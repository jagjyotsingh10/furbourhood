import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { AppBar } from "@/components/AppBar";
import { ScreenBody, SectionTitle } from "@/components/AppShell";
import { CertificateForm, CertificateList, VerificationChecklist } from "@/components/Certificates";
import { FormError } from "@/components/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { certificateFileUrl, deleteCertificate, uploadCertificate } from "@/data/api";
import { useMyCertificates, useMyListing } from "@/data/hooks";
import { verificationSteps } from "@/lib/verification";
import type { Provider } from "@/types";

function CertificatesPanel({ listing }: { listing: Provider }) {
  const certs = useMyCertificates(listing.id);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needs = listing.skills.map((s) => s.need);

  if (certs.error) return <ErrorState message={certs.error} onRetry={certs.reload} />;
  if (certs.loading && !certs.data) return <LoadingState />;
  const list = certs.data ?? [];

  return (
    <>
      <VerificationChecklist steps={verificationSteps(listing, list)} />
      {sent && (
        <p role="status" className="flex items-center gap-2 rounded-card bg-mint p-4 text-sm font-semibold">
          <CircleCheck className="size-5 shrink-0" aria-hidden />
          Sent for review. Furbourhood usually checks certificates within 2 working days.
        </p>
      )}
      {needs.length === 0 ? (
        <EmptyState title="Add a skill first">
          Certificates prove a skill on your listing.{" "}
          <Link to="/listing" className="font-semibold underline">
            Add skills in My listing
          </Link>
          .
        </EmptyState>
      ) : (
        <CertificateForm
          needs={needs}
          onUpload={async (input) => {
            setSent(false);
            await uploadCertificate(listing.id, input);
            setSent(true);
            certs.reload();
          }}
        />
      )}
      <SectionTitle>Your certificates</SectionTitle>
      <FormError message={error} />
      <CertificateList
        certificates={list}
        onOpen={async (cert) => {
          setError(null);
          // Open the tab first (synchronously) so pop-up blockers allow it, then point it at the private link.
          const tab = window.open("", "_blank");
          try {
            const url = await certificateFileUrl(cert);
            if (tab) tab.location.href = url;
            else window.location.href = url;
          } catch (err) {
            tab?.close();
            setError(err instanceof Error ? err.message : "Couldn't open the file.");
          }
        }}
        onDelete={async (cert) => {
          if (!window.confirm(`Remove "${cert.title}"? You can upload it again later.`)) return;
          setError(null);
          try {
            await deleteCertificate(cert);
            setSent(false);
            certs.reload();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't remove the certificate.");
          }
        }}
      />
    </>
  );
}

/** Provider uploads certificates; Furbourhood reviews them and approved ones make the skill Verified. */
export function Verification() {
  const { role } = useAuth();
  const { data: listing, loading, error, reload } = useMyListing();

  let body;
  if (role !== "provider") {
    body = <EmptyState title="Verification is for care providers" />;
  } else if (loading && !listing) {
    body = <LoadingState />;
  } else if (error) {
    body = <ErrorState message={error} onRetry={reload} />;
  } else if (!listing) {
    body = (
      <EmptyState title="Publish your listing first">
        <Button asChild size="sm" className="mt-3">
          <Link to="/listing">Set up my listing</Link>
        </Button>
      </EmptyState>
    );
  } else {
    body = <CertificatesPanel listing={listing} />;
  }

  return (
    <>
      <AppBar title="Verification" back="/listing" />
      <ScreenBody>{body}</ScreenBody>
    </>
  );
}
