
CREATE TABLE public.shared_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  shift TEXT NOT NULL,
  member TEXT,
  brand_name TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (owner_id, date, shift)
);

GRANT SELECT ON public.shared_shifts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_shifts TO authenticated;
GRANT ALL ON public.shared_shifts TO service_role;

ALTER TABLE public.shared_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared shifts are public read"
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

CREATE INDEX shared_shifts_owner_date_idx ON public.shared_shifts (owner_id, date, shift);
