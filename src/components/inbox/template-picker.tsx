"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageTemplate } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  ImageIcon,
  LayoutTemplate,
  Loader2,
  Upload,
  Video,
} from "lucide-react";
import { extractVariableIndices } from "@/lib/whatsapp/template-validators";
import {
  MEDIA_MAX_BYTES_BY_KIND,
  uploadAccountMedia,
} from "@/lib/storage/upload-media";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export interface TemplateSendValues {
  body: string[];
  headerText?: string;
  /** Public HTTPS URL for IMAGE/VIDEO/DOCUMENT headers at send time. */
  headerMediaUrl?: string;
  /** Optional Meta media id (from a prior /media upload). */
  headerMediaId?: string;
  buttonParams?: Record<number, string>;
}

interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: MessageTemplate, values: TemplateSendValues) => void;
}

const MEDIA_HEADER_TYPES = ["image", "video", "document"] as const;
type MediaHeaderType = (typeof MEDIA_HEADER_TYPES)[number];

function isMediaHeaderType(value: unknown): value is MediaHeaderType {
  return MEDIA_HEADER_TYPES.includes(value as MediaHeaderType);
}

const PICKER_ACCEPT: Record<MediaHeaderType, string> = {
  image: "image/png,image/jpeg,image/webp",
  video: "video/mp4,video/3gpp",
  document:
    "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain",
};

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function renderBodyPreview(body: string, params: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (_, raw) => {
    const idx = Number(raw) - 1;
    const value = params[idx];
    return value && value.trim().length > 0 ? value : `{{${raw}}}`;
  });
}

interface UrlButtonSlot {
  index: number;
  text: string;
  url: string;
}

/**
 * Templates may need values for: body variables, a text-header
 * variable, media-header URL, and per-URL-button suffixes. Collect
 * them all so the send-message path doesn't 400 on missing parameters.
 */
function collectVariableSlots(template: MessageTemplate): {
  bodyVars: number[];
  headerVarCount: number;
  mediaHeaderType: MediaHeaderType | null;
  urlButtonSlots: UrlButtonSlot[];
} {
  const bodyVars = extractVariableIndices(template.body_text);
  const headerVarCount =
    template.header_type === "text" && template.header_content
      ? extractVariableIndices(template.header_content).length
      : 0;
  const mediaHeaderType = isMediaHeaderType(template.header_type)
    ? template.header_type
    : null;
  const urlButtonSlots: UrlButtonSlot[] = [];
  (template.buttons ?? []).forEach((b, i) => {
    if (b.type === "URL" && extractVariableIndices(b.url).length > 0) {
      urlButtonSlots.push({ index: i, text: b.text, url: b.url });
    }
  });
  return { bodyVars, headerVarCount, mediaHeaderType, urlButtonSlots };
}

/**
 * Whether the picker must open a form before send. Media headers need
 * a URL/id; if the template already stores a valid public sample URL we
 * can send immediately with that value (user can still open settings to
 * change the sample later). Missing media always forces the form.
 */
function needsUserInput(
  template: MessageTemplate,
  slots: ReturnType<typeof collectVariableSlots>,
): boolean {
  const storedMedia = template.header_media_url?.trim() ?? "";
  const needsMediaInput =
    slots.mediaHeaderType !== null &&
    !(storedMedia && isValidHttpUrl(storedMedia));
  return (
    slots.bodyVars.length > 0 ||
    slots.headerVarCount > 0 ||
    needsMediaInput ||
    slots.urlButtonSlots.length > 0
  );
}

