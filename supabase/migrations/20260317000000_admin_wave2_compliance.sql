-- Wave 2: CMS, Email Campaigns, Promo Codes

-- 1. CMS articles (blog, help, landing pages)
CREATE TABLE IF NOT EXISTS cms_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_type text NOT NULL CHECK (article_type IN ('blog', 'help', 'landing')),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content jsonb NOT NULL,
  excerpt text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  seo_title text,
  seo_description text,
  og_image_url text,
  author_id uuid REFERENCES profiles(id),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_articles_type_status_idx ON cms_articles(article_type, status);
ALTER TABLE cms_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cms_articles_published_public" ON cms_articles;
CREATE POLICY "cms_articles_published_public" ON cms_articles
  FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "cms_articles_admin" ON cms_articles;
CREATE POLICY "cms_articles_admin" ON cms_articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 2. Email campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  content jsonb NOT NULL,
  target_roles text[],
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count int,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "email_campaigns_admin" ON email_campaigns;
CREATE POLICY "email_campaigns_admin" ON email_campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 3. Promo codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  max_uses int,
  uses_count int DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  applies_to text[],
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_codes_admin" ON promo_codes;
CREATE POLICY "promo_codes_admin" ON promo_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
