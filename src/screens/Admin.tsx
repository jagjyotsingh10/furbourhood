import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, FileCheck } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody, SectionTitle } from "@/components/AppShell";
import { CertificateStatusChip } from "@/components/Certificates";
import { BarList, StatTile } from "@/components/Dashboard";
import { FormError, TextAreaField } from "@/components/Field";
import { LevelBadge } from "@/components/LevelBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { certificateFileUrl, reviewCertificate, type CertificateForReview } from "@/data/api";
import { useCertificateQueue, usePlatformStats } from "@/data/hooks";
import { AREAS, LEVEL_LABELS, NEED_LABELS, STATUS_LABELS, serviceInfo } from "@/lib/catalog";
import { formatDate, formatPrice, plural } from "@/lib/format";
import type { BookingStatus, ServiceId, SkillLevel } from "@/types";

function StaffOnly({ title }: { title: string }) {
  return (
    <>
      <AppBar title={title} />
      <ScreenBody>
        <EmptyState title="For Furbourhood staff">This screen is only for the Furbourhood team.</EmptyState>
      </ScreenBody>
    </>
  );
}

/** /admin: platform numbers for the Furbourhood team. */
export function AdminDashboard() {
  const { isAdmin } = useAuth();
  const stats = usePlatformStats();
  if (!isAdmin) return <StaffOnly title="Dashboard" />;

  const s = stats.data;
  return (
    <>
      <AppBar title="Platform dashboard" />
      <ScreenBody>
        {stats.error ? (
          <ErrorState message={stats.error} onRetry={stats.reload} />
        ) : !s ? (
          <LoadingState />
        ) : (
          <>
            {s.certificatesPending > 0 && (
              <Link
                to="/review"
                className="flex items-center gap-3 rounded-card bg-sky p-4 font-semibold text-navy hover:bg-sky/80"
              >
                <FileCheck className="size-5 shrink-0" aria-hidden />
                <span className="flex-1">{plural(s.certificatesPending, "certificate")} waiting for review</span>
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            )}

            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Pet owners" value={s.owners} detail={`${plural(s.pets, "pet")} listed`} />
              <StatTile
                label="Care providers"
                value={s.providers}
                detail={`${s.providersVerifiedInPerson} verified in person`}
              />
              <StatTile label="Bookings" value={s.bookings} detail={`${s.demoShare}% demo data`} />
              <StatTile label="Paid booking value" value={formatPrice(s.bookingValue)} detail="Paid and completed" />
              <StatTile
                label="Average rating"
                value={s.reviews === 0 ? "–" : s.averageRating.toFixed(1)}
                detail={plural(s.reviews, "review")}
              />
              <StatTile label="Certificates to review" value={s.certificatesPending} />
            </div>

            <SectionTitle>Bookings</SectionTitle>
            <BarList
              title="By status"
              unit="bookings"
              items={Object.entries(s.byStatus).map(([k, v]) => ({ label: STATUS_LABELS[k as BookingStatus], value: v ?? 0 }))}
            />
            <BarList
              title="By service"
              unit="bookings"
              items={Object.entries(s.byService).map(([k, v]) => ({ label: serviceInfo(k as ServiceId).label, value: v ?? 0 }))}
            />

            <SectionTitle>Providers and trust</SectionTitle>
            <BarList
              title="Providers by area"
              unit="providers"
              items={Object.entries(s.byArea).map(([fsa, v]) => ({ label: `${AREAS[fsa] ?? fsa} (${fsa})`, value: v }))}
            />
            <BarList
              title="Skills by level"
              unit="skills"
              items={(["self-declared", "verified", "proven"] as SkillLevel[]).map((l) => ({
                label: LEVEL_LABELS[l],
                value: s.byLevel[l] ?? 0,
              }))}
            />

            <DemoNote>Numbers come from the live database, which holds mostly fictional demo data.</DemoNote>
          </>
        )}
      </ScreenBody>
    </>
  );
}

function ReviewCard({ cert, onReviewed }: { cert: CertificateForReview; onReviewed: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (status: "approved" | "rejected") => {
    if (status === "rejected" && note.trim().length === 0) return setError("Add a note so the provider knows what to fix.");
    setBusy(status);
    setError(null);
    try {
      await reviewCertificate(cert.id, status, note.trim());
      onReviewed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the review.");
      setBusy(null);
    }
  };

  const open = async () => {
    setError(null);
    const tab = window.open("", "_blank");
    try {
      const url = await certificateFileUrl(cert);
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (err) {
      tab?.close();
      setError(err instanceof Error ? err.message : "Couldn't open the file.");
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{cert.title}</p>
          <p className="text-sm text-muted-foreground">
            {cert.providerName}
            {cert.issuer && ` · ${cert.issuer}`} · sent {formatDate(cert.createdAt.slice(0, 10))}
          </p>
        </div>
        <CertificateStatusChip status={cert.status} />
      </div>
      <p className="flex flex-wrap items-center gap-2 text-sm">
        Proves {NEED_LABELS[cert.need].toLowerCase()}
        {cert.currentLevel ? <LevelBadge level={cert.currentLevel} /> : <span className="text-muted-foreground">(skill removed)</span>}
      </p>
      {cert.status === "rejected" && cert.reviewNote && <p className="text-sm">Note: “{cert.reviewNote}”</p>}
      <div>
        <Button variant="outline" size="sm" onClick={open}>
          View file
        </Button>
      </div>
      {cert.status === "pending" && (
        <>
          <TextAreaField
            id={`note-${cert.id}`}
            label="Note to the provider"
            hint="Needed when declining, e.g. “The name on the certificate doesn't match.”"
            value={note}
            maxLength={280}
            onChange={(e) => setNote(e.target.value)}
            className="[&_textarea]:min-h-16"
          />
          <FormError message={error} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={busy !== null} onClick={() => decide("rejected")}>
              {busy === "rejected" ? "Saving…" : "Decline"}
            </Button>
            <Button disabled={busy !== null} onClick={() => decide("approved")}>
              {busy === "approved" ? "Saving…" : "Approve"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Approving makes this skill Verified on the provider's listing.</p>
        </>
      )}
      {cert.status !== "pending" && <FormError message={error} />}
    </Card>
  );
}

/** /review: the certificate queue. Pending first. */
export function CertificateReview() {
  const { isAdmin } = useAuth();
  const queue = useCertificateQueue();
  if (!isAdmin) return <StaffOnly title="Certificates" />;

  const list = queue.data ?? [];
  const pending = list.filter((c) => c.status === "pending");
  const done = list.filter((c) => c.status !== "pending");

  return (
    <>
      <AppBar title="Certificates" />
      <ScreenBody>
        {queue.error ? (
          <ErrorState message={queue.error} onRetry={queue.reload} />
        ) : queue.loading && !queue.data ? (
          <LoadingState />
        ) : (
          <>
            <SectionTitle>Waiting for review ({pending.length})</SectionTitle>
            {pending.length === 0 ? (
              <EmptyState title="All caught up">New certificates from providers appear here.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {pending.map((c) => (
                  <li key={c.id}>
                    <ReviewCard cert={c} onReviewed={queue.reload} />
                  </li>
                ))}
              </ul>
            )}
            {done.length > 0 && (
              <>
                <SectionTitle>Reviewed</SectionTitle>
                <ul className="flex flex-col gap-3">
                  {done.map((c) => (
                    <li key={c.id}>
                      <ReviewCard cert={c} onReviewed={queue.reload} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </ScreenBody>
    </>
  );
}
