import { useRef, useState, type FormEvent } from "react";
import { Circle, CircleCheck, CircleX, Clock, FileText, FileUp, Trash2 } from "lucide-react";

import { ChoiceGroup, Field, FormError } from "@/components/Field";
import { EmptyState } from "@/components/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CERT_MAX_BYTES, type Certificate, type CertificateInput, type CertificateStatus } from "@/data/api";
import { NEED_LABELS } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import type { ChecklistStep } from "@/lib/verification";
import { cn } from "@/lib/utils";
import type { CareNeed } from "@/types";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

const CERT_STATUS = {
  pending: { variant: "outline", icon: Clock, label: "In review" },
  approved: { variant: "mint", icon: CircleCheck, label: "Approved" },
  rejected: { variant: "muted", icon: CircleX, label: "Not approved" },
} as const;

export function CertificateStatusChip({ status }: { status: CertificateStatus }) {
  const { variant, icon: Icon, label } = CERT_STATUS[status];
  return (
    <Badge variant={variant}>
      <Icon aria-hidden />
      {label}
    </Badge>
  );
}

/** Provider's form: which skill it proves, the course name, who issued it, and the file. */
export function CertificateForm({ needs, onUpload }: { needs: CareNeed[]; onUpload: (input: CertificateInput) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const [need, setNeed] = useState<CareNeed>(needs[0]!);
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const choose = (picked: File | undefined) => {
    setError(null);
    if (!picked) return;
    if (!ACCEPT.split(",").includes(picked.type)) return setError("Upload a PDF or a photo (JPEG, PNG or WebP).");
    if (picked.size > CERT_MAX_BYTES) return setError("That file is over 10 MB. Try a smaller scan or photo.");
    setFile(picked);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (title.trim().length < 2) return setError("Add the certificate or course name.");
    if (!file) return setError("Add the certificate file.");
    setBusy(true);
    setError(null);
    try {
      await onUpload({ need, title: title.trim(), issuer: issuer.trim(), file });
      setTitle("");
      setIssuer("");
      setFile(null);
      if (input.current) input.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload the certificate. Try again.");
    }
    setBusy(false);
  };

  return (
    <Card className="p-4">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <p className="font-heading text-base font-bold">Upload a certificate</p>
        <ChoiceGroup
          name="cert-need"
          legend="Which skill does it prove?"
          options={needs.map((n) => ({ value: n, label: NEED_LABELS[n] }))}
          value={need}
          onChange={setNeed}
        />
        <Field
          id="cert-title"
          label="Certificate or course"
          placeholder="e.g. Pet First Aid & CPR"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Field
          id="cert-issuer"
          label="Issued by (optional)"
          placeholder="e.g. St. John Ambulance"
          value={issuer}
          maxLength={120}
          onChange={(e) => setIssuer(e.target.value)}
        />
        <label className="flex cursor-pointer items-center gap-3 rounded-control border-2 border-dashed border-input bg-cloud p-4 text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring">
          <input ref={input} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
          {file ? <FileText className="size-5 shrink-0" aria-hidden /> : <FileUp className="size-5 shrink-0" aria-hidden />}
          <span className="min-w-0 flex-1">
            <span className="block truncate">{file ? file.name : "Choose a PDF or photo"}</span>
            <span className="block text-xs font-normal text-muted-foreground">
              {file ? "Tap to choose a different file" : "Up to 10 MB. Only you and Furbourhood can see it."}
            </span>
          </span>
        </label>
        <FormError message={error} />
        <Button type="submit" disabled={busy}>
          <FileUp aria-hidden />
          {busy ? "Uploading…" : "Send for review"}
        </Button>
      </form>
    </Card>
  );
}

/** The provider's own certificates with their review status. */
export function CertificateList({
  certificates,
  onOpen,
  onDelete,
}: {
  certificates: Certificate[];
  onOpen: (cert: Certificate) => void;
  onDelete: (cert: Certificate) => void;
}) {
  if (certificates.length === 0) {
    return <EmptyState title="No certificates yet">Upload one to get a skill Verified.</EmptyState>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {certificates.map((c) => (
        <li key={c.id}>
          <Card className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-muted-foreground">
                  {NEED_LABELS[c.need]}
                  {c.issuer && ` · ${c.issuer}`} · sent {formatDate(c.createdAt.slice(0, 10))}
                </p>
              </div>
              <CertificateStatusChip status={c.status} />
            </div>
            {c.status === "rejected" && c.reviewNote && <p className="text-sm">Furbourhood: “{c.reviewNote}”</p>}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpen(c)}>
                <FileText aria-hidden />
                View file
              </Button>
              {c.status !== "approved" && (
                <Button variant="ghost" size="sm" onClick={() => onDelete(c)}>
                  <Trash2 aria-hidden />
                  Remove
                </Button>
              )}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

/** Steps a provider goes through to be trusted. Done = mint check, waiting = clock, to do = empty circle. */
export function VerificationChecklist({ steps }: { steps: ChecklistStep[] }) {
  const done = steps.filter((s) => s.state === "done").length;
  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-heading text-base font-bold">Verification checklist</p>
        <p className="text-sm text-muted-foreground">
          {done} of {steps.length} done
        </p>
      </div>
      <ol className="mt-3 flex flex-col gap-3">
        {steps.map((s) => {
          const Icon = s.state === "done" ? CircleCheck : s.state === "waiting" ? Clock : Circle;
          return (
            <li key={s.label} className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  s.state === "done" ? "bg-mint" : s.state === "waiting" ? "bg-sky-tint" : "border border-input",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {s.label}
                  <span className="sr-only">
                    {s.state === "done" ? " (done)" : s.state === "waiting" ? " (in review)" : " (to do)"}
                  </span>
                </span>
                <span className="block text-sm text-muted-foreground">{s.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/** Owner-facing list on a provider's profile: what Furbourhood has checked. Hidden when empty. */
export function CheckedCertificates({ certificates }: { certificates: Certificate[] }) {
  if (certificates.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {certificates.map((c) => (
        <li key={c.id} className="flex items-start gap-3 text-sm">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">{c.title}</span>
            {c.issuer && ` · ${c.issuer}`}
            <span className="block text-muted-foreground">Proves {NEED_LABELS[c.need].toLowerCase()}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
