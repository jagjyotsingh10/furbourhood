import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { NeedChip } from "@/components/NeedChip";
import { Card } from "@/components/ui/card";
import { plural } from "@/lib/format";
import type { Pet } from "@/types";

/** Pet summary. With `editable`, the whole card links to the pet's edit screen. */
export function PetCard({ pet, editable = false }: { pet: Pet; editable?: boolean }) {
  return (
    <Card className="relative p-4">
      <div className="flex items-center gap-3">
        <Avatar name={pet.name} tone={pet.tone} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-lg leading-tight font-bold">
            {editable ? (
              <Link
                to={`/pets/${pet.id}/edit`}
                aria-label={`Edit ${pet.name}`}
                className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
              >
                {pet.name}
              </Link>
            ) : (
              pet.name
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            {pet.species}
            {pet.breed && ` · ${pet.breed}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {plural(pet.ageYears, "year")} old · {pet.weightKg} kg
          </p>
        </div>
        {editable && (
          <span className="flex items-center text-sm font-semibold" aria-hidden>
            Edit
            <ChevronRight className="size-4" />
          </span>
        )}
      </div>
      {pet.needs.length > 0 && (
        <div className="mt-3">
          <p className="sr-only">Care needs</p>
          <ul className="flex flex-wrap gap-1.5">
            {pet.needs.map((need) => (
              <li key={need}>
                <NeedChip need={need} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
