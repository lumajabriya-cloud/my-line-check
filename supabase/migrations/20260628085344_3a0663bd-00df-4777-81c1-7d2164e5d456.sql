
CREATE TABLE public.section_structs (
  section_name TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.section_structs TO authenticated;
GRANT ALL ON public.section_structs TO service_role;
ALTER TABLE public.section_structs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authed read structs" ON public.section_structs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authed write structs" ON public.section_structs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authed update structs" ON public.section_structs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authed delete structs" ON public.section_structs FOR DELETE TO authenticated USING (true);

CREATE TABLE public.section_checks (
  section_name TEXT NOT NULL,
  check_date DATE NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  PRIMARY KEY (section_name, check_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.section_checks TO authenticated;
GRANT ALL ON public.section_checks TO service_role;
ALTER TABLE public.section_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authed read checks" ON public.section_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "authed write checks" ON public.section_checks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authed update checks" ON public.section_checks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authed delete checks" ON public.section_checks FOR DELETE TO authenticated USING (true);

CREATE INDEX section_checks_date_idx ON public.section_checks (check_date DESC);
