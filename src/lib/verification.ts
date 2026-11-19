import type { Certificate } from "@/data/api";
import type { Provider } from "@/types";

export interface ChecklistStep {
  label: string;
  detail: string;
  state: "done" | "waiting" | "todo";
}

/** The provider's path to being trusted, worked out from their listing and certificates. */
export function verificationSteps(listing: Provider, certs: Certificate[]): ChecklistStep[] {
  const profileDone = listing.bio.trim().length > 0 && listing.services.length > 0 && listing.skills.length > 0;
  const approved = certs.filter((c) => c.status === "approved");
  const pending = certs.some((c) => c.status === "pending");
  const verifiedSkills = listing.skills.filter((s) => s.level !== "self-declared").length;

  return [
    {
      label: "Complete your listing",
      detail: profileDone ? "Bio, services and skills are filled in." : "Add a bio, at least one service and your skills.",
      state: profileDone ? "done" : "todo",
    },
    {
      label: "Upload a certificate",
      detail: certs.length > 0 ? `${certs.length} sent.` : "A course or qualification for one of your skills.",
      state: certs.length > 0 ? "done" : "todo",
    },
    {
      label: "Furbourhood checks it",
      detail:
        approved.length > 0
          ? `${approved.length} approved. ${verifiedSkills} of ${listing.skills.length} skills are Verified or Proven.`
          : pending
            ? "In review. Usually within 2 working days."
            : "Happens after you upload.",
      state: approved.length > 0 ? "done" : pending ? "waiting" : "todo",
    },
    {
      label: "In-person check",
      detail: listing.verifiedInPerson
        ? "Done. Your listing shows Verified in person."
        : "Furbourhood meets you once before your listing shows Verified in person.",
      state: listing.verifiedInPerson ? "done" : "todo",
    },
  ];
}
