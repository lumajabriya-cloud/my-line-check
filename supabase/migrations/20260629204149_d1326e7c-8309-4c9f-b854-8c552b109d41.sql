
DROP POLICY IF EXISTS "authed write checks" ON public.section_checks;
DROP POLICY IF EXISTS "authed update checks" ON public.section_checks;
DROP POLICY IF EXISTS "authed delete checks" ON public.section_checks;
DROP POLICY IF EXISTS "authed write structs" ON public.section_structs;
DROP POLICY IF EXISTS "authed update structs" ON public.section_structs;
DROP POLICY IF EXISTS "authed delete structs" ON public.section_structs;

CREATE POLICY "authed write checks" ON public.section_checks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authed update checks" ON public.section_checks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authed delete checks" ON public.section_checks FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "authed write structs" ON public.section_structs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authed update structs" ON public.section_structs FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authed delete structs" ON public.section_structs FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
