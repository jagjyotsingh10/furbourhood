/** DEMO DATA. Fictional bookings for the demo owner. */
import type { Booking } from "@/types";

export const DEMO_TODAY = "2026-10-20";

export const bookings: Booking[] = [
  {
    id: "b1",
    providerId: "priya-s",
    petId: "biscuit",
    service: "walking",
    start: "2026-10-23",
    end: "2026-10-23",
    status: "requested",
    total: 24,
  },
  {
    id: "b2",
    providerId: "amir-h",
    petId: "biscuit",
    service: "boarding",
    start: "2026-10-30",
    end: "2026-11-02",
    status: "accepted",
    total: 135,
  },
  {
    id: "b3",
    providerId: "sophie-l",
    petId: "mochi",
    service: "drop-in",
    start: "2026-11-07",
    end: "2026-11-08",
    status: "paid",
    total: 36,
  },
  {
    id: "b4",
    providerId: "daniel-r",
    petId: "rocket",
    service: "daycare",
    start: "2026-10-09",
    end: "2026-10-09",
    status: "completed",
    total: 32,
  },
  {
    id: "b5",
    providerId: "kevin-l",
    petId: "mochi",
    service: "drop-in",
    start: "2026-09-12",
    end: "2026-09-14",
    status: "completed",
    total: 75,
  },
];
