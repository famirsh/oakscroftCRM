import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  isValidHttpUrl,
  persistTemplateHeaderMediaUrl,
} from '@/lib/whatsapp/template-header-media'

/**
 * Set (or force-replace) the permanent send-time media URL for a
 * template's IMAGE / VIDEO / DOCUMENT header.
 *
 *   POST { header_media_url: string, force?: boolean }
 *
 * - Default (`force` omitted/false): only writes when the row has no
 *   stored URL yet — used by the inbox picker / first successful send
 *   so agents are prompted once.
 * - `force: true`: replace an existing URL (template editor "change
 *   default media"). Requires admin membership (settings-class write).
 *
 * Does NOT re-submit the template to Meta. Creation-time samples use
 * `header_handle`; this field is purely the CRM's send-time default.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid template id.' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, account_role')
      .eq('user_id', user.id)
      .maybeSingle()
    const accountId = profile?.account_id as string | undefined
    if (!accountId) {
      return NextResponse.json(
        { error: 'Your profile is not linked to an account.' },
        { status: 403 },
      )
    }

    let body: { header_media_url?: unknown; force?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const url =
      typeof body.header_media_url === 'string' ? body.header_media_url.trim() : ''
    if (!url || !isValidHttpUrl(url)) {
      return NextResponse.json(
        { error: 'header_media_url must be a valid http(s) URL.' },
        { status: 400 },
      )
    }

    const force = body.force === true
    if (force) {
      // Force-replace is a settings write — owner/admin only (matches
      // message_templates_update RLS via is_account_member(..., 'admin')).
      // First-time fill (force=false) is open to any member who can send.
      const role = (profile?.account_role as string | undefined) ?? ''
      if (role !== 'admin' && role !== 'owner') {
        return NextResponse.json(
          { error: 'Only admins can replace an existing default header media.' },
          { status: 403 },
        )
      }
    }

    // Ensure the template is visible to this account (RLS select).
    const { data: existing, error: lookupErr } = await supabase
      .from('message_templates')
      .select('id, header_type, header_media_url')
      .eq('id', id)
      .eq('account_id', accountId)
      .maybeSingle()
    if (lookupErr || !existing) {
      return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
    }

    const result = await persistTemplateHeaderMediaUrl({
      accountId,
      templateId: id,
      headerMediaUrl: url,
      force,
    })

    if (result.reason === 'not_media_header') {
      return NextResponse.json(
        { error: 'Template does not have an image/video/document header.' },
        { status: 400 },
      )
    }
    if (result.reason === 'db_error') {
      return NextResponse.json(
        { error: result.error || 'Failed to save header media.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      updated: result.updated,
      header_media_url: url,
      // When already_set and not forced, surface that so the UI can
      // skip a redundant toast.
      already_set: result.reason === 'already_set',
    })
  } catch (error) {
    console.error('[templates/header-media] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save header media.' },
      { status: 500 },
    )
  }
}
