import { Plus } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody } from "@/components/AppShell";
import { PetCard } from "@/components/PetCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { usePets } from "@/data/hooks";

export function MyPets() {
  const { data: pets = [], loading, error, reload } = usePets();

  return (
    <>
      <AppBar title="My pets" />
      <ScreenBody>
        <p className="text-sm text-muted-foreground">
          Care needs help us match each pet with providers who have the right skills.
        </p>
        {loading ? (
          <LoadingState label="Loading your pets…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : pets.length === 0 ? (
          <EmptyState title="No pets yet">Add your first pet to start finding care.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {pets.map((pet) => (
              <li key={pet.id}>
                <PetCard pet={pet} />
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="lg" className="border-dashed">
          <Plus aria-hidden />
          Add pet
        </Button>
        <DemoNote>New accounts start with three demo pets.</DemoNote>
      </ScreenBody>
    </>
  );
}
