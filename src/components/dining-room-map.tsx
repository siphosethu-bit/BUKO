import { Check, X as XIcon } from "lucide-react";
import {
  tables,
  tablePositions,
  seatLayout,
  furnitureWidth,
  type DiningTable,
  type SeatSpot,
} from "@/lib/floor-plan";

export type SeatHover = {
  title: string;
  detail: string;
  state: "available" | "taken" | "selected" | "small";
};

type Props = {
  selectedSeats?: string[];
  takenSeats?: Set<string>;
  partySize?: number;
  /** null until availability has been checked for a date and time. */
  checked?: boolean;
  unavailable?: boolean;
  activeZone?: string;
  onToggleSeat?: (id: string) => void;
  onToggleTable?: (tableId: string) => void;
  onHover?: (event: React.MouseEvent | React.FocusEvent, info: SeatHover) => void;
  onLeave?: () => void;
  miniature?: boolean;
};

const EMPTY = new Set<string>();

/** The plan and its hit targets share one coordinate system, including on touch screens. */
export function DiningRoomMap({
  selectedSeats = [],
  takenSeats = EMPTY,
  partySize = 2,
  checked = false,
  unavailable = false,
  activeZone = "all",
  onToggleSeat,
  onToggleTable,
  onHover,
  onLeave,
  miniature = false,
}: Props) {
  const picked = new Set(selectedSeats);
  return (
    <div className={`dining-map ${miniature ? "map-miniature" : ""}`}>
      <svg
        className="room-architecture"
        viewBox="0 0 1000 690"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={miniature ? "mini-wood" : "room-wood"}
            width="90"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 11.5H90M30 0V12" stroke="#ddd4c5" strokeWidth=".6" />
          </pattern>
          <pattern
            id={miniature ? "mini-deck" : "room-deck"}
            width="15"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path d="M14 0V50" stroke="#c6c7b7" strokeWidth=".7" />
          </pattern>
        </defs>
        <rect x="35" y="45" width="710" height="590" fill="#efe9dd" />
        <rect
          x="35"
          y="45"
          width="710"
          height="590"
          fill={`url(#${miniature ? "mini-wood" : "room-wood"})`}
        />
        <rect x="745" y="92" width="220" height="543" fill="#e5e7db" />
        <rect
          x="745"
          y="92"
          width="220"
          height="543"
          fill={`url(#${miniature ? "mini-deck" : "room-deck"})`}
        />
        <path
          d="M611 635H35V45H745V92H965V635H698"
          stroke="#aaa395"
          strokeWidth="9"
          className={miniature ? "" : "room-wall"}
          pathLength={miniature ? undefined : 1}
        />
        <path
          d="M745 95V274M745 415V632M35 503H287V635"
          stroke="#aaa395"
          strokeWidth="7"
        />
        <path d="M165 503H240" stroke="#efe9dd" strokeWidth="10" />
        <path
          d="M165 503V428A75 75 0 0 1 240 503M611 635V548A87 87 0 0 1 698 635"
          stroke="#b6af9f"
          strokeWidth="1.5"
        />
        <path
          d="M745 276H803V334M745 413H803V355"
          stroke="#b4b6a5"
          strokeWidth="2"
        />
        <path d="M27 103V465M43 103V465" stroke="#a6bbc0" strokeWidth="3" />
        {[115, 235, 355, 465].map((y) => (
          <path key={y} d={`M26 ${y}H44`} stroke="#7e989e" strokeWidth="3" />
        ))}
        <rect x="264" y="56" width="374" height="42" rx="3" fill="#6e6250" />
        <rect x="272" y="62" width="358" height="28" rx="2" fill="#93816a" />
        <rect
          x="267"
          y="72"
          width="350"
          height="2"
          fill="#bba98b"
          opacity=".7"
        />
        <rect x="650" y="526" width="44" height="65" rx="3" fill="#ad9b80" />
        <rect x="655" y="531" width="34" height="55" rx="2" fill="#c5b496" />
        <path d="M715 493V547" stroke="#c6bcaa" strokeWidth="1.5" />
        {[
          [75, 75],
          [696, 84],
          [690, 456],
          [930, 128],
          [930, 590],
          [321, 598],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <circle r="18" fill="#c6bfac" />
            <circle r="13" fill="#697259" />
            <ellipse rx="7" ry="15" transform="rotate(-35)" fill="#8b9773" />
            <ellipse rx="6" ry="14" transform="rotate(50)" fill="#7b8a65" />
            <circle r="4" fill="#a2ad84" />
          </g>
        ))}
        <g className="room-labels" fill="#7a705f" textAnchor="middle">
          <text x="457" y="83" fill="#faf4e5" fontSize="9" letterSpacing="3">
            THE BAR
          </text>
          <text x="414" y="285" fontSize="12" letterSpacing="3">
            MAIN DINING ROOM
          </text>
          <text x="126" y="102" fontSize="9" letterSpacing="1.8">
            BY THE WINDOW
          </text>
          <text x="165" y="519" fontSize="9" letterSpacing="2">
            PRIVATE DINING
          </text>
          <text x="849" y="122" fontSize="11" letterSpacing="2.6">
            TERRACE
          </text>
          <text x="672" y="613" fontSize="8" letterSpacing="1.3">
            HOST
          </text>
          <text x="655" y="666" fontSize="10" letterSpacing="2">
            ENTRANCE
          </text>
          <path
            d="M655 646V627M651 632 655 627 659 632"
            stroke="#7a705f"
            strokeWidth="1.2"
          />
        </g>
      </svg>

      {tables.map((table, index) => {
        const position = tablePositions[table.id];
        const seats = seatLayout(table);
        const viewW = furnitureWidth(table);
        const tooSmall = table.seats < partySize;
        const freeSeats = seats.filter((s) => !takenSeats.has(s.id));
        const fullyBooked = checked && freeSeats.length === 0;
        const dimmed = activeZone !== "all" && activeZone !== table.zone;
        const style = {
          left: `${position.x / 10}%`,
          top: `${position.y / 6.9}%`,
          width: `${position.width / 10}%`,
          "--t": index,
        } as React.CSSProperties;

        return (
          <div
            key={table.id}
            className={`map-table furniture-${table.shape} zone-${table.zone}${dimmed ? " is-dimmed" : ""}${tooSmall ? " table-small" : ""}${fullyBooked ? " table-booked" : ""}`}
            style={style}
          >
            {miniature ? (
              <TableFurniture table={table} seats={seats} withChairs />
            ) : (
              <>
                <button
                  type="button"
                  className="map-table-body"
                  aria-label={`${table.label}, ${table.seats} seats, ${
                    fullyBooked
                      ? "fully booked"
                      : tooSmall
                        ? `too small for ${partySize} guests`
                        : `${freeSeats.length} free`
                  }. Choose the whole table.`}
                  aria-disabled={unavailable}
                  onClick={() => { if (!unavailable) onToggleTable?.(table.id); }}
                  onMouseMove={(e) =>
                    onHover?.(e, {
                      title: table.label,
                      detail: `${table.seats} seats · ${checked ? `${freeSeats.length} free` : "availability not checked"}`,
                      state: fullyBooked
                        ? "taken"
                        : tooSmall
                          ? "small"
                          : "available",
                    })
                  }
                  onMouseLeave={onLeave}
                >
                  <TableFurniture table={table} seats={seats} />
                  <span className="map-table-number">{table.id}</span>
                  <span className="map-table-caption">
                    {fullyBooked ? "Fully booked" : `${table.seats} seats`}
                  </span>
                </button>
                {seats.map((seat) => (
                  <Seat
                    key={seat.id}
                    seat={seat}
                    table={table}
                    viewW={viewW}
                    selected={picked.has(seat.id)}
                    taken={takenSeats.has(seat.id)}
                    tooSmall={tooSmall}
                    unavailable={unavailable}
                    onToggle={onToggleSeat}
                    onHover={onHover}
                    onLeave={onLeave}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Seat({
  seat,
  table,
  viewW,
  selected,
  taken,
  tooSmall,
  unavailable,
  onToggle,
  onHover,
  onLeave,
}: {
  seat: SeatSpot;
  table: DiningTable;
  viewW: number;
  selected: boolean;
  taken: boolean;
  tooSmall: boolean;
  unavailable: boolean;
  onToggle?: (id: string) => void;
  onHover?: (event: React.MouseEvent | React.FocusEvent, info: SeatHover) => void;
  onLeave?: () => void;
}) {
  const state = taken
    ? "taken"
    : selected
      ? "selected"
      : tooSmall
        ? "small"
        : "available";
  const info: SeatHover = {
    title: `${table.label} · Seat ${seat.seatNo}`,
    detail:
      state === "taken"
        ? "Already taken"
        : state === "selected"
          ? "Selected, tap to remove"
          : state === "small"
            ? `This table seats ${table.seats}`
            : "Available",
    state,
  };
  return (
    <button
      type="button"
      className={`map-seat seat-${state}`}
      data-seat={seat.id}
      style={{
        left: `${(seat.x / viewW) * 100}%`,
        top: `${seat.y}%`,
        width: `${(seat.w / viewW) * 100}%`,
        height: `${seat.h}%`,
      }}
      aria-label={`${table.label}, seat ${seat.seatNo}, ${info.detail}`}
      aria-pressed={selected}
      aria-disabled={taken || unavailable}
      onClick={() => { if (!unavailable) onToggle?.(seat.id); }}
      onMouseMove={(e) => {
        e.stopPropagation();
        onHover?.(e, info);
      }}
      onFocus={(e) => onHover?.(e, info)}
      onMouseLeave={onLeave}
      onBlur={onLeave}
    >
      <span className="seat-body">
        {selected && <Check size={11} strokeWidth={3} />}
        {taken && <XIcon size={10} strokeWidth={3} />}
      </span>
    </button>
  );
}

function TableFurniture({
  table,
  seats,
  withChairs = false,
}: {
  table: DiningTable;
  seats: SeatSpot[];
  withChairs?: boolean;
}) {
  const long = table.shape === "long";
  const w = furnitureWidth(table);
  const tabletop = long
    ? { x: 23, y: 24, width: 104, height: 48 }
    : { x: 24, y: 20, width: 52, height: 52 };
  return (
    <svg
      className="furniture-svg"
      viewBox={`0 0 ${w} 100`}
      fill="none"
      aria-hidden="true"
    >
      {withChairs && (
        <g className="chair-shapes">
          {seats.map((s) => (
            <rect
              key={s.id}
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx="4"
              className="chair-fill"
            />
          ))}
        </g>
      )}
      {table.shape === "round" ? (
        <circle cx="50" cy="46" r="27" className="tabletop-fill" />
      ) : (
        <rect {...tabletop} rx={long ? 7 : 5} className="tabletop-fill" />
      )}
      {table.shape === "round" ? (
        <circle cx="50" cy="46" r="22" className="tabletop-grain" />
      ) : (
        <rect
          x={tabletop.x + 4}
          y={tabletop.y + 4}
          width={tabletop.width - 8}
          height={tabletop.height - 8}
          rx="3"
          className="tabletop-grain"
        />
      )}
      <circle className="candle-glow" cx={w / 2} cy="46" r="13" />
      <circle className="candle-flame" cx={w / 2} cy="46" r="2.6" />
    </svg>
  );
}
