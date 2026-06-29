import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  SECTIONS,
  STAFF,
  defaultShift,
  sectionProgress,
  todayISO,
  type Slot,
} from "@/lib/lineCheck";
import { supabase } from "@/integrations/supabase/client";
import { clearLocalCache } from "@/lib/cloudSync";
import {
  LayoutDashboard,
  History,
  Settings,
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Flame,
  Fish,
  Salad,
  ShieldCheck,
  Soup,
  ChefHat,
  Utensils,
  Refrigerator,
  Package,
  Cake,
  Snowflake,
  Beer,
  LogOut,
} from "lucide-react";


const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BAR: Beer,
  NIKKEI: Fish,
  SALAD: Salad,
  "QA LINE": ShieldCheck,
  SOLTADO: Flame,
  GRILL: Flame,
  SAUTEE: Soup,
  FRYER: ChefHat,
  "STANDING CHILLER": Refrigerator,
  "DRY STORAGE": Package,
  "SWEET ELEMENTS": Cake,
  "PREP STANDING CHILLER": Refrigerator,
  "PREP FREEZER": Snowflake,
};

const SHIFT_OPTIONS: { value: Slot; label: string }[] = [
  { value: "op", label: "Opening" },
  { value: "mid", label: "Mid" },
  { value: "cl", label: "Closing" },
];

type Ctx = {
  date: string;
  setDate: (v: string) => void;
  shift: Slot;
  setShift: (v: Slot) => void;
  member: string;
  setMember: (v: string) => void;
  title: string;
};

export function AppShell({
  children,
  title,
  date,
  setDate,
  shift,
  setShift,
  member,
  setMember,
}: Ctx & { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar date={date} shift={shift} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          date={date}
          setDate={setDate}
          shift={shift}
          setShift={setShift}
          member={member}
          setMember={setMember}
        />
        <div className="min-w-0 flex-1 px-6 py-6 lg:px-10 lg:py-8">{children}</div>
      </div>
    </div>
  );
}

