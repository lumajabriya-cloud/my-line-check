import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapFromCloud } from "@/lib/cloudSync";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    bootstrapFromCloud()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("[bootstrap] failed", e);
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading your team's line checks…
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div className="max-w-sm">
          <p className="text-sm font-semibold text-danger">Couldn't load data</p>
          <p className="mt-2 text-xs text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
