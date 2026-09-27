"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArmchairIcon,
  ArrowRight,
  CalendarDays,
  Clock3,
  Maximize2,
  RefreshCw,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  findSeat,
  findTable,
  zones,
  tables,
  seatLayout,
  takenSeatIds,
  primaryTableOf,
} from "@/lib/floor-plan";
import { johannesburgDate } from "@/lib/booking";
import type { AvailabilityResult } from "@/app/actions/public";
import { DiningRoomMap, type SeatHover } from "./dining-room-map";

type Props = {
  seats: string[];
  onSelect: (seatIds: string[]) => void;
  date: string;
  time: string;
  partySize: number;
  ready: boolean;
  slots?: string[];
  onDateChange?: (date: string) => void;
  onTimeChange?: (time: string) => void;
};

const CASCADE_MS = 70;

export function FloorPlan({
  seats,
  onSelect,
  date,
  time,
  partySize,
  ready,
  slots = [],
  onDateChange,
  onTimeChange,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [activeZone, setActiveZone] = useState("all");
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [limitHit, setLimitHit] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [tip, setTip] = useState<{ x: number; y: number; info: SeatHover } | null>(null);
  const [loaded, setLoaded] = useState<{ key: string; result: AvailabilityResult } | null>(null);

  const key = `${date}:${time}:${revision}`;
  const canCheck = ready && !!date && !!time;
  const current = loaded?.key === key ? loaded.result : null;
  const bookings = canCheck && current?.ok ? current.bookings : null;
  const pending = canCheck && !current;
  const taken = takenSeatIds(time, bookings);
  const checked = canCheck && !!bookings;
  const cap = Math.max(partySize, 1);
  const savedSeats = seats.filter((id) => findSeat(id));
  const savedTable = findTable(primaryTableOf(savedSeats));
  const freeCount = checked
    ? tables.reduce(
        (n, t) =>
          t.seats < partySize
            ? n
            : n + seatLayout(t).filter((s) => !taken.has(s.id)).length,
        0,
      )
    : 0;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  useEffect(() => {
    if (!open || !canCheck) return;
    const controller = new AbortController();
    fetch(`/api/table-availability?date=${encodeURIComponent(date)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => r.json() as Promise<AvailabilityResult>)
      .then((result) => {
        if (!controller.signal.aborted) setLoaded({ key, result });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setLoaded({
            key,
            result: { ok: false, message: "We couldn’t check the tables. Please try again." },
          });
      });
    return () => controller.abort();
  }, [open, canCheck, date, key]);
  useEffect(() => {
    if (!open || !canCheck) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setRevision((r) => r + 1);
    }, 60000);
    return () => window.clearInterval(timer);
  }, [open, canCheck]);

  /** Briefly plays a CSS animation on one seat without re-rendering the map. */
  const pulse = useCallback((seatId: string, cls: string) => {
    const node = mapRef.current?.querySelector(`[data-seat="${seatId}"]`);
    if (!node) return;
    node.classList.remove(cls);
    void (node as HTMLElement).offsetWidth;
    node.classList.add(cls);
    timers.current.push(window.setTimeout(() => node.classList.remove(cls), 700));
  }, []);

  const toggleSeat = useCallback(
    (id: string) => {
      if (verifying || (canCheck && !checked)) return;
      if (taken.has(id)) {
        pulse(id, "seat-shake");
        return;
      }
      setFeedback("");
      setDraft((chosen) => {
        if (chosen.includes(id)) {
          pulse(id, "seat-burst");
          const next = chosen.filter((s) => s !== id);
          setAnnounce(`Seat released. ${next.length} of ${cap} chosen.`);
          return next;
        }
        if (chosen.length >= cap) {
          pulse(id, "seat-shake");
          setLimitHit(true);
          timers.current.push(window.setTimeout(() => setLimitHit(false), 2600));
          return chosen;
        }
        pulse(id, "seat-burst");
        const next = [...chosen, id];
        setAnnounce(`Seat chosen. ${next.length} of ${cap} chosen.`);
        return next;
      });
    },
    [cap, pulse, taken, verifying, canCheck, checked],
  );

  /** Clicking the table body sweeps every free seat at it, one after another. */
  const toggleTable = useCallback(
    (tableId: string) => {
      if (verifying) return;
      const table = findTable(tableId);
      if (!table) return;
      const free = seatLayout(table).filter((s) => !taken.has(s.id));
      if (!free.length) {
        seatLayout(table).forEach((s, i) =>
          timers.current.push(window.setTimeout(() => pulse(s.id, "seat-shake"), i * 40)),
        );
        return;
      }
      const allChosen = free.every((s) => draft.includes(s.id));
      free.forEach((s, i) =>
        timers.current.push(
          window.setTimeout(() => {
            if (allChosen ? draft.includes(s.id) : !draft.includes(s.id)) toggleSeat(s.id);
          }, i * CASCADE_MS),
        ),
      );
    },
    [draft, pulse, taken, toggleSeat, verifying],
  );

  function close() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    dialog.current?.close();
    setOpen(false);
    setTip(null);
  }
  function show() {
    setDraft(savedSeats);
    setRevision((r) => r + 1);
    setFeedback("");
    setActiveZone("all");
    setOpen(true);
    dialog.current?.showModal();
  }
  async function confirmSelection() {
    if (!draft.length || (canCheck && !current?.ok)) return;
    if (!canCheck) {
      onSelect(draft);
      close();
      return;
    }
    setVerifying(true);
    setFeedback("");
    try {
      const response = await fetch(
        `/api/table-availability?date=${encodeURIComponent(date)}`,
        { cache: "no-store" },
      );
      const result: AvailabilityResult = await response.json();
      setLoaded({ key, result });
      if (!result.ok) {
        setFeedback(result.message);
        return;
      }
      const nowTaken = takenSeatIds(time, result.bookings);
      const clashes = draft.filter((id) => nowTaken.has(id));
      if (clashes.length) {
        clashes.forEach((id) => pulse(id, "seat-swap"));
        setDraft((chosen) => chosen.filter((id) => !nowTaken.has(id)));
        setFeedback(
          clashes.length === draft.length
            ? "Those seats were just taken. Please choose again."
            : "Some of your seats were just taken. We removed them. Please pick again.",
        );
        return;
      }
      onSelect(draft);
      close();
    } catch {
      setFeedback("We couldn’t recheck your seats. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  const hover = useCallback((event: React.MouseEvent | React.FocusEvent, info: SeatHover) => {
    const panel = mapRef.current?.closest(".seating-map-panel") as HTMLElement | null;
    if (!panel) return;
    const box = panel.getBoundingClientRect();
    const point = "clientX" in event
      ? { x: event.clientX, y: event.clientY }
      : (() => {
          const r = (event.target as HTMLElement).getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top };
        })();
    setTip({ x: point.x - box.left, y: point.y - box.top, info });
  }, []);

  return (
    <div className="seat-picker">
      <div className="seat-picker-label">
        <span className="eyebrow">A place at our table</span>
        <span>Optional</span>
      </div>
      <button
        type="button"
        className="seat-picker-launch"
        onClick={show}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="seat-picker-thumbnail" aria-hidden="true">
          <DiningRoomMap miniature />
        </span>
        <span className="seat-picker-description">
          <span className="seat-picker-title">
            {savedSeats.length
              ? `${savedSeats.length} seat${savedSeats.length > 1 ? "s" : ""} chosen`
              : "Find your favourite seat."}
          </span>
          <span>
            {savedSeats.length
              ? savedTable
                ? `${savedTable.label} · ${zones.find((z) => z.id === savedTable.zone)?.label}`
                : "Across more than one table"
              : "By the window, out on the terrace, or in the heart of the room."}
          </span>
          <span className="seat-picker-action">
            {savedSeats.length ? "Change your seats" : "Open the floor plan"}{" "}
            <ArrowRight size={15} />
          </span>
        </span>
        <span className="seat-picker-expand">
          <Maximize2 size={18} />
        </span>
      </button>
      {savedSeats.length > 0 && (
        <button type="button" className="seat-picker-clear" onClick={() => onSelect([])}>
          Clear seat choice
        </button>
      )}

      <dialog
        className="seating-dialog candlelit-picker"
        ref={dialog}
        aria-labelledby="seating-title"
        onClose={() => { timers.current.forEach(clearTimeout); timers.current = []; setOpen(false); }}
        onCancel={(e) => {
          if (verifying) e.preventDefault();
        }}
        onClick={(e) => {
          if (e.target === dialog.current && !verifying) close();
        }}
      >
        <div className="seating-dialog-inner">
          <header className="seating-dialog-header">
            <div>
              <span className="eyebrow">BUKO · Make yourself at home</span>
              <h2 id="seating-title">Choose where you’d like to sit.</h2>
              <p>Tap a chair to claim it, or tap the table to take every free seat at it.</p>
            </div>
            <button
              type="button"
              className="seating-close"
              aria-label="Close floor plan"
              onClick={close}
              disabled={verifying}
            >
              <X size={21} />
            </button>
          </header>

          <div className="seating-visit-details">
            <label>
              <CalendarDays size={15} />
              <span className="sr-only">Floor plan date</span>
              <input
                aria-label="Floor plan date"
                type="date"
                min={johannesburgDate()}
                value={date}
                onChange={(e) => {
                  setDraft([]);
                  setFeedback("");
                  onDateChange?.(e.target.value);
                }}
                disabled={verifying}
              />
            </label>
            <label>
              <Clock3 size={15} />
              <span className="sr-only">Floor plan time</span>
              <select
                aria-label="Floor plan time"
                value={time}
                onChange={(e) => {
                  setDraft([]);
                  setFeedback("");
                  onTimeChange?.(e.target.value);
                }}
                disabled={!slots.length || verifying}
              >
                <option value="">{date ? "Choose a time" : "Choose a date first"}</option>
                {slots.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <span>
              <Users size={15} />
              {partySize} {partySize === 1 ? "guest" : "guests"}
            </span>
            <span className="seating-timezone">South African time</span>
          </div>

          <div className="seating-dialog-body">
            <div className="seating-map-panel">
              <div className="seating-map-toolbar">
                <div className="zone-chips" role="group" aria-label="Filter the floor plan by area">
                  {[{ id: "all", label: "All areas" }, ...zones].map((z) => (
                    <button
                      type="button"
                      key={z.id}
                      className={activeZone === z.id ? "on" : ""}
                      aria-pressed={activeZone === z.id}
                      onClick={() => setActiveZone(z.id)}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>
                <div className="seating-map-tools">
                  <button
                    type="button"
                    aria-label={zoom ? "Fit floor plan" : "Zoom in on floor plan"}
                    onClick={() => setZoom(!zoom)}
                  >
                    {zoom ? <ZoomOut size={17} /> : <ZoomIn size={17} />}
                  </button>
                  <button
                    type="button"
                    aria-label="Refresh seat availability"
                    disabled={!canCheck || pending || verifying}
                    onClick={() => setRevision((r) => r + 1)}
                  >
                    <RefreshCw size={15} className={pending ? "is-loading" : ""} />
                  </button>
                </div>
              </div>
              <div
                className="seating-map-viewport"
                tabIndex={0}
                role="region"
                aria-label="Restaurant floor plan. Scroll to explore the room."
              >
                <div className={`seating-map-scale ${zoom ? "zoomed" : ""}`} ref={mapRef}>
                  <DiningRoomMap
                    selectedSeats={draft}
                    takenSeats={taken}
                    partySize={partySize}
                    checked={checked}
                    unavailable={canCheck && !checked}
                    activeZone={activeZone}
                    onToggleSeat={toggleSeat}
                    onToggleTable={toggleTable}
                    onHover={hover}
                    onLeave={() => setTip(null)}
                  />
                </div>
              </div>
              {tip && (
                <div
                  className="seat-tooltip"
                  style={{ left: tip.x, top: tip.y }}
                  role="presentation"
                >
                  <b>{tip.info.title}</b>
                  <span className={`tip-state tip-${tip.info.state}`}>{tip.info.detail}</span>
                </div>
              )}
              <div className="seating-map-legend">
                <span>
                  <i className="legend-available" />
                  {checked ? "Available" : "Seat"}
                </span>
                <span>
                  <i className="legend-selected" />
                  Yours
                </span>
                <span>
                  <i className="legend-booked" />
                  Taken
                </span>
                <span className="seating-pan-hint">
                  Tap a table to take all of its free seats.
                </span>
              </div>
            </div>

            <aside className="seating-selection">
              <div className="seating-availability" aria-live="polite">
                {!ready ? (
                  "Explore the room and save a preference. Online booking opens soon."
                ) : !date || !time ? (
                  "Pick a date and time to see which seats are free."
                ) : pending ? (
                  "Checking the floor…"
                ) : current && !current.ok ? (
                  <>
                    <span>{current.message}</span>
                    <button type="button" onClick={() => setRevision((r) => r + 1)}>
                      Try again
                    </button>
                  </>
                ) : (
                  <>
                    <i />
                    {freeCount} {freeCount === 1 ? "seat free" : "seats free"}
                  </>
                )}
              </div>

              <div className="seat-tally">
                <strong>{draft.length}</strong> of {cap} seat{cap > 1 ? "s" : ""} chosen
              </div>
              <div className="seat-meter">
                <i style={{ width: `${Math.min((draft.length / cap) * 100, 100)}%` }} />
              </div>
              <p className={`seat-limit ${limitHit ? "on" : ""}`} aria-hidden={!limitHit}>
                You’re booking for {cap} {cap === 1 ? "guest" : "guests"}. Change the guest
                count to choose more seats.
              </p>

              <div className="seat-chips">
                {draft.length ? (
                  draft.map((id) => {
                    const found = findSeat(id);
                    return (
                      <span className="seat-chip" key={id}>
                        {found ? `${found.table.label} · seat ${found.seat.seatNo}` : id}
                        <button
                          type="button"
                          aria-label={`Remove ${found ? `${found.table.label} seat ${found.seat.seatNo}` : id}`}
                          onClick={() => toggleSeat(id)}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })
                ) : (
                  <span className="seat-chips-empty">
                    <ArmchairIcon size={30} strokeWidth={1} />
                    Tap a chair on the plan and it will appear here.
                  </span>
                )}
              </div>

              {feedback && (
                <p className="seating-feedback" role="alert">
                  {feedback}
                </p>
              )}
              <p className="sr-only" aria-live="polite">
                {announce}
              </p>

              <dl className="seat-visit-summary">
                <div><dt>Date</dt><dd>{date ? new Date(`${date}T12:00:00+02:00`).toLocaleDateString('en-ZA', {day:'numeric',month:'short'}) : 'Choose a date'}</dd></div>
                <div><dt>Time</dt><dd>{time || 'Choose a time'}</dd></div>
                <div><dt>Area</dt><dd>{[...new Set(draft.map(id => zones.find(z => z.id === findSeat(id)?.table.zone)?.label).filter(Boolean))].join(', ') || 'Your choice'}</dd></div>
              </dl>

              <div className="seating-selection-actions">
                <button
                  type="button"
                  className="button button-gold"
                  disabled={!draft.length || verifying || (canCheck && !checked)}
                  onClick={confirmSelection}
                >
                  {verifying
                    ? "Checking your seats…"
                    : draft.length
                      ? `Choose ${draft.length} seat${draft.length > 1 ? "s" : ""}`
                      : "Choose your seats"}
                  <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  className="seating-no-preference"
                  disabled={verifying}
                  onClick={() => {
                    onSelect([]);
                    close();
                  }}
                >
                  Let the team seat us
                </button>
                <p>Your seats are held once our team confirms your reservation.</p>
              </div>
            </aside>
          </div>

          <footer className="seating-dialog-footer">
            <span>GOOD FOOD. GOOD COMPANY.</span>
            <span>A little closer to home.</span>
          </footer>
        </div>
      </dialog>
    </div>
  );
}
