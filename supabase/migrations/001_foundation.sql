-- =============================================================================
-- Phase 1 Foundation: Database Schema Migration
-- =============================================================================
-- Creates the core user, role, verification, GDPR consent, and audit tables.
-- All tables have RLS enabled with appropriate policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Enum Types
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
  'homebuyer', 'renter', 'seller', 'landlord', 'agent', 'service_provider'
);

CREATE TYPE verification_level AS ENUM (
  'basic', 'standard', 'enhanced', 'professional'
);

CREATE TYPE verification_stage AS ENUM (
  'email', 'phone', 'identity', 'insurance', 'qualifications', 'admin_review'
);

-- ---------------------------------------------------------------------------
-- Table 1: profiles (extends auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  active_role user_role NOT NULL DEFAULT 'homebuyer',
  verification_level verification_level NOT NULL DEFAULT 'basic',
  avatar_url TEXT,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete for GDPR
);

-- ---------------------------------------------------------------------------
-- Table 2: user_roles (multi-role junction table)
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- ---------------------------------------------------------------------------
-- Table 3: provider_verifications (verification pipeline)
-- ---------------------------------------------------------------------------
CREATE TABLE public.provider_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage verification_stage NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  document_url TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stage)
);

-- ---------------------------------------------------------------------------
-- Table 4: consent_records (GDPR consent)
-- ---------------------------------------------------------------------------
CREATE TABLE public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL
    CHECK (consent_type IN ('marketing', 'analytics', 'third_party')),
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, consent_type)
);

-- ---------------------------------------------------------------------------
-- Table 5: consent_audit_log (immutable audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE public.consent_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL,
  old_value BOOLEAN,
  new_value BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Table 6: auth_audit_log (auth event tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE public.auth_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Table 7: deletion_requests (GDPR Art. 17)
-- ---------------------------------------------------------------------------
CREATE TABLE public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_purge_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  purged_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_profiles_active_role
  ON profiles(active_role) WHERE deleted_at IS NULL;

CREATE INDEX idx_user_roles_user_id
  ON user_roles(user_id);

CREATE INDEX idx_user_roles_role
  ON user_roles(role);

CREATE INDEX idx_consent_records_user_id
  ON consent_records(user_id);

CREATE INDEX idx_consent_audit_user_id
  ON consent_audit_log(user_id, created_at DESC);

CREATE INDEX idx_auth_audit_user_id
  ON auth_audit_log(user_id, created_at DESC);

CREATE INDEX idx_provider_verifications_user
  ON provider_verifications(user_id);

CREATE INDEX idx_provider_verifications_status
  ON provider_verifications(status) WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- Trigger Function: update_updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER consent_records_updated_at
  BEFORE UPDATE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER provider_verifications_updated_at
  BEFORE UPDATE ON provider_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger Function: handle_new_user (auto-create profile on registration)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  );

  INSERT INTO public.auth_audit_log (user_id, event_type, event_details)
  VALUES (
    NEW.id,
    'registration',
    jsonb_build_object('provider', NEW.raw_app_meta_data->>'provider')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger Function: log_consent_change (consent audit trail)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.consent_audit_log (
    user_id, consent_type, old_value, new_value, ip_address, user_agent
  )
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.consent_type, OLD.consent_type),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.granted END,
    NEW.granted,
    NEW.ip_address,
    NEW.user_agent
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER consent_change_audit
  AFTER INSERT OR UPDATE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION log_consent_change();

-- ---------------------------------------------------------------------------
-- Row Level Security: Enable on ALL tables
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS Policies: profiles
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- RLS Policies: user_roles
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS Policies: consent_records
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own consent" ON consent_records
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own consent" ON consent_records
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own consent" ON consent_records
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS Policies: consent_audit_log
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own consent audit" ON consent_audit_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS Policies: auth_audit_log
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own auth audit" ON auth_audit_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS Policies: provider_verifications
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own verifications" ON provider_verifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own verifications" ON provider_verifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS Policies: deletion_requests
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own deletion requests" ON deletion_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own deletion requests" ON deletion_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
