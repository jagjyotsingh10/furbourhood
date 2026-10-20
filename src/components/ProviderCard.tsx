import { Link } from "react-router-dom";
import { ChevronRight, CircleCheck, MapPin } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { FeaturedBadge, Rating, VerifiedBadge } from "@/components/Badges";
import { LevelBadge } from "@/components/LevelBadge";
import { Card } from "@/components/ui/card";
import { NEED_LABELS } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { ProviderMatch } from "@/lib/match";

interface ProviderCardProps {
  match: ProviderMatch;
  /** Only true on the All providers tab. Best match never shows Featured. */
  showFeatured?: boolean;
  /** Query string carried to the profile, e.g. "?service=walking&pet=biscuit" */
  search?: string;
}

export function ProviderCard({ match, showFeatured = false, search = "" }: ProviderCardProps) {
  const { provider, matchedSkills, needsTotal, offer } = match;

  return (
    <Card className="relative p-4">
      <div className="flex gap-3">
        <Avatar name={provider.name} tone={provider.tone} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-lg leading-tight font-bold">
              {/* Stretched link: the whole card opens the profile */}
              <Link
                to={`/providers/${provider.id}${search}`}
                className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
              >
                {provider.name}
              </Link>
            </h3>
            {showFeatured && provider.featured && <FeaturedBadge />}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden />
            {provider.area.name} · {provider.area.fsa}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Rating rating={provider.rating} reviewCount={provider.reviewCount} />
            {provider.verifiedInPerson && <VerifiedBadge />}
          </div>
        </div>
      </div>

      {needsTotal > 0 && (
        <div className="mt-3 rounded-control bg-cloud p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <CircleCheck className="size-4" aria-hidden />
            Meets {matchedSkills.length} of {needsTotal} needs
          </p>
          {matchedSkills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matchedSkills.map((skill) => (
                <LevelBadge key={skill.need} level={skill.level} label={NEED_LABELS[skill.need]} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {offer ? (
            <>
              from <span className="text-base font-bold text-navy">{formatPrice(offer.rate)}</span> / {offer.unit}
            </>
          ) : (
            "Rates on profile"
          )}
        </p>
        <span className="flex items-center text-sm font-semibold" aria-hidden>
          View profile
          <ChevronRight className="size-4" />
        </span>
      </div>
    </Card>
  );
}
