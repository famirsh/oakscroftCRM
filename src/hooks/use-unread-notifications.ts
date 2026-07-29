"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

/**
 * Count of unread notifications for the current user. Used by the
 * sidebar AND header badge — both share one module-level store so we
 * only hit PostgREST once and keep a single realtime channel.
 *
 * RLS on `notifications` already scopes every read to `auth.uid() =
 * user_id`, so no explicit filter is needed here — same pattern as
 * `useTotalUnread` for conversations.
 */

// ---------------------------------------------------------------------------
// Module singleton — survives React Strict Mode remounts and is shared by
// every consumer of useUnreadNotifications in the tree.
// ---------------------------------------------------------------------------

let count = 0;
const listeners = new Set<() => void>();
let channel: RealtimeChannel | null = null;
let bootstrapPromise: Promise<void> | null = null;
/** Bumped on teardown so in-flight bootstraps ignore stale completions. */
let epoch = 0;

function emit() {
  for (const l of listeners) l();
}

function subscribeStore(listener: () => void) {
  listeners.add(listener);
  ensureBootstrapped();
  return () => {
    listeners.delete(listener);
    // Keep the channel warm while the dashboard shell is mounted; tear
    // down only when the last consumer unmounts (e.g. sign-out navigation).
    if (listeners.size === 0) {
      teardown();
    }
  };
}

function getSnapshot() {
  return count;
}

function getServerSnapshot() {
  return 0;
}

function ensureBootstrapped() {
  if (bootstrapPromise) return bootstrapPromise;

  const startedAt = epoch;
  bootstrapPromise = (async () => {
    const supabase = createClient();
    try {
      // head:true skips fetching rows — we only need the `count`
      // supabase-js returns alongside the (empty) response body.
      const { count: unreadCount, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .is("read_at", null);
      // Discard result if a Strict-Mode teardown raced this fetch.
      if (startedAt !== epoch) return;
      if (!error) {
        count = unreadCount ?? 0;
        emit();
      }
    } catch {
      // leave count at 0
    }

    if (startedAt !== epoch) return;
    attachChannel(supabase);
  })();

  return bootstrapPromise;
}

function attachChannel(supabase: SupabaseClient) {
  if (channel) return;

  channel = supabase
    .channel("notifications-unread-count")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications" },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as Notification;
          if (!row.read_at) {
            count += 1;
            emit();
          }
        } else if (payload.eventType === "UPDATE") {
          // Updates here only ever set read_at (marking a notification
          // read). Derive purely from the new row so we don't rely on
          // payload.old columns, which require REPLICA IDENTITY FULL.
          const newRow = payload.new as Notification;
          if (newRow.read_at) {
            count = Math.max(0, count - 1);
            emit();
          }
        } else if (payload.eventType === "DELETE") {
          const oldRow = payload.old as Partial<Notification>;
          if (!oldRow.read_at) {
            count = Math.max(0, count - 1);
            emit();
          }
        }
      },
    )
    .subscribe();
}

function teardown() {
  epoch += 1;
  if (channel) {
    const supabase = createClient();
    void supabase.removeChannel(channel);
    channel = null;
  }
  bootstrapPromise = null;
}

export function useUnreadNotifications(): number {
  // useSyncExternalStore is the React-recommended way to subscribe to
  // an external shared store without tearing in concurrent mode.
  return useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);
}
