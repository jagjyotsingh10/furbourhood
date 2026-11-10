import { useState, type FormEvent } from "react";
import { Cat, Dog } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { ChoiceGroup, Field, FormError, type Choice } from "@/components/Field";
import { NeedPicker } from "@/components/NeedPicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PetInput } from "@/data/api";
import { cn } from "@/lib/utils";
import type { BrandTone, Pet } from "@/types";

const SPECIES: Choice<Pet["species"]>[] = [
  { value: "Dog", label: "Dog", icon: <Dog className="size-4" aria-hidden /> },
  { value: "Cat", label: "Cat", icon: <Cat className="size-4" aria-hidden /> },
];

const SWATCH: Record<BrandTone, string> = {
  coral: "bg-coral",
  sky: "bg-sky",
  mint: "bg-mint",
  navy: "bg-navy",
};

const TONES: Choice<BrandTone>[] = (["coral", "sky", "mint", "navy"] as const).map((tone) => ({
  value: tone,
  label: tone[0]!.toUpperCase() + tone.slice(1),
  icon: <span className={cn("size-4 rounded-full border border-navy/20", SWATCH[tone])} aria-hidden />,
}));

export const EMPTY_PET: PetInput = {
  name: "",
  species: "Dog",
  breed: "",
  ageYears: 0,
  weightKg: 0,
  tone: "coral",
  needs: [],
};

export function toPetInput({ name, species, breed, ageYears, weightKg, tone, needs }: Pet): PetInput {
  return { name, species, breed, ageYears, weightKg, tone, needs };
}

const LIMITS = { name: 40, breed: 60, age: 30, weight: 120 };

type Errors = Partial<Record<"name" | "age" | "weight", string>>;

function validate(name: string, age: string, weight: string): Errors {
  const errors: Errors = {};
  if (!name.trim()) errors.name = "Enter your pet's name.";
  const ageNum = Number(age);
  if (age === "" || !Number.isInteger(ageNum) || ageNum < 0 || ageNum > LIMITS.age)
    errors.age = `Whole years, 0 to ${LIMITS.age}.`;
  const weightNum = Number(weight);
  if (weight === "" || Number.isNaN(weightNum) || weightNum <= 0 || weightNum > LIMITS.weight)
    errors.weight = `Between 0.1 and ${LIMITS.weight} kg.`;
  return errors;
}

interface PetFormProps {
  initial: PetInput;
  submitLabel: string;
  onSubmit: (input: PetInput) => Promise<void>;
}

/** Add / Edit pet form. Shows a live avatar preview; validates before calling onSubmit. */
export function PetForm({ initial, submitLabel, onSubmit }: PetFormProps) {
  const [name, setName] = useState(initial.name);
  const [species, setSpecies] = useState(initial.species);
  const [breed, setBreed] = useState(initial.breed);
  // A new pet starts with empty number fields rather than "0".
  const isNew = !initial.name;
  const [age, setAge] = useState(isNew ? "" : String(initial.ageYears));
  const [weight, setWeight] = useState(isNew ? "" : String(initial.weightKg));
  const [tone, setTone] = useState(initial.tone);
  const [needs, setNeeds] = useState(initial.needs);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Editing a field clears its error, so stale messages don't linger.
  const edit = (field: keyof Errors, set: (value: string) => void) => (value: string) => {
    set(value);
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const editName = edit("name", setName);
  const editAge = edit("age", setAge);
  const editWeight = edit("weight", setWeight);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate(name, age, weight);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        species,
        breed: breed.trim(),
        ageYears: Number(age),
        weightKg: Number(weight),
        tone,
        needs,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save. Try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col items-center gap-2" aria-hidden>
        <Avatar name={name.trim() || "?"} tone={tone} size="xl" />
      </div>

      <Card className="flex flex-col gap-4 p-4">
        <Field
          id="pet-name"
          label="Name"
          value={name}
          maxLength={LIMITS.name}
          autoComplete="off"
          onChange={(e) => editName(e.target.value)}
          error={errors.name}
        />
        <ChoiceGroup name="species" legend="Species" options={SPECIES} value={species} onChange={setSpecies} />
        <Field
          id="pet-breed"
          label="Breed"
          hint="Optional, e.g. Golden Retriever or Mixed"
          value={breed}
          maxLength={LIMITS.breed}
          autoComplete="off"
          onChange={(e) => setBreed(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="pet-age"
            label="Age (years)"
            type="number"
            inputMode="numeric"
            min={0}
            max={LIMITS.age}
            step={1}
            value={age}
            onChange={(e) => editAge(e.target.value)}
            error={errors.age}
          />
          <Field
            id="pet-weight"
            label="Weight (kg)"
            type="number"
            inputMode="decimal"
            min={0.1}
            max={LIMITS.weight}
            step={0.1}
            value={weight}
            onChange={(e) => editWeight(e.target.value)}
            error={errors.weight}
          />
        </div>
      </Card>

      <Card className="p-4">
        <NeedPicker value={needs} onChange={setNeeds} />
      </Card>

      <Card className="p-4">
        <ChoiceGroup name="tone" legend="Avatar colour" options={TONES} value={tone} onChange={setTone} columns={4} />
      </Card>

      <FormError message={formError} />
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
