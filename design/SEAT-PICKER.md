# Seat picker

The reservation form opens `src/components/floor-plan.tsx` as a native modal dialog. Individual chairs and whole-table selection use the same stored seat IDs. Confirming here saves the choice to the reservation form; only the completed guest form submits a reservation request. It does not claim a confirmed booking before the team confirms it.

The supplied `seat-picker.html` informed the dark palette, gold selections, zone filters, animated chairs, removable chips and summary. The existing BUKO room layout and saved table IDs are retained. This is an adaptation of the prototype, not its exact booth/bar layout.

- Edit tables, zones, seat counts and coordinates in `src/lib/floor-plan.ts`; drawing lives in `src/components/dining-room-map.tsx`.
- Theme tokens and responsive overrides live in `src/app/seat-picker-dark.css`.
- Availability comes from `/api/table-availability`, using pending and confirmed requests for the selected date and a two-hour sitting. Only table, time and seat IDs are returned.
- When bookings are disabled, the map lets a visitor save a preference. It does not invent occupied seats or submit mock reservations.
- Apply `004_seat_booking_guard.sql` after the initial/table migrations before enabling live seat booking. It adds the seat column if absent and checks seat conflicts under a date-level database lock. This migration has been tested locally, not applied to the connected database.
- `tests/browser/seating.spec.ts` covers selection, whole-table cascade, limits, errors, conflicts, responsive layout, keyboard interaction and accessibility.

# Temporary menu

The 18 sample dishes in `src/lib/defaults.ts` are served only while no dish is published. `src/lib/menu-content.ts` replaces the complete sample menu when the admin publishes the first item, including an unavailable item. Published PDF menus and the owner's digital/PDF/both setting remain supported. No placeholder records were written into the admin database.