export function TemplatePicker({
  open,
  onOpenChange,
  onSelect,
}: TemplatePickerProps) {
  const t = useTranslations("Inbox.templatePicker");

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MessageTemplate | null>(null);
  const [params, setParams] = useState<string[]>([]);
  const [headerText, setHeaderText] = useState<string>("");
  const [headerMediaUrl, setHeaderMediaUrl] = useState<string>("");
  const [buttonParams, setButtonParams] = useState<Record<number, string>>({});
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const headerFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setTemplates([]);
          setLoading(false);
        }
        return;
      }

      // Scope by RLS (message_templates_select → is_account_member), NOT by
      // user_id. Templates are account-owned, so filtering on the caller's
      // user_id hid templates that a teammate created — leaving them unable
      // to send approved templates in a shared account.
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("status", "APPROVED")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error("Failed to fetch templates:", error);
        setTemplates([]);
      } else {
        setTemplates((data as MessageTemplate[]) ?? []);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  function resetSelection() {
    setSelected(null);
    setParams([]);
    setHeaderText("");
    setHeaderMediaUrl("");
    setButtonParams({});
    setUploadingHeader(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetSelection();
    onOpenChange(next);
  }

  function pickTemplate(template: MessageTemplate) {
    const slots = collectVariableSlots(template);
    const storedMedia = template.header_media_url?.trim() ?? "";

    // Fully static templates (and media-header templates that already
    // carry a public sample URL) can send immediately. Media headers
    // without a stored URL open the form so the agent can upload/paste
    // one before Meta rejects the send.
    if (!needsUserInput(template, slots)) {
      const values: TemplateSendValues = { body: [] };
      if (slots.mediaHeaderType && storedMedia) {
        values.headerMediaUrl = storedMedia;
      }
      onSelect(template, values);
      handleOpenChange(false);
      return;
    }

    setSelected(template);
    setParams(new Array(slots.bodyVars.length).fill(""));
    setHeaderText("");
    // Prefer the template's stored sample URL so the common "reuse the
    // approved media" case needs no extra typing.
    setHeaderMediaUrl(storedMedia);
    setButtonParams({});
  }

  /**
   * Save the media URL as the template's permanent default when the row
   * has none yet. Fire-and-forget — send still proceeds if this fails;
   * the send pipeline also persists after a successful Meta delivery.
   */
  async function persistDefaultHeaderMedia(
    template: MessageTemplate,
    url: string,
  ) {
    const existing = template.header_media_url?.trim() ?? "";
    if (existing || !url || !isValidHttpUrl(url)) return;
    try {
      await fetch(`/api/whatsapp/templates/${template.id}/header-media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header_media_url: url }),
      });
      // Reflect locally so a second open of the picker in this session
      // auto-sends without re-prompting.
      template.header_media_url = url;
    } catch (err) {
      console.warn("Failed to persist template header media:", err);
    }
  }

  async function confirm() {
    if (!selected) return;
    const slots = collectVariableSlots(selected);
    const values: TemplateSendValues = { body: params };
    if (headerText.trim()) values.headerText = headerText.trim();
    if (slots.mediaHeaderType) {
      const media = headerMediaUrl.trim();
      if (!media || !isValidHttpUrl(media)) return;
      values.headerMediaUrl = media;
      // First-time media for this template → store permanently so the
      // agent is not asked again on the next send.
      await persistDefaultHeaderMedia(selected, media);
    }
    if (Object.keys(buttonParams).length > 0) {
      values.buttonParams = Object.fromEntries(
        Object.entries(buttonParams).map(([k, v]) => [Number(k), v.trim()]),
      );
    }
    onSelect(selected, values);
    handleOpenChange(false);
  }

  async function handleHeaderFile(file: File, kind: MediaHeaderType) {
    const maxBytes = MEDIA_MAX_BYTES_BY_KIND[kind];
    if (file.size > maxBytes) {
      toast.error(
        t("headerMediaTooLarge", {
          size: (file.size / 1024 / 1024).toFixed(1),
          max: (maxBytes / 1024 / 1024).toFixed(0),
        }),
      );
      return;
    }
    setUploadingHeader(true);
    try {
      const { publicUrl } = await uploadAccountMedia("chat-media", file);
      setHeaderMediaUrl(publicUrl);
      if (selected) {
        await persistDefaultHeaderMedia(selected, publicUrl);
      }
      toast.success(t("headerMediaUploaded"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("headerMediaUploadFailed"),
      );
    } finally {
      setUploadingHeader(false);
      if (headerFileRef.current) headerFileRef.current.value = "";
    }
  }

  const slots = useMemo(
    () => (selected ? collectVariableSlots(selected) : null),
    [selected],
  );

  const headerMediaValid =
    !slots?.mediaHeaderType ||
    (headerMediaUrl.trim().length > 0 && isValidHttpUrl(headerMediaUrl.trim()));

  const canConfirm =
    !!selected &&
    !!slots &&
    slots.bodyVars.every((_, i) => (params[i] ?? "").trim().length > 0) &&
    (slots.headerVarCount === 0 || headerText.trim().length > 0) &&
    headerMediaValid &&
    !uploadingHeader &&
    slots.urlButtonSlots.every(
      (s) => (buttonParams[s.index] ?? "").trim().length > 0,
    );

  const mediaHeaderIcon =
    slots?.mediaHeaderType === "video" ? (
      <Video className="h-4 w-4 text-primary" />
    ) : slots?.mediaHeaderType === "document" ? (
      <FileText className="h-4 w-4 text-primary" />
    ) : (
      <ImageIcon className="h-4 w-4 text-primary" />
    );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-popover-foreground">
            <LayoutTemplate className="h-4 w-4 text-primary" />
            {selected ? selected.name : t("sendTemplate")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {selected
              ? t("fillPlaceholders")
              : t("pickTemplate")}
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-md border border-border bg-background/50 p-6 text-center">
                <p className="text-sm text-popover-foreground">{t("noApprovedTemplates")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("noApprovedTemplatesHint")}
                </p>
              </div>
            ) : (
              templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => pickTemplate(tpl)}
                  className="w-full rounded-md border border-border bg-background/50 p-3 text-left transition-colors hover:border-primary/40 hover:bg-popover"
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-popover-foreground">
                          {tpl.name}
                        </p>
                        <Badge className="border border-primary/30 bg-primary/20 text-[10px] text-primary">
                          {tpl.category}
                        </Badge>
                        {tpl.language && (
                          <span className="text-[10px] uppercase text-muted-foreground">
                            {tpl.language}
                          </span>
                        )}
                        {isMediaHeaderType(tpl.header_type) && (
                          <Badge
                            variant="outline"
                            className="border-border text-[10px] capitalize text-muted-foreground"
                          >
                            {tpl.header_type} header
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {tpl.body_text}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-background/50 p-3">
              <p className="mb-1 text-xs text-muted-foreground">{t("preview")}</p>
              <p className="whitespace-pre-wrap text-sm text-popover-foreground">
                {renderBodyPreview(selected.body_text, params)}
              </p>
              {selected.footer_text && (
                <p className="mt-2 text-xs italic text-muted-foreground">
                  {selected.footer_text}
                </p>
              )}
            </div>

            {/* TEXT header with {{1}} */}
            {slots && slots.headerVarCount > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-popover-foreground">
                  {`Header {{1}}`}
                </Label>
                <Input
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder={t("headerValuePlaceholder")}
                  className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}

            {/* IMAGE / VIDEO / DOCUMENT header media */}
            {slots?.mediaHeaderType && (
              <div className="space-y-2 rounded-md border border-border bg-background/50 p-3">
                <div className="flex items-center gap-2">
                  {mediaHeaderIcon}
                  <Label className="text-xs font-medium text-popover-foreground">
                    {t("headerMediaTitle", {
                      type: slots.mediaHeaderType,
                    })}
                  </Label>
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                    {slots.mediaHeaderType}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("headerMediaRequired", {
                    type: slots.mediaHeaderType,
                  })}
                </p>

                <input
                  ref={headerFileRef}
                  type="file"
                  accept={PICKER_ACCEPT[slots.mediaHeaderType]}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && slots.mediaHeaderType) {
                      void handleHeaderFile(file, slots.mediaHeaderType);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingHeader}
                  onClick={() => headerFileRef.current?.click()}
                  className="border-border text-popover-foreground hover:bg-muted"
                >
                  {uploadingHeader ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploadingHeader
                    ? t("headerMediaUploading")
                    : t("headerMediaUpload", {
                        type: slots.mediaHeaderType,
                      })}
                </Button>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("headerMediaUrlLabel")}
                  </Label>
                  <Input
                    type="url"
                    value={headerMediaUrl}
                    onChange={(e) => setHeaderMediaUrl(e.target.value)}
                    placeholder={t("headerMediaUrlPlaceholder", {
                      type: slots.mediaHeaderType,
                    })}
                    className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {slots.mediaHeaderType === "image" &&
                  headerMediaValid &&
                  headerMediaUrl.trim() && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={headerMediaUrl.trim()}
                      alt="Header preview"
                      className="mt-1 max-h-36 rounded-md border border-border object-contain"
                    />
                  )}

                {!headerMediaValid && (
                  <p className="text-xs text-amber-300 whitespace-pre-line">
                    {headerMediaUrl.trim()
                      ? t("headerMediaInvalidUrl")
                      : t("headerMediaMissing", {
                          type: slots.mediaHeaderType,
                        })}
                  </p>
                )}
              </div>
            )}

            {slots?.bodyVars.map((v, i) => (
              <div key={v} className="space-y-1">
                <Label className="text-xs text-popover-foreground">{`Body {{${v}}}`}</Label>
                <Input
                  value={params[i] ?? ""}
                  onChange={(e) => {
                    const next = [...params];
                    next[i] = e.target.value;
                    setParams(next);
                  }}
                  placeholder={t("bodyValuePlaceholder", { val: `{{${v}}}` })}
                  className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
                />
              </div>
            ))}
            {slots?.urlButtonSlots.map((slot) => (
              <div key={slot.index} className="space-y-1">
                <Label className="text-xs text-popover-foreground">
                  {`URL button "${slot.text}" — value for `}{`{{1}}`}
                </Label>
                <Input
                  value={buttonParams[slot.index] ?? ""}
                  onChange={(e) =>
                    setButtonParams((prev) => ({
                      ...prev,
                      [slot.index]: e.target.value,
                    }))
                  }
                  placeholder={t("urlSuffixValuePlaceholder")}
                  className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-[10px] text-muted-foreground break-all">
                  {t("finalUrl", { url: slot.url.replace(/\{\{1\}\}/g, buttonParams[slot.index] || "{{1}}") })}
                </p>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          {selected ? (
            <>
              <Button
                variant="outline"
                onClick={resetSelection}
                className="border-border text-popover-foreground hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("back")}
              </Button>
              <Button
                disabled={!canConfirm}
                onClick={confirm}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {t("send")}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="border-border text-popover-foreground hover:bg-muted"
            >
              {t("cancel")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
