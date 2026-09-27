import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tables,
  tablePositions,
  getTableState,
  overlaps,
  seatLayout,
  furnitureWidth,
  takenSeatIds,
  findSeat,
  primaryTableOf,
  describeSeats,
} from "../src/lib/floor-plan";
test("availability is unknown when it has not loaded, rather than showing every table free", () => {
  assert.equal(getTableState(tables[0], 2, "18:00", null), "unknown");
  assert.equal(getTableState(tables[0], 2, "", []), "unknown");
});
test("booked tables use the full two-hour sitting and permit back-to-back reservations", () => {
  const bookings = [{ table_id: "W1", time: "18:00" }];
  assert.equal(getTableState(tables[0], 2, "19:30", bookings), "booked");
  assert.equal(getTableState(tables[0], 2, "20:00", bookings), "available");
  assert.equal(getTableState(tables[0], 2, "16:30", bookings), "booked");
  assert.equal(getTableState(tables[0], 2, "16:00", bookings), "available");
  assert.equal(overlaps("23:30", "22:00"), true);
});
test("tables that cannot seat the party are never selectable", () => {
  assert.equal(getTableState(tables[0], 4, "18:00", []), "small");
  assert.equal(
    getTableState(
      tables.find((t) => t.id === "P1")!,
      10,
      "18:00",
      [],
    ),
    "available",
  );
});
test("every table keeps its saved identifier and fits within the room plan", () => {
  assert.equal(new Set(tables.map((t) => t.id)).size, tables.length);
  for (const t of tables) {
    const p = tablePositions[t.id];
    assert.ok(p);
    assert.ok(p.x - p.width / 2 > 0 && p.x + p.width / 2 < 1000);
    assert.ok(p.y > 50 && p.y < 635);
  }
});

test("every table's chairs match its seat count and stay inside the furniture box", () => {
  for (const t of tables) {
    const seats = seatLayout(t);
    assert.equal(seats.length, t.seats, `${t.id} drew ${seats.length} chairs for ${t.seats} seats`);
    assert.equal(new Set(seats.map((s) => s.id)).size, t.seats);
    const width = furnitureWidth(t);
    for (const s of seats) {
      assert.ok(s.x >= 0 && s.x + s.w <= width, `${s.id} sits outside its table`);
      assert.ok(s.y >= 0 && s.y + s.h <= 100, `${s.id} sits outside its table`);
    }
  }
});
test("a booking for a whole table holds all of its seats, a seat booking holds only its own", () => {
  const wholeTable = takenSeatIds("18:00", [{ table_id: "W1", time: "18:00" }]);
  assert.deepEqual([...wholeTable].sort(), ["W1-1", "W1-2"]);
  const oneSeat = takenSeatIds("18:00", [
    { table_id: "M1", time: "18:00", seat_ids: "M1-2" },
  ]);
  assert.deepEqual([...oneSeat], ["M1-2"]);
});
test("seats free up once the sitting is over, and unchecked availability holds nothing", () => {
  const booking = [{ table_id: "W1", time: "18:00", seat_ids: "W1-1" }];
  assert.equal(takenSeatIds("19:30", booking).has("W1-1"), true);
  assert.equal(takenSeatIds("20:00", booking).has("W1-1"), false);
  assert.equal(takenSeatIds("", booking).size, 0);
  assert.equal(takenSeatIds("18:00", null).size, 0);
});
test("seats resolve back to their table, and a shared table is named only when unanimous", () => {
  assert.equal(findSeat("M4-6")?.table.id, "M4");
  assert.equal(findSeat("M4-99"), undefined);
  assert.equal(findSeat("nope-1"), undefined);
  assert.equal(primaryTableOf(["W1-1", "W1-2"]), "W1");
  assert.equal(primaryTableOf(["W1-1", "W2-1"]), "");
  assert.equal(primaryTableOf([]), "");
  assert.match(describeSeats(["W1-2", "W1-1"]), /Table 1 \(seats 1, 2\)/);
});
