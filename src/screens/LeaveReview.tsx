import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { ScreenBody } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { FormError, TextAreaField } from "@/components/Field";
import { LevelBadge } from "@/components/LevelBadge";
import { StarRatingInput } from "@/components/StarRatingInput";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createReview } from "@/data/api";
import { useBookings } from "@/data/hooks";
import { NEED_LABELS, serviceInfo } from "@/lib/catalog";
import { formatDateRange } from "@/lib/format";
import type { CareNeed } from "@/types";
import type { BookingsNotice } from "@/screens/Bookings";

const MAX_BODY = 600;

export function LeaveReview() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useBookings();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [confirmed, setConfirmed] = useState<CareNeed[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const details = data?.find((d) => d.booking.id === id);

  const shell = (content: ReactNode) => (
    <>
      <AppBar title="Leave a review" back="/bookings" />
      <ScreenBody>{content}</ScreenBody>
    </>
  );

  if (loading && !data) return shell(<LoadingState />);
  if (error) return shell(<ErrorState message={error} onRetry={reload} />);
  if (!details) return shell(<EmptyState title="Booking not found" />);
  if (details.booking.status !== "completed")
    return shell(<EmptyState title="Not ready to review">You can review a booking once it's completed.</EmptyState>);
  if (details.reviewed) return shell(<EmptyState title="Already reviewed">Thanks, you've reviewed this booking.</EmptyState>);

  const { booking, provider, pet } = details;
  // Skills the provider lists that match this pet's needs: the ones the owner saw in use.
  const confirmable = provider.skills.filter((s) => pet.needs.includes(s.need));

  const toggle = (need: CareNeed) =>
    setConfirmed((current) => (current.includes(need) ? current.filter((n) => n !== need) : [...current, need]));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (rating === 0) return setFormError("Choose a rating from 1 to 5 stars.");
    if (body.trim().length < 10) return setFormError("Write a few words about the care, at least 10 characters.");
    setBusy(true);
    try {
      await createReview({ bookingId: booking.id, rating, body: body.trim(), confirmedNeeds: confirmed });
      const notice: BookingsNotice = { message: `Review posted for ${provider.name}. Thanks for helping other owners.` };
      navigate("/bookings", { replace: true, state: notice });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not post the review. Try again.");
      setBusy(false);
    }
  };

  return shell(
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Card className="flex items-center gap-3 p-4">
        <Avatar name={provider.name} tone={provider.tone} size="lg" />
        <div className="min-w-0">
          <h2 className="font-heading text-lg leading-tight font-bold">{provider.name}</h2>
          <p className="text-sm text-muted-foreground">
            {serviceInfo(booking.service).label} for {pet.name} · {formatDateRange(booking.start, booking.end)}
          </p>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <StarRatingInput value={rating} onChange={setRating} />
        <TextAreaField
          id="review-body"
          label="Your review"
          hint={`What went well, and anything other owners should know. ${body.length}/${MAX_BODY}`}
          value={body}
          maxLength={MAX_BODY}
          onChange={(e) => setBody(e.target.value)}
        />
      </Card>

      {confirmable.length > 0 && (
        <Card className="p-4">
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">Confirm skills {provider.name} used</legend>
            <p className="mb-3 text-xs text-muted-foreground">
              Tick the ones handled well. When 3 owners confirm a skill, it becomes Proven.
            </p>
            <ul className="flex flex-col gap-2">
              {confirmable.map((skill) => {
                const checked = confirmed.includes(skill.need);
                return (
                  <li key={skill.need} className="flex items-center gap-2">
                    {/* The badge sits outside the label: it has its own tap-to-explain tooltip. */}
                    <label className="flex min-h-11 flex-1 cursor-pointer items-center rounded-control border border-input bg-card px-3 py-2 has-checked:border-navy has-checked:bg-sky has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <input type="checkbox" checked={checked} onChange={() => toggle(skill.need)} className="sr-only" />
                        <span
                          aria-hidden
                          className="flex size-5 items-center justify-center rounded-sm border border-navy bg-card"
                        >
                          {checked && <Check className="size-3.5" />}
                        </span>
                        {NEED_LABELS[skill.need]}
                      </span>
                    </label>
                    <LevelBadge level={skill.level} />
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </Card>
      )}

      <FormError message={formError} />
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Posting…" : "Post review"}
      </Button>
    </form>,
  );
}
