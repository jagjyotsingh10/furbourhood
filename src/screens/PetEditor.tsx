import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { ScreenBody } from "@/components/AppShell";
import { FormError } from "@/components/Field";
import { EMPTY_PET, PetForm, toPetInput } from "@/components/PetForm";
import { ErrorState, LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createPet, deletePet, updatePet } from "@/data/api";
import { usePet, usePetBookingCount } from "@/data/hooks";
import { plural } from "@/lib/format";
import { NotFound } from "@/screens/NotFound";

export function AddPet() {
  const navigate = useNavigate();
  return (
    <>
      <AppBar title="Add pet" back="/pets" />
      <ScreenBody>
        <PetForm
          initial={EMPTY_PET}
          submitLabel="Add pet"
          onSubmit={async (input) => {
            await createPet(input);
            navigate("/pets", { replace: true });
          }}
        />
      </ScreenBody>
    </>
  );
}

function DeletePet({ id, name }: { id: string; name: string }) {
  const navigate = useNavigate();
  const bookings = usePetBookingCount(id);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bring the confirmation fully into view once it opens; otherwise it sits behind the tab bar.
  const scrollIntoView = useCallback((node: HTMLDivElement | null) => {
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await deletePet(id);
      navigate("/pets", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete. Try again.");
      setBusy(false);
    }
  };

  if (!confirming) {
    return (
      <Button variant="ghost" className="text-destructive hover:bg-coral-tint" onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden />
        Delete {name}
      </Button>
    );
  }

  const count = bookings.data ?? 0;
  return (
    <Card
      ref={scrollIntoView}
      className="flex flex-col gap-3 border-2 border-destructive p-4"
      role="group"
      aria-labelledby="delete-title"
    >
      <h2 id="delete-title" className="font-heading text-lg font-bold">
        Delete {name}?
      </h2>
      <p className="text-sm">
        {count > 0
          ? `This also removes ${plural(count, "booking")} for ${name}. This can't be undone.`
          : "This can't be undone."}
      </p>
      <FormError message={error} />
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={remove} disabled={busy || bookings.loading}>
          {busy ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </Card>
  );
}

export function EditPet() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: pet, loading, error, reload } = usePet(id);

  if (loading || error) {
    return (
      <>
        <AppBar title="Edit pet" back="/pets" />
        <ScreenBody>{error ? <ErrorState message={error} onRetry={reload} /> : <LoadingState />}</ScreenBody>
      </>
    );
  }
  if (!pet) return <NotFound />;

  return (
    <>
      <AppBar title={`Edit ${pet.name}`} back="/pets" />
      <ScreenBody>
        <PetForm
          initial={toPetInput(pet)}
          submitLabel="Save changes"
          onSubmit={async (input) => {
            await updatePet(pet.id, input);
            navigate("/pets", { replace: true });
          }}
        />
        <DeletePet id={pet.id} name={pet.name} />
      </ScreenBody>
    </>
  );
}
