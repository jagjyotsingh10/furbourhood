/** DEMO DATA. Fictional pets belonging to the demo owner. */
import type { Pet } from "@/types";

export const pets: Pet[] = [
  {
    id: "biscuit",
    name: "Biscuit",
    species: "Dog",
    breed: "Golden Retriever",
    ageYears: 11,
    weightKg: 31,
    tone: "coral",
    needs: ["senior-care", "oral-medication", "anxiety"],
  },
  {
    id: "mochi",
    name: "Mochi",
    species: "Cat",
    breed: "Domestic Shorthair",
    ageYears: 4,
    weightKg: 5,
    tone: "sky",
    needs: ["cat-care", "special-diet"],
  },
  {
    id: "rocket",
    name: "Rocket",
    species: "Dog",
    breed: "Beagle mix",
    ageYears: 1,
    weightKg: 11,
    tone: "mint",
    needs: ["puppy-training"],
  },
];

export function getPet(id: string): Pet | undefined {
  return pets.find((p) => p.id === id);
}
