/**
 * Persist a permanent public HTTPS URL for a template's media header.
 *
 * Meta only returns creation-time `header_handle` samples on sync — those
 * are NOT reusable at send time. The CRM therefore stores a public URL in
 * `header_media_url` so IMAGE/VIDEO/DOCUMENT templates can be re-sent
 * without re-prompting the agent every time.
 *
 * Rules:
 *   - Never overwrite an existing non-empty `header_media_url` unless
 *     `force` is true (template editor "change default media").
 *   - Uses the service-role client so agents (who can send but not update
 *     templates under RLS) can still save the first successful media.
 *   - Always account-scoped; never touches another tenant's rows.
 */

import { supabaseAdmin } from '@/lib/flows/admin-client';
import type { MessageTemplate } from '@/types';

const MEDIA_HEADER_TYPES = new Set(['image', 'video', 'document']);

export function isMediaHeaderType(
  value: unknown,
): value is 'image' | 'video' | 'document' {
  return typeof value === 'string' && MEDIA_HEADER_TYPES.has(value);
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface PersistHeaderMediaResult {
  /** True when the row was updated. */
  updated: boolean;
  /** Reason when not updated (for logs / callers). */
  reason?:
    | 'not_media_header'
    | 'invalid_url'
    | 'already_set'
    | 'not_found'
    | 'db_error';
  error?: string;
}

/**
 * Save `headerMediaUrl` onto the template row when (and only when) the
 * template has a media header and no permanent URL is stored yet.
 * Pass `force: true` to replace an existing URL (editor change-default).
 */
export async function persistTemplateHeaderMediaUrl(args: {
  accountId: string;
  templateId: string;
  headerMediaUrl: string;
  force?: boolean;
}): Promise<PersistHeaderMediaResult> {
  const url = args.headerMediaUrl.trim();
  if (!isValidHttpUrl(url)) {
    return { updated: false, reason: 'invalid_url' };
  }

  const admin = supabaseAdmin();
  const { data: row, error: lookupErr } = await admin
    .from('message_templates')
    .select('id, header_type, header_media_url')
    .eq('id', args.templateId)
    .eq('account_id', args.accountId)
    .maybeSingle();

  if (lookupErr) {
    return { updated: false, reason: 'db_error', error: lookupErr.message };
  }
  if (!row) {
    return { updated: false, reason: 'not_found' };
  }
  if (!isMediaHeaderType(row.header_type)) {
    return { updated: false, reason: 'not_media_header' };
  }

  const existing = (row.header_media_url as string | null)?.trim() ?? '';
  if (existing && !args.force) {
    return { updated: false, reason: 'already_set' };
  }
  // No-op when the same URL is already stored.
  if (existing === url) {
    return { updated: false, reason: 'already_set' };
  }

  const { error: updErr } = await admin
    .from('message_templates')
    .update({
      header_media_url: url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', args.templateId)
    .eq('account_id', args.accountId);

  if (updErr) {
    return { updated: false, reason: 'db_error', error: updErr.message };
  }
  return { updated: true };
}

/**
 * Convenience for the send path: if the local template row has a media
 * header but no stored URL, and this send supplied one, persist it so
 * the next send can auto-fill without prompting.
 */
export async function maybePersistHeaderMediaAfterSend(args: {
  accountId: string;
  template: MessageTemplate | null | undefined;
  headerMediaUrl?: string | null;
}): Promise<void> {
  const { accountId, template, headerMediaUrl } = args;
  if (!template?.id) return;
  if (!isMediaHeaderType(template.header_type)) return;
  const existing = template.header_media_url?.trim() ?? '';
  if (existing) return;
  const url = headerMediaUrl?.trim() ?? '';
  if (!url) return;

  const result = await persistTemplateHeaderMediaUrl({
    accountId,
    templateId: template.id,
    headerMediaUrl: url,
    force: false,
  });
  if (result.updated) {
    // Mutate the in-memory row so subsequent recipients in the same
    // process (broadcast loop) see the stored URL without a re-fetch.
    template.header_media_url = url;
  } else if (result.reason === 'db_error') {
    console.warn(
      '[template-header-media] failed to persist header_media_url:',
      result.error,
    );
  }
}
