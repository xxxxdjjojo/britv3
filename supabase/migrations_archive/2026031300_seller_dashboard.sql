-- seller_listings
CREATE TABLE IF NOT EXISTS seller_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  postcode text NOT NULL,
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  property_type text NOT NULL CHECK (property_type IN ('detached','semi-detached','terraced','flat','bungalow','other')),
  tenure text NOT NULL CHECK (tenure IN ('freehold','leasehold')),
  leasehold_years_remaining integer,
  bedrooms integer,
  bathrooms integer,
  features text[],
  council_tax_band text CHECK (council_tax_band IN ('A','B','C','D','E','F','G','H')),
  epc_band text CHECK (epc_band IN ('A','B','C','D','E','F','G')),
  photos jsonb DEFAULT '[]'::jsonb,
  floor_plan_url text,
  description text,
  description_tone text CHECK (description_tone IN ('professional','warm','luxury')),
  key_selling_points text[],
  asking_price integer,
  listing_type text CHECK (listing_type IN ('for_sale','auction','expressions_of_interest')),
  price_qualifier text CHECK (price_qualifier IN ('offers_over','offers_in_excess_of','guide_price','fixed_price','poa',NULL)),
  ai_valuation_estimate integer,
  epc_url text,
  managed_by_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','under_offer','sold','paused','archived')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- listing_analytics_events
CREATE TABLE IF NOT EXISTS listing_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES seller_listings(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view','save','enquiry','phone_click','email_click')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  visitor_fingerprint text
);

-- listing_description_attempts
CREATE TABLE IF NOT EXISTS listing_description_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES seller_listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- seller_viewings
CREATE TABLE IF NOT EXISTS seller_viewings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES seller_listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  viewing_datetime timestamptz NOT NULL,
  viewing_type text NOT NULL CHECK (viewing_type IN ('in_person','virtual')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rescheduled','cancelled','completed')),
  feedback text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- seller_offers
CREATE TABLE IF NOT EXISTS seller_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES seller_listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  amount integer NOT NULL,
  buyer_type text CHECK (buyer_type IN ('cash','mortgage')),
  chain_status text CHECK (chain_status IN ('chain_free','in_chain')),
  chain_length integer,
  is_verified boolean DEFAULT false,
  conditions text,
  solicitor_name text,
  solicitor_email text,
  solicitor_phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','countered','rejected','withdrawn')),
  counter_amount integer,
  counter_message text,
  offered_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- sale_progression_stages
CREATE TABLE IF NOT EXISTS sale_progression_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES seller_offers(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token uuid NOT NULL DEFAULT gen_random_uuid(),
  current_stage integer NOT NULL DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 8),
  stage_dates jsonb DEFAULT '{}'::jsonb,
  expected_dates jsonb DEFAULT '{}'::jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  solicitor_name text,
  solicitor_email text,
  solicitor_phone text,
  buyer_solicitor_name text,
  buyer_solicitor_email text,
  mortgage_broker_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- agent_enquiries
CREATE TABLE IF NOT EXISTS agent_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES seller_listings(id) ON DELETE SET NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','responded','booked')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- agent_profiles
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name text NOT NULL DEFAULT '',
  areas_covered text[] NOT NULL DEFAULT '{}',
  fee_percentage numeric(4,2),
  average_rating numeric(3,2),
  review_count integer NOT NULL DEFAULT 0,
  sold_count integer NOT NULL DEFAULT 0,
  average_days_to_sell integer,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents manage own profile" ON agent_profiles
  FOR ALL USING (id = auth.uid());
CREATE POLICY "Anyone can read agent profiles" ON agent_profiles
  FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seller_listings_seller_id ON seller_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_listings_status ON seller_listings(status);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_events_listing_id ON listing_analytics_events(listing_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_listing_date ON listing_analytics_events(listing_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_viewings_seller_id ON seller_viewings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_viewings_listing_id ON seller_viewings(listing_id);
CREATE INDEX IF NOT EXISTS idx_seller_offers_listing_id ON seller_offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_seller_offers_seller_id ON seller_offers(seller_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_accepted_offer_per_listing
  ON seller_offers (listing_id) WHERE status = 'accepted';
CREATE INDEX IF NOT EXISTS idx_sale_progression_offer_id ON sale_progression_stages(offer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sale_progression_share_token
  ON sale_progression_stages(share_token);
CREATE INDEX IF NOT EXISTS idx_agent_enquiries_seller_id ON agent_enquiries(seller_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_areas ON agent_profiles USING GIN(areas_covered);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_seller_listings_updated_at
  BEFORE UPDATE ON seller_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_viewings_updated_at
  BEFORE UPDATE ON seller_viewings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_offers_updated_at
  BEFORE UPDATE ON seller_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sale_progression_updated_at
  BEFORE UPDATE ON sale_progression_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE seller_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_description_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_viewings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_progression_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage own listings" ON seller_listings
  FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Anyone can record analytics" ON listing_analytics_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Sellers read own listing analytics" ON listing_analytics_events
  FOR SELECT USING (
    listing_id IN (SELECT id FROM seller_listings WHERE seller_id = auth.uid())
  );

CREATE POLICY "Sellers manage own attempts" ON listing_description_attempts
  FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Sellers manage own viewings" ON seller_viewings
  FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Sellers manage own offers" ON seller_offers
  FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Sellers manage own sale progression" ON sale_progression_stages
  FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Sellers manage own agent enquiries" ON agent_enquiries
  FOR ALL USING (seller_id = auth.uid());
