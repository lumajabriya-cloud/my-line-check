import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, useShellState } from "@/components/AppShell";
import {
  SECTIONS,
  dayHistory,
  listHistoryDates,
  type DayHistory,
} from "@/lib/lineCheck";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Shift History — Line Check 2026" },
      {
        name: "description",
        content: "Past line checks, completion trends, and recurring issues.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const shell = useShellState("History");
  const navigate = useNavigate();
  const [station, setStation] = useState<string>("ALL");
  const [shiftFilter, setShiftFilter] = useState<string>("ALL");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    window.addEventListener("storage", fn);
    window.addEventListener("linecheck:update", fn);
    return () => {
      window.removeEventListener("storage", fn);
      window.removeEventListener("linecheck:update", fn);
    };
  }, []);

  const { days, totals } = useMemo(() => {
    const dates = listHistoryDates();
    const days: DayHistory[] = dates.map((d) => dayHistory(d));
    const totals = days.reduce(
      (acc, d) => {
        acc.checks += d.stationsTouched;
        acc.complete += d.stationsComplete;
        acc.flagged += d.flagged;
        return acc;
      },
      { checks: 0, complete: 0, flagged: 0 },
    );
    return { days, totals };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, station, shiftFilter]);

  return (
    <AppShell {...shell}>
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/" })}
          className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-base font-bold tracking-tight">History</h2>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 lg:p-7">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-xl font-bold tracking-tight">Shift History</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Past line checks, completion trends, and recurring issues
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryTile value={totals.checks} label="Total Checks" tone="bg-muted/50" valueClass="text-foreground" />
          <SummaryTile value={totals.complete} label="Fully Complete" tone="bg-success-soft" valueClass="text-success" />
          <SummaryTile value={totals.flagged} label="Flagged Items" tone="bg-danger-soft" valueClass="text-danger" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filter
          </span>
          <FilterSelect
            value={station}
            onChange={setStation}
            options={[
              { value: "ALL", label: "All Stations" },
              ...SECTIONS.map((s) => ({ value: s.name, label: s.name })),
            ]}
          />
          <FilterSelect
            value={shiftFilter}
            onChange={setShiftFilter}
            options={[
              { value: "ALL", label: "All Shifts" },
              { value: "op", label: "Opening" },
              { value: "mid", label: "Mid" },
              { value: "cl", label: "Closing" },
            ]}
          />
        </div>
      </section>

      <h2 className="mb-3 mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Past Shifts
      </h2>

      {days.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No past shifts yet. Complete a line check to start building history.
        </div>
      ) : (
        <ul className="space-y-3">
          {days.map((d) => (
            <DayRow key={d.date} day={d} />
          ))}
        </ul>
      )}
    </AppShell>
  );
}

function SummaryTile({
  value,
  label,
  tone,
  valueClass,
}: {
  value: number;
  label: string;
  tone: string;
  valueClass: string;
}) {
  return (
    <div className={`rounded-2xl px-5 py-4 ${tone}`}>
      <p className={`text-3xl font-black tracking-tight ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-foreground/30"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function DayRow({ day }: { day: DayHistory }) {
  const d = new Date(day.date + "T00:00:00");
  const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
  const dayNum = d.toLocaleDateString(undefined, { day: "2-digit" });
  const short = d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const pct = day.totalItems ? Math.round((day.checkedItems / day.totalItems) * 100) : 0;

  return (
    <li>
      <Link
        to="/"
        className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent"
      >
        <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-muted/50 py-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {weekday}
          </span>
          <span className="text-2xl font-black tabular-nums text-foreground">{dayNum}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{short}</p>
          <p className="text-xs text-muted-foreground">
            {day.stationsTouched} station {day.stationsTouched === 1 ? "check" : "checks"}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px]">
            {day.stationsComplete > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-success">
                <CheckCircle2 className="h-3 w-3" />
                {day.stationsComplete} complete
              </span>
            )}
            {day.flagged > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-danger">
                <AlertTriangle className="h-3 w-3" />
                {day.flagged} flagged
              </span>
            )}
          </div>
        </div>
        <div className="hidden w-32 sm:block">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: "var(--gradient-readiness)" }}
            />
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </li>
  );
}