function Sidebar({ date, shift }: { date: string; shift: Slot }) {
  const loc = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  // Recompute progress on date/shift change and on storage updates
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

  return (
    <aside
      className={`sticky top-0 z-20 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all md:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-5">
        <Link to="/" className="flex items-center gap-2" suppressHydrationWarning>
          <BrandMark collapsed={collapsed} />
        </Link>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <nav className="px-3">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={loc.pathname === "/"} collapsed={collapsed} />
        <NavItem to="/history" icon={History} label="History" active={loc.pathname === "/history"} collapsed={collapsed} />
        <NavItem to="/settings" icon={Settings} label="Settings" active={loc.pathname === "/settings"} collapsed={collapsed} />
      </nav>

      <div className="mt-4 flex-1 overflow-y-auto px-3 pb-6" data-tick={tick}>
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Stations
          </p>
        )}
        <ul className="space-y-0.5">
          {SECTIONS.map((s) => {
            const Icon = SECTION_ICONS[s.name] ?? Utensils;
            const { done, total } = sectionProgress(s.name, shift, date);
            const pct = total ? Math.round((done / total) * 100) : 0;
            const active = loc.pathname === `/section/${encodeURIComponent(s.name)}`;
            return (
              <li key={s.name}>
                <Link
                  to="/section/$name"
                  params={{ name: s.name }}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate">{s.name}</span>
                      <span className="ml-auto flex items-center gap-2" suppressHydrationWarning>
                        <span className="h-1 w-10 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full"
                            style={{
                              width: `${pct}%`,
                              background: "var(--gradient-readiness)",
                            }}
                          />
                        </span>
                        <span className="w-7 text-right text-[10px] tabular-nums text-muted-foreground">
                          {pct}%
                        </span>
                      </span>
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  active,
  collapsed,
  disabled,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  collapsed: boolean;
  disabled?: boolean;
}) {
  const cls = `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? "bg-foreground text-background"
      : disabled
        ? "text-muted-foreground/50 cursor-not-allowed"
        : "text-foreground hover:bg-sidebar-accent"
  }`;
  if (disabled) {
    return (
      <div className={cls}>
        <Icon className="h-4 w-4" />
        {!collapsed && <span>{label}</span>}
      </div>
    );
  }
  return (
    <Link to={to} className={cls}>
      <Icon className="h-4 w-4" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function TopBar({
  title,
  date,
  setDate,
  shift,
  setShift,
  member,
  setMember,
}: Ctx) {
  const dayName = new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
  });
  const shortDate = new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-background/85 px-6 py-4 backdrop-blur lg:px-10">
      <h1 className="text-lg font-bold tracking-tight text-foreground">{title}</h1>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Pill icon={<Calendar className="h-3.5 w-3.5" />}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || todayISO())}
            className="bg-transparent text-xs font-semibold uppercase tracking-wide outline-none"
            aria-label="Date"
          />
          <span className="rounded-full bg-info-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-info">
            {dayName}
          </span>
          <span className="sr-only">{shortDate}</span>
        </Pill>
        <Pill icon={<Clock className="h-3.5 w-3.5" />}>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as Slot)}
            className="bg-transparent text-xs font-semibold outline-none"
            aria-label="Shift"
          >
            {SHIFT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Pill>
        <Pill icon={<User className="h-3.5 w-3.5" />}>
          <TeamMemberSelect value={member} onChange={setMember} />
        </Pill>
        <SignOutButton />
      </div>
    </header>
  );
}

function SignOutButton() {
  const navigate = useNavigate();
  const onClick = async () => {
    await supabase.auth.signOut();
    clearLocalCache();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <button
      onClick={onClick}
      title="Sign out"
      aria-label="Sign out"
      className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      <LogOut className="h-3.5 w-3.5" />
    </button>
  );
}


function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </div>
  );
}

function TeamMemberSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [members, setMembers] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("linecheck:settings:staff");
      if (raw) return JSON.parse(raw);
    } catch {}
    return STAFF;
  });
  useEffect(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem("linecheck:settings:staff");
        setMembers(raw ? JSON.parse(raw) : STAFF);
      } catch {
        setMembers(STAFF);
      }
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("linecheck:staff-update", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("linecheck:staff-update", refresh);
    };
  }, []);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-xs font-semibold outline-none"
      aria-label="Team member"
    >
      <option value="">Team Member</option>
      {members.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}

const MEMBER_KEY = "linecheck:selected-member";

export function useShellState(initialTitle: string) {
  const [date, setDate] = useState(todayISO());
  const [shift, setShift] = useState<Slot>(defaultShift());
  const [member, setMemberState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(MEMBER_KEY) || "";
    } catch {
      return "";
    }
  });
  useEffect(() => {
    try {
      if (member) localStorage.setItem(MEMBER_KEY, member);
      else localStorage.removeItem(MEMBER_KEY);
    } catch {}
  }, [member]);
  const setMember = (v: string) => setMemberState(v);
  return { date, setDate, shift, setShift, member, setMember, title: initialTitle };
}

function BrandMark({ collapsed }: { collapsed: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("LUMA");
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    setMounted(true);
    const refresh = () => {
      try {
        setName(localStorage.getItem("linecheck:settings:brand:name") || "LUMA");
        setLogo(localStorage.getItem("linecheck:settings:brand:logo"));
      } catch {}
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("linecheck:brand-update", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("linecheck:brand-update", refresh);
    };
  }, []);
  const initial = (name || "L").trim().charAt(0).toUpperCase() || "L";
  return (
    <>
      {mounted && logo ? (
        <img
          src={logo}
          alt={name}
          className="h-8 w-8 rounded-lg object-cover"
        />
      ) : (
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background text-sm font-bold">
          {initial}
        </span>
      )}
      {!collapsed && (
        <span className="text-base font-bold tracking-tight">{name}</span>
      )}
    </>
  );
}

export { SECTION_ICONS };
