import { Plus } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody } from "@/components/AppShell";
import { PetCard } from "@/components/PetCard";
import { Button } from "@/components/ui/button";
import { pets } from "@/mocks";

export function MyPets() {
  return (
    <>
      <AppBar title="My pets" />
      <ScreenBody>
        <p className="text-sm text-muted-foreground">
          Care needs help us match each pet with providers who have the right skills.
        </p>
        <ul className="flex flex-col gap-3">
          {pets.map((pet) => (
            <li key={pet.id}>
              <PetCard pet={pet} />
            </li>
          ))}
        </ul>
        <Button variant="outline" size="lg" className="border-dashed">
          <Plus aria-hidden />
          Add pet
        </Button>
        <DemoNote />
      </ScreenBody>
    </>
  );
}
