
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other',
  start_date date NOT NULL,
  end_date date NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SEK',
  max_participants integer NOT NULL DEFAULT 50,
  show_spots_left boolean NOT NULL DEFAULT true,
  spots_left_threshold integer,
  image_url text NOT NULL DEFAULT '',
  image_position text DEFAULT '50% 50%',
  status text NOT NULL DEFAULT 'draft',
  form_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  presentation_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published trips" ON public.trips
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins full access to trips" ON public.trips
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  presentation_data jsonb,
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create registrations" ON public.registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins full access to registrations" ON public.registrations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER registrations_updated_at BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
