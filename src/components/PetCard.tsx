import { Avatar } from "@/components/Avatar";
import { NeedChip } from "@/components/NeedChip";
import { Card } from "@/components/ui/card";
import { plural } from "@/lib/format";
import type { Pet } from "@/types";

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Avatar name={pet.name} tone={pet.tone} size="lg" />
        <div className="min-w-0">
          <h3 className="font-heading text-lg leading-tight font-bold">{pet.name}</h3>
          <p className="text-sm text-muted-foreground">
            {pet.species} · {pet.breed}
          </p>
          <p className="text-sm text-muted-foreground">
            {plural(pet.ageYears, "year")} old · {pet.weightKg} kg
          </p>
        </div>
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
