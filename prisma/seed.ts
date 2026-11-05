/**
 * Demo data: users for the mock login, and spots across Tel Aviv-Yafo.
 *
 * Idempotent: fixed ids + `upsert` with an empty `update`, so running it on
 * every deploy creates missing rows and never overwrites changes made in the
 * app (e.g. a host editing a demo spot).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type SpotType } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined || databaseUrl === "") throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const SUNDAY_TO_THURSDAY = [0, 1, 2, 3, 4];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

type WeeklyWindow = { days: number[]; from: string; until: string };

/** "08:30" -> 510 minutes since midnight. */
function minutes(time: string): number {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

function toRules(windows: WeeklyWindow[]) {
  return windows.flatMap(({ days, from, until }) =>
    days.map((dayOfWeek) => ({ dayOfWeek, startMinute: minutes(from), endMinute: minutes(until) })),
  );
}

const USERS = [
  { id: "demo-noa", name: "Noa Levi", email: "noa@demo.tlvpark", phone: "+972-50-111-2233" },
  { id: "demo-yossi", name: "Yossi Cohen", email: "yossi@demo.tlvpark", phone: "+972-52-444-5566" },
  { id: "demo-dana", name: "Dana Mizrahi", email: "dana@demo.tlvpark", phone: "+972-54-777-8899" },
  { id: "demo-avi", name: "Avi Peretz", email: "avi@demo.tlvpark", phone: null },
];

type SeedSpot = {
  id: string;
  hostId: string;
  title: string;
  description: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  spotType: SpotType;
  lengthCm: number;
  widthCm: number;
  heightClearanceCm: number | null;
  isCovered: boolean;
  isGated: boolean;
  hasEvCharger: boolean;
  hourlyShekels: number;
  dailyCapShekels: number;
  gatePhoneNumber: string | null;
  accessInstructions: string;
  schedule: WeeklyWindow[];
};

const SPOTS: SeedSpot[] = [
  {
    id: "demo-spot-rothschild",
    hostId: "demo-noa",
    title: "Underground spot on Rothschild Blvd",
    description: "Secure residential garage, 2 minutes from the boulevard. Free on workdays while I'm at the office.",
    addressLine: "Rothschild Blvd 30",
    latitude: 32.0636,
    longitude: 34.7741,
    spotType: "UNDERGROUND_GARAGE",
    lengthCm: 500,
    widthCm: 240,
    heightClearanceCm: 200,
    isCovered: true,
    isGated: true,
    hasEvCharger: false,
    hourlyShekels: 18,
    dailyCapShekels: 90,
    gatePhoneNumber: "+972-3-555-0101",
    accessInstructions: "Call the gate number from the ramp; it opens after one ring. Spot #14 on level -1.",
    schedule: [{ days: SUNDAY_TO_THURSDAY, from: "08:00", until: "18:00" }],
  },
  {
    id: "demo-spot-dizengoff",
    hostId: "demo-noa",
    title: "Covered spot near Dizengoff Center",
    description: "Building parking with an EV charger (bring your own Type 2 cable).",
    addressLine: "Dizengoff 50",
    latitude: 32.0757,
    longitude: 34.7748,
    spotType: "UNDERGROUND_GARAGE",
    lengthCm: 480,
    widthCm: 230,
    heightClearanceCm: 190,
    isCovered: true,
    isGated: true,
    hasEvCharger: true,
    hourlyShekels: 20,
    dailyCapShekels: 110,
    gatePhoneNumber: "+972-3-555-0102",
    accessInstructions: "Dial the gate, enter the lobby code 2580#, the spot is marked 'TLVPark 3'.",
    schedule: [{ days: EVERY_DAY, from: "00:00", until: "24:00" }],
  },
  {
    id: "demo-spot-florentin",
    hostId: "demo-yossi",
    title: "Driveway spot in Florentin",
    description: "Open driveway in a quiet courtyard. Great for evenings out in Florentin.",
    addressLine: "Vital 12",
    latitude: 32.057,
    longitude: 34.769,
    spotType: "DRIVEWAY",
    lengthCm: 450,
    widthCm: 220,
    heightClearanceCm: null,
    isCovered: false,
    isGated: false,
    hasEvCharger: false,
    hourlyShekels: 12,
    dailyCapShekels: 60,
    gatePhoneNumber: null,
    accessInstructions: "Enter the courtyard through the blue gate (always open). Park on the left, behind the scooter.",
    schedule: [
      { days: EVERY_DAY, from: "17:00", until: "24:00" },
      { days: EVERY_DAY, from: "00:00", until: "02:00" },
    ],
  },
  {
    id: "demo-spot-ben-yehuda",
    hostId: "demo-yossi",
    title: "Gated spot 3 minutes from the beach",
    description: "Ground-level gated parking off Ben Yehuda. Weekends only.",
    addressLine: "Ben Yehuda 120",
    latitude: 32.087,
    longitude: 34.7705,
    spotType: "OPEN_LOT",
    lengthCm: 520,
    widthCm: 250,
    heightClearanceCm: null,
    isCovered: false,
    isGated: true,
    hasEvCharger: false,
    hourlyShekels: 15,
    dailyCapShekels: 80,
    gatePhoneNumber: "+972-3-555-0104",
    accessInstructions: "Call the gate number; use spot B (painted yellow).",
    schedule: [{ days: [5, 6], from: "07:00", until: "22:00" }],
  },
  {
    id: "demo-spot-neve-tzedek",
    hostId: "demo-noa",
    title: "Motorcycle spot in Neve Tzedek",
    description: "Small covered nook for a motorcycle or scooter, right by Shabazi Street.",
    addressLine: "Shabazi 40",
    latitude: 32.061,
    longitude: 34.7655,
    spotType: "DRIVEWAY",
    lengthCm: 250,
    widthCm: 120,
    heightClearanceCm: 180,
    isCovered: true,
    isGated: false,
    hasEvCharger: false,
    hourlyShekels: 6,
    dailyCapShekels: 30,
    gatePhoneNumber: null,
    accessInstructions: "Through the archway at number 40, the nook is to the right of the mailboxes.",
    schedule: [{ days: EVERY_DAY, from: "06:00", until: "23:00" }],
  },
  {
    id: "demo-spot-jaffa",
    hostId: "demo-yossi",
    title: "Large spot in Jaffa (fits vans)",
    description: "Wide open lot spot near the flea market. Fits SUVs and vans.",
    addressLine: "Yefet 30, Jaffa",
    latitude: 32.0505,
    longitude: 34.754,
    spotType: "OPEN_LOT",
    lengthCm: 600,
    widthCm: 280,
    heightClearanceCm: null,
    isCovered: false,
    isGated: false,
    hasEvCharger: false,
    hourlyShekels: 10,
    dailyCapShekels: 50,
    gatePhoneNumber: null,
    accessInstructions: "Spot #3, the one with the painted TLVPark logo on the wall.",
    schedule: [{ days: EVERY_DAY, from: "00:00", until: "24:00" }],
  },
  {
    id: "demo-spot-ramat-aviv",
    hostId: "demo-noa",
    title: "Ramat Aviv spot near the university",
    description: "Underground building parking, ideal for a day on campus.",
    addressLine: "Einstein 40",
    latitude: 32.1135,
    longitude: 34.799,
    spotType: "UNDERGROUND_GARAGE",
    lengthCm: 490,
    widthCm: 230,
    heightClearanceCm: 210,
    isCovered: true,
    isGated: true,
    hasEvCharger: true,
    hourlyShekels: 10,
    dailyCapShekels: 55,
    gatePhoneNumber: "+972-3-555-0107",
    accessInstructions: "Call the gate number, drive down to -2, spot #27.",
    schedule: [{ days: SUNDAY_TO_THURSDAY, from: "07:00", until: "20:00" }],
  },
  {
    id: "demo-spot-sarona",
    hostId: "demo-yossi",
    title: "Sarona / Kaplan office-tower spot",
    description: "Evening and weekend spot in a tower garage next to Sarona Market.",
    addressLine: "Kaplan 20",
    latitude: 32.0722,
    longitude: 34.786,
    spotType: "UNDERGROUND_GARAGE",
    lengthCm: 500,
    widthCm: 240,
    heightClearanceCm: 200,
    isCovered: true,
    isGated: true,
    hasEvCharger: false,
    hourlyShekels: 22,
    dailyCapShekels: 120,
    gatePhoneNumber: "+972-3-555-0108",
    accessInstructions: "Call the gate number, then show the booking screen to the guard if asked.",
    schedule: [
      { days: SUNDAY_TO_THURSDAY, from: "18:00", until: "24:00" },
      { days: [5, 6], from: "00:00", until: "24:00" },
    ],
  },
  {
    id: "demo-spot-ibn-gabirol",
    hostId: "demo-noa",
    title: "Spot by Rabin Square",
    description: "Driveway behind the building, steps from Ibn Gabirol cafés.",
    addressLine: "Ibn Gabirol 100",
    latitude: 32.082,
    longitude: 34.7815,
    spotType: "DRIVEWAY",
    lengthCm: 470,
    widthCm: 220,
    heightClearanceCm: null,
    isCovered: false,
    isGated: true,
    hasEvCharger: false,
    hourlyShekels: 16,
    dailyCapShekels: 85,
    gatePhoneNumber: "+972-3-555-0109",
    accessInstructions: "Call the gate number; park behind the building, last spot on the right.",
    schedule: [{ days: EVERY_DAY, from: "09:00", until: "21:00" }],
  },
];

async function main(): Promise<void> {
  for (const user of USERS) {
    await prisma.user.upsert({ where: { id: user.id }, update: {}, create: user });
  }

  for (const { schedule, hourlyShekels, dailyCapShekels, ...spot } of SPOTS) {
    await prisma.parkingSpot.upsert({
      where: { id: spot.id },
      update: {},
      create: {
        ...spot,
        hourlyRateAgorot: hourlyShekels * 100,
        dailyCapAgorot: dailyCapShekels * 100,
        availabilityRules: { create: toRules(schedule) },
      },
    });
  }

  console.log(`Seed complete: ${USERS.length} users, ${SPOTS.length} spots (existing rows left unchanged).`);
}

// A rejection is left unhandled on purpose: Node then exits with code 1, so a
// failed seed fails the deploy instead of starting with missing data.
void main().finally(() => prisma.$disconnect());
