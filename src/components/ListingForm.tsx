import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { Field, FormError, TextAreaField, TonePicker } from "@/components/Field";
import { LevelBadge } from "@/components/LevelBadge";
import { NeedPicker } from "@/components/NeedPicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ListingInput } from "@/data/api";
import { AREAS, HOUSEHOLD_LIMIT, NEED_LABELS, SERVICE_UNITS, SERVICES } from "@/lib/catalog";
import { FSA_PATTERN } from "@/lib/search";
import type { ProviderSkill, ServiceId } from "@/types";

const LIMITS = { name: 40, bio: 600, years: 60, minRate: 5, maxRate: 500 };

type Errors = Partial<Record<"name" | "area" | "years" | "bio" | "services" | "pets", string>>;

interface ListingFormProps {
  initial: ListingInput;
  /** Skills already on the listing, to show their current levels */
  currentSkills: ProviderSkill[];
  submitLabel: string;
  onSubmit: (input: ListingInput) => Promise<void>;
}

/** Create / edit a provider listing: profile, services with rates, and skills. */
export function ListingForm({ initial, currentSkills, submitLabel, onSubmit }: ListingFormProps) {
  const [name, setName] = useState(initial.name);
  const [tone, setTone] = useState(initial.tone);
  const [area, setArea] = useState(initial.areaFsa);
  const [bio, setBio] = useState(initial.bio);
  const [years, setYears] = useState(String(initial.yearsExperience));
  const [ownDogs, setOwnDogs] = useState(String(initial.ownDogs));
  const [ownCats, setOwnCats] = useState(String(initial.ownCats));
  const [rates, setRates] = useState<Partial<Record<ServiceId, string>>>(() =>
    Object.fromEntries(initial.services.map((s) => [s.service, String(s.rate)])),
  );
  const [needs, setNeeds] = useState(initial.needs);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const clear = (field: keyof Errors) => setErrors((current) => ({ ...current, [field]: undefined }));

  const toggleService = (service: ServiceId) => {
    clear("services");
    setRates((current) => {
      const next = { ...current };
      if (service in next) delete next[service];
      else next[service] = "";
      return next;
    });
  };

  const validate = (): Errors => {
    const found: Errors = {};
    if (!name.trim()) found.name = "Enter the name owners will see.";
    if (!FSA_PATTERN.test(area)) found.area = "Enter the first 3 characters of your postal code, like N9A.";
    const yearsNum = Number(years);
    if (years === "" || !Number.isInteger(yearsNum) || yearsNum < 0 || yearsNum > LIMITS.years)
      found.years = `Whole years, 0 to ${LIMITS.years}.`;
    if (bio.length > LIMITS.bio) found.bio = `Keep it under ${LIMITS.bio} characters.`;
    const dogs = Number(ownDogs);
    const cats = Number(ownCats);
    if (!Number.isInteger(dogs) || !Number.isInteger(cats) || dogs < 0 || cats < 0 || dogs > 10 || cats > 10)
      found.pets = "Enter whole numbers from 0 to 10.";
    const chosen = Object.entries(rates);
    if (chosen.length === 0) found.services = "Offer at least one service.";
    else if (chosen.some(([, rate]) => !(Number(rate) >= LIMITS.minRate && Number(rate) <= LIMITS.maxRate)))
      found.services = `Each rate must be between $${LIMITS.minRate} and $${LIMITS.maxRate}.`;
    return found;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        tone,
        areaFsa: area,
        areaName: AREAS[area] ?? "Windsor-Essex",
        bio: bio.trim(),
        yearsExperience: Number(years),
        ownDogs: Number(ownDogs),
        ownCats: Number(ownCats),
        // Keep the catalog order so the profile lists services consistently.
        services: SERVICES.filter((s) => s.id in rates).map((s) => ({
          service: s.id,
          rate: Number(rates[s.id]),
          unit: SERVICE_UNITS[s.id],
        })),
        needs,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save. Try again.");
    }
    setBusy(false);
  };

  const ranked = currentSkills.filter((s) => s.level !== "self-declared" && needs.includes(s.need));

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex justify-center" aria-hidden>
        <Avatar name={name.trim() || "?"} tone={tone} size="xl" />
      </div>

      <Card className="flex flex-col gap-4 p-4">
        <Field
          id="listing-name"
          label="Name owners will see"
          hint='First name and last initial works well, e.g. "Priya S."'
          value={name}
          maxLength={LIMITS.name}
          autoComplete="off"
          onChange={(e) => {
            setName(e.target.value);
            clear("name");
          }}
          error={errors.name}
        />
        <Field
          id="listing-area"
          label="Area"
          hint={FSA_PATTERN.test(area) ? `${AREAS[area] ?? "Windsor-Essex"} · first 3 characters of your postal code` : "First 3 characters of your postal code"}
          value={area}
          maxLength={3}
          autoComplete="off"
          autoCapitalize="characters"
          onChange={(e) => {
            setArea(e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 3));
            clear("area");
          }}
          error={errors.area}
        />
        <TextAreaField
          id="listing-bio"
          label="About you"
          hint={`What owners should know: experience, home, routine. ${bio.length}/${LIMITS.bio}`}
          value={bio}
          maxLength={LIMITS.bio}
          onChange={(e) => {
            setBio(e.target.value);
            clear("bio");
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="listing-years"
            label="Years of experience"
            type="number"
            inputMode="numeric"
            min={0}
            max={LIMITS.years}
            value={years}
            onChange={(e) => {
              setYears(e.target.value);
              clear("years");
            }}
            error={errors.years}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <div>
          <p className="text-sm font-semibold">Your own pets</p>
          <p className="text-xs text-muted-foreground">
            City of Windsor By-law 8156 allows {HOUSEHOLD_LIMIT.Dog} dogs and {HOUSEHOLD_LIMIT.Cat} cats per home,
            your own included. If you offer boarding or daycare, guests are limited so you stay within it.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="listing-own-dogs"
            label="Dogs"
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            value={ownDogs}
            onChange={(e) => {
              setOwnDogs(e.target.value);
              clear("pets");
            }}
          />
          <Field
            id="listing-own-cats"
            label="Cats"
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            value={ownCats}
            onChange={(e) => {
              setOwnCats(e.target.value);
              clear("pets");
            }}
          />
        </div>
        {errors.pets && <p className="text-xs text-destructive">{errors.pets}</p>}
      </Card>

      <Card className="p-4">
        <fieldset aria-describedby={errors.services ? "services-error" : undefined}>
          <legend className="mb-1 text-sm font-semibold">Services and rates</legend>
          <p className="mb-3 text-xs text-muted-foreground">Turn on what you offer and set your price in dollars.</p>
          <ul className="flex flex-col gap-2">
            {SERVICES.map((s) => {
              const on = s.id in rates;
              const Icon = s.icon;
              return (
                <li key={s.id} className="flex items-center gap-2">
                  <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-control border border-input bg-card px-3 text-sm font-semibold has-checked:border-navy has-checked:bg-sky has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring">
                    <input type="checkbox" checked={on} onChange={() => toggleService(s.id)} className="sr-only" />
                    {on ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
                    {s.label}
                  </label>
                  {on && (
                    <div className="flex w-32 items-center gap-1">
                      <Input
                        aria-label={`${s.label} rate in dollars per ${SERVICE_UNITS[s.id]}`}
                        type="number"
                        inputMode="decimal"
                        min={LIMITS.minRate}
                        max={LIMITS.maxRate}
                        placeholder="$"
                        value={rates[s.id]}
                        onChange={(e) => {
                          setRates((current) => ({ ...current, [s.id]: e.target.value }));
                          clear("services");
                        }}
                        className="px-2.5"
                      />
                      <span className="shrink-0 text-xs text-muted-foreground">/{SERVICE_UNITS[s.id]}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {errors.services && (
            <p id="services-error" className="mt-2 text-xs text-destructive">
              {errors.services}
            </p>
          )}
        </fieldset>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <NeedPicker
          value={needs}
          onChange={setNeeds}
          legend="Skills"
          hint="New skills start as Self-declared. Furbourhood verifies skills in person, and owners confirm them after bookings."
        />
        {ranked.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ranked.map((skill) => (
              <LevelBadge key={skill.need} level={skill.level} label={NEED_LABELS[skill.need]} />
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <TonePicker value={tone} onChange={setTone} />
      </Card>

      <FormError message={formError} />
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
