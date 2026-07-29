"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation } from "@/types";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

/**
 * Count of conversations with at least one unread inbound message for
 * the current user. Used by the sidebar to surface a green dot on the
 * Inbox nav entry when the user is elsewhere in the app.
 *
 * Module-level store + single realtime channel so multiple consumers
 * (or React Strict Mode remounts) never double-fetch.
 */

// ---------------------------------------------------------------------------
// Module singleton
// ---------------------------------------------------------------------------

let total = 0;
const counts = new Map<string, number>();
const listeners = new Set<() => void>();
let channel: RealtimeChannel | null = null;
let bootstrapPromise: Promise<void> | null = null;
/** Bumped on teardown so in-flight bootstraps ignore stale completions. */
let epoch = 0;

function emit() {
  for (const l of listeners) l();
}

function recompute() {
  let sum = 0;
  for (const n of counts.values()) if (n > 0) sum += 1;
  if (sum === total) return;
  total = sum;
  emit();
}

function subscribeStore(listener: () => void) {
  listeners.add(listener);
  ensureBootstrapped();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      teardown();
    }
  };
}

function getSnapshot() {
  return total;
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
      // Initial load. RLS scopes this to the signed-in user automatically —
      // no explicit user_id filter needed here.
      const { data, error } = await supabase
        .from("conversations")
        .select("id, unread_count");
      if (startedAt !== epoch) return;
      if (!error && data) {
        counts.clear();
        for (const row of data as { id: string; unread_count: number }[]) {
          counts.set(row.id, row.unread_count ?? 0);
        }
        recompute();
      }
    } catch {
      // leave total at 0
    }

    if (startedAt !== epoch) return;
    attachChannel(supabase);
  })();

  return bootstrapPromise;
}

function attachChannel(supabase: SupabaseClient) {
  if (channel) return;

  channel = supabase
    .channel("total-unread-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "conversations" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const oldRow = payload.old as Partial<Conversation>;
          if (oldRow.id) counts.delete(oldRow.id);
        } else {
          const row = payload.new as Conversation;
          counts.set(row.id, row.unread_count ?? 0);
        }
        recompute();
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

export function useTotalUnread(): number {
  return useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);
}
