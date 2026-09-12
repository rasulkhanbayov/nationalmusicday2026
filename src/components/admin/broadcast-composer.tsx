"use client";

import { useState } from "react";
import { Loader2, Eye, Send, MailCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type EventOption = { id: string; name: string };

/**
 * Compose and send an announcement to an event's paid ticket holders.
 *
 * A bulk send cannot be undone, so the flow is deliberately three steps:
 * preview the rendered email, send yourself a test, then type the recipient
 * count to unlock the real send.
 */
export function BroadcastComposer({
  events,
  adminEmail,
}: {
  events: EventOption[];
  adminEmail: string;
}) {
  const { toast } = useToast();
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [personalise, setPersonalise] = useState(true);

  const [busy, setBusy] = useState<null | "preview" | "test" | "send">(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [sample, setSample] = useState<string[]>([]);
  const [confirm, setConfirm] = useState("");
  const [testSent, setTestSent] = useState(false);
  const [done, setDone] = useState<{
    sent: number;
    failed: { email: string; error: string }[];
  } | null>(null);

  async function call(
    mode: "preview" | "test" | "send",
    onlyEmails?: string[],
  ) {
    setBusy(mode);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          subject,
          message,
          personalise,
          mode,
          ...(mode === "send"
            ? { confirmCount: onlyEmails ? onlyEmails.length : count }
            : {}),
          ...(onlyEmails ? { onlyEmails } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");

      if (mode === "preview") {
        setPreview(json.html);
        setCount(json.recipientCount);
        setSample(json.sample ?? []);
      } else if (mode === "test") {
        setTestSent(true);
        toast({
          variant: "success",
          title: "Test sent",
          description: `Check ${json.sentTo}`,
        });
      } else {
        setDone({ sent: json.sent, failed: json.failed ?? [] });
        setConfirm("");
        toast({
          variant: "success",
          title: `Sent to ${json.sent} recipient${json.sent === 1 ? "" : "s"}`,
          description: json.failed?.length
            ? `${json.failed.length} failed - see below`
            : undefined,
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  }

  const canSend =
    count !== null &&
    count > 0 &&
    subject.trim() !== "" &&
    message.trim() !== "" &&
    confirm.trim() === String(count);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Compose */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-serif text-xl font-semibold text-navy-900">
            Compose
          </h2>

          {events.length > 1 ? (
            <div>
              <Label htmlFor="ev">Event</Label>
              <select
                id="ev"
                value={eventId}
                onChange={(e) => {
                  setEventId(e.target.value);
                  setPreview(null);
                  setCount(null);
                }}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="A note about the concert"
              maxLength={160}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              placeholder={
                "Write your message here.\n\nLeave a blank line between paragraphs."
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed"
            />
            <p className="mt-1.5 text-sm text-muted-foreground">
              Plain text. Blank lines become paragraphs; the commontone header
              and footer are added automatically.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-navy-800">
            <input
              type="checkbox"
              checked={personalise}
              onChange={(e) => setPersonalise(e.target.checked)}
              className="h-4 w-4"
            />
            Start each email with &ldquo;Dear &lt;first name&gt;,&rdquo;
          </label>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => void call("preview")}
              disabled={busy !== null}
            >
              {busy === "preview" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Preview
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void call("test")}
              disabled={busy !== null || !subject.trim() || !message.trim()}
              title={`Sends one copy to ${adminEmail}`}
            >
              {busy === "test" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MailCheck className="h-4 w-4" />
              )}
              Send test to me
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview + send */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-3 font-serif text-xl font-semibold text-navy-900">
              Preview
            </h2>
            {preview ? (
              <iframe
                title="Email preview"
                srcDoc={preview}
                className="h-[420px] w-full rounded-lg border border-border bg-white"
              />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Click <strong>Preview</strong> to see the email and count
                recipients.
              </p>
            )}
          </CardContent>
        </Card>

        {count !== null ? (
          <Card className="border-gold/50">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">
                    This will email {count} ticket holder
                    {count === 1 ? "" : "s"}. It cannot be undone.
                  </p>
                  {sample.length > 0 ? (
                    <p className="mt-1 text-amber-800/80">
                      e.g. {sample.slice(0, 3).join(", ")}
                      {count > 3 ? ` and ${count - 3} more` : ""}
                    </p>
                  ) : null}
                  {!testSent ? (
                    <p className="mt-1 text-amber-800/80">
                      Send yourself a test first - strongly recommended.
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <Label htmlFor="confirm">
                  Type <strong>{count}</strong> to confirm
                </Label>
                <Input
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={String(count)}
                  className="max-w-[160px]"
                  inputMode="numeric"
                />
              </div>

              <Button
                type="button"
                variant="gold"
                size="lg"
                disabled={!canSend || busy !== null}
                onClick={() => void call("send")}
              >
                {busy === "send" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send to {count} recipient
                    {count === 1 ? "" : "s"}
                  </>
                )}
              </Button>

              {done ? (
                <div className="space-y-3 border-t border-border pt-4 text-sm">
                  <p className="font-medium text-navy-900">
                    Sent {done.sent}.{" "}
                    {done.failed.length === 0 ? (
                      "No failures."
                    ) : (
                      <span className="text-destructive">
                        {done.failed.length} failed.
                      </span>
                    )}
                  </p>

                  {done.failed.length > 0 ? (
                    <>
                      {/* Listing the addresses matters: without them there is
                          no way to retry without emailing everyone twice. */}
                      <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-secondary p-3">
                        {done.failed.map((f) => (
                          <p key={f.email} className="text-xs text-navy-800">
                            <span className="font-mono">{f.email}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              — {f.error}
                            </span>
                          </p>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() =>
                          void call(
                            "send",
                            done.failed.map((f) => f.email),
                          )
                        }
                      >
                        {busy === "send" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Retry {done.failed.length} failed only
                      </Button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
