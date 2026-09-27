/**
 * BUKO seating plan.
 *
 * PLACEHOLDER LAYOUT — these zones, table numbers and seat counts are a sensible
 * starting point, not BUKO's confirmed floor plan. Replace them with the real
 * room layout before launch; ids are stored on reservations, so changing an id
 * after go-live orphans the table reference on existing bookings.
 */
export type TableShape = "round" | "square" | "long";
export type DiningTable = {
  id: string;
  label: string;
  zone: string;
  seats: number;
  shape: TableShape;
};
export type Zone = { id: string; label: string; note: string };

/** How long a table is held for one sitting, used to work out when a booked table frees up. */
export const TABLE_TURN_MINUTES = 120;

export const zones: Zone[] = [
  {
    id: "window",
    label: "By the window",
    note: "Intimate two-seaters along the glass",
  },
  { id: "dining", label: "Main dining room", note: "The heart of the room" },
  { id: "private", label: "Private room", note: "A room of your own" },
  { id: "terrace", label: "Terrace", note: "Open air, under the lanterns" },
];

export const tables: DiningTable[] = [
  { id: "W1", label: "Table 1", zone: "window", seats: 2, shape: "round" },
  { id: "W2", label: "Table 2", zone: "window", seats: 2, shape: "round" },
  { id: "W3", label: "Table 3", zone: "window", seats: 2, shape: "round" },
  { id: "M1", label: "Table 4", zone: "dining", seats: 4, shape: "square" },
  { id: "M2", label: "Table 5", zone: "dining", seats: 4, shape: "square" },
  { id: "M3", label: "Table 6", zone: "dining", seats: 4, shape: "round" },
  { id: "M4", label: "Table 7", zone: "dining", seats: 6, shape: "long" },
  { id: "M5", label: "Table 8", zone: "dining", seats: 6, shape: "long" },
  {
    id: "P1",
    label: "The private table",
    zone: "private",
    seats: 10,
    shape: "long",
  },
  { id: "T1", label: "Terrace 1", zone: "terrace", seats: 2, shape: "round" },
  { id: "T2", label: "Terrace 2", zone: "terrace", seats: 4, shape: "square" },
  { id: "T3", label: "Terrace 3", zone: "terrace", seats: 6, shape: "long" },
];

export const tableIds = tables.map((t) => t.id);
export const findTable = (id: string) => tables.find((t) => t.id === id);

/** Coordinates in the 1000 × 690 architectural plan. Table IDs remain stable. */
export const tablePositions: Record<
  string,
  { x: number; y: number; width: number }
> = {
  W1: { x: 115, y: 166, width: 92 },
  W2: { x: 115, y: 307, width: 92 },
  W3: { x: 115, y: 447, width: 92 },
  M1: { x: 313, y: 186, width: 102 },
  M2: { x: 518, y: 186, width: 102 },
  M3: { x: 577, y: 351, width: 106 },
  M4: { x: 315, y: 364, width: 138 },
  M5: { x: 490, y: 542, width: 138 },
  P1: { x: 182, y: 574, width: 160 },
  T1: { x: 855, y: 187, width: 92 },
  T2: { x: 855, y: 357, width: 102 },
  T3: { x: 855, y: 532, width: 138 },
};

export type TableState = "available" | "booked" | "small" | "unknown";
export function getTableState(
  table: DiningTable,
  partySize: number,
  time: string,
  bookings: { table_id: string; time: string }[] | null,
): TableState {
  if (table.seats < partySize) return "small";
  if (!time || bookings === null) return "unknown";
  return bookings.some((b) => b.table_id === table.id && overlaps(time, b.time))
    ? "booked"
    : "available";
}

/** Adds minutes to an "HH:MM" clock time, clamped to the same day. */
export function addMinutes(time: string, minutes: number): string {
  const total = Math.min(
    Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + minutes,
    23 * 60 + 59,
  );
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** True when a new sitting at `time` would overlap a sitting already booked at `booked`. */
export function overlaps(time: string, booked: string): boolean {
  const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  return Math.abs(mins(time) - mins(booked)) < TABLE_TURN_MINUTES;
}

/* ------------------------------------------------------------------ *
 * Seats
 * Chair rectangles live in each table's own furniture viewBox so the
 * drawing and the clickable hit targets can never drift apart.
 * ------------------------------------------------------------------ */
export type SeatSpot = {
  id: string;
  seatNo: number;
  tableId: string;
  /** Rect inside the table's furniture viewBox. */
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Width of a table's furniture viewBox; the height is always 100. */
export const furnitureWidth = (table: DiningTable) =>
  table.shape === "long" ? 150 : 100;

/** Chair rectangles for a table, in furniture viewBox units. */
export function seatLayout(table: DiningTable): SeatSpot[] {
  const long = table.shape === "long";
  let rects: number[][];
  if (table.seats === 2) {
    rects = [
      [8, 35, 13, 24],
      [79, 35, 13, 24],
    ];
  } else if (long) {
    const half = Math.ceil(table.seats / 2);
    rects = Array.from({ length: table.seats }, (_, i) => {
      const column = i % half;
      const x = 27 + column * (84 / Math.max(half - 1, 1));
      return [x, i < half ? 7 : 76, 14, 12];
    });
  } else {
    rects = [
      [40, 3, 20, 13],
      [40, 77, 20, 13],
      [6, 35, 13, 22],
      [81, 35, 13, 22],
    ];
  }
  return rects.slice(0, table.seats).map(([x, y, w, h], i) => ({
    id: `${table.id}-${i + 1}`,
    seatNo: i + 1,
    tableId: table.id,
    x,
    y,
    w,
    h,
  }));
}

export const allSeats = (): SeatSpot[] => tables.flatMap(seatLayout);
export function findSeat(id: string) {
  const tableId = id.split("-")[0];
  const table = findTable(tableId);
  const seat = table && seatLayout(table).find((s) => s.id === id);
  return table && seat ? { table, seat } : undefined;
}

/** A reservation as far as availability is concerned — never any guest detail. */
export type SeatBooking = { table_id: string; time: string; seat_ids?: string };

/**
 * Seats already spoken for at `time`. A booking that named specific seats holds
 * only those; an older booking that named only a table holds all of its seats.
 */
export function takenSeatIds(
  time: string,
  bookings: SeatBooking[] | null,
): Set<string> {
  const taken = new Set<string>();
  if (!time || !bookings) return taken;
  for (const booking of bookings) {
    if (!overlaps(time, booking.time)) continue;
    const named = (booking.seat_ids ?? "").split(",").filter(Boolean);
    if (named.length) named.forEach((id) => taken.add(id));
    else {
      const table = findTable(booking.table_id);
      if (table) seatLayout(table).forEach((s) => taken.add(s.id));
    }
  }
  return taken;
}

/** The one table every chosen seat belongs to, or "" when the picks span tables. */
export function primaryTableOf(seatIds: string[]): string {
  const ids = new Set(seatIds.map((id) => id.split("-")[0]));
  return ids.size === 1 ? [...ids][0] : "";
}

export function describeSeats(seatIds: string[]): string {
  const byTable = new Map<string, number[]>();
  for (const id of seatIds) {
    const [tableId, no] = id.split("-");
    byTable.set(tableId, [...(byTable.get(tableId) ?? []), Number(no)]);
  }
  return [...byTable]
    .map(([tableId, numbers]) => {
      const table = findTable(tableId);
      const seats = numbers.sort((a, b) => a - b).join(", ");
      return `${table?.label ?? tableId} (seat${numbers.length > 1 ? "s" : ""} ${seats})`;
    })
    .join(" · ");
}
