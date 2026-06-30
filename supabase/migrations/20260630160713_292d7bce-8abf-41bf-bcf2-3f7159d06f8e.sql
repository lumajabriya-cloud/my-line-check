CREATE TABLE public.shared_shifts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  shift text NOT NULL,
  member text,
  brand_name text,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, date, shift)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_shifts TO authenticated;
GRANT SELECT ON public.shared_shifts TO anon;
GRANT ALL ON public.shared_shifts TO service_role;

ALTER TABLE public.shared_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared shifts"
  ON public.shared_shifts FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert their shared shifts"
  ON public.shared_shifts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their shared shifts"
  ON public.shared_shifts FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their shared shifts"
  ON public.shared_shifts FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shared_shifts_updated_at
  BEFORE UPDATE ON public.shared_shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();