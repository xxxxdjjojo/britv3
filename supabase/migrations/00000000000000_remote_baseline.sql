


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "btree_gin" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."booking_status" AS ENUM (
    'pending_confirmation',
    'confirmed',
    'in_progress',
    'completing',
    'completed',
    'cancelled',
    'disputed'
);


ALTER TYPE "public"."booking_status" OWNER TO "postgres";


CREATE TYPE "public"."document_category" AS ENUM (
    'gas_safety',
    'epc',
    'electrical',
    'insurance',
    'tenancy_agreement',
    'inventory',
    'other',
    'electrical_eicr',
    'inspection_report',
    'receipt'
);


ALTER TYPE "public"."document_category" OWNER TO "postgres";


CREATE TYPE "public"."document_verification_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'more_info_required'
);


ALTER TYPE "public"."document_verification_status" OWNER TO "postgres";


CREATE TYPE "public"."financial_entry_type" AS ENUM (
    'income',
    'expense'
);


ALTER TYPE "public"."financial_entry_type" OWNER TO "postgres";


CREATE TYPE "public"."invoice_status" AS ENUM (
    'draft',
    'sent',
    'paid',
    'overdue',
    'cancelled'
);


ALTER TYPE "public"."invoice_status" OWNER TO "postgres";


CREATE TYPE "public"."listing_status" AS ENUM (
    'draft',
    'active',
    'under_offer',
    'sold',
    'let',
    'withdrawn',
    'archived'
);


ALTER TYPE "public"."listing_status" OWNER TO "postgres";


CREATE TYPE "public"."listing_type" AS ENUM (
    'sale',
    'rent'
);


ALTER TYPE "public"."listing_type" OWNER TO "postgres";


CREATE TYPE "public"."maintenance_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'emergency'
);


ALTER TYPE "public"."maintenance_priority" OWNER TO "postgres";


CREATE TYPE "public"."maintenance_status" AS ENUM (
    'reported',
    'acknowledged',
    'in_progress',
    'resolved',
    'closed',
    'new',
    'assigned'
);


ALTER TYPE "public"."maintenance_status" OWNER TO "postgres";


CREATE TYPE "public"."media_type" AS ENUM (
    'image',
    'floor_plan',
    'epc_document'
);


ALTER TYPE "public"."media_type" OWNER TO "postgres";


CREATE TYPE "public"."planning_status_type" AS ENUM (
    'granted',
    'pending',
    'refused',
    'none_known'
);


ALTER TYPE "public"."planning_status_type" OWNER TO "postgres";


CREATE TYPE "public"."property_type" AS ENUM (
    'detached',
    'semi_detached',
    'terraced',
    'flat',
    'bungalow',
    'land',
    'cottage',
    'penthouse',
    'studio',
    'maisonette',
    'other'
);


ALTER TYPE "public"."property_type" OWNER TO "postgres";


CREATE TYPE "public"."provider_reference_status" AS ENUM (
    'pending',
    'submitted',
    'verified'
);


ALTER TYPE "public"."provider_reference_status" OWNER TO "postgres";


CREATE TYPE "public"."provider_reference_type" AS ENUM (
    'client',
    'peer'
);


ALTER TYPE "public"."provider_reference_type" OWNER TO "postgres";


CREATE TYPE "public"."provider_verification_status" AS ENUM (
    'unverified',
    'pending_review',
    'verified',
    'suspended',
    'rejected'
);


ALTER TYPE "public"."provider_verification_status" OWNER TO "postgres";


CREATE TYPE "public"."quote_status" AS ENUM (
    'draft',
    'sent',
    'viewed',
    'accepted',
    'declined',
    'expired',
    'withdrawn'
);


ALTER TYPE "public"."quote_status" OWNER TO "postgres";


CREATE TYPE "public"."referral_status" AS ENUM (
    'pending',
    'rewarded'
);


ALTER TYPE "public"."referral_status" OWNER TO "postgres";


CREATE TYPE "public"."referral_tier" AS ENUM (
    'none',
    'connector',
    'ambassador',
    'champion',
    'partner'
);


ALTER TYPE "public"."referral_tier" OWNER TO "postgres";


CREATE TYPE "public"."referral_track" AS ENUM (
    'trade_to_trade',
    'trade_to_homeowner'
);


ALTER TYPE "public"."referral_track" OWNER TO "postgres";


CREATE TYPE "public"."reward_status" AS ENUM (
    'earned',
    'applied',
    'failed',
    'voided'
);


ALTER TYPE "public"."reward_status" OWNER TO "postgres";


CREATE TYPE "public"."rfq_status" AS ENUM (
    'open',
    'quotes_received',
    'awarded',
    'cancelled',
    'expired'
);


ALTER TYPE "public"."rfq_status" OWNER TO "postgres";


CREATE TYPE "public"."service_category" AS ENUM (
    'conveyancing',
    'surveying',
    'mortgage_broker',
    'moving_company',
    'home_inspector',
    'cleaning',
    'handyman',
    'plumber',
    'electrician',
    'landscaping',
    'interior_design',
    'architect',
    'property_management',
    'pest_control',
    'locksmith',
    'other',
    'builder',
    'plasterer',
    'painter',
    'carpenter'
);


ALTER TYPE "public"."service_category" OWNER TO "postgres";


CREATE TYPE "public"."tenancy_status" AS ENUM (
    'active',
    'expired',
    'terminated',
    'pending',
    'ending_soon',
    'ended'
);


ALTER TYPE "public"."tenancy_status" OWNER TO "postgres";


CREATE TYPE "public"."tenure_type" AS ENUM (
    'freehold',
    'leasehold',
    'shared_ownership'
);


ALTER TYPE "public"."tenure_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'homebuyer',
    'renter',
    'seller',
    'landlord',
    'agent',
    'service_provider',
    'mortgage_broker'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."verification_document_type" AS ENUM (
    'identity_proof',
    'qualification_certificate',
    'insurance_certificate',
    'business_registration',
    'dbs_check',
    'reference_letter',
    'gas_safe_certificate',
    'niceic_registration',
    'napit_registration',
    'cscs_card',
    'part_p_certificate',
    'acs_qualification',
    'public_liability_insurance'
);


ALTER TYPE "public"."verification_document_type" OWNER TO "postgres";


CREATE TYPE "public"."verification_level" AS ENUM (
    'basic',
    'standard',
    'enhanced',
    'professional'
);


ALTER TYPE "public"."verification_level" OWNER TO "postgres";


CREATE TYPE "public"."verification_stage" AS ENUM (
    'email',
    'phone',
    'identity',
    'insurance',
    'qualifications',
    'admin_review'
);


ALTER TYPE "public"."verification_stage" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_offer_cascade"("p_offer_id" "uuid", "p_seller_id" "uuid", "p_solicitor_name" "text" DEFAULT NULL::"text", "p_solicitor_email" "text" DEFAULT NULL::"text", "p_solicitor_phone" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_listing_id uuid;
  v_offer_status text;
  v_progression_id uuid;
  v_rejected_count integer;
BEGIN
  -- 1. Verify ownership + pending status
  SELECT listing_id, status INTO v_listing_id, v_offer_status
  FROM seller_offers
  WHERE id = p_offer_id AND seller_id = p_seller_id;

  IF v_listing_id IS NULL THEN
    RAISE EXCEPTION 'Offer not found or not owned by you';
  END IF;
  IF v_offer_status != 'pending' THEN
    RAISE EXCEPTION 'Offer has already been actioned';
  END IF;

  -- 2. Accept the offer
  UPDATE seller_offers
  SET status = 'accepted',
      solicitor_name = p_solicitor_name,
      solicitor_email = p_solicitor_email,
      solicitor_phone = p_solicitor_phone,
      responded_at = now()
  WHERE id = p_offer_id;

  -- 3. Update listing to under_offer
  UPDATE seller_listings SET status = 'under_offer' WHERE id = v_listing_id;

  -- 4. Create sale progression (stage 1 = offer accepted)
  INSERT INTO sale_progression_stages (
    offer_id, seller_id, current_stage,
    stage_dates, solicitor_name, solicitor_email, solicitor_phone
  )
  VALUES (
    p_offer_id, p_seller_id, 1,
    jsonb_build_object('1', to_char(now(), 'YYYY-MM-DD')),
    p_solicitor_name, p_solicitor_email, p_solicitor_phone
  )
  RETURNING id INTO v_progression_id;

  -- 5. Reject all other pending offers on this listing
  UPDATE seller_offers
  SET status = 'rejected', responded_at = now()
  WHERE listing_id = v_listing_id
    AND id != p_offer_id
    AND status = 'pending';
  GET DIAGNOSTICS v_rejected_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'progression_id', v_progression_id,
    'rejected_count', v_rejected_count,
    'listing_id', v_listing_id
  );
END;
$$;


ALTER FUNCTION "public"."accept_offer_cascade"("p_offer_id" "uuid", "p_seller_id" "uuid", "p_solicitor_name" "text", "p_solicitor_email" "text", "p_solicitor_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_role_atomic"("p_user_id" "uuid", "p_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  BEGIN
    INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, p_role::user_role) ON CONFLICT (user_id, role) DO NOTHING;
    UPDATE public.profiles SET active_role = p_role::user_role WHERE id = p_user_id;
    INSERT INTO public.auth_audit_log (user_id, event_type, event_details) VALUES (p_user_id, 'role_assigned', jsonb_build_object('role', p_role));
  END; $$;


ALTER FUNCTION "public"."assign_role_atomic"("p_user_id" "uuid", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atomic_flag_review"("p_review_id" "uuid", "p_user_id" "uuid", "p_reason" "text", "p_description" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_reviewer_id uuid;
  v_new_flag_count integer;
  v_flag_id uuid;
BEGIN
  SELECT reviewer_id INTO v_reviewer_id
  FROM public.reviews
  WHERE id = p_review_id;

  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  IF v_reviewer_id = p_user_id THEN
    RAISE EXCEPTION 'Cannot flag your own review';
  END IF;

  INSERT INTO public.review_flags (review_id, user_id, reason, description, admin_status)
  VALUES (p_review_id, p_user_id, p_reason, p_description, 'pending')
  RETURNING id INTO v_flag_id;

  UPDATE public.reviews
  SET flag_count = flag_count + 1
  WHERE id = p_review_id
  RETURNING flag_count INTO v_new_flag_count;

  IF v_new_flag_count >= 3 THEN
    UPDATE public.moderation_queue
    SET priority_score = priority_score + 5
    WHERE review_id = p_review_id;
  END IF;

  RETURN jsonb_build_object('flag_id', v_flag_id, 'flag_count', v_new_flag_count);
END;
$$;


ALTER FUNCTION "public"."atomic_flag_review"("p_review_id" "uuid", "p_user_id" "uuid", "p_reason" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atomic_vote_review"("p_review_id" "uuid", "p_user_id" "uuid", "p_is_helpful" boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_existing_vote boolean;
  v_result jsonb;
BEGIN
  SELECT is_helpful INTO v_existing_vote
  FROM public.review_helpfulness
  WHERE review_id = p_review_id AND user_id = p_user_id;

  IF v_existing_vote IS NOT NULL THEN
    IF v_existing_vote != p_is_helpful THEN
      UPDATE public.review_helpfulness
      SET is_helpful = p_is_helpful, created_at = now()
      WHERE review_id = p_review_id AND user_id = p_user_id;

      IF p_is_helpful THEN
        UPDATE public.reviews
        SET helpful_count = helpful_count + 1,
            not_helpful_count = GREATEST(not_helpful_count - 1, 0)
        WHERE id = p_review_id;
      ELSE
        UPDATE public.reviews
        SET not_helpful_count = not_helpful_count + 1,
            helpful_count = GREATEST(helpful_count - 1, 0)
        WHERE id = p_review_id;
      END IF;
    END IF;
  ELSE
    INSERT INTO public.review_helpfulness (review_id, user_id, is_helpful)
    VALUES (p_review_id, p_user_id, p_is_helpful);

    IF p_is_helpful THEN
      UPDATE public.reviews
      SET helpful_count = helpful_count + 1
      WHERE id = p_review_id;
    ELSE
      UPDATE public.reviews
      SET not_helpful_count = not_helpful_count + 1
      WHERE id = p_review_id;
    END IF;
  END IF;

  SELECT jsonb_build_object(
    'helpful_count', r.helpful_count,
    'not_helpful_count', r.not_helpful_count
  ) INTO v_result
  FROM public.reviews r
  WHERE r.id = p_review_id;

  RETURN COALESCE(v_result, '{"helpful_count":0,"not_helpful_count":0}'::jsonb);
END;
$$;


ALTER FUNCTION "public"."atomic_vote_review"("p_review_id" "uuid", "p_user_id" "uuid", "p_is_helpful" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."book_viewing_slot"("p_slot_id" "uuid", "p_user_id" "uuid", "p_listing_id" "uuid", "p_type" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_slot    public.viewing_slots;
  v_viewing public.viewings;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  SELECT * INTO v_slot
  FROM public.viewing_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF v_slot.status <> 'available' THEN
    RETURN jsonb_build_object('success', false, 'error', 'SLOT_UNAVAILABLE');
  END IF;

  UPDATE public.viewing_slots
  SET status = 'booked', updated_at = now()
  WHERE id = p_slot_id;

  INSERT INTO public.viewings (user_id, slot_id, listing_id, type)
  VALUES (p_user_id, p_slot_id, p_listing_id, p_type)
  RETURNING * INTO v_viewing;

  RETURN jsonb_build_object('success', true, 'viewing_id', v_viewing.id);
END;
$$;


ALTER FUNCTION "public"."book_viewing_slot"("p_slot_id" "uuid", "p_user_id" "uuid", "p_listing_id" "uuid", "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."boost_defamation_flag_priority"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.reason = 'defamation' THEN
    UPDATE public.moderation_queue
    SET priority_score = priority_score + 10
    WHERE review_id = NEW.review_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."boost_defamation_flag_priority"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_reminder_date"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    NEW.next_reminder_date := NEW.expiry_date - INTERVAL '30 days';
    NEW.reminder_sent := FALSE;
  ELSE
    NEW.next_reminder_date := NULL;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_reminder_date"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_viewing"("p_viewing_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_viewing public.viewings;
BEGIN
  SELECT * INTO v_viewing
  FROM public.viewings
  WHERE id = p_viewing_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
  END IF;

  UPDATE public.viewings
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_viewing_id;

  UPDATE public.viewing_slots
  SET status = 'available', updated_at = now()
  WHERE id = v_viewing.slot_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."cancel_viewing"("p_viewing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_feature_flag"("p_key" "text", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_flag feature_flags%ROWTYPE;
  v_user_role TEXT;
BEGIN
  SELECT * INTO v_flag FROM feature_flags WHERE key = p_key;
  IF NOT FOUND THEN RETURN false; END IF;
  IF NOT v_flag.enabled THEN RETURN false; END IF;

  -- Role restriction check
  IF v_flag.allowed_roles IS NOT NULL AND p_user_id IS NOT NULL THEN
    SELECT role INTO v_user_role FROM profiles WHERE id = p_user_id;
    IF v_user_role IS NULL OR NOT (v_user_role = ANY(v_flag.allowed_roles)) THEN
      RETURN false;
    END IF;
  END IF;

  -- Random rollout evaluation
  IF v_flag.rollout_pct < 100 THEN
    IF random() * 100 >= v_flag.rollout_pct THEN RETURN false; END IF;
  END IF;

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."check_feature_flag"("p_key" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_plan text;
  user_is_admin boolean;
  user_id uuid;
BEGIN
  user_id := (event->>'user_id')::uuid;
  claims := event->'claims';

  SELECT active_role, is_admin
  INTO user_role, user_is_admin
  FROM public.profiles
  WHERE id = user_id;

  SELECT plan_name
  INTO user_plan
  FROM public.subscriptions
  WHERE user_id = custom_access_token_hook.user_id
    AND status IN ('active', 'trialing')
  LIMIT 1;

  claims := jsonb_set(claims, '{app_metadata}', COALESCE(claims->'app_metadata', '{}'::jsonb));
  claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(COALESCE(user_role, '')));
  claims := jsonb_set(claims, '{app_metadata,plan}', to_jsonb(COALESCE(user_plan, '')));
  claims := jsonb_set(claims, '{app_metadata,is_admin}', to_jsonb(COALESCE(user_is_admin, false)));

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.jwt_claims_errors (user_id, error_message, error_detail)
  VALUES (user_id, SQLERRM, SQLSTATE);
  RETURN event;
END;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decide_invoice_dispute"("p_id" "uuid", "p_admin" "uuid", "p_decision" "text", "p_category" "text", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_status text;
  v_invoice uuid;
begin
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'decision reason is required';
  end if;
  if p_category is null or btrim(p_category) = '' then
    raise exception 'playbook category is required';
  end if;
  if p_decision not in ('conceded','rejected') then
    raise exception 'invalid decision: %', p_decision;
  end if;

  select status, invoice_id into v_status, v_invoice
    from invoice_disputes where id = p_id for update;
  if not found then
    raise exception 'dispute not found: %', p_id;
  end if;
  if v_status <> 'open' then
    raise exception 'already decided: %', p_id;
  end if;

  perform set_config('truedeed.dispute_decide', 'on', true);
  update invoice_disputes
     set status = p_decision,
         category = p_category,
         decided_by = p_admin,
         decided_at = now(),
         decision_reason = p_reason
   where id = p_id;
  perform set_config('truedeed.dispute_decide', '', true);

  if p_decision = 'conceded' then
    perform public.transition_invoice(
      v_invoice, 'dispute_resolved-upheld', null, p_admin
    );
  else
    perform public.transition_invoice(
      v_invoice, 'dispute_resolved-rejected', null, p_admin
    );
  end if;
end $$;


ALTER FUNCTION "public"."decide_invoice_dispute"("p_id" "uuid", "p_admin" "uuid", "p_decision" "text", "p_category" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decide_rebuttal"("p_rebuttal_id" "uuid", "p_admin_id" "uuid", "p_decision" "text", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_decision text;
begin
  if p_decision not in ('upheld','rejected') then
    raise exception 'invalid decision: %', p_decision;
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'decision reason is required';
  end if;
  select decision into v_decision from rebuttals where id = p_rebuttal_id for update;
  if not found then
    raise exception 'rebuttal not found: %', p_rebuttal_id;
  end if;
  if v_decision is not null then
    raise exception 'already decided: %', p_rebuttal_id;
  end if;
  perform set_config('truedeed.decide', 'on', true);
  update rebuttals
     set decision = p_decision,
         decided_by = p_admin_id,
         decided_at = now(),
         decision_reason = p_reason
   where id = p_rebuttal_id;
  perform set_config('truedeed.decide', '', true);
end $$;


ALTER FUNCTION "public"."decide_rebuttal"("p_rebuttal_id" "uuid", "p_admin_id" "uuid", "p_decision" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_stale_quotes"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.quotes
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    status IN ('sent', 'viewed')
    AND valid_until < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."expire_stale_quotes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_stale_rfqs"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.service_requests
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    status IN ('open', 'quotes_received')
    AND expires_at < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."expire_stale_rfqs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_recent_price_drops"() RETURNS TABLE("property_id" "uuid", "listing_id" "uuid", "title" "text", "slug" "text", "old_price" bigint, "new_price" bigint, "drop_pct" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH latest_two AS (
    SELECT
      ph.property_id AS prop_id,
      ph.price AS ph_price,
      ph.created_at AS ph_created,
      ROW_NUMBER() OVER (PARTITION BY ph.property_id ORDER BY ph.created_at DESC) AS rn
    FROM public.price_history ph
    WHERE ph.created_at > now() - interval '48 hours'
  )
  SELECT
    l2.prop_id AS property_id,
    sl.listing_id,
    sl.title,
    sl.slug,
    prev.ph_price AS old_price,
    l2.ph_price AS new_price,
    ROUND(((prev.ph_price - l2.ph_price)::numeric / prev.ph_price) * 100, 1) AS drop_pct
  FROM latest_two l2
  JOIN latest_two prev ON l2.prop_id = prev.prop_id AND prev.rn = 2
  JOIN public.search_listings sl ON sl.property_id = l2.prop_id::text
  WHERE l2.rn = 1
    AND l2.ph_price < prev.ph_price
    AND l2.ph_created > now() - interval '24 hours';
END;
$$;


ALTER FUNCTION "public"."find_recent_price_drops"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gdpr_scrub_introductions"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_count integer;
begin
  perform set_config('truedeed.gdpr_scrub', 'on', true);
  update introductions
     set applicant_id = null,
         applicant_name = '[erased]',
         applicant_email = '[erased]'
   where applicant_id = p_user_id;
  get diagnostics v_count = row_count;
  perform set_config('truedeed.gdpr_scrub', '', true);
  return v_count;
end $$;


ALTER FUNCTION "public"."gdpr_scrub_introductions"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gdpr_scrub_invoice_disputes"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_count integer;
begin
  perform set_config('truedeed.dispute_scrub', 'on', true);
  update invoice_disputes
     set raised_by = null,
         grounds = '[erased]',
         evidence_storage_paths = '{}'::text[]
   where raised_by = p_user_id;
  get diagnostics v_count = row_count;
  perform set_config('truedeed.dispute_scrub', '', true);
  return v_count;
end $$;


ALTER FUNCTION "public"."gdpr_scrub_invoice_disputes"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_booking_reference"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN NEW.booking_reference := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'); RETURN NEW; END; $$;


ALTER FUNCTION "public"."generate_booking_reference"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_listing_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  SELECT LOWER(REGEXP_REPLACE(REGEXP_REPLACE(p.address_line1 || '-' || p.city || '-' || NEW.listing_type, '[^a-zA-Z0-9\-]', '-', 'g'), '-+', '-', 'g'))
  INTO base_slug FROM properties p WHERE p.id = NEW.property_id;
  base_slug := TRIM(BOTH '-' FROM base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM listings WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_listing_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_quote_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN NEW.quote_number := 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'); RETURN NEW; END; $$;


ALTER FUNCTION "public"."generate_quote_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_agent_dashboard_kpis"("p_agent_id" "uuid") RETURNS TABLE("active_listings_count" bigint, "new_leads_count" bigint, "viewings_this_week_count" bigint, "pending_offers_count" bigint, "performance_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_total_leads  BIGINT;
  v_closed_leads BIGINT;
BEGIN
  -- Total and closed leads for performance ratio
  SELECT COUNT(*) INTO v_total_leads
  FROM agent_leads
  WHERE agent_id = p_agent_id;

  SELECT COUNT(*) INTO v_closed_leads
  FROM agent_leads
  WHERE agent_id = p_agent_id AND stage = 'closed';

  RETURN QUERY
  SELECT
    -- active listings: listings table where agent created them and status is active
    (
      SELECT COUNT(*)::BIGINT
      FROM listings
      WHERE created_by = p_agent_id
        AND status = 'active'
    ) AS active_listings_count,

    -- new leads in last 7 days
    (
      SELECT COUNT(*)::BIGINT
      FROM agent_leads
      WHERE agent_id = p_agent_id
        AND created_at >= NOW() - INTERVAL '7 days'
    ) AS new_leads_count,

    -- viewings scheduled this week
    (
      SELECT COUNT(*)::BIGINT
      FROM agent_viewing_slots
      WHERE agent_id = p_agent_id
        AND start_time >= date_trunc('week', NOW())
        AND start_time <  date_trunc('week', NOW()) + INTERVAL '7 days'
    ) AS viewings_this_week_count,

    -- pending offers
    (
      SELECT COUNT(*)::BIGINT
      FROM agent_offers
      WHERE agent_id = p_agent_id
        AND status = 'pending'
    ) AS pending_offers_count,

    -- performance score: closed / total leads (0.00 if no leads)
    CASE
      WHEN v_total_leads = 0 THEN 0.00
      ELSE ROUND((v_closed_leads::NUMERIC / v_total_leads::NUMERIC) * 100, 2)
    END AS performance_score;
END;
$$;


ALTER FUNCTION "public"."get_agent_dashboard_kpis"("p_agent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_compliance_matrix"("p_landlord_id" "uuid") RETURNS TABLE("property_id" "uuid", "property_address" "text", "is_hmo" boolean, "category" "text", "doc_id" "uuid", "expiry_date" "date", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH landlord_properties AS (
    SELECT p.id, p.address_line1 || ', ' || p.city AS address, p.is_hmo
    FROM properties p
    JOIN listings l ON l.property_id = p.id
    WHERE l.user_id = p_landlord_id
      AND l.listing_type = 'rent'
      AND l.deleted_at IS NULL
  ),
  categories AS (
    SELECT unnest(ARRAY[
      'gas_safety', 'electrical_eicr', 'epc',
      'deposit_protection', 'smoke_co_alarms',
      'hmo_licence', 'fire_safety'
    ]) AS cat
  ),
  -- Cross join properties × categories, filtering HMO-only categories
  matrix AS (
    SELECT lp.id AS prop_id, lp.address, lp.is_hmo, c.cat
    FROM landlord_properties lp
    CROSS JOIN categories c
    WHERE c.cat NOT IN ('hmo_licence', 'fire_safety')
       OR lp.is_hmo = TRUE
  ),
  -- Find the most recent active document per property × category
  latest_docs AS (
    SELECT DISTINCT ON (pd.property_id, pd.category)
      pd.property_id,
      pd.category::TEXT AS category,
      pd.id AS doc_id,
      pd.expiry_date
    FROM property_documents pd
    WHERE pd.is_active = TRUE
    ORDER BY pd.property_id, pd.category, pd.created_at DESC
  )
  SELECT
    m.prop_id AS property_id,
    m.address AS property_address,
    m.is_hmo,
    m.cat AS category,
    ld.doc_id,
    ld.expiry_date,
    CASE
      WHEN ld.doc_id IS NULL THEN 'missing'
      WHEN ld.expiry_date IS NULL THEN 'valid'  -- no expiry = always valid (e.g. smoke alarms)
      WHEN ld.expiry_date < NOW() THEN 'expired'
      WHEN ld.expiry_date <= NOW() + INTERVAL '30 days' THEN 'expiring'
      ELSE 'valid'
    END AS status
  FROM matrix m
  LEFT JOIN latest_docs ld ON ld.property_id = m.prop_id AND ld.category = m.cat
  ORDER BY m.address, m.cat;
END;
$$;


ALTER FUNCTION "public"."get_compliance_matrix"("p_landlord_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_documents_due_for_reminder"() RETURNS TABLE("document_id" "uuid", "property_id" "uuid", "uploaded_by" "uuid", "document_name" "text", "category" "public"."document_category", "expiry_date" "date", "days_until_expiry" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY SELECT pd.id, pd.property_id, pd.uploaded_by, pd.name, pd.category, pd.expiry_date, (pd.expiry_date - CURRENT_DATE)::INTEGER AS days_until_expiry FROM property_documents pd WHERE pd.next_reminder_date <= CURRENT_DATE AND pd.reminder_sent = FALSE AND pd.expiry_date > CURRENT_DATE ORDER BY pd.expiry_date ASC;
END;
$$;


ALTER FUNCTION "public"."get_documents_due_for_reminder"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inbox_for_user"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "participant_1_id" "uuid", "participant_2_id" "uuid", "context_type" "text", "context_id" "uuid", "last_message_at" timestamp with time zone, "created_at" timestamp with time zone, "participant_name" "text", "last_message_preview" "text", "unread_count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  WITH my_convs AS (
    SELECT * FROM conversations
    WHERE participant_1_id = p_user_id OR participant_2_id = p_user_id
    ORDER BY last_message_at DESC
  ),
  other_ids AS (
    SELECT id AS conv_id,
      CASE WHEN participant_1_id = p_user_id
        THEN participant_2_id ELSE participant_1_id END AS other_id
    FROM my_convs
  ),
  names AS (
    SELECT o.conv_id, p.display_name
    FROM other_ids o
    JOIN profiles p ON p.id = o.other_id
  ),
  previews AS (
    SELECT DISTINCT ON (conversation_id) conversation_id, content
    FROM messages ORDER BY conversation_id, created_at DESC
  ),
  read_status AS (
    SELECT conversation_id, last_read_at FROM conversation_read_status
    WHERE user_id = p_user_id
  ),
  unread AS (
    SELECT m.conversation_id, COUNT(*) AS cnt
    FROM messages m
    LEFT JOIN read_status rs ON rs.conversation_id = m.conversation_id
    WHERE m.sender_id <> p_user_id
      AND m.created_at > COALESCE(rs.last_read_at, '1970-01-01')
    GROUP BY m.conversation_id
  )
  SELECT c.id, c.participant_1_id, c.participant_2_id,
    c.context_type::text, c.context_id, c.last_message_at, c.created_at,
    n.display_name AS participant_name,
    LEFT(pr.content, 100) AS last_message_preview,
    COALESCE(u.cnt, 0) AS unread_count
  FROM my_convs c
  LEFT JOIN names n ON n.conv_id = c.id
  LEFT JOIN previews pr ON pr.conversation_id = c.id
  LEFT JOIN unread u ON u.conversation_id = c.id;
$$;


ALTER FUNCTION "public"."get_inbox_for_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_key_dates"("p_landlord_id" "uuid") RETURNS TABLE("event_date" "date", "event_type" "text", "title" "text", "property_address" "text", "property_id" "uuid", "urgency" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  -- Tenancy endings
  SELECT
    t.lease_end_date AS event_date,
    'tenancy_end'::TEXT AS event_type,
    ('Tenancy ending: ' || t.tenant_name)::TEXT AS title,
    (p.address_line1 || ', ' || p.city)::TEXT AS property_address,
    p.id AS property_id,
    CASE
      WHEN t.lease_end_date <= NOW() + INTERVAL '14 days' THEN 'critical'
      WHEN t.lease_end_date <= NOW() + INTERVAL '30 days' THEN 'warning'
      ELSE 'info'
    END AS urgency
  FROM tenancies t
  JOIN properties p ON p.id = t.property_id
  JOIN listings l ON l.property_id = p.id
  WHERE t.landlord_id = p_landlord_id
    AND t.status IN ('active', 'ending_soon')
    AND t.lease_end_date IS NOT NULL
    AND t.lease_end_date <= NOW() + INTERVAL '60 days'
    AND l.deleted_at IS NULL

  UNION ALL

  -- Compliance expiry
  SELECT
    pd.expiry_date AS event_date,
    'compliance_expiry'::TEXT AS event_type,
    (pd.category || ' expires')::TEXT AS title,
    (p.address_line1 || ', ' || p.city)::TEXT AS property_address,
    p.id AS property_id,
    CASE
      WHEN pd.expiry_date <= NOW() THEN 'critical'
      WHEN pd.expiry_date <= NOW() + INTERVAL '14 days' THEN 'warning'
      ELSE 'info'
    END AS urgency
  FROM property_documents pd
  JOIN properties p ON p.id = pd.property_id
  JOIN listings l ON l.property_id = p.id
  WHERE l.user_id = p_landlord_id
    AND pd.is_active = TRUE
    AND pd.expiry_date IS NOT NULL
    AND pd.expiry_date <= NOW() + INTERVAL '60 days'
    AND l.deleted_at IS NULL

  ORDER BY event_date ASC
  LIMIT 20;
END;
$$;


ALTER FUNCTION "public"."get_key_dates"("p_landlord_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_landlord_health_score"("p_landlord_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
  v_compliance_score NUMERIC;
  v_rent_score NUMERIC;
  v_maintenance_score NUMERIC;
  v_deposit_score NUMERIC;
  v_total_certs INTEGER;
  v_expired_certs INTEGER;
  v_expiring_certs INTEGER;
  v_total_rent INTEGER;
  v_paid_rent INTEGER;
  v_active_tenancies INTEGER;
  v_registered_deposits INTEGER;
  v_avg_response_days NUMERIC;
BEGIN
  -- ========================================================================
  -- 1. Compliance freshness (40pts)
  -- Count active compliance certs across all landlord properties.
  -- Deduct proportionally for expired; half-deduct for expiring within 30 days.
  -- ========================================================================
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE pd.expiry_date < NOW()),
    COUNT(*) FILTER (WHERE pd.expiry_date >= NOW() AND pd.expiry_date <= NOW() + INTERVAL '30 days')
  INTO v_total_certs, v_expired_certs, v_expiring_certs
  FROM property_documents pd
  JOIN properties p ON p.id = pd.property_id
  JOIN listings l ON l.property_id = p.id
  WHERE l.user_id = p_landlord_id
    AND pd.category IN ('gas_safety', 'electrical_eicr', 'epc')
    AND pd.is_active = TRUE;

  IF v_total_certs = 0 THEN
    v_compliance_score := 40;
  ELSE
    v_compliance_score := 40.0 * (1.0
      - (v_expired_certs::NUMERIC / v_total_certs)
      - (v_expiring_certs::NUMERIC / v_total_certs * 0.5));
  END IF;
  IF v_compliance_score < 0 THEN v_compliance_score := 0; END IF;

  -- ========================================================================
  -- 2. Rent collection rate (30pts)
  -- Uses financial_entries with type='income', category='rent' for current month.
  -- payment_status = 'paid' counts as collected.
  -- ========================================================================
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE fe.payment_status = 'paid')
  INTO v_total_rent, v_paid_rent
  FROM financial_entries fe
  JOIN tenancies t ON t.id = fe.tenancy_id
  WHERE t.landlord_id = p_landlord_id
    AND fe.type = 'income'
    AND fe.category = 'rent'
    AND fe.entry_date >= date_trunc('month', NOW())::DATE
    AND fe.entry_date < (date_trunc('month', NOW()) + INTERVAL '1 month')::DATE;

  IF v_total_rent = 0 THEN
    v_rent_score := 30;
  ELSE
    v_rent_score := 30.0 * v_paid_rent::NUMERIC / v_total_rent;
  END IF;

  -- ========================================================================
  -- 3. Maintenance response time (20pts)
  -- Avg days from created_at to updated_at for open requests (new/acknowledged).
  -- <2 days = 20, <7 = 15, <14 = 10, else = 5, no open = 20.
  -- ========================================================================
  SELECT AVG(
    EXTRACT(EPOCH FROM (COALESCE(mr.updated_at, NOW()) - mr.created_at)) / 86400
  )
  INTO v_avg_response_days
  FROM maintenance_requests mr
  JOIN properties p ON p.id = mr.property_id
  JOIN listings l ON l.property_id = p.id
  WHERE l.user_id = p_landlord_id
    AND mr.status IN ('new', 'acknowledged');

  IF v_avg_response_days IS NULL THEN v_maintenance_score := 20;
  ELSIF v_avg_response_days < 2 THEN v_maintenance_score := 20;
  ELSIF v_avg_response_days < 7 THEN v_maintenance_score := 15;
  ELSIF v_avg_response_days < 14 THEN v_maintenance_score := 10;
  ELSE v_maintenance_score := 5;
  END IF;

  -- ========================================================================
  -- 4. Deposit registration completeness (10pts)
  -- registered_deposits / active_tenancies * 10
  -- ========================================================================
  SELECT COUNT(DISTINCT t.id)
  INTO v_active_tenancies
  FROM tenancies t
  WHERE t.landlord_id = p_landlord_id AND t.status = 'active';

  SELECT COUNT(DISTINCT dr.tenancy_id)
  INTO v_registered_deposits
  FROM deposit_registrations dr
  JOIN tenancies t ON t.id = dr.tenancy_id
  WHERE t.landlord_id = p_landlord_id
    AND t.status = 'active'
    AND dr.status = 'registered';

  IF v_active_tenancies = 0 THEN
    v_deposit_score := 10;
  ELSE
    v_deposit_score := 10.0 * v_registered_deposits::NUMERIC / v_active_tenancies;
  END IF;

  -- ========================================================================
  -- Build result JSON
  -- ========================================================================
  SELECT json_build_object(
    'total_score', ROUND(v_compliance_score + v_rent_score + v_maintenance_score + v_deposit_score),
    'compliance_score', ROUND(v_compliance_score),
    'compliance_max', 40,
    'rent_score', ROUND(v_rent_score),
    'rent_max', 30,
    'maintenance_score', ROUND(v_maintenance_score),
    'maintenance_max', 20,
    'deposit_score', ROUND(v_deposit_score),
    'deposit_max', 10,
    'weakest_area', CASE
      WHEN v_compliance_score / 40.0 <= v_rent_score / 30.0
        AND v_compliance_score / 40.0 <= v_maintenance_score / 20.0
        AND v_compliance_score / 40.0 <= v_deposit_score / 10.0
      THEN 'compliance'
      WHEN v_rent_score / 30.0 <= v_maintenance_score / 20.0
        AND v_rent_score / 30.0 <= v_deposit_score / 10.0
      THEN 'rent'
      WHEN v_maintenance_score / 20.0 <= v_deposit_score / 10.0
      THEN 'maintenance'
      ELSE 'deposits'
    END
  ) INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_landlord_health_score"("p_landlord_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_landlord_portfolio_kpis"("p_landlord_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_properties',   COUNT(DISTINCT l.id),
    'occupied',           COUNT(DISTINCT l.id) FILTER (WHERE t.status IN ('active', 'ending_soon')),
    'vacant',             COUNT(DISTINCT l.id) - COUNT(DISTINCT l.id) FILTER (WHERE t.status IN ('active', 'ending_soon')),
    'occupancy_rate',     CASE
                            WHEN COUNT(DISTINCT l.id) = 0 THEN 0
                            ELSE ROUND(
                              COUNT(DISTINCT l.id) FILTER (WHERE t.status IN ('active', 'ending_soon'))::NUMERIC
                              * 100.0 / COUNT(DISTINCT l.id),
                              1
                            )
                          END,
    'total_monthly_rent', COALESCE(
                            SUM(t.rent_amount) FILTER (
                              WHERE t.status = 'active' AND t.rent_frequency = 'monthly'
                            ),
                            0
                          ),
    'compliance_alerts',  COUNT(pd.id) FILTER (
                            WHERE pd.expiry_date IS NOT NULL
                              AND pd.expiry_date >= CURRENT_DATE
                              AND pd.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
                          ),
    'open_maintenance',   COUNT(mr.id) FILTER (
                            WHERE mr.status IN ('new', 'acknowledged', 'assigned', 'in_progress')
                          ),
    'expired_compliance', COUNT(pd.id) FILTER (
                            WHERE pd.expiry_date IS NOT NULL
                              AND pd.expiry_date < CURRENT_DATE
                          )
  ) INTO result
  FROM listings l
  JOIN properties p ON p.id = l.property_id
  LEFT JOIN tenancies t ON t.property_id = p.id
  LEFT JOIN property_documents pd
    ON pd.property_id = p.id
   AND pd.category IN ('gas_safety', 'electrical_eicr', 'epc')
  LEFT JOIN maintenance_requests mr ON mr.property_id = p.id
  WHERE l.user_id = p_landlord_id
    AND l.listing_type = 'rent';

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_landlord_portfolio_kpis"("p_landlord_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_landlord_portfolio_properties"("p_landlord_id" "uuid") RETURNS TABLE("id" "uuid", "address_line_1" "text", "address_line_2" "text", "city" "text", "postcode" "text", "property_type" "text", "bedrooms" integer, "listing_id" "uuid", "tenant_name" "text", "tenancy_status" "text", "rent_amount" numeric, "rent_frequency" "text", "lease_end_date" "date", "open_maintenance_count" bigint, "expiring_documents_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.address_line1 AS address_line_1,
    p.address_line2 AS address_line_2,
    p.city,
    p.postcode,
    p.property_type::TEXT,
    p.bedrooms,
    l.id AS listing_id,
    -- Active tenancy: prefer 'active', then 'ending_soon'
    t_active.tenant_name,
    t_active.status::TEXT AS tenancy_status,
    t_active.rent_amount,
    t_active.rent_frequency,
    t_active.lease_end_date,
    -- Open maintenance count
    COALESCE(mc.cnt, 0) AS open_maintenance_count,
    -- Expiring documents count (within 30 days, active only)
    COALESCE(dc.cnt, 0) AS expiring_documents_count
  FROM listings l
  INNER JOIN properties p ON p.id = l.property_id
  -- Pick the best active tenancy per property using DISTINCT ON
  LEFT JOIN LATERAL (
    SELECT
      ten.tenant_name,
      ten.status,
      ten.rent_amount,
      ten.rent_frequency,
      ten.lease_end_date
    FROM tenancies ten
    WHERE ten.property_id = p.id
      AND ten.status IN ('active', 'ending_soon')
    ORDER BY
      CASE ten.status WHEN 'active' THEN 0 WHEN 'ending_soon' THEN 1 END
    LIMIT 1
  ) t_active ON TRUE
  -- Open maintenance aggregate
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM maintenance_requests mr
    WHERE mr.property_id = p.id
      AND mr.status IN ('new', 'acknowledged', 'assigned', 'in_progress')
  ) mc ON TRUE
  -- Expiring documents aggregate (active docs expiring within 30 days)
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM property_documents pd
    WHERE pd.property_id = p.id
      AND pd.is_active = TRUE
      AND pd.expiry_date >= NOW()
      AND pd.expiry_date <= NOW() + INTERVAL '30 days'
  ) dc ON TRUE
  WHERE l.user_id = p_landlord_id
    AND l.listing_type = 'rent'   -- fixed: was 'rental' (not a valid enum value)
    AND l.deleted_at IS NULL
  ORDER BY p.address_line1;
END;
$$;


ALTER FUNCTION "public"."get_landlord_portfolio_properties"("p_landlord_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_nearby_transport_stops"("center_lat" double precision, "center_lng" double precision, "radius_meters" double precision DEFAULT 8000, "max_results" integer DEFAULT 6) RETURNS TABLE("name" "text", "stop_type" "text", "distance_meters" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  select d.name, d.stop_type, d.distance_meters
  from (
    select distinct on (s.name)
      s.name,
      s.stop_type,
      st_distance(
        s.coordinates,
        st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography
      ) as distance_meters
    from public.transport_stops s
    where st_dwithin(
      s.coordinates,
      st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
      radius_meters
    )
    order by s.name, distance_meters asc
  ) d
  order by d.distance_meters asc
  limit max_results;
$$;


ALTER FUNCTION "public"."get_nearby_transport_stops"("center_lat" double precision, "center_lng" double precision, "radius_meters" double precision, "max_results" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_property_financial_summary"("p_property_id" "uuid", "p_start_date" "date" DEFAULT ("date_trunc"('year'::"text", (CURRENT_DATE)::timestamp with time zone))::"date", "p_end_date" "date" DEFAULT CURRENT_DATE) RETURNS TABLE("total_income" numeric, "total_expenses" numeric, "net_income" numeric, "entry_count" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income, COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses, COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net_income, COUNT(*) AS entry_count FROM financial_entries WHERE property_id = p_property_id AND entry_date BETWEEN p_start_date AND p_end_date;
END;
$$;


ALTER FUNCTION "public"."get_property_financial_summary"("p_property_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_count"("p_user_id" "uuid") RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(DISTINCT m.conversation_id)
  FROM conversations c
  JOIN messages m ON m.conversation_id = c.id
  LEFT JOIN conversation_read_status rs
    ON rs.conversation_id = c.id AND rs.user_id = p_user_id
  WHERE (c.participant_1_id = p_user_id OR c.participant_2_id = p_user_id)
    AND m.sender_id <> p_user_id
    AND m.created_at > COALESCE(rs.last_read_at, '1970-01-01');
$$;


ALTER FUNCTION "public"."get_unread_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_favorite_count"("p_listing_id" "uuid", "p_delta" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE listings
  SET favorite_count = GREATEST(0, favorite_count + p_delta)
  WHERE id = p_listing_id;
END;
$$;


ALTER FUNCTION "public"."increment_favorite_count"("p_listing_id" "uuid", "p_delta" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_listing_view_count"("p_listing_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE listings
  SET view_count = view_count + 1
  WHERE id = p_listing_id;
END;
$$;


ALTER FUNCTION "public"."increment_listing_view_count"("p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_success" boolean DEFAULT NULL::boolean, "p_error_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Caller is not an admin';
  END IF;

  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, metadata, ip_address, success, error_message)
  VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_metadata, p_ip_address, p_success, p_error_message)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "text", "p_metadata" "jsonb", "p_ip_address" "inet", "p_success" boolean, "p_error_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_consent_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."log_consent_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_introduction_notified"("p_id" "uuid", "p_notified_at" timestamp with time zone, "p_deadline" timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_notified timestamptz;
begin
  select notified_at into v_notified from introductions where id = p_id for update;
  if not found then
    raise exception 'introduction not found: %', p_id;
  end if;
  if v_notified is not null then
    raise exception 'already notified: %', p_id;
  end if;
  perform set_config('truedeed.allow_notify', 'on', true);
  update introductions
     set notified_at = p_notified_at, rebuttal_deadline = p_deadline
   where id = p_id;
  perform set_config('truedeed.allow_notify', '', true);
end $$;


ALTER FUNCTION "public"."mark_introduction_notified"("p_id" "uuid", "p_notified_at" timestamp with time zone, "p_deadline" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."next_invoice_number"() RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select 'TD-' || to_char(now(), 'YYYY') || '-'
              || lpad(nextval('public.invoice_number_seq')::text, 4, '0')
$$;


ALTER FUNCTION "public"."next_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_review_created"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ DECLARE v_user_review_count INTEGER; v_booking_completed_at TIMESTAMPTZ; v_hours_since_completion NUMERIC; v_text_len INTEGER; v_caps_ratio NUMERIC; v_authenticity NUMERIC := 50; v_fake_probability NUMERIC := 0; BEGIN SELECT COUNT(*) INTO v_user_review_count FROM reviews WHERE reviewer_id = NEW.reviewer_id AND id != NEW.id; SELECT updated_at INTO v_booking_completed_at FROM bookings WHERE id = NEW.booking_id AND status = 'completed'; IF v_booking_completed_at IS NOT NULL THEN v_hours_since_completion := EXTRACT(EPOCH FROM (NOW() - v_booking_completed_at)) / 3600; ELSE v_hours_since_completion := 0; END IF; v_text_len := LENGTH(NEW.review_text); v_caps_ratio := CASE WHEN v_text_len > 0 THEN LENGTH(REGEXP_REPLACE(NEW.review_text, '[^A-Z]', '', 'g'))::NUMERIC / v_text_len ELSE 0 END; IF v_user_review_count > 0 THEN v_authenticity := v_authenticity + LEAST(v_user_review_count * 5, 20); END IF; IF v_hours_since_completion BETWEEN 1 AND 720 THEN v_authenticity := v_authenticity + 15; END IF; IF v_text_len BETWEEN 50 AND 1000 THEN v_authenticity := v_authenticity + 10; END IF; IF v_hours_since_completion < 0.083 THEN v_fake_probability := v_fake_probability + 20; END IF; IF v_caps_ratio > 0.3 THEN v_fake_probability := v_fake_probability + 15; END IF; IF (NEW.overall_rating IN (1, 5)) AND v_text_len < 50 THEN v_fake_probability := v_fake_probability + 10; END IF; IF v_user_review_count = 0 THEN v_fake_probability := v_fake_probability + 5; END IF; NEW.authenticity_score := LEAST(GREATEST(v_authenticity, 0), 100); NEW.fake_review_probability := LEAST(GREATEST(v_fake_probability, 0), 100); NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.review_text, '')); RETURN NEW; END; $$;


ALTER FUNCTION "public"."on_review_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_deleted_user"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- -----------------------------------------------------------------------
  -- A. Pseudonymise the user profile
  -- -----------------------------------------------------------------------
  UPDATE profiles
  SET display_name  = 'Deleted User',
      first_name    = NULL,
      last_name     = NULL,
      phone         = NULL,
      postcode      = NULL,
      bio           = NULL,
      avatar_url    = NULL,
      settings      = '{}'::jsonb,
      deleted_at    = now()
  WHERE id = p_user_id;

  -- -----------------------------------------------------------------------
  -- B. Delete user activity data (saved items, history, analytics)
  -- -----------------------------------------------------------------------
  DELETE FROM saved_properties  WHERE user_id = p_user_id;
  DELETE FROM saved_searches    WHERE user_id = p_user_id;
  DELETE FROM viewing_history   WHERE user_id = p_user_id;
  DELETE FROM search_analytics  WHERE user_id = p_user_id;

  -- -----------------------------------------------------------------------
  -- C. Withdraw active listings (BUG-11: prevent orphaned listings)
  -- -----------------------------------------------------------------------
  UPDATE listings
  SET status     = 'withdrawn',
      deleted_at = now()
  WHERE user_id = p_user_id
    AND status = 'active';

  UPDATE seller_listings
  SET status = 'withdrawn'
  WHERE user_id = p_user_id
    AND status IN ('active', 'draft');

  -- -----------------------------------------------------------------------
  -- D. Pseudonymise messages and reviews (BUG-12)
  -- -----------------------------------------------------------------------
  UPDATE messages
  SET sender_id = NULL
  WHERE sender_id = p_user_id;

  UPDATE reviews
  SET reviewer_id = NULL
  WHERE reviewer_id = p_user_id;

  -- -----------------------------------------------------------------------
  -- E. Delete auth-related data
  -- -----------------------------------------------------------------------
  DELETE FROM user_backup_codes WHERE user_id = p_user_id;
  DELETE FROM consent_records   WHERE user_id = p_user_id;
  DELETE FROM user_roles        WHERE user_id = p_user_id;

  -- -----------------------------------------------------------------------
  -- F. Cancel active bookings and open service requests
  -- -----------------------------------------------------------------------
  UPDATE bookings
  SET status = 'cancelled'
  WHERE (user_id = p_user_id OR provider_id = p_user_id)
    AND status NOT IN ('completed', 'cancelled');

  UPDATE service_requests
  SET status = 'cancelled'
  WHERE user_id = p_user_id
    AND status = 'open';

  -- -----------------------------------------------------------------------
  -- G. Mark deletion request as completed
  -- -----------------------------------------------------------------------
  UPDATE deletion_requests
  SET status       = 'completed',
      completed_at = now()
  WHERE user_id = p_user_id
    AND status = 'pending';
END;
$$;


ALTER FUNCTION "public"."purge_deleted_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_search_listings"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY search_listings; END;
$$;


ALTER FUNCTION "public"."refresh_search_listings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reschedule_viewing"("p_viewing_id" "uuid", "p_new_slot_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_viewing  public.viewings;
  v_new_slot public.viewing_slots;
BEGIN
  SELECT * INTO v_viewing
  FROM public.viewings
  WHERE id = p_viewing_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
  END IF;

  SELECT * INTO v_new_slot
  FROM public.viewing_slots
  WHERE id = p_new_slot_id
  FOR UPDATE;

  IF v_new_slot.status <> 'available' THEN
    RETURN jsonb_build_object('success', false, 'error', 'SLOT_UNAVAILABLE');
  END IF;

  UPDATE public.viewing_slots
  SET status = 'available', updated_at = now()
  WHERE id = v_viewing.slot_id;

  UPDATE public.viewing_slots
  SET status = 'booked', updated_at = now()
  WHERE id = p_new_slot_id;

  UPDATE public.viewings
  SET status = 'rescheduled', slot_id = p_new_slot_id, updated_at = now()
  WHERE id = p_viewing_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."reschedule_viewing"("p_viewing_id" "uuid", "p_new_slot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."review_invoice_candidate"("p_id" "uuid", "p_reviewer" "uuid", "p_new_status" "text", "p_note" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_status text;
begin
  select status into v_status from invoice_candidates where id = p_id for update;
  if not found then
    raise exception 'invoice candidate not found: %', p_id;
  end if;
  if p_new_status = 'rejected' and (p_note is null or btrim(p_note) = '') then
    raise exception 'review note is required';
  end if;
  if not (
    (v_status = 'pending_review' and p_new_status in ('approved','rejected'))
    or (v_status = 'on_hold_branch_query' and p_new_status = 'pending_review')
    or (v_status = 'approved' and p_new_status = 'invoiced')
  ) then
    raise exception 'invalid transition: % -> %', v_status, p_new_status;
  end if;
  perform set_config('truedeed.review', 'on', true);
  update invoice_candidates
     set status = p_new_status,
         reviewed_by = p_reviewer,
         reviewed_at = now(),
         review_note = p_note
   where id = p_id;
  perform set_config('truedeed.review', '', true);
end $$;


ALTER FUNCTION "public"."review_invoice_candidate"("p_id" "uuid", "p_reviewer" "uuid", "p_new_status" "text", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_listings_by_polygon"("polygon_geojson" "text", "p_listing_type" "public"."listing_type" DEFAULT NULL::"public"."listing_type", "p_min_price" numeric DEFAULT NULL::numeric, "p_max_price" numeric DEFAULT NULL::numeric, "p_min_bedrooms" integer DEFAULT NULL::integer, "p_property_type" "public"."property_type" DEFAULT NULL::"public"."property_type", "p_limit" integer DEFAULT 20, "p_cursor" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("listing_id" "uuid", "property_id" "uuid", "listing_type" "public"."listing_type", "status" "public"."listing_status", "price" numeric, "property_type" "public"."property_type", "bedrooms" integer, "bathrooms" numeric, "city" "text", "postcode" "text", "epc_rating" character, "new_build" boolean, "listed_date" "date", "slug" "text", "thumbnail_url" "text", "title" "text", "address_line1" "text", "rent_frequency" "text", "price_qualifier" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE poly GEOMETRY;
BEGIN
  poly := ST_GeomFromGeoJSON(polygon_geojson);
  RETURN QUERY SELECT sl.listing_id, sl.property_id, sl.listing_type, sl.status, sl.price, sl.property_type, sl.bedrooms, sl.bathrooms, sl.city, sl.postcode, sl.epc_rating, sl.new_build, sl.listed_date, sl.slug, sl.thumbnail_url, sl.title, sl.address_line1, sl.rent_frequency, sl.price_qualifier FROM search_listings sl WHERE ST_Intersects(sl.coordinates::geometry, ST_Envelope(poly)) AND ST_Within(sl.coordinates::geometry, poly) AND (p_listing_type IS NULL OR sl.listing_type = p_listing_type) AND (p_min_price IS NULL OR sl.price >= p_min_price) AND (p_max_price IS NULL OR sl.price <= p_max_price) AND (p_min_bedrooms IS NULL OR sl.bedrooms >= p_min_bedrooms) AND (p_property_type IS NULL OR sl.property_type = p_property_type) AND (p_cursor IS NULL OR sl.listing_id > p_cursor) ORDER BY sl.listed_date DESC, sl.listing_id ASC LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."search_listings_by_polygon"("polygon_geojson" "text", "p_listing_type" "public"."listing_type", "p_min_price" numeric, "p_max_price" numeric, "p_min_bedrooms" integer, "p_property_type" "public"."property_type", "p_limit" integer, "p_cursor" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_listings_by_radius"("center_lat" double precision, "center_lng" double precision, "radius_meters" double precision, "p_listing_type" "public"."listing_type" DEFAULT NULL::"public"."listing_type", "p_min_price" numeric DEFAULT NULL::numeric, "p_max_price" numeric DEFAULT NULL::numeric, "p_min_bedrooms" integer DEFAULT NULL::integer, "p_property_type" "public"."property_type" DEFAULT NULL::"public"."property_type", "p_limit" integer DEFAULT 20, "p_cursor" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("listing_id" "uuid", "property_id" "uuid", "listing_type" "public"."listing_type", "status" "public"."listing_status", "price" numeric, "property_type" "public"."property_type", "bedrooms" integer, "bathrooms" numeric, "city" "text", "postcode" "text", "epc_rating" character, "new_build" boolean, "listed_date" "date", "slug" "text", "thumbnail_url" "text", "title" "text", "address_line1" "text", "rent_frequency" "text", "price_qualifier" "text", "distance_meters" double precision)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY SELECT sl.listing_id, sl.property_id, sl.listing_type, sl.status, sl.price, sl.property_type, sl.bedrooms, sl.bathrooms, sl.city, sl.postcode, sl.epc_rating, sl.new_build, sl.listed_date, sl.slug, sl.thumbnail_url, sl.title, sl.address_line1, sl.rent_frequency, sl.price_qualifier, ST_Distance(sl.coordinates, ST_MakePoint(center_lng, center_lat)::geography) AS distance_meters FROM search_listings sl WHERE ST_DWithin(sl.coordinates, ST_MakePoint(center_lng, center_lat)::geography, radius_meters) AND (p_listing_type IS NULL OR sl.listing_type = p_listing_type) AND (p_min_price IS NULL OR sl.price >= p_min_price) AND (p_max_price IS NULL OR sl.price <= p_max_price) AND (p_min_bedrooms IS NULL OR sl.bedrooms >= p_min_bedrooms) AND (p_property_type IS NULL OR sl.property_type = p_property_type) AND (p_cursor IS NULL OR sl.listing_id > p_cursor) ORDER BY distance_meters ASC, sl.listing_id ASC LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."search_listings_by_radius"("center_lat" double precision, "center_lng" double precision, "radius_meters" double precision, "p_listing_type" "public"."listing_type", "p_min_price" numeric, "p_max_price" numeric, "p_min_bedrooms" integer, "p_property_type" "public"."property_type", "p_limit" integer, "p_cursor" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_providers"("p_service_category" "public"."service_category" DEFAULT NULL::"public"."service_category", "p_postcode" "text" DEFAULT NULL::"text", "p_lat" double precision DEFAULT NULL::double precision, "p_lng" double precision DEFAULT NULL::double precision, "p_radius_miles" integer DEFAULT 25, "p_min_rating" numeric DEFAULT NULL::numeric, "p_search_query" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("provider_id" "uuid", "business_name" "text", "business_description" "text", "services" "public"."service_category"[], "average_rating" numeric, "review_count" bigint, "distance_miles" numeric, "slug" "text", "avatar_url" "text", "years_in_business" integer, "completed_jobs_count" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$ DECLARE search_location GEOGRAPHY; radius_meters INTEGER; BEGIN radius_meters := p_radius_miles * 1609; IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN search_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography; END IF; RETURN QUERY SELECT spd.user_id, spd.business_name, spd.business_description, spd.services, COALESCE(prs.average_rating, 0::NUMERIC), COALESCE(prs.total_reviews, 0::BIGINT), CASE WHEN search_location IS NOT NULL AND spd.base_location IS NOT NULL THEN ROUND((ST_Distance(spd.base_location, search_location) / 1609)::NUMERIC, 1) ELSE NULL END, spd.slug, p.avatar_url, spd.years_in_business, spd.completed_jobs_count FROM service_provider_details spd JOIN profiles p ON spd.user_id = p.id LEFT JOIN provider_rating_stats prs ON spd.user_id = prs.provider_id WHERE p.provider_verification_status = 'verified' AND p.deleted_at IS NULL AND (p_service_category IS NULL OR p_service_category = ANY(spd.services)) AND (search_location IS NULL OR spd.base_location IS NULL OR ST_DWithin(spd.base_location, search_location, radius_meters) OR p_postcode = ANY(spd.service_postcodes)) AND (p_min_rating IS NULL OR COALESCE(prs.average_rating, 0) >= p_min_rating) AND (p_search_query IS NULL OR to_tsvector('english', COALESCE(spd.business_name, '') || ' ' || COALESCE(spd.business_description, '')) @@ plainto_tsquery('english', p_search_query)) ORDER BY CASE WHEN p_postcode = ANY(spd.service_postcodes) THEN 0 ELSE 1 END, CASE WHEN search_location IS NOT NULL AND spd.base_location IS NOT NULL THEN ST_Distance(spd.base_location, search_location) ELSE 999999999 END, COALESCE(prs.average_rating, 0) DESC, COALESCE(prs.total_reviews, 0) DESC LIMIT p_limit OFFSET p_offset; END; $$;


ALTER FUNCTION "public"."search_providers"("p_service_category" "public"."service_category", "p_postcode" "text", "p_lat" double precision, "p_lng" double precision, "p_radius_miles" integer, "p_min_rating" numeric, "p_search_query" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."select_roles_atomic"("p_user_id" "uuid", "p_roles" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  DECLARE r text;
  BEGIN
    FOREACH r IN ARRAY p_roles LOOP INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, r::user_role) ON CONFLICT (user_id, role) DO NOTHING; END LOOP;
    UPDATE public.profiles SET active_role = p_roles[1]::user_role WHERE id = p_user_id;
    INSERT INTO public.auth_audit_log (user_id, event_type, event_details) VALUES (p_user_id, 'roles_selected', jsonb_build_object('roles', to_jsonb(p_roles)));
  END; $$;


ALTER FUNCTION "public"."select_roles_atomic"("p_user_id" "uuid", "p_roles" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_property_coordinates"("p_property_id" "uuid", "p_lng" double precision, "p_lat" double precision) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE properties
  SET coordinates = ST_MakePoint(p_lng, p_lat)::geography
  WHERE id = p_property_id;
END;
$$;


ALTER FUNCTION "public"."set_property_coordinates"("p_property_id" "uuid", "p_lng" double precision, "p_lat" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."switch_role_atomic"("p_user_id" "uuid", "p_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  DECLARE v_old_role text;
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = p_role::user_role) THEN RAISE EXCEPTION 'User does not have the requested role'; END IF;
    SELECT active_role::text INTO v_old_role FROM public.profiles WHERE id = p_user_id;
    UPDATE public.profiles SET active_role = p_role::user_role WHERE id = p_user_id;
    INSERT INTO public.auth_audit_log (user_id, event_type, event_details) VALUES (p_user_id, 'role_switched', jsonb_build_object('old_role', v_old_role, 'new_role', p_role));
  END; $$;


ALTER FUNCTION "public"."switch_role_atomic"("p_user_id" "uuid", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_price_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO price_history (listing_id, old_price, new_price, changed_by) VALUES (NEW.id, OLD.price, NEW.price, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_price_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transition_introduction"("p_id" "uuid", "p_new_status" "text", "p_reason" "text", "p_actor" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_current text;
begin
  select status into v_current
    from introduction_status_history
   where introduction_id = p_id
   order by created_at desc, id desc
   limit 1;
  if v_current is null then
    v_current := 'active';
  end if;

  if not (
    (v_current = 'active' and p_new_status in
      ('rebutted','cancelled_manifest_error','expired',
       'converted_sstc','converted_exchanged','converted_completed'))
    or (v_current = 'converted_sstc' and p_new_status in
      ('active','converted_exchanged','converted_completed','expired'))
    or (v_current = 'converted_exchanged' and p_new_status in
      ('active','converted_completed','expired'))
  ) then
    raise exception 'invalid transition: % -> %', v_current, p_new_status;
  end if;

  insert into introduction_status_history (introduction_id, status, reason, actor)
  values (p_id, p_new_status, p_reason, p_actor);
end $$;


ALTER FUNCTION "public"."transition_introduction"("p_id" "uuid", "p_new_status" "text", "p_reason" "text", "p_actor" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transition_invoice"("p_id" "uuid", "p_event" "text", "p_days_overdue" integer DEFAULT NULL::integer, "p_actor" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_state text;
  v_before text;
  v_new text;
begin
  select state, state_before_dispute into v_state, v_before
    from invoices where id = p_id for update;
  if not found then
    raise exception 'invoice not found: %', p_id;
  end if;

  v_new := case
    -- I+14: first DD collection attempt
    when v_state = 'open' and p_event = 'collection_started'
      then 'collecting'
    -- dunning day 0
    when v_state = 'collecting' and p_event = 'payment_failed'
      then 'overdue'
    -- D+14: formal notice
    when v_state = 'overdue' and p_event = 'day_tick'
         and coalesce(p_days_overdue, 0) >= 14
      then 'final_notice'
    -- D+21: clause 11.1(a) suspension
    when v_state = 'final_notice' and p_event = 'day_tick'
         and coalesce(p_days_overdue, 0) >= 21
      then 'suspended'
    -- payment received at any point during collection/dunning
    when v_state in ('collecting','overdue','final_notice','suspended')
         and p_event = 'payment_confirmed'
      then 'paid'
    -- clause 8.6: debt survives a chargeback (ops-only recovery path)
    when v_state = 'paid' and p_event = 'charged_back'
      then 'charged_back'
    -- dispute freezes the dunning clock wherever it stands
    when v_state in ('open','collecting','overdue','final_notice','suspended')
         and p_event = 'dispute_raised'
      then 'disputed'
    -- rejected: clock resumes where it stopped
    when v_state = 'disputed' and p_event = 'dispute_resolved-rejected'
      then coalesce(v_before, 'open')
    -- upheld: invoice is written off
    when v_state = 'disputed' and p_event = 'dispute_resolved-upheld'
      then 'cancelled'
    else null
  end;

  if v_new is null then
    raise exception 'invalid dunning transition: % on state %', p_event, v_state;
  end if;

  perform set_config('truedeed.billing', 'on', true);
  update invoices
     set state = v_new,
         paid_at = case when v_new = 'paid' then now() else paid_at end,
         state_before_dispute = case
           when p_event = 'dispute_raised' then v_state
           when p_event = 'dispute_resolved-rejected' then null
           else state_before_dispute
         end
   where id = p_id;
  perform set_config('truedeed.billing', '', true);

  insert into invoice_events (invoice_id, event_type, detail)
  values (p_id, p_event,
          jsonb_strip_nulls(jsonb_build_object(
            'from', v_state,
            'to', v_new,
            'days_overdue', p_days_overdue,
            'actor', p_actor)));
end $$;


ALTER FUNCTION "public"."transition_invoice"("p_id" "uuid", "p_event" "text", "p_days_overdue" integer, "p_actor" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."truedeed_fill_invoice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.invoice_number is null then
    new.invoice_number := public.next_invoice_number();
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."truedeed_fill_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."truedeed_forbid_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  raise exception 'append-only table: % blocked on %', tg_op, tg_table_name;
end $$;


ALTER FUNCTION "public"."truedeed_forbid_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."truedeed_introductions_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if tg_op = 'DELETE' then
    raise exception 'append-only table: DELETE blocked on introductions';
  end if;

  -- Controlled path 1: one-shot notification stamp (mark_introduction_notified)
  if current_setting('truedeed.allow_notify', true) = 'on'
     and old.notified_at is null and old.rebuttal_deadline is null
     and new.notified_at is not null and new.rebuttal_deadline is not null
     and new.id = old.id
     and new.applicant_id is not distinct from old.applicant_id
     and new.applicant_name = old.applicant_name
     and new.applicant_email = old.applicant_email
     and new.listing_id = old.listing_id
     and new.agent_id = old.agent_id
     and new.branch_id is not distinct from old.branch_id
     and new.first_contact_type = old.first_contact_type
     and new.occurred_at = old.occurred_at
     and new.tail_expires_at = old.tail_expires_at
     and new.prev_hash is not distinct from old.prev_hash
     and new.row_hash = old.row_hash then
    return new;
  end if;

  -- Controlled path 2: GDPR erasure of applicant PII (gdpr_scrub_introductions)
  if current_setting('truedeed.gdpr_scrub', true) = 'on'
     and new.applicant_id is null
     and new.applicant_name = '[erased]'
     and new.applicant_email = '[erased]'
     and new.id = old.id
     and new.listing_id = old.listing_id
     and new.agent_id = old.agent_id
     and new.branch_id is not distinct from old.branch_id
     and new.first_contact_type = old.first_contact_type
     and new.occurred_at = old.occurred_at
     and new.notified_at is not distinct from old.notified_at
     and new.rebuttal_deadline is not distinct from old.rebuttal_deadline
     and new.tail_expires_at = old.tail_expires_at
     and new.prev_hash is not distinct from old.prev_hash
     and new.row_hash = old.row_hash then
    return new;
  end if;

  raise exception 'append-only table: UPDATE blocked on introductions';
end $$;


ALTER FUNCTION "public"."truedeed_introductions_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."truedeed_invoice_candidates_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if tg_op = 'DELETE' then
    raise exception 'append-only table: DELETE blocked on invoice_candidates';
  end if;
  if current_setting('truedeed.review', true) = 'on'
     and new.id = old.id
     and new.source = old.source
     and new.introduction_id = old.introduction_id
     and new.reported_outcome_id is not distinct from old.reported_outcome_id
     and new.ppd_match_id is not distinct from old.ppd_match_id
     and new.amount_pence = old.amount_pence
     and new.vat_pence = old.vat_pence
     and new.created_at = old.created_at then
    return new;
  end if;
  raise exception 'append-only table: UPDATE blocked on invoice_candidates';
end $$;


ALTER FUNCTION "public"."truedeed_invoice_candidates_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."truedeed_invoice_disputes_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if tg_op = 'DELETE' then
    raise exception 'append-only table: DELETE blocked on invoice_disputes';
  end if;

  if current_setting('truedeed.dispute_decide', true) = 'on'
     and old.status = 'open'
     and new.status in ('conceded','rejected')
     and new.category is not null
     and new.decided_by is not null
     and new.decided_at is not null
     and new.decision_reason is not null
     and new.id = old.id
     and new.invoice_id = old.invoice_id
     and new.raised_by is not distinct from old.raised_by
     and new.grounds = old.grounds
     and new.evidence_storage_paths = old.evidence_storage_paths
     and new.raised_at = old.raised_at
     and new.properly_raised = old.properly_raised then
    return new;
  end if;

  if current_setting('truedeed.dispute_scrub', true) = 'on'
     and new.raised_by is null
     and new.grounds = '[erased]'
     and new.evidence_storage_paths = '{}'::text[]
     and new.id = old.id
     and new.invoice_id = old.invoice_id
     and new.status = old.status
     and new.category is not distinct from old.category
     and new.decided_by is not distinct from old.decided_by
     and new.decided_at is not distinct from old.decided_at
     and new.decision_reason is not distinct from old.decision_reason
     and new.raised_at = old.raised_at
     and new.properly_raised = old.properly_raised then
    return new;
  end if;

  raise exception 'append-only table: UPDATE blocked on invoice_disputes';
end $$;


ALTER FUNCTION "public"."truedeed_invoice_disputes_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."truedeed_invoices_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.state is distinct from old.state
     and current_setting('truedeed.billing', true) is distinct from 'on' then
    raise exception 'state changes only via transition_invoice';
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."truedeed_invoices_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."truedeed_rebuttals_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if tg_op = 'DELETE' then
    raise exception 'append-only table: DELETE blocked on rebuttals';
  end if;
  if current_setting('truedeed.decide', true) = 'on'
     and old.decision is null
     and new.decision is not null
     and new.id = old.id
     and new.introduction_id = old.introduction_id
     and new.submitted_by = old.submitted_by
     and new.submitted_at = old.submitted_at
     and new.evidence_storage_paths = old.evidence_storage_paths
     and new.evidence_dated_at = old.evidence_dated_at then
    return new;
  end if;
  raise exception 'append-only table: UPDATE blocked on rebuttals';
end $$;


ALTER FUNCTION "public"."truedeed_rebuttals_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."truedeed_set_intro_hash"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare prev text;
begin
  perform pg_advisory_xact_lock(hashtext('truedeed_introductions_chain'));
  select i.row_hash into prev
    from public.introductions i
   order by i.occurred_at desc, i.id desc
   limit 1;
  new.prev_hash := prev;
  new.tail_expires_at := coalesce(new.tail_expires_at, new.occurred_at + interval '6 months');
  new.row_hash := encode(sha256(convert_to(
    coalesce(prev, 'genesis') || new.id::text || new.applicant_id::text ||
    new.listing_id::text || new.first_contact_type ||
    to_char(new.occurred_at, 'YYYY-MM-DD"T"HH24:MI:SS.US'),
  'utf8')), 'hex');
  return new;
end $$;


ALTER FUNCTION "public"."truedeed_set_intro_hash"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_certificates_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_certificates_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_completed_jobs_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN UPDATE service_provider_details SET completed_jobs_count = completed_jobs_count + 1 WHERE user_id = NEW.provider_id; END IF; RETURN NEW; END; $$;


ALTER FUNCTION "public"."update_completed_jobs_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_payment_schedules_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_payment_schedules_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ppd_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."update_ppd_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_properties_tsv"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.description_tsv := setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') || setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') || setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_properties_tsv"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_provider_rating_stats_incremental"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN IF NEW.moderation_status = 'approved' AND (OLD IS NULL OR OLD.moderation_status != 'approved') THEN INSERT INTO provider_rating_stats (provider_id, average_rating, total_reviews, last_review_date) VALUES (NEW.provider_id, NEW.overall_rating, 1, NOW()) ON CONFLICT (provider_id) DO UPDATE SET average_rating = (provider_rating_stats.average_rating * provider_rating_stats.total_reviews + NEW.overall_rating) / (provider_rating_stats.total_reviews + 1), total_reviews = provider_rating_stats.total_reviews + 1, avg_punctuality = CASE WHEN NEW.punctuality_rating IS NOT NULL THEN (provider_rating_stats.avg_punctuality * provider_rating_stats.total_reviews + NEW.punctuality_rating) / (provider_rating_stats.total_reviews + 1) ELSE provider_rating_stats.avg_punctuality END, avg_quality = CASE WHEN NEW.quality_rating IS NOT NULL THEN (provider_rating_stats.avg_quality * provider_rating_stats.total_reviews + NEW.quality_rating) / (provider_rating_stats.total_reviews + 1) ELSE provider_rating_stats.avg_quality END, avg_value = CASE WHEN NEW.value_rating IS NOT NULL THEN (provider_rating_stats.avg_value * provider_rating_stats.total_reviews + NEW.value_rating) / (provider_rating_stats.total_reviews + 1) ELSE provider_rating_stats.avg_value END, avg_professionalism = CASE WHEN NEW.professionalism_rating IS NOT NULL THEN (provider_rating_stats.avg_professionalism * provider_rating_stats.total_reviews + NEW.professionalism_rating) / (provider_rating_stats.total_reviews + 1) ELSE provider_rating_stats.avg_professionalism END, count_5_star = provider_rating_stats.count_5_star + CASE WHEN NEW.overall_rating = 5 THEN 1 ELSE 0 END, count_4_star = provider_rating_stats.count_4_star + CASE WHEN NEW.overall_rating = 4 THEN 1 ELSE 0 END, count_3_star = provider_rating_stats.count_3_star + CASE WHEN NEW.overall_rating = 3 THEN 1 ELSE 0 END, count_2_star = provider_rating_stats.count_2_star + CASE WHEN NEW.overall_rating = 2 THEN 1 ELSE 0 END, count_1_star = provider_rating_stats.count_1_star + CASE WHEN NEW.overall_rating = 1 THEN 1 ELSE 0 END, last_review_date = NOW(), updated_at = NOW(); END IF; RETURN NEW; END; $$;


ALTER FUNCTION "public"."update_provider_rating_stats_incremental"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';


CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
)
PARTITION BY RANGE ("created_at");


ALTER TABLE "public"."activity_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."activity_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."activity_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."activity_log_id_seq" OWNED BY "public"."activity_log"."id";


SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_log_2026_03" (
    "id" bigint DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log_2026_03" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log_2026_04" (
    "id" bigint DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log_2026_04" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log_2026_05" (
    "id" bigint DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log_2026_05" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log_2026_06" (
    "id" bigint DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log_2026_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log_2026_07" (
    "id" bigint DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log_2026_07" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log_2026_08" (
    "id" bigint DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log_2026_08" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log_2026_09" (
    "id" bigint DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log_2026_09" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log_2026_10" (
    "id" bigint DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log_2026_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log_2026_11" (
    "id" bigint DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log_2026_11" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log_2026_12" (
    "id" bigint DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log_2026_12" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log_2027_01" (
    "id" bigint DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log_2027_01" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log_2027_02" (
    "id" bigint DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log_2027_02" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "text" NOT NULL,
    "metadata" "jsonb",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "success" boolean,
    "error_message" "text"
);


ALTER TABLE "public"."admin_audit_log" OWNER TO "postgres";


COMMENT ON COLUMN "public"."admin_audit_log"."success" IS 'Whether the audited action succeeded. NULL = legacy entry.';



COMMENT ON COLUMN "public"."admin_audit_log"."error_message" IS 'Error message if the action failed. NULL = success or legacy entry.';



CREATE TABLE IF NOT EXISTS "public"."agencies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "address" "text",
    "registration_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "companies_house_no" character(8),
    "company_status" "text",
    "company_sic_codes" "text"[],
    "director_name" "text",
    "ch_verified_at" timestamp with time zone,
    "vat_number" "text",
    "hmrc_aml_reference" "text",
    "hmrc_aml_verified" boolean DEFAULT false
);


ALTER TABLE "public"."agencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_agency_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "agency_name" "text" NOT NULL,
    "contact_email" "text",
    "contact_phone" "text",
    "address_line_1" "text",
    "address_line_2" "text",
    "city" "text",
    "postcode" "text",
    "description" "text",
    "specializations" "text"[] DEFAULT '{}'::"text"[],
    "coverage_areas" "text"[] DEFAULT '{}'::"text"[],
    "logo_url" "text",
    "brand_primary_colour" "text",
    "brand_secondary_colour" "text",
    "social_facebook" "text",
    "social_twitter" "text",
    "social_instagram" "text",
    "social_linkedin" "text",
    "website_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text",
    "display_name" "text",
    "bio" "text",
    "role" "text",
    "user_id" "uuid",
    "agency_id" "uuid",
    "company_number" "text",
    "gocardless_customer_id" "text",
    "gocardless_mandate_id" "text",
    "mandate_status" "text",
    "billing_suspended_at" timestamp with time zone,
    CONSTRAINT "agent_agency_profiles_mandate_status_check" CHECK (("mandate_status" = ANY (ARRAY['pending'::"text", 'submitted'::"text", 'active'::"text", 'failed'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."agent_agency_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_api_keys" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "key_hash" "text" NOT NULL,
    "key_prefix" "text" NOT NULL,
    "name" "text" NOT NULL,
    "rate_limit_per_minute" integer DEFAULT 60,
    "last_used_at" timestamp with time zone,
    "usage_count" bigint DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."agent_api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_branches" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address_line_1" "text",
    "address_line_2" "text",
    "city" "text",
    "postcode" "text",
    "phone" "text",
    "email" "text",
    "is_head_office" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agent_branches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_commissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "sale_price" bigint NOT NULL,
    "commission_rate" numeric(5,2) NOT NULL,
    "commission_amount" bigint NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_commissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'invoiced'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."agent_commissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_crm_clients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "client_type" "text" DEFAULT 'buyer'::"text" NOT NULL,
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "last_contact_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_crm_clients_client_type_check" CHECK (("client_type" = ANY (ARRAY['buyer'::"text", 'seller'::"text", 'landlord'::"text", 'tenant'::"text"])))
);


ALTER TABLE "public"."agent_crm_clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_enquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "listing_id" "uuid",
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'sent'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "agent_enquiries_status_check" CHECK (("status" = ANY (ARRAY['sent'::"text", 'responded'::"text", 'booked'::"text"])))
);


ALTER TABLE "public"."agent_enquiries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_feed_integrations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "api_key_encrypted" "text",
    "webhook_url" "text",
    "sync_status" "text" DEFAULT 'disconnected'::"text" NOT NULL,
    "last_sync_at" timestamp with time zone,
    "field_mapping" "jsonb" DEFAULT '{}'::"jsonb",
    "error_log" "jsonb"[] DEFAULT '{}'::"jsonb"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_feed_integrations_provider_check" CHECK (("provider" = ANY (ARRAY['reapit'::"text", 'alto'::"text", 'jupix'::"text"]))),
    CONSTRAINT "agent_feed_integrations_sync_status_check" CHECK (("sync_status" = ANY (ARRAY['disconnected'::"text", 'connected'::"text", 'syncing'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."agent_feed_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_lead_activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agent_lead_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_leads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "property_id" "uuid",
    "contact_name" "text" NOT NULL,
    "contact_email" "text",
    "contact_phone" "text",
    "stage" "text" DEFAULT 'new_enquiry'::"text" NOT NULL,
    "source" "text" DEFAULT 'other'::"text" NOT NULL,
    "assigned_to" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_leads_source_check" CHECK (("source" = ANY (ARRAY['website'::"text", 'portal'::"text", 'phone'::"text", 'walk_in'::"text", 'referral'::"text", 'other'::"text"]))),
    CONSTRAINT "agent_leads_stage_check" CHECK (("stage" = ANY (ARRAY['new_enquiry'::"text", 'qualified'::"text", 'viewing_booked'::"text", 'offer_made'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."agent_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_offer_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "offer_id" "uuid" NOT NULL,
    "previous_status" "text",
    "new_status" "text" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agent_offer_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_offers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "lead_id" "uuid",
    "buyer_name" "text" NOT NULL,
    "buyer_email" "text",
    "buyer_phone" "text",
    "amount" bigint NOT NULL,
    "conditions" "text",
    "solicitor_details" "jsonb" DEFAULT '{}'::"jsonb",
    "aip_status" "text" DEFAULT 'not_provided'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "counter_amount" bigint,
    "vendor_notified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_offers_aip_status_check" CHECK (("aip_status" = ANY (ARRAY['not_provided'::"text", 'provided'::"text", 'verified'::"text"]))),
    CONSTRAINT "agent_offers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'countered'::"text", 'withdrawn'::"text"])))
);


ALTER TABLE "public"."agent_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_profiles" (
    "id" "uuid" NOT NULL,
    "agency_name" "text" DEFAULT ''::"text" NOT NULL,
    "areas_covered" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "fee_percentage" numeric(4,2),
    "average_rating" numeric(3,2),
    "review_count" integer DEFAULT 0 NOT NULL,
    "sold_count" integer DEFAULT 0 NOT NULL,
    "average_days_to_sell" integer,
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text",
    "entity_type" "text",
    "professional_title" "text",
    "years_experience" integer,
    "transactions_count" "text",
    "languages_spoken" "text"[],
    "specialties" "text"[],
    "phone_uk" "text",
    "website_url" "text",
    "office_address" "jsonb",
    "photo_url" "text",
    CONSTRAINT "agent_profiles_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['ltd_company'::"text", 'sole_trader'::"text"])))
);


ALTER TABLE "public"."agent_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_sale_progressions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "offer_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "stage" "text" DEFAULT 'offer_accepted'::"text" NOT NULL,
    "expected_completion_date" "date",
    "solicitor_buyer" "jsonb" DEFAULT '{}'::"jsonb",
    "solicitor_seller" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_sale_progressions_stage_check" CHECK (("stage" = ANY (ARRAY['offer_accepted'::"text", 'memorandum_of_sale'::"text", 'solicitors_instructed'::"text", 'searches'::"text", 'survey'::"text", 'mortgage'::"text", 'exchange'::"text", 'completion'::"text"])))
);


ALTER TABLE "public"."agent_sale_progressions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_team_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "branch_id" "uuid",
    "role" "text" DEFAULT 'negotiator'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "email" "text",
    "name" "text",
    "invited_at" timestamp with time zone DEFAULT "now"(),
    "joined_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_team_members_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'senior_negotiator'::"text", 'negotiator'::"text", 'lettings_manager'::"text", 'viewer'::"text"]))),
    CONSTRAINT "agent_team_members_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."agent_team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_vendor_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "report_type" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "pdf_url" "text",
    CONSTRAINT "agent_vendor_reports_report_type_check" CHECK (("report_type" = ANY (ARRAY['listing_performance'::"text", 'viewing_summary'::"text", 'market_analysis'::"text"])))
);


ALTER TABLE "public"."agent_vendor_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_viewing_feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "viewing_slot_id" "uuid" NOT NULL,
    "buyer_name" "text",
    "interest_level" integer,
    "price_opinion" "text",
    "likelihood_to_offer" "text",
    "comments" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_viewing_feedback_interest_level_check" CHECK ((("interest_level" >= 1) AND ("interest_level" <= 5))),
    CONSTRAINT "agent_viewing_feedback_likelihood_to_offer_check" CHECK (("likelihood_to_offer" = ANY (ARRAY['unlikely'::"text", 'possible'::"text", 'likely'::"text", 'very_likely'::"text"]))),
    CONSTRAINT "agent_viewing_feedback_price_opinion_check" CHECK (("price_opinion" = ANY (ARRAY['too_high'::"text", 'about_right'::"text", 'good_value'::"text"])))
);


ALTER TABLE "public"."agent_viewing_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_viewing_slots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "is_booked" boolean DEFAULT false,
    "booked_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agent_viewing_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_match_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "location" "text",
    "budget_min" integer,
    "budget_max" integer,
    "bedrooms_min" integer,
    "bedrooms_max" integer,
    "must_haves" "text"[],
    "lifestyle_factors" "jsonb" DEFAULT '{}'::"jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_match_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_match_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "match_score" numeric(4,3) NOT NULL,
    "match_reasons" "jsonb" DEFAULT '[]'::"jsonb",
    "computed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval) NOT NULL,
    CONSTRAINT "ai_match_results_match_score_check" CHECK ((("match_score" >= (0)::numeric) AND ("match_score" <= (1)::numeric)))
);


ALTER TABLE "public"."ai_match_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_rating_stats" (
    "provider_id" "uuid" NOT NULL,
    "average_rating" numeric(3,2) DEFAULT 0,
    "total_reviews" bigint DEFAULT 0,
    "avg_punctuality" numeric(3,2) DEFAULT 0,
    "avg_quality" numeric(3,2) DEFAULT 0,
    "avg_value" numeric(3,2) DEFAULT 0,
    "avg_professionalism" numeric(3,2) DEFAULT 0,
    "count_5_star" integer DEFAULT 0,
    "count_4_star" integer DEFAULT 0,
    "count_3_star" integer DEFAULT 0,
    "count_2_star" integer DEFAULT 0,
    "count_1_star" integer DEFAULT 0,
    "total_helpful_votes" bigint DEFAULT 0,
    "reviews_with_responses" integer DEFAULT 0,
    "response_rate" numeric(5,2) DEFAULT 0,
    "last_review_date" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."provider_rating_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_provider_details" (
    "user_id" "uuid" NOT NULL,
    "business_name" "text" NOT NULL,
    "business_description" "text",
    "trading_name" "text",
    "company_number" "text",
    "vat_number" "text",
    "services" "public"."service_category"[] DEFAULT '{}'::"public"."service_category"[] NOT NULL,
    "service_postcodes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "service_radius" integer DEFAULT 25,
    "base_location" "public"."geography"(Point,4326),
    "pricing" "jsonb" DEFAULT '{}'::"jsonb",
    "qualifications" "text"[],
    "accreditations" "text"[],
    "insurance_details" "jsonb",
    "portfolio_urls" "text"[],
    "slug" "text" NOT NULL,
    "website_url" "text",
    "years_in_business" integer DEFAULT 0,
    "completed_jobs_count" integer DEFAULT 0,
    "response_time_hours" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "trust_score" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."service_provider_details" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."area_rating_stats" AS
 SELECT "split_part"("pc"."val", ' '::"text", 1) AS "area_code",
    ("svc"."val")::"text" AS "trade_category",
    ("avg"("prs"."average_rating"))::numeric(3,2) AS "avg_rating",
    ("sum"("prs"."total_reviews"))::bigint AS "total_reviews",
    ("count"(DISTINCT "prs"."provider_id"))::integer AS "total_providers",
    ("array_agg"("prs"."provider_id" ORDER BY "prs"."average_rating" DESC))[1] AS "top_provider_id"
   FROM ((("public"."provider_rating_stats" "prs"
     JOIN "public"."service_provider_details" "spd" ON (("spd"."user_id" = "prs"."provider_id")))
     CROSS JOIN LATERAL "unnest"("spd"."service_postcodes") "pc"("val"))
     CROSS JOIN LATERAL "unnest"("spd"."services") "svc"("val"))
  WHERE (("prs"."total_reviews" > 0) AND ("spd"."service_postcodes" IS NOT NULL) AND ("array_length"("spd"."service_postcodes", 1) > 0))
  GROUP BY ("split_part"("pc"."val", ' '::"text", 1)), ("svc"."val")::"text"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."area_rating_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_audit_log" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_details" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_audit_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."auth_audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."auth_audit_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."auth_audit_log_id_seq" OWNED BY "public"."auth_audit_log"."id";



CREATE TABLE IF NOT EXISTS "public"."billing_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stripe_event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "payload" "jsonb",
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."billing_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_state_transitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_status" "public"."booking_status" NOT NULL,
    "to_status" "public"."booking_status" NOT NULL,
    "allowed_by" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "requires_reason" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."booking_state_transitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "from_status" "public"."booking_status",
    "to_status" "public"."booking_status" NOT NULL,
    "changed_by" "uuid",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."booking_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_request_id" "uuid",
    "quote_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "booking_reference" "text",
    "scheduled_start_date" "date" NOT NULL,
    "scheduled_end_date" "date" NOT NULL,
    "actual_start_date" "date",
    "actual_end_date" "date",
    "status" "public"."booking_status" DEFAULT 'pending_confirmation'::"public"."booking_status" NOT NULL,
    "cancellation_reason" "text",
    "cancelled_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bookings_dates_valid" CHECK (("scheduled_end_date" >= "scheduled_start_date"))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."broadband_coverage" (
    "postcode" "text" NOT NULL,
    "sfbb_pct" numeric(5,2),
    "ufbb_pct" numeric(5,2),
    "gigabit_pct" numeric(5,2),
    "below_uso_pct" numeric(5,2),
    "source" "text" DEFAULT 'ofcom-cn2025'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."broadband_coverage" OWNER TO "postgres";


COMMENT ON TABLE "public"."broadband_coverage" IS 'Ofcom Connected Nations 2025 fixed-broadband availability by postcode (% of premises per tier). Source: Ofcom, OGL v3.0.';



CREATE TABLE IF NOT EXISTS "public"."business_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "utr_number" character(10),
    "trading_name" "text",
    "trading_address" "jsonb",
    "vat_number" "text",
    "hmrc_aml_reference" "text",
    "hmrc_aml_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."business_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certificates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "provider_id" "uuid" NOT NULL,
    "certificate_type" "text" NOT NULL,
    "certificate_number" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "issued_at" "date" DEFAULT CURRENT_DATE NOT NULL,
    "expires_at" "date",
    "file_path" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "certificates_certificate_type_check" CHECK (("certificate_type" = ANY (ARRAY['gas_safe_cp12'::"text", 'eic'::"text", 'eicr'::"text", 'minor_works'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."certificates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chain_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upstream_progression_id" "uuid" NOT NULL,
    "downstream_progression_id" "uuid" NOT NULL,
    "position_in_chain" integer DEFAULT 1 NOT NULL,
    "chain_group_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chain_links_no_self_link" CHECK (("upstream_progression_id" <> "downstream_progression_id"))
);


ALTER TABLE "public"."chain_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chain_risk_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "progression_id" "uuid" NOT NULL,
    "chain_group_id" "uuid" NOT NULL,
    "risk_level" "text" DEFAULT 'low'::"text" NOT NULL,
    "risk_score" integer DEFAULT 0 NOT NULL,
    "chain_length" integer DEFAULT 1 NOT NULL,
    "chain_position" integer DEFAULT 1 NOT NULL,
    "slowest_link_id" "uuid",
    "slowest_link_days" integer DEFAULT 0,
    "factors" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "computed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chain_risk_scores_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."chain_risk_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cms_articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "article_type" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "excerpt" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "seo_title" "text",
    "seo_description" "text",
    "og_image_url" "text",
    "author_id" "uuid",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cms_articles_article_type_check" CHECK (("article_type" = ANY (ARRAY['blog'::"text", 'help'::"text", 'landing'::"text"]))),
    CONSTRAINT "cms_articles_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."cms_articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_cron_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "properties_checked" integer DEFAULT 0 NOT NULL,
    "emails_queued" integer DEFAULT 0 NOT NULL,
    "emails_skipped_already_sent" integer DEFAULT 0 NOT NULL,
    "error_count" integer DEFAULT 0 NOT NULL,
    "error_details" "jsonb"
);


ALTER TABLE "public"."compliance_cron_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_audit_log" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "consent_type" "text" NOT NULL,
    "old_value" boolean,
    "new_value" boolean NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."consent_audit_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."consent_audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."consent_audit_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."consent_audit_log_id_seq" OWNED BY "public"."consent_audit_log"."id";



CREATE TABLE IF NOT EXISTS "public"."consent_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "consent_type" "text" NOT NULL,
    "granted" boolean DEFAULT false NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "consent_records_consent_type_check" CHECK (("consent_type" = ANY (ARRAY['marketing'::"text", 'analytics'::"text", 'third_party'::"text"])))
);


ALTER TABLE "public"."consent_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "resolved_by" "uuid",
    "resolution_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    CONSTRAINT "content_reports_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['listing'::"text", 'review'::"text"]))),
    CONSTRAINT "content_reports_reason_check" CHECK (("char_length"("reason") <= 500)),
    CONSTRAINT "content_reports_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'resolved'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."content_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_read_status" (
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "last_read_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."conversation_read_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "participant_1_id" "uuid" NOT NULL,
    "participant_2_id" "uuid" NOT NULL,
    "context_type" "text" NOT NULL,
    "context_id" "uuid",
    "last_message_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "conversations_context_type_check" CHECK (("context_type" = ANY (ARRAY['listing'::"text", 'booking'::"text", 'rfq'::"text", 'general'::"text"]))),
    CONSTRAINT "no_self_conversation" CHECK (("participant_1_id" <> "participant_2_id"))
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deletion_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "scheduled_purge_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "purged_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "deletion_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."deletion_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deposit_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenancy_id" "uuid",
    "scheme" "text",
    "certificate_number" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "registered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deposit_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "target_roles" "text"[],
    "status" "text" DEFAULT 'draft'::"text",
    "scheduled_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "recipient_count" integer,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'sent'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."email_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "template" "text" NOT NULL,
    "recipient" "text" NOT NULL,
    "resend_id" "text",
    "status" "text" DEFAULT 'sent'::"text",
    "suppression_reason" "text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_logs_status_check" CHECK (("status" = ANY (ARRAY['sent'::"text", 'failed'::"text", 'suppressed'::"text", 'delivered'::"text", 'bounced'::"text"])))
);


ALTER TABLE "public"."email_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "key" "text" NOT NULL,
    "enabled" boolean DEFAULT false,
    "rollout_pct" integer DEFAULT 0,
    "allowed_roles" "text"[],
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid",
    CONSTRAINT "feature_flags_rollout_pct_check" CHECK ((("rollout_pct" >= 0) AND ("rollout_pct" <= 100)))
);


ALTER TABLE "public"."feature_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_entries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."financial_entry_type" NOT NULL,
    "category" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "description" "text",
    "entry_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "receipt_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenancy_id" "uuid",
    "payment_status" "text" DEFAULT 'pending'::"text",
    CONSTRAINT "financial_entries_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "financial_entries_category_check" CHECK (("char_length"("category") <= 100)),
    CONSTRAINT "financial_entries_description_check" CHECK (("char_length"("description") <= 500))
);


ALTER TABLE "public"."financial_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gdpr_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "request_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "export_url" "text",
    "export_expires_at" timestamp with time zone,
    "notes" "text",
    "fulfilled_by" "uuid",
    "fulfilled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "gdpr_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['access'::"text", 'deletion'::"text", 'portability'::"text", 'rectification'::"text"]))),
    CONSTRAINT "gdpr_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'fulfilled'::"text", 'rejected'::"text", 'failed'::"text", 'email_failed'::"text"])))
);


ALTER TABLE "public"."gdpr_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."introduction_events" (
    "id" bigint NOT NULL,
    "introduction_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "introduction_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['enquiry'::"text", 'viewing_requested'::"text", 'viewing_booked'::"text", 'viewing_attended'::"text", 'viewing_cancelled'::"text", 'message_sent'::"text", 'offer_relayed'::"text", 'note'::"text"])))
);


ALTER TABLE "public"."introduction_events" OWNER TO "postgres";


ALTER TABLE "public"."introduction_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."introduction_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."introduction_status_history" (
    "id" bigint NOT NULL,
    "introduction_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "reason" "text",
    "actor" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "introduction_status_history_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'rebutted'::"text", 'cancelled_manifest_error'::"text", 'converted_sstc'::"text", 'converted_exchanged'::"text", 'converted_completed'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."introduction_status_history" OWNER TO "postgres";


ALTER TABLE "public"."introduction_status_history" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."introduction_status_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."introductions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "applicant_id" "uuid",
    "applicant_name" "text" NOT NULL,
    "applicant_email" "text" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "branch_id" "uuid",
    "first_contact_type" "text" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notified_at" timestamp with time zone,
    "rebuttal_deadline" timestamp with time zone,
    "tail_expires_at" timestamp with time zone NOT NULL,
    "prev_hash" "text",
    "row_hash" "text" NOT NULL,
    CONSTRAINT "introductions_first_contact_type_check" CHECK (("first_contact_type" = ANY (ARRAY['enquiry'::"text", 'viewing_request'::"text", 'message'::"text"])))
);


ALTER TABLE "public"."introductions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "tenancy_id" "uuid",
    "landlord_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "rooms" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "photo_urls" "text"[] DEFAULT '{}'::"text"[],
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "inventory_reports_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'complete'::"text", 'signed'::"text"]))),
    CONSTRAINT "inventory_reports_type_check" CHECK (("type" = ANY (ARRAY['check_in'::"text", 'check_out'::"text"])))
);


ALTER TABLE "public"."inventory_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invite_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "audience" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "redeemed_at" timestamp with time zone,
    "redeemed_by" "uuid",
    "expires_at" timestamp with time zone,
    "notes" "text",
    CONSTRAINT "invite_codes_audience_check" CHECK (("audience" = ANY (ARRAY['trade'::"text", 'agent'::"text", 'developer'::"text"])))
);


ALTER TABLE "public"."invite_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" NOT NULL,
    "introduction_id" "uuid" NOT NULL,
    "reported_outcome_id" "uuid",
    "ppd_match_id" "uuid",
    "amount_pence" bigint DEFAULT 24900 NOT NULL,
    "vat_pence" bigint DEFAULT 4980 NOT NULL,
    "status" "text" DEFAULT 'pending_review'::"text" NOT NULL,
    "hold_expires_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "invoice_candidates_source_check" CHECK (("source" = ANY (ARRAY['agent_report'::"text", 'audit_match'::"text"]))),
    CONSTRAINT "invoice_candidates_status_check" CHECK (("status" = ANY (ARRAY['pending_review'::"text", 'on_hold_branch_query'::"text", 'approved'::"text", 'invoiced'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."invoice_candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_disputes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "raised_by" "uuid",
    "grounds" "text" NOT NULL,
    "evidence_storage_paths" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "category" "text",
    "raised_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "properly_raised" boolean DEFAULT true NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "decided_by" "uuid",
    "decided_at" timestamp with time zone,
    "decision_reason" "text",
    CONSTRAINT "invoice_disputes_category_check" CHECK (("category" = ANY (ARRAY['D1_source'::"text", 'D2_fell_through'::"text", 'D3_different_applicant'::"text", 'D4_no_tail_agreement'::"text", 'D5_fee_level'::"text"]))),
    CONSTRAINT "invoice_disputes_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'conceded'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."invoice_disputes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_events" (
    "id" bigint NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "detail" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invoice_events" OWNER TO "postgres";


ALTER TABLE "public"."invoice_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."invoice_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE SEQUENCE IF NOT EXISTS "public"."invoice_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invoice_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_number" "text" NOT NULL,
    "org_agent_id" "uuid" NOT NULL,
    "invoice_candidate_id" "uuid",
    "introduction_id" "uuid",
    "net_pence" bigint NOT NULL,
    "vat_pence" bigint NOT NULL,
    "gross_pence" bigint NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "due_at" timestamp with time zone NOT NULL,
    "state" "text" DEFAULT 'open'::"text" NOT NULL,
    "state_before_dispute" "text",
    "gocardless_payment_id" "text",
    "paid_at" timestamp with time zone,
    CONSTRAINT "invoices_state_check" CHECK (("state" = ANY (ARRAY['open'::"text", 'collecting'::"text", 'paid'::"text", 'overdue'::"text", 'final_notice'::"text", 'suspended'::"text", 'disputed'::"text", 'charged_back'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jwt_claims_errors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "error_message" "text" NOT NULL,
    "error_detail" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."jwt_claims_errors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kyc_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "check_id" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "document_type" "text",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "kyc_verifications_provider_check" CHECK (("provider" = ANY (ARRAY['yoti'::"text", 'onfido'::"text", 'mock'::"text"]))),
    CONSTRAINT "kyc_verifications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'approved'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."kyc_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."landlord_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "portfolio_size" integer DEFAULT 1,
    "portfolio_types" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."landlord_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listing_analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visitor_fingerprint" "text",
    CONSTRAINT "listing_analytics_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['view'::"text", 'save'::"text", 'enquiry'::"text", 'phone_click'::"text", 'email_click'::"text"])))
);


ALTER TABLE "public"."listing_analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listing_description_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "tone" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."listing_description_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listing_moderation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "flags" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "listing_moderation_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."listing_moderation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_type" "public"."listing_type" NOT NULL,
    "status" "public"."listing_status" DEFAULT 'draft'::"public"."listing_status",
    "price" numeric(12,2) NOT NULL,
    "rent_frequency" "text",
    "price_qualifier" "text",
    "service_charge_annual" numeric(10,2),
    "ground_rent_annual" numeric(10,2),
    "listed_date" "date" DEFAULT CURRENT_DATE,
    "available_from" "date",
    "slug" "text",
    "view_count" integer DEFAULT 0,
    "enquiry_count" integer DEFAULT 0,
    "favorite_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "created_by" "uuid",
    "branch_id" "uuid",
    "paon" "text",
    "saon" "text",
    "uprn" "text",
    CONSTRAINT "listings_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "listings_price_qualifier_check" CHECK (("price_qualifier" = ANY (ARRAY['offers_over'::"text", 'guide_price'::"text", 'fixed_price'::"text", 'from'::"text", 'poa'::"text"]))),
    CONSTRAINT "listings_rent_frequency_check" CHECK (("rent_frequency" = ANY (ARRAY['weekly'::"text", 'monthly'::"text", 'yearly'::"text"]))),
    CONSTRAINT "valid_rent_freq" CHECK (((("listing_type" = 'rent'::"public"."listing_type") AND ("rent_frequency" IS NOT NULL)) OR ("listing_type" = 'sale'::"public"."listing_type")))
);


ALTER TABLE "public"."listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "tenancy_id" "uuid",
    "reported_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "priority" "public"."maintenance_priority" DEFAULT 'medium'::"public"."maintenance_priority" NOT NULL,
    "status" "public"."maintenance_status" DEFAULT 'reported'::"public"."maintenance_status" NOT NULL,
    "photo_urls" "text"[] DEFAULT '{}'::"text"[],
    "resolution_notes" "text",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "maintenance_requests_description_check" CHECK (("char_length"("description") <= 2000)),
    CONSTRAINT "maintenance_requests_title_check" CHECK (("char_length"("title") <= 200))
);


ALTER TABLE "public"."maintenance_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_pricing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_category" "text" NOT NULL,
    "region" "text" NOT NULL,
    "price_low" numeric(10,2) NOT NULL,
    "price_median" numeric(10,2) NOT NULL,
    "price_high" numeric(10,2) NOT NULL,
    "sample_size" integer DEFAULT 0 NOT NULL,
    "data_source" "text" NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "market_pricing_data_source_check" CHECK (("data_source" = ANY (ARRAY['seed'::"text", 'platform'::"text", 'blended'::"text"])))
);


ALTER TABLE "public"."market_pricing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "attachment_url" "text",
    "attachment_type" "text",
    "attachment_size_bytes" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "messages_attachment_type_check" CHECK ((("attachment_type" IS NULL) OR ("attachment_type" = ANY (ARRAY['image'::"text", 'pdf'::"text"])))),
    CONSTRAINT "messages_content_check" CHECK (("length"("content") <= 5000))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mobility_scores" (
    "property_id" "uuid" NOT NULL,
    "walk_score" smallint,
    "transit_score" smallint,
    "bike_score" smallint,
    "walk_amenity_count" integer,
    "transit_stop_count" integer,
    "bike_cycleway_count" integer,
    "source" "text" DEFAULT 'osm+naptan'::"text" NOT NULL,
    "computed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mobility_scores_bike_score_check" CHECK ((("bike_score" >= 0) AND ("bike_score" <= 100))),
    CONSTRAINT "mobility_scores_transit_score_check" CHECK ((("transit_score" >= 0) AND ("transit_score" <= 100))),
    CONSTRAINT "mobility_scores_walk_score_check" CHECK ((("walk_score" >= 0) AND ("walk_score" <= 100)))
);


ALTER TABLE "public"."mobility_scores" OWNER TO "postgres";


COMMENT ON TABLE "public"."mobility_scores" IS 'Independent walk/transit/bike mobility scores per property (0-100), computed from OpenStreetMap (ODbL) + NaPTAN transport_stops (OGL v3.0). Not affiliated with Walk Score(R).';



CREATE TABLE IF NOT EXISTS "public"."moderation_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_id" "uuid" NOT NULL,
    "priority_score" integer DEFAULT 0,
    "assigned_to" "uuid",
    "assigned_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "decision" "text",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "moderation_queue_decision_check" CHECK (("decision" = ANY (ARRAY['approved'::"text", 'rejected'::"text", 'flagged'::"text"])))
);


ALTER TABLE "public"."moderation_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moving_checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "offer_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "offer_stage" "text",
    "is_completed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."moving_checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offer_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_id" "uuid" NOT NULL,
    "from_status" "text",
    "to_status" "text" NOT NULL,
    "changed_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."offer_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "conditions" "text",
    "solicitor_name" "text",
    "solicitor_email" "text",
    "solicitor_phone" "text",
    "solicitor_id" "uuid",
    "aip_document_path" "text",
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "offers_amount_check" CHECK (("amount" > 0)),
    CONSTRAINT "offers_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'solicitors_instructed'::"text", 'searches'::"text", 'survey'::"text", 'mortgage_approved'::"text", 'exchange'::"text", 'completion'::"text", 'withdrawn'::"text"])))
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "quote_id" "uuid",
    "provider_id" "uuid" NOT NULL,
    "milestone_label" "text" NOT NULL,
    "amount_pence" bigint NOT NULL,
    "due_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invoice_id" "uuid",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_schedules_amount_pence_check" CHECK (("amount_pence" > 0)),
    CONSTRAINT "payment_schedules_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'invoiced'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."payment_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_events" (
    "id" bigint NOT NULL,
    "event_type" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "platform_events_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['conversation'::"text", 'booking'::"text", 'listing'::"text", 'rfq'::"text", 'transaction'::"text"])))
);


ALTER TABLE "public"."platform_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."platform_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."platform_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."platform_events_id_seq" OWNED BY "public"."platform_events"."id";



CREATE TABLE IF NOT EXISTS "public"."ppd_ingest_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "file_label" "text" NOT NULL,
    "file_sha256" "text" NOT NULL,
    "rows_added" integer,
    "rows_changed" integer,
    "rows_deleted" integer,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    CONSTRAINT "ppd_ingest_runs_status_check" CHECK (("status" = ANY (ARRAY['running'::"text", 'succeeded'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."ppd_ingest_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ppd_match_candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ppd_tuid" "text" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "introduction_id" "uuid",
    "mode" "text" NOT NULL,
    "score" numeric(4,3) NOT NULL,
    "score_components" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending_review'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ppd_match_candidates_mode_check" CHECK (("mode" = ANY (ARRAY['verification'::"text", 'audit'::"text"]))),
    CONSTRAINT "ppd_match_candidates_status_check" CHECK (("status" = ANY (ARRAY['pending_review'::"text", 'branch_queried'::"text", 'confirmed'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."ppd_match_candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ppd_sync_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sync_type" "text" NOT NULL,
    "source_file" "text" NOT NULL,
    "records_added" integer DEFAULT 0,
    "records_updated" integer DEFAULT 0,
    "records_deleted" integer DEFAULT 0,
    "status" "text" NOT NULL,
    "error_message" "text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."ppd_sync_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ppd_transactions" (
    "ppd_tuid" "text" NOT NULL,
    "price_pence" bigint NOT NULL,
    "transfer_date" "date" NOT NULL,
    "postcode" "text",
    "property_type" "text",
    "new_build" boolean,
    "tenure" "text",
    "paon" "text",
    "saon" "text",
    "street" "text",
    "locality" "text",
    "town" "text",
    "district" "text",
    "county" "text",
    "ppd_category" "text" NOT NULL,
    "last_record_status" "text",
    "ingest_run_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ppd_transactions_last_record_status_check" CHECK (("last_record_status" = ANY (ARRAY['A'::"text", 'C'::"text", 'D'::"text"])))
);


ALTER TABLE "public"."ppd_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "old_price" numeric(12,2) NOT NULL,
    "new_price" numeric(12,2) NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"(),
    "changed_by" "uuid"
);


ALTER TABLE "public"."price_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_paid_data" (
    "transaction_id" "text" NOT NULL,
    "price" bigint NOT NULL,
    "date_of_transfer" timestamp without time zone NOT NULL,
    "postcode" "text",
    "property_type" character(1) NOT NULL,
    "old_new" character(1) NOT NULL,
    "duration" character(1) NOT NULL,
    "paon" "text",
    "saon" "text",
    "street" "text",
    "locality" "text",
    "town" "text",
    "district" "text",
    "county" "text",
    "ppd_category" character(1) NOT NULL,
    "record_status" character(1) NOT NULL,
    "outward_code" "text" GENERATED ALWAYS AS ("upper"("split_part"("postcode", ' '::"text", 1))) STORED
);


ALTER TABLE "public"."price_paid_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_paid_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_id" "text" NOT NULL,
    "price" integer NOT NULL,
    "transaction_date" "date" NOT NULL,
    "postcode" "text",
    "postcode_area" "text" GENERATED ALWAYS AS ("split_part"("postcode", ' '::"text", 1)) STORED,
    "property_type" "text",
    "is_new_build" boolean DEFAULT false NOT NULL,
    "tenure" "text",
    "paon" "text",
    "saon" "text",
    "street" "text",
    "locality" "text",
    "town_city" "text",
    "district" "text",
    "county" "text",
    "transaction_category" "text",
    "record_status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "district_slug" "text" GENERATED ALWAYS AS ("lower"("replace"("replace"("replace"("district", 'LONDON BOROUGH OF '::"text", ''::"text"), 'CITY OF '::"text", ''::"text"), ' '::"text", '-'::"text"))) STORED,
    "town_slug" "text" GENERATED ALWAYS AS ("lower"("replace"("town_city", ' '::"text", '-'::"text"))) STORED,
    CONSTRAINT "price_paid_transactions_property_type_check" CHECK (("property_type" = ANY (ARRAY['D'::"text", 'S'::"text", 'T'::"text", 'F'::"text", 'O'::"text"]))),
    CONSTRAINT "price_paid_transactions_record_status_check" CHECK (("record_status" = ANY (ARRAY['A'::"text", 'C'::"text", 'D'::"text"]))),
    CONSTRAINT "price_paid_transactions_tenure_check" CHECK (("tenure" = ANY (ARRAY['F'::"text", 'L'::"text", 'U'::"text"]))),
    CONSTRAINT "price_paid_transactions_transaction_category_check" CHECK (("transaction_category" = ANY (ARRAY['A'::"text", 'B'::"text"])))
);


ALTER TABLE "public"."price_paid_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "active_role" "public"."user_role" DEFAULT 'homebuyer'::"public"."user_role" NOT NULL,
    "verification_level" "public"."verification_level" DEFAULT 'basic'::"public"."verification_level" NOT NULL,
    "avatar_url" "text",
    "phone" "text",
    "phone_verified" boolean DEFAULT false,
    "is_admin" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "provider_verification_status" "public"."provider_verification_status" DEFAULT 'unverified'::"public"."provider_verification_status" NOT NULL,
    "preferences" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "notifications_read_at" timestamp with time zone,
    "provider_details" "jsonb",
    "privacy_settings" "jsonb" DEFAULT '{"visibility": "public", "active_status": true, "search_indexing": true, "anonymous_analytics": true, "last_viewed_visible": false, "third_party_marketing": false}'::"jsonb",
    "notification_preferences" "jsonb" DEFAULT '{"sms_alerts": false, "push_listings": true, "push_messages": true, "email_listings": true, "email_messages": true, "email_viewings": true, "email_marketing": false}'::"jsonb",
    "suspended_until" timestamp with time zone,
    "ban_reason" "text",
    "banned_at" timestamp with time zone,
    "profile_score" integer DEFAULT 0,
    "onboarding_step" integer DEFAULT 1,
    "onboarding_complete" boolean DEFAULT false,
    "language_preferences" "jsonb" DEFAULT '{"locale": "en-GB", "currency": "GBP", "timezone": "Europe/London", "date_format": "DD/MM/YYYY"}'::"jsonb",
    "accessibility_preferences" "jsonb" DEFAULT '{"dark_mode": "system", "font_size": "medium", "high_contrast": false, "reduced_motion": false, "screen_reader_hints": true}'::"jsonb",
    "referral_tier" "public"."referral_tier" DEFAULT 'none'::"public"."referral_tier" NOT NULL,
    "referral_count" integer DEFAULT 0 NOT NULL,
    "scheduled_deletion_at" timestamp with time zone,
    "admin_role" "text",
    CONSTRAINT "profiles_admin_role_check" CHECK (("admin_role" = ANY (ARRAY['super_admin'::"text", 'moderation_admin'::"text", 'ops_admin'::"text", 'dev_admin'::"text"]))),
    CONSTRAINT "profiles_profile_score_check" CHECK ((("profile_score" >= 0) AND ("profile_score" <= 100)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "discount_type" "text" NOT NULL,
    "discount_value" numeric NOT NULL,
    "max_uses" integer,
    "uses_count" integer DEFAULT 0,
    "valid_from" timestamp with time zone,
    "valid_until" timestamp with time zone,
    "applies_to" "text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "promo_codes_discount_type_check" CHECK (("discount_type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text"])))
);


ALTER TABLE "public"."promo_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "address_line1" "text" NOT NULL,
    "address_line2" "text",
    "city" "text" NOT NULL,
    "county" "text",
    "postcode" "text" NOT NULL,
    "coordinates" "public"."geography"(Point,4326),
    "property_type" "public"."property_type" NOT NULL,
    "bedrooms" integer NOT NULL,
    "bathrooms" numeric(3,1) NOT NULL,
    "reception_rooms" integer,
    "square_footage" integer,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "description_tsv" "tsvector",
    "features" "jsonb" DEFAULT '{}'::"jsonb",
    "epc_rating" character(1),
    "epc_score" integer,
    "tenure" "public"."tenure_type",
    "lease_remaining_years" integer,
    "council_tax_band" character(1),
    "year_built" integer,
    "new_build" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "is_hmo" boolean DEFAULT false NOT NULL,
    "hmo_licence_number" "text",
    "hmo_licence_expiry" "date",
    "planning_permission_status" "public"."planning_status_type",
    CONSTRAINT "properties_bathrooms_check" CHECK (("bathrooms" >= (0)::numeric)),
    CONSTRAINT "properties_bedrooms_check" CHECK ((("bedrooms" >= 0) AND ("bedrooms" <= 50))),
    CONSTRAINT "properties_council_tax_band_check" CHECK (("council_tax_band" = ANY (ARRAY['A'::"bpchar", 'B'::"bpchar", 'C'::"bpchar", 'D'::"bpchar", 'E'::"bpchar", 'F'::"bpchar", 'G'::"bpchar", 'H'::"bpchar"]))),
    CONSTRAINT "properties_description_check" CHECK (("length"("description") <= 5000)),
    CONSTRAINT "properties_epc_rating_check" CHECK (("epc_rating" = ANY (ARRAY['A'::"bpchar", 'B'::"bpchar", 'C'::"bpchar", 'D'::"bpchar", 'E'::"bpchar", 'F'::"bpchar", 'G'::"bpchar"]))),
    CONSTRAINT "properties_epc_score_check" CHECK ((("epc_score" >= 1) AND ("epc_score" <= 100))),
    CONSTRAINT "properties_lease_remaining_years_check" CHECK (("lease_remaining_years" >= 0)),
    CONSTRAINT "properties_reception_rooms_check" CHECK (("reception_rooms" >= 0)),
    CONSTRAINT "properties_square_footage_check" CHECK (("square_footage" > 0)),
    CONSTRAINT "properties_title_check" CHECK (("length"("title") <= 200)),
    CONSTRAINT "properties_year_built_check" CHECK ((("year_built" >= 1600) AND ("year_built" <= 2050))),
    CONSTRAINT "valid_postcode" CHECK (("postcode" ~ '^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$'::"text"))
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


COMMENT ON COLUMN "public"."properties"."is_hmo" IS 'Whether this property is a House in Multiple Occupation (HMO), triggering additional compliance requirements';



COMMENT ON COLUMN "public"."properties"."hmo_licence_number" IS 'Local authority HMO licence reference number';



COMMENT ON COLUMN "public"."properties"."hmo_licence_expiry" IS 'HMO licence expiry date — renewal applications typically take 8-12 weeks';



COMMENT ON COLUMN "public"."properties"."planning_permission_status" IS 'Seller/agent-declared planning permission status (NTSELAT material information). NULL = not declared.';



CREATE TABLE IF NOT EXISTS "public"."property_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "tenancy_id" "uuid",
    "uploaded_by" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "public"."document_category" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" integer,
    "expiry_date" "date",
    "next_reminder_date" "date",
    "reminder_sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "property_documents_file_size_check" CHECK ((("file_size" > 0) AND ("file_size" <= 2097152))),
    CONSTRAINT "valid_reminder_date" CHECK ((("next_reminder_date" IS NULL) OR ("next_reminder_date" <= "expiry_date")))
);


ALTER TABLE "public"."property_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "insight_type" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "fetched_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "property_insights_insight_type_check" CHECK (("insight_type" = ANY (ARRAY['land_registry'::"text", 'ofsted'::"text", 'crime'::"text", 'broadband'::"text", 'roi'::"text"])))
);


ALTER TABLE "public"."property_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "media_type" "public"."media_type" NOT NULL,
    "url" "text" NOT NULL,
    "thumbnail_url" "text",
    "caption" "text",
    "alt_text" "text",
    "sort_order" integer DEFAULT 0,
    "file_size" integer,
    "original_filename" "text",
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."property_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_renovation_scenarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "renovation_type" "text" NOT NULL,
    "budget_input" integer,
    "estimated_uplift_low" integer,
    "estimated_uplift_high" integer,
    "confidence" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "property_renovation_scenarios_confidence_check" CHECK (("confidence" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"])))
);


ALTER TABLE "public"."property_renovation_scenarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "session_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."property_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_analytics_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "profile_views" integer DEFAULT 0 NOT NULL,
    "enquiries_received" integer DEFAULT 0 NOT NULL,
    "quotes_sent" integer DEFAULT 0 NOT NULL,
    "bookings_won" integer DEFAULT 0 NOT NULL,
    "earnings_pence" bigint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."provider_analytics_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "recurring_rules" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "provider_availability_dates_valid" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."provider_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "badge_type" "text" NOT NULL,
    "badge_label" "text" NOT NULL,
    "description" "text",
    "earned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."provider_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_boosts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "boost_type" "text" NOT NULL,
    "coverage_area" "text",
    "duration_days" integer NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "stripe_payment_intent_id" "text",
    "amount_paid" numeric(10,2),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "provider_boosts_boost_type_check" CHECK (("boost_type" = ANY (ARRAY['featured_profile'::"text", 'area_spotlight'::"text", 'category_top'::"text"])))
);


ALTER TABLE "public"."provider_boosts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_type" "public"."verification_document_type" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "mime_type" "text" NOT NULL,
    "verification_status" "public"."document_verification_status" DEFAULT 'pending'::"public"."document_verification_status" NOT NULL,
    "expiry_date" "date",
    "reviewer_notes" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."provider_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "booking_id" "uuid",
    "client_id" "uuid" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "line_items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    "vat_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'GBP'::"text" NOT NULL,
    "status" "public"."invoice_status" DEFAULT 'draft'::"public"."invoice_status" NOT NULL,
    "due_date" "date",
    "paid_at" timestamp with time zone,
    "stripe_payment_intent_id" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."provider_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_portfolio_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "description" "text",
    "category" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "before_image_path" "text",
    "after_image_path" "text",
    "is_featured" boolean DEFAULT false NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."provider_portfolio_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_references" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "reference_type" "public"."provider_reference_type" NOT NULL,
    "referee_name" "text" NOT NULL,
    "referee_email" "text" NOT NULL,
    "referee_phone" "text",
    "relationship" "text",
    "status" "public"."provider_reference_status" DEFAULT 'pending'::"public"."provider_reference_status" NOT NULL,
    "reference_text" "text",
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "submitted_at" timestamp with time zone,
    "verified_at" timestamp with time zone,
    "submission_token_hash" "text",
    "last_reminded_at" timestamp with time zone,
    "reminder_count" integer DEFAULT 0 NOT NULL,
    "cancelled_at" timestamp with time zone
);


ALTER TABLE "public"."provider_references" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referred_user_id" "uuid",
    "referral_code" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reward_amount" numeric(10,2) DEFAULT 50.00,
    "rewarded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "provider_referrals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'signed_up'::"text", 'verified'::"text", 'rewarded'::"text"])))
);


ALTER TABLE "public"."provider_referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_service_areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "name" "text",
    "zone" "public"."geometry"(MultiPolygon,4326) NOT NULL,
    "radius_km" numeric(6,2),
    "zone_type" "text" DEFAULT 'polygon'::"text" NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "provider_service_areas_zone_type_check" CHECK (("zone_type" = ANY (ARRAY['radius'::"text", 'polygon'::"text"])))
);


ALTER TABLE "public"."provider_service_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "pricing_type" "text" NOT NULL,
    "price_amount" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "provider_services_pricing_type_check" CHECK (("pricing_type" = ANY (ARRAY['hourly'::"text", 'fixed'::"text", 'quote_on_request'::"text"])))
);


ALTER TABLE "public"."provider_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stage" "public"."verification_stage" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "document_url" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "provider_verifications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'submitted'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."provider_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "keys" "jsonb" NOT NULL,
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_request_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "quote_number" "text",
    "total_amount" numeric(10,2) NOT NULL,
    "vat_included" boolean DEFAULT false NOT NULL,
    "line_items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "scope_of_work" "text" NOT NULL,
    "estimated_duration" "text",
    "payment_terms" "text",
    "warranty_info" "text",
    "validity_date" "date",
    "status" "public"."quote_status" DEFAULT 'draft'::"public"."quote_status" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "quote_signature" "text"
);


ALTER TABLE "public"."quotes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."quotes"."quote_signature" IS 'HMAC-SHA256 of (service_request_id||provider_id||total_amount||scope_of_work||line_items) computed server-side at quote submission time. Null for draft quotes.';



CREATE TABLE IF NOT EXISTS "public"."rebuttals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "introduction_id" "uuid" NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "evidence_storage_paths" "text"[] NOT NULL,
    "evidence_dated_at" "date" NOT NULL,
    "decision" "text",
    "decided_by" "uuid",
    "decided_at" timestamp with time zone,
    "decision_reason" "text",
    CONSTRAINT "rebuttals_decision_check" CHECK (("decision" = ANY (ARRAY['upheld'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."rebuttals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."referral_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_codes_v2" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."referral_codes_v2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_conversions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referred_id" "uuid" NOT NULL,
    "code_used" "text" NOT NULL,
    "converted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "referral_conversions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'converted'::"text"])))
);


ALTER TABLE "public"."referral_conversions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referral_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "reward_type" "text" DEFAULT 'subscription_credit'::"text" NOT NULL,
    "amount_pence" integer NOT NULL,
    "status" "public"."reward_status" DEFAULT 'earned'::"public"."reward_status" NOT NULL,
    "stripe_coupon_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_at" timestamp with time zone
);


ALTER TABLE "public"."referral_rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referred_id" "uuid",
    "referral_code" "text" NOT NULL,
    "track" "public"."referral_track" DEFAULT 'trade_to_trade'::"public"."referral_track" NOT NULL,
    "status" "public"."referral_status" DEFAULT 'pending'::"public"."referral_status" NOT NULL,
    "referred_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "converted_at" timestamp with time zone
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."refund_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_payment_intent_id" "text",
    "stripe_charge_id" "text",
    "amount_pence" integer,
    "reason" "text" NOT NULL,
    "details" "text",
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "admin_id" "uuid",
    "admin_notes" "text",
    "stripe_refund_id" "text",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "refund_requests_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'auto_approved'::"text", 'pending_review'::"text", 'approved'::"text", 'rejected'::"text", 'processed'::"text"])))
);


ALTER TABLE "public"."refund_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."renovation_type_benchmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "renovation_type" "text" NOT NULL,
    "region" "text" NOT NULL,
    "cost_low_per_sqm" integer,
    "cost_high_per_sqm" integer,
    "value_uplift_pct_low" numeric(5,2),
    "value_uplift_pct_high" numeric(5,2),
    "data_source" "text",
    "last_updated" "date" DEFAULT CURRENT_DATE NOT NULL
);


ALTER TABLE "public"."renovation_type_benchmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."renter_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "preferred_locations" "text"[] DEFAULT '{}'::"text"[],
    "min_monthly_rent" integer DEFAULT 500,
    "max_monthly_rent" integer DEFAULT 2000,
    "property_types" "text"[] DEFAULT '{}'::"text"[],
    "min_bedrooms" integer DEFAULT 1,
    "requirements" "text"[] DEFAULT '{}'::"text"[],
    "notification_frequency" "text" DEFAULT 'daily'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."renter_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reported_outcomes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "introduction_id" "uuid" NOT NULL,
    "reported_by" "uuid" NOT NULL,
    "outcome" "text" NOT NULL,
    "completion_date" "date",
    "agreed_price_pence" bigint,
    "reported_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reported_outcomes_completed_requires_details" CHECK ((("outcome" <> 'completed'::"text") OR (("completion_date" IS NOT NULL) AND ("agreed_price_pence" IS NOT NULL)))),
    CONSTRAINT "reported_outcomes_outcome_check" CHECK (("outcome" = ANY (ARRAY['offer_accepted'::"text", 'exchanged'::"text", 'completed'::"text", 'fell_through'::"text", 'tenancy_commenced'::"text", 'tenancy_abandoned'::"text"])))
);


ALTER TABLE "public"."reported_outcomes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "description" "text",
    "admin_status" "text" DEFAULT 'pending'::"text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "review_flags_admin_status_check" CHECK (("admin_status" = ANY (ARRAY['pending'::"text", 'reviewed'::"text", 'dismissed'::"text"]))),
    CONSTRAINT "review_flags_reason_check" CHECK (("reason" = ANY (ARRAY['spam'::"text", 'inappropriate'::"text", 'fake'::"text", 'off_topic'::"text", 'contact_info'::"text", 'promotional'::"text", 'duplicate'::"text", 'defamation'::"text"])))
);


ALTER TABLE "public"."review_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_helpfulness" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "is_helpful" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."review_helpfulness" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "overall_rating" integer NOT NULL,
    "punctuality_rating" integer,
    "quality_rating" integer,
    "value_rating" integer,
    "professionalism_rating" integer,
    "title" "text" NOT NULL,
    "review_text" "text" NOT NULL,
    "search_vector" "tsvector",
    "sentiment" "text",
    "authenticity_score" numeric(5,2) DEFAULT 0,
    "fake_review_probability" numeric(5,2) DEFAULT 0,
    "spam_indicators" "jsonb" DEFAULT '{}'::"jsonb",
    "moderation_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "provider_response" "text",
    "provider_response_at" timestamp with time zone,
    "helpful_count" integer DEFAULT 0,
    "not_helpful_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "flag_count" integer DEFAULT 0,
    "edited_at" timestamp with time zone,
    "original_text" "text",
    "edit_count" integer DEFAULT 0,
    "edit_history" "jsonb" DEFAULT '[]'::"jsonb",
    "is_incentivised" boolean DEFAULT false,
    CONSTRAINT "reviews_moderation_status_check" CHECK (("moderation_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'flagged'::"text"]))),
    CONSTRAINT "reviews_overall_rating_check" CHECK ((("overall_rating" >= 1) AND ("overall_rating" <= 5))),
    CONSTRAINT "reviews_professionalism_rating_check" CHECK ((("professionalism_rating" >= 1) AND ("professionalism_rating" <= 5))),
    CONSTRAINT "reviews_punctuality_rating_check" CHECK ((("punctuality_rating" >= 1) AND ("punctuality_rating" <= 5))),
    CONSTRAINT "reviews_quality_rating_check" CHECK ((("quality_rating" >= 1) AND ("quality_rating" <= 5))),
    CONSTRAINT "reviews_sentiment_check" CHECK (("sentiment" = ANY (ARRAY['very_negative'::"text", 'negative'::"text", 'neutral'::"text", 'positive'::"text", 'very_positive'::"text"]))),
    CONSTRAINT "reviews_value_rating_check" CHECK ((("value_rating" >= 1) AND ("value_rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sale_progression_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "share_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "current_stage" integer DEFAULT 1 NOT NULL,
    "stage_dates" "jsonb" DEFAULT '{}'::"jsonb",
    "expected_dates" "jsonb" DEFAULT '{}'::"jsonb",
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "solicitor_name" "text",
    "solicitor_email" "text",
    "solicitor_phone" "text",
    "buyer_solicitor_name" "text",
    "buyer_solicitor_email" "text",
    "mortgage_broker_name" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sale_progression_stages_current_stage_check" CHECK ((("current_stage" >= 1) AND ("current_stage" <= 8)))
);


ALTER TABLE "public"."sale_progression_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_searches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "filters" "jsonb" NOT NULL,
    "alerts_enabled" boolean DEFAULT true,
    "alert_frequency" "text" DEFAULT 'daily'::"text",
    "last_alerted_at" timestamp with time zone,
    "new_results_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "saved_searches_alert_frequency_check" CHECK (("alert_frequency" = ANY (ARRAY['instant'::"text", 'daily'::"text", 'weekly'::"text"])))
);


ALTER TABLE "public"."saved_searches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sdr_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "audience" "text" NOT NULL,
    "persona" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    CONSTRAINT "sdr_campaigns_audience_check" CHECK (("audience" = ANY (ARRAY['trade'::"text", 'agent'::"text", 'developer'::"text"]))),
    CONSTRAINT "sdr_campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."sdr_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sdr_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid",
    "target_id" "uuid",
    "job_id" "text" NOT NULL,
    "body" "text",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "sent_at" timestamp with time zone,
    "error_message" "text",
    "enqueued_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sdr_messages_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'sent'::"text", 'skipped'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."sdr_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sdr_targets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid",
    "external_id" "text" NOT NULL,
    "contact" "text" NOT NULL,
    "audience" "text" NOT NULL,
    "postcode" "text",
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sdr_targets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_analytics" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "filters" "jsonb" NOT NULL,
    "result_count" integer NOT NULL,
    "query_duration_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."search_analytics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."search_analytics_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."search_analytics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."search_analytics_id_seq" OWNED BY "public"."search_analytics"."id";



CREATE MATERIALIZED VIEW "public"."search_listings" AS
 SELECT "l"."id" AS "listing_id",
    "p"."id" AS "property_id",
    "l"."listing_type",
    "l"."status",
    "l"."price",
    "p"."property_type",
    "p"."bedrooms",
    "p"."bathrooms",
    "p"."city",
    "p"."postcode",
    "p"."coordinates",
    "p"."description_tsv",
    "p"."features",
    "p"."epc_rating",
    "p"."new_build",
    "l"."listed_date",
    "l"."slug",
    "pm"."thumbnail_url",
    "p"."title",
    "p"."address_line1",
    "l"."rent_frequency",
    "l"."price_qualifier",
    "p"."reception_rooms",
    "p"."square_footage",
    "l"."view_count",
    "l"."favorite_count",
    "l"."enquiry_count"
   FROM (("public"."listings" "l"
     JOIN "public"."properties" "p" ON (("p"."id" = "l"."property_id")))
     LEFT JOIN "public"."property_media" "pm" ON ((("pm"."listing_id" = "l"."id") AND ("pm"."sort_order" = 0) AND ("pm"."media_type" = 'image'::"public"."media_type"))))
  WHERE (("l"."status" = 'active'::"public"."listing_status") AND ("l"."deleted_at" IS NULL) AND ("p"."deleted_at" IS NULL))
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."search_listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seller_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "postcode" "text" NOT NULL,
    "address_line_1" "text" NOT NULL,
    "address_line_2" "text",
    "city" "text" NOT NULL,
    "property_type" "text" NOT NULL,
    "tenure" "text" NOT NULL,
    "leasehold_years_remaining" integer,
    "bedrooms" integer,
    "bathrooms" integer,
    "features" "text"[],
    "council_tax_band" "text",
    "epc_band" "text",
    "photos" "jsonb" DEFAULT '[]'::"jsonb",
    "floor_plan_url" "text",
    "description" "text",
    "description_tone" "text",
    "key_selling_points" "text"[],
    "asking_price" integer,
    "listing_type" "text",
    "price_qualifier" "text",
    "ai_valuation_estimate" integer,
    "epc_url" "text",
    "managed_by_agent_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "planning_permission_status" "public"."planning_status_type",
    CONSTRAINT "seller_listings_council_tax_band_check" CHECK (("council_tax_band" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text", 'D'::"text", 'E'::"text", 'F'::"text", 'G'::"text", 'H'::"text"]))),
    CONSTRAINT "seller_listings_description_tone_check" CHECK (("description_tone" = ANY (ARRAY['professional'::"text", 'warm'::"text", 'luxury'::"text"]))),
    CONSTRAINT "seller_listings_epc_band_check" CHECK (("epc_band" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text", 'D'::"text", 'E'::"text", 'F'::"text", 'G'::"text"]))),
    CONSTRAINT "seller_listings_listing_type_check" CHECK (("listing_type" = ANY (ARRAY['for_sale'::"text", 'auction'::"text", 'expressions_of_interest'::"text"]))),
    CONSTRAINT "seller_listings_price_qualifier_check" CHECK (("price_qualifier" = ANY (ARRAY['offers_over'::"text", 'offers_in_excess_of'::"text", 'guide_price'::"text", 'fixed_price'::"text", 'poa'::"text", NULL::"text"]))),
    CONSTRAINT "seller_listings_property_type_check" CHECK (("property_type" = ANY (ARRAY['detached'::"text", 'semi-detached'::"text", 'terraced'::"text", 'flat'::"text", 'bungalow'::"text", 'other'::"text"]))),
    CONSTRAINT "seller_listings_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'under_offer'::"text", 'sold'::"text", 'paused'::"text", 'archived'::"text"]))),
    CONSTRAINT "seller_listings_tenure_check" CHECK (("tenure" = ANY (ARRAY['freehold'::"text", 'leasehold'::"text"])))
);


ALTER TABLE "public"."seller_listings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."seller_listings"."planning_permission_status" IS 'Seller-declared planning permission status (NTSELAT material information). NULL = not declared.';



CREATE TABLE IF NOT EXISTS "public"."seller_offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "buyer_name" "text" NOT NULL,
    "buyer_email" "text" NOT NULL,
    "amount" integer NOT NULL,
    "buyer_type" "text",
    "chain_status" "text",
    "chain_length" integer,
    "is_verified" boolean DEFAULT false,
    "conditions" "text",
    "solicitor_name" "text",
    "solicitor_email" "text",
    "solicitor_phone" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "counter_amount" integer,
    "counter_message" "text",
    "offered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "seller_offers_buyer_type_check" CHECK (("buyer_type" = ANY (ARRAY['cash'::"text", 'mortgage'::"text"]))),
    CONSTRAINT "seller_offers_chain_status_check" CHECK (("chain_status" = ANY (ARRAY['chain_free'::"text", 'in_chain'::"text"]))),
    CONSTRAINT "seller_offers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'countered'::"text", 'rejected'::"text", 'withdrawn'::"text"])))
);


ALTER TABLE "public"."seller_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seller_viewings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "buyer_name" "text" NOT NULL,
    "buyer_email" "text" NOT NULL,
    "viewing_datetime" timestamp with time zone NOT NULL,
    "viewing_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "feedback" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "seller_viewings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'rescheduled'::"text", 'cancelled'::"text", 'completed'::"text"]))),
    CONSTRAINT "seller_viewings_viewing_type_check" CHECK (("viewing_type" = ANY (ARRAY['in_person'::"text", 'virtual'::"text"])))
);


ALTER TABLE "public"."seller_viewings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "postcode_district" "text" NOT NULL,
    "display_name" "text",
    "latitude" double precision,
    "longitude" double precision,
    "market_types" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."service_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_job_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "milestone_key" "text" NOT NULL,
    "status" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    CONSTRAINT "service_job_milestones_milestone_key_check" CHECK (("milestone_key" = ANY (ARRAY['quote_accepted'::"text", 'job_scheduled'::"text", 'work_started'::"text", 'work_completed'::"text", 'payment_received'::"text"]))),
    CONSTRAINT "service_job_milestones_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."service_job_milestones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "service_category" "public"."service_category" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "property_address" "text",
    "property_postcode" "text" NOT NULL,
    "property_location" "public"."geography"(Point,4326),
    "preferred_start_date" "date",
    "urgency_level" "text" DEFAULT 'normal'::"text" NOT NULL,
    "budget_min" numeric(10,2),
    "budget_max" numeric(10,2),
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "public"."rfq_status" DEFAULT 'open'::"public"."rfq_status" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "view_count" integer DEFAULT 0,
    "quote_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "lat" double precision,
    "lng" double precision,
    CONSTRAINT "service_requests_urgency_level_check" CHECK (("urgency_level" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'emergency'::"text"]))),
    CONSTRAINT "valid_uk_postcode" CHECK (("property_postcode" ~* '^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$'::"text"))
);


ALTER TABLE "public"."service_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."social_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "social_links_platform_check" CHECK (("platform" = ANY (ARRAY['website'::"text", 'linkedin'::"text", 'instagram'::"text", 'facebook'::"text", 'tiktok'::"text", 'rightmove'::"text", 'zoopla'::"text"])))
);


ALTER TABLE "public"."social_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_connect_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "stripe_account_id" "text" NOT NULL,
    "onboarding_complete" boolean DEFAULT false NOT NULL,
    "charges_enabled" boolean DEFAULT false NOT NULL,
    "payouts_enabled" boolean DEFAULT false NOT NULL,
    "details_submitted" boolean DEFAULT false NOT NULL,
    "kyc_status" "text",
    "last_payout_amount" bigint,
    "last_payout_status" "text",
    "last_payout_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stripe_connect_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "account_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stripe_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_subscription_id" "text",
    "stripe_customer_id" "text",
    "status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "plan_name" "text",
    "price_amount" integer,
    "currency" "text" DEFAULT 'gbp'::"text" NOT NULL,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false NOT NULL,
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenancies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "tenant_name" "text" NOT NULL,
    "tenant_email" "text",
    "tenant_phone" "text",
    "monthly_rent" numeric(10,2) NOT NULL,
    "deposit_amount" numeric(10,2),
    "deposit_scheme" "text",
    "lease_start_date" "date" NOT NULL,
    "lease_end_date" "date" NOT NULL,
    "status" "public"."tenancy_status" DEFAULT 'active'::"public"."tenancy_status" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "rent_amount" numeric(10,2),
    "rent_frequency" "text" DEFAULT 'monthly'::"text",
    CONSTRAINT "tenancies_deposit_amount_check" CHECK (("deposit_amount" >= (0)::numeric)),
    CONSTRAINT "tenancies_deposit_scheme_check" CHECK (("deposit_scheme" = ANY (ARRAY['DPS'::"text", 'MyDeposits'::"text", 'TDS'::"text", 'other'::"text"]))),
    CONSTRAINT "tenancies_monthly_rent_check" CHECK (("monthly_rent" > (0)::numeric)),
    CONSTRAINT "tenancies_tenant_email_check" CHECK (("tenant_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text")),
    CONSTRAINT "tenancies_tenant_name_check" CHECK (("char_length"("tenant_name") <= 200)),
    CONSTRAINT "valid_tenancy_dates" CHECK (("lease_end_date" > "lease_start_date"))
);


ALTER TABLE "public"."tenancies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "applicant_user_id" "uuid",
    "applicant_name" "text" NOT NULL,
    "applicant_email" "text" NOT NULL,
    "status" "text" DEFAULT 'received'::"text" NOT NULL,
    "monthly_income" numeric(10,2),
    "employment_status" "text",
    "credit_check_status" "text",
    "references_status" "text",
    "notes" "text",
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tenant_applications_credit_check_status_check" CHECK (("credit_check_status" = ANY (ARRAY['pending'::"text", 'passed'::"text", 'failed'::"text", 'not_run'::"text"]))),
    CONSTRAINT "tenant_applications_references_status_check" CHECK (("references_status" = ANY (ARRAY['pending'::"text", 'received'::"text", 'verified'::"text"]))),
    CONSTRAINT "tenant_applications_status_check" CHECK (("status" = ANY (ARRAY['received'::"text", 'shortlisted'::"text", 'referencing'::"text", 'approved'::"text", 'rejected'::"text", 'withdrawn'::"text"])))
);


ALTER TABLE "public"."tenant_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "milestone_key" "text" NOT NULL,
    "status" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "completed_date" "date",
    CONSTRAINT "transaction_milestones_milestone_key_check" CHECK (("milestone_key" = ANY (ARRAY['offer_accepted'::"text", 'mortgage_submitted'::"text", 'survey_instructed'::"text", 'survey_completed'::"text", 'conveyancing_started'::"text", 'searches_completed'::"text", 'contracts_exchanged'::"text", 'completion'::"text"]))),
    CONSTRAINT "transaction_milestones_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."transaction_milestones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transport_stops" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "atco_code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "stop_type" "text" NOT NULL,
    "coordinates" "public"."geography"(Point,4326) NOT NULL,
    "locality" "text",
    "source" "text" DEFAULT 'naptan'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transport_stops_stop_type_check" CHECK (("stop_type" = ANY (ARRAY['rail'::"text", 'tube'::"text", 'tram'::"text", 'ferry'::"text"])))
);


ALTER TABLE "public"."transport_stops" OWNER TO "postgres";


COMMENT ON TABLE "public"."transport_stops" IS 'NaPTAN station-level transport stops (rail/tube/tram/ferry) for the property Local Area widget. Source: DfT NaPTAN, OGL v3.0.';



CREATE TABLE IF NOT EXISTS "public"."truedeed_audit_log" (
    "id" bigint NOT NULL,
    "actor" "uuid",
    "action" "text" NOT NULL,
    "entity" "text" NOT NULL,
    "entity_id" "text",
    "detail" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."truedeed_audit_log" OWNER TO "postgres";


ALTER TABLE "public"."truedeed_audit_log" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."truedeed_audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_backup_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code_hash" "text" NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_backup_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "offer_id" "uuid",
    "document_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size_bytes" integer NOT NULL,
    "mime_type" "text" NOT NULL,
    "status" "text" DEFAULT 'uploaded'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['id_proof'::"text", 'proof_of_funds'::"text", 'aip_letter'::"text", 'other'::"text"]))),
    CONSTRAINT "user_documents_file_size_bytes_check" CHECK (("file_size_bytes" > 0)),
    CONSTRAINT "user_documents_status_check" CHECK (("status" = ANY (ARRAY['uploaded'::"text", 'pending_review'::"text", 'verified'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."user_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."viewing_history" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "viewed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."viewing_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."viewing_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."viewing_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."viewing_history_id_seq" OWNED BY "public"."viewing_history"."id";



CREATE TABLE IF NOT EXISTS "public"."viewing_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "viewing_slots_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'booked'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "viewing_slots_type_check" CHECK (("type" = ANY (ARRAY['in_person'::"text", 'virtual'::"text"])))
);


ALTER TABLE "public"."viewing_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."viewings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "slot_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'confirmed'::"text" NOT NULL,
    "type" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "viewings_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'cancelled'::"text", 'rescheduled'::"text", 'completed'::"text"]))),
    CONSTRAINT "viewings_type_check" CHECK (("type" = ANY (ARRAY['in_person'::"text", 'virtual'::"text"])))
);


ALTER TABLE "public"."viewings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_log" ATTACH PARTITION "public"."activity_log_2026_03" FOR VALUES FROM ('2026-03-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');



ALTER TABLE ONLY "public"."activity_log" ATTACH PARTITION "public"."activity_log_2026_04" FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00');



ALTER TABLE ONLY "public"."activity_log" ATTACH PARTITION "public"."activity_log_2026_05" FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');



ALTER TABLE ONLY "public"."activity_log" ATTACH PARTITION "public"."activity_log_2026_06" FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');



ALTER TABLE ONLY "public"."activity_log" ATTACH PARTITION "public"."activity_log_2026_07" FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');



ALTER TABLE ONLY "public"."activity_log" ATTACH PARTITION "public"."activity_log_2026_08" FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');



ALTER TABLE ONLY "public"."activity_log" ATTACH PARTITION "public"."activity_log_2026_09" FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');



ALTER TABLE ONLY "public"."activity_log" ATTACH PARTITION "public"."activity_log_2026_10" FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');



ALTER TABLE ONLY "public"."activity_log" ATTACH PARTITION "public"."activity_log_2026_11" FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');



ALTER TABLE ONLY "public"."activity_log" ATTACH PARTITION "public"."activity_log_2026_12" FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');



ALTER TABLE ONLY "public"."activity_log" ATTACH PARTITION "public"."activity_log_2027_01" FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-02-01 00:00:00+00');



ALTER TABLE ONLY "public"."activity_log" ATTACH PARTITION "public"."activity_log_2027_02" FOR VALUES FROM ('2027-02-01 00:00:00+00') TO ('2027-03-01 00:00:00+00');



ALTER TABLE ONLY "public"."activity_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."activity_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."auth_audit_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."auth_audit_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."consent_audit_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."consent_audit_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."platform_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."platform_events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."search_analytics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."search_analytics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."viewing_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."viewing_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."activity_log_2026_03"
    ADD CONSTRAINT "activity_log_2026_03_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."activity_log_2026_04"
    ADD CONSTRAINT "activity_log_2026_04_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."activity_log_2026_05"
    ADD CONSTRAINT "activity_log_2026_05_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."activity_log_2026_06"
    ADD CONSTRAINT "activity_log_2026_06_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."activity_log_2026_07"
    ADD CONSTRAINT "activity_log_2026_07_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."activity_log_2026_08"
    ADD CONSTRAINT "activity_log_2026_08_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."activity_log_2026_09"
    ADD CONSTRAINT "activity_log_2026_09_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."activity_log_2026_10"
    ADD CONSTRAINT "activity_log_2026_10_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."activity_log_2026_11"
    ADD CONSTRAINT "activity_log_2026_11_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."activity_log_2026_12"
    ADD CONSTRAINT "activity_log_2026_12_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."activity_log_2027_01"
    ADD CONSTRAINT "activity_log_2027_01_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."activity_log_2027_02"
    ADD CONSTRAINT "activity_log_2027_02_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_owner_id_key" UNIQUE ("owner_id");



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_agency_profiles"
    ADD CONSTRAINT "agent_agency_profiles_agent_id_key" UNIQUE ("agent_id");



ALTER TABLE ONLY "public"."agent_agency_profiles"
    ADD CONSTRAINT "agent_agency_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_api_keys"
    ADD CONSTRAINT "agent_api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_branches"
    ADD CONSTRAINT "agent_branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_commissions"
    ADD CONSTRAINT "agent_commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_crm_clients"
    ADD CONSTRAINT "agent_crm_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_enquiries"
    ADD CONSTRAINT "agent_enquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_feed_integrations"
    ADD CONSTRAINT "agent_feed_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_lead_activities"
    ADD CONSTRAINT "agent_lead_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_leads"
    ADD CONSTRAINT "agent_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_offer_history"
    ADD CONSTRAINT "agent_offer_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_offers"
    ADD CONSTRAINT "agent_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_profiles"
    ADD CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_sale_progressions"
    ADD CONSTRAINT "agent_sale_progressions_offer_id_key" UNIQUE ("offer_id");



ALTER TABLE ONLY "public"."agent_sale_progressions"
    ADD CONSTRAINT "agent_sale_progressions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_team_members"
    ADD CONSTRAINT "agent_team_members_agent_id_user_id_key" UNIQUE ("agent_id", "user_id");



ALTER TABLE ONLY "public"."agent_team_members"
    ADD CONSTRAINT "agent_team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_vendor_reports"
    ADD CONSTRAINT "agent_vendor_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_viewing_feedback"
    ADD CONSTRAINT "agent_viewing_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_viewing_slots"
    ADD CONSTRAINT "agent_viewing_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_match_preferences"
    ADD CONSTRAINT "ai_match_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_match_preferences"
    ADD CONSTRAINT "ai_match_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."ai_match_results"
    ADD CONSTRAINT "ai_match_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_audit_log"
    ADD CONSTRAINT "auth_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_events"
    ADD CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_events"
    ADD CONSTRAINT "billing_events_stripe_event_id_key" UNIQUE ("stripe_event_id");



ALTER TABLE ONLY "public"."booking_state_transitions"
    ADD CONSTRAINT "booking_state_transitions_from_status_to_status_key" UNIQUE ("from_status", "to_status");



ALTER TABLE ONLY "public"."booking_state_transitions"
    ADD CONSTRAINT "booking_state_transitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_status_history"
    ADD CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_booking_reference_key" UNIQUE ("booking_reference");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."broadband_coverage"
    ADD CONSTRAINT "broadband_coverage_pkey" PRIMARY KEY ("postcode");



ALTER TABLE ONLY "public"."business_verifications"
    ADD CONSTRAINT "business_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_verifications"
    ADD CONSTRAINT "business_verifications_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chain_links"
    ADD CONSTRAINT "chain_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chain_links"
    ADD CONSTRAINT "chain_links_unique_pair" UNIQUE ("upstream_progression_id", "downstream_progression_id");



ALTER TABLE ONLY "public"."chain_risk_scores"
    ADD CONSTRAINT "chain_risk_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chain_risk_scores"
    ADD CONSTRAINT "chain_risk_scores_unique_progression" UNIQUE ("progression_id");



ALTER TABLE ONLY "public"."cms_articles"
    ADD CONSTRAINT "cms_articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cms_articles"
    ADD CONSTRAINT "cms_articles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."compliance_cron_runs"
    ADD CONSTRAINT "compliance_cron_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_audit_log"
    ADD CONSTRAINT "consent_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_records"
    ADD CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_records"
    ADD CONSTRAINT "consent_records_user_id_consent_type_key" UNIQUE ("user_id", "consent_type");



ALTER TABLE ONLY "public"."content_reports"
    ADD CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_reports"
    ADD CONSTRAINT "content_reports_reporter_id_entity_type_entity_id_key" UNIQUE ("reporter_id", "entity_type", "entity_id");



ALTER TABLE ONLY "public"."conversation_read_status"
    ADD CONSTRAINT "conversation_read_status_pkey" PRIMARY KEY ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deletion_requests"
    ADD CONSTRAINT "deletion_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deposit_registrations"
    ADD CONSTRAINT "deposit_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_campaigns"
    ADD CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."financial_entries"
    ADD CONSTRAINT "financial_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gdpr_requests"
    ADD CONSTRAINT "gdpr_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."introduction_events"
    ADD CONSTRAINT "introduction_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."introduction_status_history"
    ADD CONSTRAINT "introduction_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."introductions"
    ADD CONSTRAINT "introductions_applicant_id_listing_id_key" UNIQUE ("applicant_id", "listing_id");



ALTER TABLE ONLY "public"."introductions"
    ADD CONSTRAINT "introductions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_reports"
    ADD CONSTRAINT "inventory_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_candidates"
    ADD CONSTRAINT "invoice_candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_disputes"
    ADD CONSTRAINT "invoice_disputes_invoice_id_key" UNIQUE ("invoice_id");



ALTER TABLE ONLY "public"."invoice_disputes"
    ADD CONSTRAINT "invoice_disputes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_events"
    ADD CONSTRAINT "invoice_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_candidate_id_key" UNIQUE ("invoice_candidate_id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jwt_claims_errors"
    ADD CONSTRAINT "jwt_claims_errors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kyc_verifications"
    ADD CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kyc_verifications"
    ADD CONSTRAINT "kyc_verifications_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."landlord_profiles"
    ADD CONSTRAINT "landlord_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landlord_profiles"
    ADD CONSTRAINT "landlord_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."listing_analytics_events"
    ADD CONSTRAINT "listing_analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_description_attempts"
    ADD CONSTRAINT "listing_description_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_moderation"
    ADD CONSTRAINT "listing_moderation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_pricing"
    ADD CONSTRAINT "market_pricing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_pricing"
    ADD CONSTRAINT "market_pricing_service_category_region_key" UNIQUE ("service_category", "region");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mobility_scores"
    ADD CONSTRAINT "mobility_scores_pkey" PRIMARY KEY ("property_id");



ALTER TABLE ONLY "public"."moderation_queue"
    ADD CONSTRAINT "moderation_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moving_checklist_items"
    ADD CONSTRAINT "moving_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offer_status_history"
    ADD CONSTRAINT "offer_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_schedules"
    ADD CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_events"
    ADD CONSTRAINT "platform_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ppd_ingest_runs"
    ADD CONSTRAINT "ppd_ingest_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ppd_match_candidates"
    ADD CONSTRAINT "ppd_match_candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ppd_match_candidates"
    ADD CONSTRAINT "ppd_match_candidates_ppd_tuid_listing_id_key" UNIQUE ("ppd_tuid", "listing_id");



ALTER TABLE ONLY "public"."ppd_sync_log"
    ADD CONSTRAINT "ppd_sync_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ppd_transactions"
    ADD CONSTRAINT "ppd_transactions_pkey" PRIMARY KEY ("ppd_tuid");



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_paid_data"
    ADD CONSTRAINT "price_paid_data_pkey" PRIMARY KEY ("transaction_id");



ALTER TABLE ONLY "public"."price_paid_transactions"
    ADD CONSTRAINT "price_paid_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_paid_transactions"
    ADD CONSTRAINT "price_paid_transactions_transaction_id_key" UNIQUE ("transaction_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_documents"
    ADD CONSTRAINT "property_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_insights"
    ADD CONSTRAINT "property_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_insights"
    ADD CONSTRAINT "property_insights_property_id_insight_type_key" UNIQUE ("property_id", "insight_type");



ALTER TABLE ONLY "public"."property_media"
    ADD CONSTRAINT "property_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_renovation_scenarios"
    ADD CONSTRAINT "property_renovation_scenarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_views"
    ADD CONSTRAINT "property_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_analytics_daily"
    ADD CONSTRAINT "provider_analytics_daily_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_analytics_daily"
    ADD CONSTRAINT "provider_analytics_daily_provider_id_date_key" UNIQUE ("provider_id", "date");



ALTER TABLE ONLY "public"."provider_availability"
    ADD CONSTRAINT "provider_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_badges"
    ADD CONSTRAINT "provider_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_boosts"
    ADD CONSTRAINT "provider_boosts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_documents"
    ADD CONSTRAINT "provider_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_invoices"
    ADD CONSTRAINT "provider_invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."provider_invoices"
    ADD CONSTRAINT "provider_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_portfolio_items"
    ADD CONSTRAINT "provider_portfolio_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_rating_stats"
    ADD CONSTRAINT "provider_rating_stats_pkey" PRIMARY KEY ("provider_id");



ALTER TABLE ONLY "public"."provider_references"
    ADD CONSTRAINT "provider_references_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_referrals"
    ADD CONSTRAINT "provider_referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_referrals"
    ADD CONSTRAINT "provider_referrals_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."provider_service_areas"
    ADD CONSTRAINT "provider_service_areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_services"
    ADD CONSTRAINT "provider_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_verifications"
    ADD CONSTRAINT "provider_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_verifications"
    ADD CONSTRAINT "provider_verifications_user_id_stage_key" UNIQUE ("user_id", "stage");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_endpoint_key" UNIQUE ("user_id", "endpoint");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_quote_number_key" UNIQUE ("quote_number");



ALTER TABLE ONLY "public"."rebuttals"
    ADD CONSTRAINT "rebuttals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."referral_codes_v2"
    ADD CONSTRAINT "referral_codes_v2_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."referral_codes_v2"
    ADD CONSTRAINT "referral_codes_v2_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_codes_v2"
    ADD CONSTRAINT "referral_codes_v2_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."referral_conversions"
    ADD CONSTRAINT "referral_conversions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_conversions"
    ADD CONSTRAINT "referral_conversions_referred_id_key" UNIQUE ("referred_id");



ALTER TABLE ONLY "public"."referral_rewards"
    ADD CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refund_requests"
    ADD CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."renovation_type_benchmarks"
    ADD CONSTRAINT "renovation_type_benchmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."renovation_type_benchmarks"
    ADD CONSTRAINT "renovation_type_benchmarks_renovation_type_region_key" UNIQUE ("renovation_type", "region");



ALTER TABLE ONLY "public"."renter_preferences"
    ADD CONSTRAINT "renter_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."renter_preferences"
    ADD CONSTRAINT "renter_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."reported_outcomes"
    ADD CONSTRAINT "reported_outcomes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_flags"
    ADD CONSTRAINT "review_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_flags"
    ADD CONSTRAINT "review_flags_user_review_unique" UNIQUE ("review_id", "user_id");



ALTER TABLE ONLY "public"."review_helpfulness"
    ADD CONSTRAINT "review_helpfulness_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_helpfulness"
    ADD CONSTRAINT "review_helpfulness_review_id_user_id_key" UNIQUE ("review_id", "user_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_booking_id_key" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sale_progression_stages"
    ADD CONSTRAINT "sale_progression_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_user_id_listing_id_key" UNIQUE ("user_id", "listing_id");



ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sdr_campaigns"
    ADD CONSTRAINT "sdr_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sdr_messages"
    ADD CONSTRAINT "sdr_messages_job_id_key" UNIQUE ("job_id");



ALTER TABLE ONLY "public"."sdr_messages"
    ADD CONSTRAINT "sdr_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sdr_targets"
    ADD CONSTRAINT "sdr_targets_campaign_id_external_id_key" UNIQUE ("campaign_id", "external_id");



ALTER TABLE ONLY "public"."sdr_targets"
    ADD CONSTRAINT "sdr_targets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_analytics"
    ADD CONSTRAINT "search_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seller_listings"
    ADD CONSTRAINT "seller_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seller_offers"
    ADD CONSTRAINT "seller_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seller_viewings"
    ADD CONSTRAINT "seller_viewings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_areas"
    ADD CONSTRAINT "service_areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_areas"
    ADD CONSTRAINT "service_areas_user_id_postcode_district_key" UNIQUE ("user_id", "postcode_district");



ALTER TABLE ONLY "public"."service_job_milestones"
    ADD CONSTRAINT "service_job_milestones_booking_id_milestone_key_key" UNIQUE ("booking_id", "milestone_key");



ALTER TABLE ONLY "public"."service_job_milestones"
    ADD CONSTRAINT "service_job_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_provider_details"
    ADD CONSTRAINT "service_provider_details_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."service_provider_details"
    ADD CONSTRAINT "service_provider_details_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_links"
    ADD CONSTRAINT "social_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_links"
    ADD CONSTRAINT "social_links_user_id_platform_key" UNIQUE ("user_id", "platform");



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_provider_id_key" UNIQUE ("provider_id");



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_stripe_account_id_key" UNIQUE ("stripe_account_id");



ALTER TABLE ONLY "public"."stripe_events"
    ADD CONSTRAINT "stripe_events_event_id_key" UNIQUE ("event_id");



ALTER TABLE ONLY "public"."stripe_events"
    ADD CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."tenancies"
    ADD CONSTRAINT "tenancies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_applications"
    ADD CONSTRAINT "tenant_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_milestones"
    ADD CONSTRAINT "transaction_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_milestones"
    ADD CONSTRAINT "transaction_milestones_transaction_id_milestone_key_key" UNIQUE ("transaction_id", "milestone_key");



ALTER TABLE ONLY "public"."transport_stops"
    ADD CONSTRAINT "transport_stops_atco_code_key" UNIQUE ("atco_code");



ALTER TABLE ONLY "public"."transport_stops"
    ADD CONSTRAINT "transport_stops_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."truedeed_audit_log"
    ADD CONSTRAINT "truedeed_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "unique_referred_id" UNIQUE ("referred_id");



ALTER TABLE ONLY "public"."user_backup_codes"
    ADD CONSTRAINT "user_backup_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_documents"
    ADD CONSTRAINT "user_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."viewing_history"
    ADD CONSTRAINT "viewing_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."viewing_history"
    ADD CONSTRAINT "viewing_history_user_id_listing_id_key" UNIQUE ("user_id", "listing_id");



ALTER TABLE ONLY "public"."viewing_slots"
    ADD CONSTRAINT "viewing_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."viewings"
    ADD CONSTRAINT "viewings_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_log_user_created" ON ONLY "public"."activity_log" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "activity_log_2026_03_user_id_created_at_idx" ON "public"."activity_log_2026_03" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "activity_log_2026_04_user_id_created_at_idx" ON "public"."activity_log_2026_04" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "activity_log_2026_05_user_id_created_at_idx" ON "public"."activity_log_2026_05" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "activity_log_2026_06_user_id_created_at_idx" ON "public"."activity_log_2026_06" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "activity_log_2026_07_user_id_created_at_idx" ON "public"."activity_log_2026_07" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "activity_log_2026_08_user_id_created_at_idx" ON "public"."activity_log_2026_08" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "activity_log_2026_09_user_id_created_at_idx" ON "public"."activity_log_2026_09" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "activity_log_2026_10_user_id_created_at_idx" ON "public"."activity_log_2026_10" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "activity_log_2026_11_user_id_created_at_idx" ON "public"."activity_log_2026_11" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "activity_log_2026_12_user_id_created_at_idx" ON "public"."activity_log_2026_12" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "activity_log_2027_01_user_id_created_at_idx" ON "public"."activity_log_2027_01" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "activity_log_2027_02_user_id_created_at_idx" ON "public"."activity_log_2027_02" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "admin_audit_log_admin_id_idx" ON "public"."admin_audit_log" USING "btree" ("admin_id");



CREATE INDEX "admin_audit_log_created_at_idx" ON "public"."admin_audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "cms_articles_type_status_idx" ON "public"."cms_articles" USING "btree" ("article_type", "status");



CREATE INDEX "gdpr_requests_status_idx" ON "public"."gdpr_requests" USING "btree" ("status") WHERE ("status" = 'pending'::"text");



CREATE UNIQUE INDEX "idx_agencies_companies_house_no" ON "public"."agencies" USING "btree" ("companies_house_no") WHERE ("companies_house_no" IS NOT NULL);



CREATE INDEX "idx_agent_agency_profiles_agency_id" ON "public"."agent_agency_profiles" USING "btree" ("agency_id") WHERE ("agency_id" IS NOT NULL);



CREATE INDEX "idx_agent_agency_profiles_agent_id" ON "public"."agent_agency_profiles" USING "btree" ("agent_id");



CREATE UNIQUE INDEX "idx_agent_agency_profiles_slug" ON "public"."agent_agency_profiles" USING "btree" ("slug") WHERE ("slug" IS NOT NULL);



CREATE INDEX "idx_agent_api_keys_agent_id" ON "public"."agent_api_keys" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_api_keys_key_hash" ON "public"."agent_api_keys" USING "btree" ("key_hash");



CREATE INDEX "idx_agent_branches_agent_id" ON "public"."agent_branches" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_commissions_agent_id" ON "public"."agent_commissions" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_commissions_property_id" ON "public"."agent_commissions" USING "btree" ("property_id");



CREATE INDEX "idx_agent_crm_clients_agent_id" ON "public"."agent_crm_clients" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_crm_clients_user_id" ON "public"."agent_crm_clients" USING "btree" ("user_id");



CREATE INDEX "idx_agent_enquiries_seller_id" ON "public"."agent_enquiries" USING "btree" ("seller_id");



CREATE INDEX "idx_agent_feed_integrations_agent_id" ON "public"."agent_feed_integrations" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_lead_activities_actor_id" ON "public"."agent_lead_activities" USING "btree" ("actor_id");



CREATE INDEX "idx_agent_lead_activities_lead_id" ON "public"."agent_lead_activities" USING "btree" ("lead_id");



CREATE INDEX "idx_agent_leads_agent_id" ON "public"."agent_leads" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_leads_agent_stage" ON "public"."agent_leads" USING "btree" ("agent_id", "stage");



CREATE INDEX "idx_agent_leads_property_id" ON "public"."agent_leads" USING "btree" ("property_id");



CREATE INDEX "idx_agent_offer_history_offer_id" ON "public"."agent_offer_history" USING "btree" ("offer_id");



CREATE INDEX "idx_agent_offers_agent_id" ON "public"."agent_offers" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_offers_agent_status" ON "public"."agent_offers" USING "btree" ("agent_id", "status");



CREATE INDEX "idx_agent_offers_lead_id" ON "public"."agent_offers" USING "btree" ("lead_id");



CREATE INDEX "idx_agent_offers_property_id" ON "public"."agent_offers" USING "btree" ("property_id");



CREATE INDEX "idx_agent_profiles_areas" ON "public"."agent_profiles" USING "gin" ("areas_covered");



CREATE INDEX "idx_agent_sale_progressions_agent_id" ON "public"."agent_sale_progressions" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_sale_progressions_offer_id" ON "public"."agent_sale_progressions" USING "btree" ("offer_id");



CREATE INDEX "idx_agent_team_members_agent_id" ON "public"."agent_team_members" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_team_members_branch_id" ON "public"."agent_team_members" USING "btree" ("branch_id");



CREATE INDEX "idx_agent_team_members_user_id" ON "public"."agent_team_members" USING "btree" ("user_id");



CREATE INDEX "idx_agent_vendor_reports_agent_id" ON "public"."agent_vendor_reports" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_vendor_reports_property_id" ON "public"."agent_vendor_reports" USING "btree" ("property_id");



CREATE INDEX "idx_agent_viewing_feedback_agent_id" ON "public"."agent_viewing_feedback" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_viewing_feedback_viewing_slot_id" ON "public"."agent_viewing_feedback" USING "btree" ("viewing_slot_id");



CREATE INDEX "idx_agent_viewing_slots_agent_id" ON "public"."agent_viewing_slots" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_viewing_slots_property_id" ON "public"."agent_viewing_slots" USING "btree" ("property_id");



CREATE INDEX "idx_agent_viewing_slots_start_time" ON "public"."agent_viewing_slots" USING "btree" ("start_time");



CREATE INDEX "idx_ai_match_results_expires_at" ON "public"."ai_match_results" USING "btree" ("expires_at");



CREATE INDEX "idx_ai_match_results_user_expires" ON "public"."ai_match_results" USING "btree" ("user_id", "expires_at");



CREATE INDEX "idx_ai_match_results_user_id" ON "public"."ai_match_results" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_events_listing_date" ON "public"."listing_analytics_events" USING "btree" ("listing_id", "occurred_at" DESC);



CREATE UNIQUE INDEX "idx_area_rating_stats_pk" ON "public"."area_rating_stats" USING "btree" ("area_code", "trade_category");



CREATE INDEX "idx_auth_audit_user_id" ON "public"."auth_audit_log" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_bookings_provider_status" ON "public"."bookings" USING "btree" ("provider_id", "status");



CREATE INDEX "idx_bookings_schedule_active" ON "public"."bookings" USING "btree" ("scheduled_start_date") WHERE ("status" = ANY (ARRAY['confirmed'::"public"."booking_status", 'in_progress'::"public"."booking_status"]));



CREATE INDEX "idx_bookings_user_status" ON "public"."bookings" USING "btree" ("user_id", "status");



CREATE INDEX "idx_bsh_booking" ON "public"."booking_status_history" USING "btree" ("booking_id");



CREATE INDEX "idx_certificates_booking_id" ON "public"."certificates" USING "btree" ("booking_id");



CREATE INDEX "idx_certificates_provider_id" ON "public"."certificates" USING "btree" ("provider_id");



CREATE INDEX "idx_certificates_provider_type" ON "public"."certificates" USING "btree" ("provider_id", "certificate_type");



CREATE INDEX "idx_chain_links_downstream" ON "public"."chain_links" USING "btree" ("downstream_progression_id");



CREATE INDEX "idx_chain_links_group" ON "public"."chain_links" USING "btree" ("chain_group_id");



CREATE INDEX "idx_chain_links_upstream" ON "public"."chain_links" USING "btree" ("upstream_progression_id");



CREATE INDEX "idx_chain_risk_scores_group" ON "public"."chain_risk_scores" USING "btree" ("chain_group_id");



CREATE INDEX "idx_chain_risk_scores_level" ON "public"."chain_risk_scores" USING "btree" ("risk_level");



CREATE INDEX "idx_chain_risk_scores_progression" ON "public"."chain_risk_scores" USING "btree" ("progression_id");



CREATE INDEX "idx_consent_audit_user_id" ON "public"."consent_audit_log" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_consent_records_user_id" ON "public"."consent_records" USING "btree" ("user_id");



CREATE INDEX "idx_content_reports_status_entity" ON "public"."content_reports" USING "btree" ("status", "entity_type") WHERE ("status" = 'open'::"text");



CREATE INDEX "idx_conversations_participant_1" ON "public"."conversations" USING "btree" ("participant_1_id", "last_message_at" DESC);



CREATE INDEX "idx_conversations_participant_2" ON "public"."conversations" USING "btree" ("participant_2_id", "last_message_at" DESC);



CREATE INDEX "idx_documents_expiry" ON "public"."property_documents" USING "btree" ("expiry_date") WHERE ("expiry_date" IS NOT NULL);



CREATE INDEX "idx_documents_property" ON "public"."property_documents" USING "btree" ("property_id");



CREATE INDEX "idx_documents_reminder" ON "public"."property_documents" USING "btree" ("next_reminder_date") WHERE (("next_reminder_date" IS NOT NULL) AND ("reminder_sent" = false));



CREATE INDEX "idx_email_logs_created_at" ON "public"."email_logs" USING "btree" ("created_at");



CREATE INDEX "idx_email_logs_status" ON "public"."email_logs" USING "btree" ("status");



CREATE INDEX "idx_email_logs_user_id" ON "public"."email_logs" USING "btree" ("user_id");



CREATE INDEX "idx_financial_property" ON "public"."financial_entries" USING "btree" ("property_id", "entry_date" DESC);



CREATE INDEX "idx_financial_type" ON "public"."financial_entries" USING "btree" ("property_id", "type", "entry_date" DESC);



CREATE INDEX "idx_financial_user" ON "public"."financial_entries" USING "btree" ("user_id");



CREATE INDEX "idx_intro_events_intro" ON "public"."introduction_events" USING "btree" ("introduction_id", "created_at" DESC);



CREATE INDEX "idx_intro_status_history_intro" ON "public"."introduction_status_history" USING "btree" ("introduction_id", "created_at" DESC);



CREATE INDEX "idx_introductions_agent" ON "public"."introductions" USING "btree" ("agent_id");



CREATE INDEX "idx_introductions_applicant" ON "public"."introductions" USING "btree" ("applicant_id");



CREATE INDEX "idx_introductions_branch" ON "public"."introductions" USING "btree" ("branch_id");



CREATE INDEX "idx_introductions_listing" ON "public"."introductions" USING "btree" ("listing_id");



CREATE INDEX "idx_introductions_occurred" ON "public"."introductions" USING "btree" ("occurred_at" DESC);



CREATE INDEX "idx_inventory_reports_property_id" ON "public"."inventory_reports" USING "btree" ("property_id");



CREATE INDEX "idx_invoice_candidates_intro" ON "public"."invoice_candidates" USING "btree" ("introduction_id");



CREATE INDEX "idx_invoice_candidates_outcome" ON "public"."invoice_candidates" USING "btree" ("reported_outcome_id");



CREATE INDEX "idx_invoice_disputes_invoice" ON "public"."invoice_disputes" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoice_disputes_open" ON "public"."invoice_disputes" USING "btree" ("raised_at" DESC) WHERE ("status" = 'open'::"text");



CREATE INDEX "idx_invoice_disputes_raised_by" ON "public"."invoice_disputes" USING "btree" ("raised_by");



CREATE INDEX "idx_invoice_events_invoice" ON "public"."invoice_events" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoices_org_agent" ON "public"."invoices" USING "btree" ("org_agent_id");



CREATE INDEX "idx_jwt_claims_errors_created" ON "public"."jwt_claims_errors" USING "btree" ("created_at");



CREATE INDEX "idx_listing_analytics_events_listing_id" ON "public"."listing_analytics_events" USING "btree" ("listing_id");



CREATE INDEX "idx_listing_moderation_status" ON "public"."listing_moderation" USING "btree" ("status") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_listings_branch_id" ON "public"."listings" USING "btree" ("branch_id");



CREATE INDEX "idx_listings_listed_date" ON "public"."listings" USING "btree" ("listed_date" DESC);



CREATE INDEX "idx_listings_search" ON "public"."listings" USING "btree" ("listing_type", "status", "price");



CREATE INDEX "idx_listings_slug" ON "public"."listings" USING "btree" ("slug");



CREATE INDEX "idx_listings_user_id" ON "public"."listings" USING "btree" ("user_id");



CREATE INDEX "idx_maintenance_property" ON "public"."maintenance_requests" USING "btree" ("property_id");



CREATE INDEX "idx_maintenance_reported_by" ON "public"."maintenance_requests" USING "btree" ("reported_by");



CREATE INDEX "idx_maintenance_status" ON "public"."maintenance_requests" USING "btree" ("property_id", "status") WHERE ("status" <> ALL (ARRAY['resolved'::"public"."maintenance_status", 'closed'::"public"."maintenance_status"]));



CREATE INDEX "idx_messages_conversation_created" ON "public"."messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_moving_checklist_items_offer_id" ON "public"."moving_checklist_items" USING "btree" ("offer_id");



CREATE INDEX "idx_moving_checklist_items_user_id" ON "public"."moving_checklist_items" USING "btree" ("user_id");



CREATE INDEX "idx_moving_checklist_user_offer" ON "public"."moving_checklist_items" USING "btree" ("user_id", "offer_id");



CREATE INDEX "idx_mq_priority" ON "public"."moderation_queue" USING "btree" ("priority_score" DESC) WHERE ("completed_at" IS NULL);



CREATE INDEX "idx_offer_status_history_offer_id" ON "public"."offer_status_history" USING "btree" ("offer_id");



CREATE INDEX "idx_offers_listing_id" ON "public"."offers" USING "btree" ("listing_id");



CREATE INDEX "idx_offers_status" ON "public"."offers" USING "btree" ("status");



CREATE INDEX "idx_offers_user_id" ON "public"."offers" USING "btree" ("user_id");



CREATE INDEX "idx_offers_user_status" ON "public"."offers" USING "btree" ("user_id", "status");



CREATE UNIQUE INDEX "idx_one_accepted_offer_per_listing" ON "public"."seller_offers" USING "btree" ("listing_id") WHERE ("status" = 'accepted'::"text");



CREATE INDEX "idx_pa_provider_dates" ON "public"."provider_availability" USING "btree" ("provider_id", "start_date", "end_date");



CREATE INDEX "idx_payment_schedules_booking_id" ON "public"."payment_schedules" USING "btree" ("booking_id");



CREATE INDEX "idx_payment_schedules_provider_id" ON "public"."payment_schedules" USING "btree" ("provider_id");



CREATE INDEX "idx_platform_events_actor" ON "public"."platform_events" USING "btree" ("actor_id", "created_at" DESC);



CREATE INDEX "idx_platform_events_created" ON "public"."platform_events" USING "btree" ("created_at");



CREATE INDEX "idx_platform_events_entity" ON "public"."platform_events" USING "btree" ("entity_id", "created_at" DESC);



CREATE INDEX "idx_portfolio_items_provider" ON "public"."provider_portfolio_items" USING "btree" ("provider_id", "sort_order");



CREATE INDEX "idx_ppd_date" ON "public"."price_paid_transactions" USING "btree" ("transaction_date" DESC);



CREATE INDEX "idx_ppd_district" ON "public"."price_paid_transactions" USING "btree" ("district");



CREATE INDEX "idx_ppd_district_slug" ON "public"."price_paid_transactions" USING "btree" ("district_slug");



CREATE INDEX "idx_ppd_district_slug_cat" ON "public"."price_paid_transactions" USING "btree" ("district_slug", "transaction_category") WHERE ("record_status" = ANY (ARRAY['A'::"text", 'C'::"text"]));



CREATE INDEX "idx_ppd_match_candidates_listing" ON "public"."ppd_match_candidates" USING "btree" ("listing_id");



CREATE INDEX "idx_ppd_postcode" ON "public"."price_paid_transactions" USING "btree" ("postcode");



CREATE INDEX "idx_ppd_postcode_area" ON "public"."price_paid_transactions" USING "btree" ("postcode_area");



CREATE INDEX "idx_ppd_postcode_cat" ON "public"."price_paid_transactions" USING "btree" ("postcode", "transaction_category") WHERE ("record_status" = ANY (ARRAY['A'::"text", 'C'::"text"]));



CREATE INDEX "idx_ppd_postcode_paon" ON "public"."price_paid_transactions" USING "btree" ("postcode", "paon");



CREATE INDEX "idx_ppd_town" ON "public"."price_paid_transactions" USING "btree" ("town_city");



CREATE INDEX "idx_ppd_town_slug" ON "public"."price_paid_transactions" USING "btree" ("town_slug");



CREATE INDEX "idx_ppd_town_slug_cat" ON "public"."price_paid_transactions" USING "btree" ("town_slug", "transaction_category") WHERE ("record_status" = ANY (ARRAY['A'::"text", 'C'::"text"]));



CREATE INDEX "idx_ppd_transactions_postcode" ON "public"."ppd_transactions" USING "btree" ("postcode");



CREATE INDEX "idx_ppd_type_date" ON "public"."price_paid_transactions" USING "btree" ("property_type", "transaction_date" DESC);



CREATE INDEX "idx_price_history_listing_changed" ON "public"."price_history" USING "btree" ("listing_id", "changed_at" DESC);



CREATE INDEX "idx_profiles_active_role" ON "public"."profiles" USING "btree" ("active_role") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_profiles_onboarding_incomplete" ON "public"."profiles" USING "btree" ("onboarding_step") WHERE ("onboarding_complete" = false);



CREATE INDEX "idx_properties_coordinates" ON "public"."properties" USING "gist" ("coordinates");



CREATE INDEX "idx_properties_description_tsv" ON "public"."properties" USING "gin" ("description_tsv");



CREATE INDEX "idx_properties_features" ON "public"."properties" USING "gin" ("features");



CREATE INDEX "idx_properties_is_hmo" ON "public"."properties" USING "btree" ("is_hmo") WHERE ("is_hmo" = true);



CREATE INDEX "idx_property_documents_active" ON "public"."property_documents" USING "btree" ("property_id", "category", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_property_insights_property_type" ON "public"."property_insights" USING "btree" ("property_id", "insight_type");



CREATE INDEX "idx_property_media_listing_sort" ON "public"."property_media" USING "btree" ("listing_id", "sort_order");



CREATE INDEX "idx_property_renovation_scenarios_user_property" ON "public"."property_renovation_scenarios" USING "btree" ("user_id", "property_id");



CREATE INDEX "idx_property_views_property_id_created" ON "public"."property_views" USING "btree" ("property_id", "created_at");



CREATE INDEX "idx_provider_analytics_daily_provider_date" ON "public"."provider_analytics_daily" USING "btree" ("provider_id", "date" DESC);



CREATE INDEX "idx_provider_badges_is_active" ON "public"."provider_badges" USING "btree" ("provider_id", "is_active");



CREATE INDEX "idx_provider_badges_provider_id" ON "public"."provider_badges" USING "btree" ("provider_id");



CREATE INDEX "idx_provider_boosts_active" ON "public"."provider_boosts" USING "btree" ("is_active", "ends_at") WHERE ("is_active" = true);



CREATE INDEX "idx_provider_boosts_provider_id" ON "public"."provider_boosts" USING "btree" ("provider_id");



CREATE INDEX "idx_provider_invoices_booking_id" ON "public"."provider_invoices" USING "btree" ("booking_id");



CREATE INDEX "idx_provider_invoices_client_id" ON "public"."provider_invoices" USING "btree" ("client_id");



CREATE INDEX "idx_provider_invoices_provider_id" ON "public"."provider_invoices" USING "btree" ("provider_id");



CREATE INDEX "idx_provider_invoices_status" ON "public"."provider_invoices" USING "btree" ("status");



CREATE INDEX "idx_provider_invoices_stripe_payment_intent" ON "public"."provider_invoices" USING "btree" ("stripe_payment_intent_id") WHERE ("stripe_payment_intent_id" IS NOT NULL);



CREATE INDEX "idx_provider_references_pending_reminders" ON "public"."provider_references" USING "btree" ("status", "cancelled_at", "last_reminded_at") WHERE (("status" = 'pending'::"public"."provider_reference_status") AND ("cancelled_at" IS NULL));



CREATE INDEX "idx_provider_references_provider_id" ON "public"."provider_references" USING "btree" ("provider_id");



CREATE INDEX "idx_provider_references_status" ON "public"."provider_references" USING "btree" ("status");



CREATE INDEX "idx_provider_referrals_referral_code" ON "public"."provider_referrals" USING "btree" ("referral_code");



CREATE INDEX "idx_provider_referrals_referred_user_id" ON "public"."provider_referrals" USING "btree" ("referred_user_id") WHERE ("referred_user_id" IS NOT NULL);



CREATE INDEX "idx_provider_referrals_referrer_id" ON "public"."provider_referrals" USING "btree" ("referrer_id");



CREATE INDEX "idx_provider_service_areas_provider_id" ON "public"."provider_service_areas" USING "btree" ("provider_id");



CREATE INDEX "idx_provider_service_areas_zone" ON "public"."provider_service_areas" USING "gist" ("zone");



CREATE INDEX "idx_provider_services_provider_id" ON "public"."provider_services" USING "btree" ("provider_id");



CREATE INDEX "idx_provider_verifications_status" ON "public"."provider_verifications" USING "btree" ("status") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_provider_verifications_user" ON "public"."provider_verifications" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_quotes_one_accepted_per_rfq" ON "public"."quotes" USING "btree" ("service_request_id") WHERE ("status" = 'accepted'::"public"."quote_status");



CREATE INDEX "idx_quotes_provider_status" ON "public"."quotes" USING "btree" ("provider_id", "status");



CREATE INDEX "idx_quotes_request_status" ON "public"."quotes" USING "btree" ("service_request_id", "status");



CREATE INDEX "idx_rebuttals_intro" ON "public"."rebuttals" USING "btree" ("introduction_id");



CREATE INDEX "idx_referral_codes_v2_code" ON "public"."referral_codes_v2" USING "btree" ("code");



CREATE INDEX "idx_referral_conversions_referrer_id" ON "public"."referral_conversions" USING "btree" ("referrer_id");



CREATE INDEX "idx_referral_rewards_recipient" ON "public"."referral_rewards" USING "btree" ("recipient_id");



CREATE INDEX "idx_referral_rewards_referral" ON "public"."referral_rewards" USING "btree" ("referral_id");



CREATE INDEX "idx_referral_rewards_status" ON "public"."referral_rewards" USING "btree" ("status");



CREATE INDEX "idx_referrals_referral_code" ON "public"."referrals" USING "btree" ("referral_code");



CREATE INDEX "idx_referrals_referrer_id" ON "public"."referrals" USING "btree" ("referrer_id");



CREATE INDEX "idx_referrals_status" ON "public"."referrals" USING "btree" ("status");



CREATE INDEX "idx_renovation_benchmarks_type_region" ON "public"."renovation_type_benchmarks" USING "btree" ("renovation_type", "region");



CREATE INDEX "idx_renovation_scenarios_property_id" ON "public"."property_renovation_scenarios" USING "btree" ("property_id");



CREATE INDEX "idx_renovation_scenarios_user_id" ON "public"."property_renovation_scenarios" USING "btree" ("user_id");



CREATE INDEX "idx_reported_outcomes_intro" ON "public"."reported_outcomes" USING "btree" ("introduction_id");



CREATE INDEX "idx_reviews_provider_moderated" ON "public"."reviews" USING "btree" ("provider_id", "moderation_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_reviews_search_vector" ON "public"."reviews" USING "gin" ("search_vector");



CREATE INDEX "idx_sale_progression_offer_id" ON "public"."sale_progression_stages" USING "btree" ("offer_id");



CREATE UNIQUE INDEX "idx_sale_progression_share_token" ON "public"."sale_progression_stages" USING "btree" ("share_token");



CREATE INDEX "idx_saved_searches_user_id" ON "public"."saved_searches" USING "btree" ("user_id");



CREATE INDEX "idx_search_listings_coordinates" ON "public"."search_listings" USING "gist" ("coordinates");



CREATE UNIQUE INDEX "idx_search_listings_listing_id" ON "public"."search_listings" USING "btree" ("listing_id");



CREATE INDEX "idx_search_listings_tsv" ON "public"."search_listings" USING "gin" ("description_tsv");



CREATE INDEX "idx_search_listings_type_price" ON "public"."search_listings" USING "btree" ("listing_type", "price");



CREATE INDEX "idx_seller_listings_seller_id" ON "public"."seller_listings" USING "btree" ("seller_id");



CREATE INDEX "idx_seller_listings_status" ON "public"."seller_listings" USING "btree" ("status");



CREATE INDEX "idx_seller_offers_listing_id" ON "public"."seller_offers" USING "btree" ("listing_id");



CREATE INDEX "idx_seller_offers_seller_id" ON "public"."seller_offers" USING "btree" ("seller_id");



CREATE INDEX "idx_seller_viewings_listing_id" ON "public"."seller_viewings" USING "btree" ("listing_id");



CREATE INDEX "idx_seller_viewings_seller_id" ON "public"."seller_viewings" USING "btree" ("seller_id");



CREATE INDEX "idx_service_job_milestones_booking" ON "public"."service_job_milestones" USING "btree" ("booking_id");



CREATE INDEX "idx_spd_base_location" ON "public"."service_provider_details" USING "gist" ("base_location");



CREATE INDEX "idx_spd_service_postcodes" ON "public"."service_provider_details" USING "gin" ("service_postcodes");



CREATE INDEX "idx_spd_services" ON "public"."service_provider_details" USING "gin" ("services");



CREATE INDEX "idx_spd_slug" ON "public"."service_provider_details" USING "btree" ("slug");



CREATE INDEX "idx_sr_category_open" ON "public"."service_requests" USING "btree" ("service_category", "status") WHERE ("status" = 'open'::"public"."rfq_status");



CREATE INDEX "idx_sr_lat_lng" ON "public"."service_requests" USING "btree" ("lat", "lng") WHERE (("lat" IS NOT NULL) AND ("lng" IS NOT NULL));



CREATE INDEX "idx_sr_property_location" ON "public"."service_requests" USING "gist" ("property_location");



CREATE INDEX "idx_sr_user_status" ON "public"."service_requests" USING "btree" ("user_id", "status");



CREATE INDEX "idx_stripe_connect_accounts_provider_id" ON "public"."stripe_connect_accounts" USING "btree" ("provider_id");



CREATE INDEX "idx_stripe_connect_accounts_stripe_account_id" ON "public"."stripe_connect_accounts" USING "btree" ("stripe_account_id");



CREATE INDEX "idx_stripe_events_event_id" ON "public"."stripe_events" USING "btree" ("event_id");



CREATE INDEX "idx_stripe_events_event_type" ON "public"."stripe_events" USING "btree" ("event_type");



CREATE INDEX "idx_stripe_events_processed_at" ON "public"."stripe_events" USING "btree" ("processed_at" DESC);



CREATE INDEX "idx_tenancies_landlord" ON "public"."tenancies" USING "btree" ("landlord_id");



CREATE INDEX "idx_tenancies_lease_end" ON "public"."tenancies" USING "btree" ("lease_end_date") WHERE ("status" = 'active'::"public"."tenancy_status");



CREATE INDEX "idx_tenancies_property" ON "public"."tenancies" USING "btree" ("property_id") WHERE ("status" = 'active'::"public"."tenancy_status");



CREATE INDEX "idx_tenant_applications_landlord_id" ON "public"."tenant_applications" USING "btree" ("landlord_id");



CREATE INDEX "idx_tenant_applications_property_id" ON "public"."tenant_applications" USING "btree" ("property_id");



CREATE INDEX "idx_transaction_milestones_txn" ON "public"."transaction_milestones" USING "btree" ("transaction_id");



CREATE INDEX "idx_transport_stops_coordinates" ON "public"."transport_stops" USING "gist" ("coordinates");



CREATE INDEX "idx_truedeed_audit_entity" ON "public"."truedeed_audit_log" USING "btree" ("entity", "entity_id", "created_at" DESC);



CREATE INDEX "idx_user_backup_codes_user_id" ON "public"."user_backup_codes" USING "btree" ("user_id");



CREATE INDEX "idx_user_documents_offer_id" ON "public"."user_documents" USING "btree" ("offer_id");



CREATE INDEX "idx_user_documents_user_id" ON "public"."user_documents" USING "btree" ("user_id");



CREATE INDEX "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_viewing_slots_agent_id" ON "public"."viewing_slots" USING "btree" ("agent_id");



CREATE INDEX "idx_viewing_slots_listing_id" ON "public"."viewing_slots" USING "btree" ("listing_id");



CREATE INDEX "idx_viewing_slots_start_time" ON "public"."viewing_slots" USING "btree" ("start_time");



CREATE INDEX "idx_viewings_listing_id" ON "public"."viewings" USING "btree" ("listing_id");



CREATE INDEX "idx_viewings_slot_id" ON "public"."viewings" USING "btree" ("slot_id");



CREATE INDEX "idx_viewings_user_id" ON "public"."viewings" USING "btree" ("user_id");



CREATE INDEX "idx_viewings_user_status" ON "public"."viewings" USING "btree" ("user_id", "status");



CREATE INDEX "invite_codes_audience_idx" ON "public"."invite_codes" USING "btree" ("audience") WHERE ("redeemed_at" IS NULL);



CREATE INDEX "invite_codes_redeemed_idx" ON "public"."invite_codes" USING "btree" ("redeemed_at");



CREATE INDEX "ppd_exact_match_idx" ON "public"."price_paid_data" USING "btree" ("postcode", "paon", "date_of_transfer" DESC) WHERE ("postcode" IS NOT NULL);



CREATE INDEX "ppd_flat_match_idx" ON "public"."price_paid_data" USING "btree" ("postcode", "paon", "saon") WHERE (("postcode" IS NOT NULL) AND ("saon" IS NOT NULL));



CREATE INDEX "ppd_outward_date_idx" ON "public"."price_paid_data" USING "btree" ("outward_code", "date_of_transfer" DESC);



CREATE INDEX "ppd_paon_trgm" ON "public"."ppd_transactions" USING "gin" ("paon" "public"."gin_trgm_ops");



CREATE INDEX "profiles_admin_role_idx" ON "public"."profiles" USING "btree" ("admin_role") WHERE ("is_admin" = true);



CREATE INDEX "profiles_search_idx" ON "public"."profiles" USING "gin" ("to_tsvector"('"english"'::"regconfig", COALESCE("display_name", ''::"text")));



CREATE INDEX "sdr_messages_status_idx" ON "public"."sdr_messages" USING "btree" ("status");



CREATE INDEX "sdr_targets_campaign_idx" ON "public"."sdr_targets" USING "btree" ("campaign_id");



CREATE INDEX "subscriptions_user_id_idx" ON "public"."subscriptions" USING "btree" ("user_id");



ALTER INDEX "public"."activity_log_pkey" ATTACH PARTITION "public"."activity_log_2026_03_pkey";



ALTER INDEX "public"."idx_activity_log_user_created" ATTACH PARTITION "public"."activity_log_2026_03_user_id_created_at_idx";



ALTER INDEX "public"."activity_log_pkey" ATTACH PARTITION "public"."activity_log_2026_04_pkey";



ALTER INDEX "public"."idx_activity_log_user_created" ATTACH PARTITION "public"."activity_log_2026_04_user_id_created_at_idx";



ALTER INDEX "public"."activity_log_pkey" ATTACH PARTITION "public"."activity_log_2026_05_pkey";



ALTER INDEX "public"."idx_activity_log_user_created" ATTACH PARTITION "public"."activity_log_2026_05_user_id_created_at_idx";



ALTER INDEX "public"."activity_log_pkey" ATTACH PARTITION "public"."activity_log_2026_06_pkey";



ALTER INDEX "public"."idx_activity_log_user_created" ATTACH PARTITION "public"."activity_log_2026_06_user_id_created_at_idx";



ALTER INDEX "public"."activity_log_pkey" ATTACH PARTITION "public"."activity_log_2026_07_pkey";



ALTER INDEX "public"."idx_activity_log_user_created" ATTACH PARTITION "public"."activity_log_2026_07_user_id_created_at_idx";



ALTER INDEX "public"."activity_log_pkey" ATTACH PARTITION "public"."activity_log_2026_08_pkey";



ALTER INDEX "public"."idx_activity_log_user_created" ATTACH PARTITION "public"."activity_log_2026_08_user_id_created_at_idx";



ALTER INDEX "public"."activity_log_pkey" ATTACH PARTITION "public"."activity_log_2026_09_pkey";



ALTER INDEX "public"."idx_activity_log_user_created" ATTACH PARTITION "public"."activity_log_2026_09_user_id_created_at_idx";



ALTER INDEX "public"."activity_log_pkey" ATTACH PARTITION "public"."activity_log_2026_10_pkey";



ALTER INDEX "public"."idx_activity_log_user_created" ATTACH PARTITION "public"."activity_log_2026_10_user_id_created_at_idx";



ALTER INDEX "public"."activity_log_pkey" ATTACH PARTITION "public"."activity_log_2026_11_pkey";



ALTER INDEX "public"."idx_activity_log_user_created" ATTACH PARTITION "public"."activity_log_2026_11_user_id_created_at_idx";



ALTER INDEX "public"."activity_log_pkey" ATTACH PARTITION "public"."activity_log_2026_12_pkey";



ALTER INDEX "public"."idx_activity_log_user_created" ATTACH PARTITION "public"."activity_log_2026_12_user_id_created_at_idx";



ALTER INDEX "public"."activity_log_pkey" ATTACH PARTITION "public"."activity_log_2027_01_pkey";



ALTER INDEX "public"."idx_activity_log_user_created" ATTACH PARTITION "public"."activity_log_2027_01_user_id_created_at_idx";



ALTER INDEX "public"."activity_log_pkey" ATTACH PARTITION "public"."activity_log_2027_02_pkey";



ALTER INDEX "public"."idx_activity_log_user_created" ATTACH PARTITION "public"."activity_log_2027_02_user_id_created_at_idx";



CREATE OR REPLACE TRIGGER "bookings_generate_reference" BEFORE INSERT ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."generate_booking_reference"();



CREATE OR REPLACE TRIGGER "bookings_update_completed_count" AFTER UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_completed_jobs_count"();



CREATE OR REPLACE TRIGGER "bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "chain_links_updated_at" BEFORE UPDATE ON "public"."chain_links" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "chain_risk_scores_updated_at" BEFORE UPDATE ON "public"."chain_risk_scores" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "consent_change_audit" AFTER INSERT OR UPDATE ON "public"."consent_records" FOR EACH ROW EXECUTE FUNCTION "public"."log_consent_change"();



CREATE OR REPLACE TRIGGER "consent_records_updated_at" BEFORE UPDATE ON "public"."consent_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "feature_flags_updated_at" BEFORE UPDATE ON "public"."feature_flags" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "introduction_events_immutable" BEFORE DELETE OR UPDATE ON "public"."introduction_events" FOR EACH ROW EXECUTE FUNCTION "public"."truedeed_forbid_mutation"();



CREATE OR REPLACE TRIGGER "introduction_status_history_immutable" BEFORE DELETE OR UPDATE ON "public"."introduction_status_history" FOR EACH ROW EXECUTE FUNCTION "public"."truedeed_forbid_mutation"();



CREATE OR REPLACE TRIGGER "introductions_hash" BEFORE INSERT ON "public"."introductions" FOR EACH ROW EXECUTE FUNCTION "public"."truedeed_set_intro_hash"();



CREATE OR REPLACE TRIGGER "introductions_immutable" BEFORE DELETE OR UPDATE ON "public"."introductions" FOR EACH ROW EXECUTE FUNCTION "public"."truedeed_introductions_guard"();



CREATE OR REPLACE TRIGGER "invoice_candidates_guard" BEFORE DELETE OR UPDATE ON "public"."invoice_candidates" FOR EACH ROW EXECUTE FUNCTION "public"."truedeed_invoice_candidates_guard"();



CREATE OR REPLACE TRIGGER "invoice_disputes_immutable" BEFORE DELETE OR UPDATE ON "public"."invoice_disputes" FOR EACH ROW EXECUTE FUNCTION "public"."truedeed_invoice_disputes_guard"();



CREATE OR REPLACE TRIGGER "invoice_events_immutable" BEFORE DELETE OR UPDATE ON "public"."invoice_events" FOR EACH ROW EXECUTE FUNCTION "public"."truedeed_forbid_mutation"();



CREATE OR REPLACE TRIGGER "invoices_fill_number" BEFORE INSERT ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."truedeed_fill_invoice_number"();



CREATE OR REPLACE TRIGGER "invoices_state_guard" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."truedeed_invoices_guard"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "provider_availability_updated_at" BEFORE UPDATE ON "public"."provider_availability" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "provider_documents_updated_at" BEFORE UPDATE ON "public"."provider_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "provider_invoices_updated_at" BEFORE UPDATE ON "public"."provider_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "provider_service_areas_updated_at" BEFORE UPDATE ON "public"."provider_service_areas" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "provider_services_updated_at" BEFORE UPDATE ON "public"."provider_services" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "provider_verifications_updated_at" BEFORE UPDATE ON "public"."provider_verifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "quotes_generate_number" BEFORE INSERT ON "public"."quotes" FOR EACH ROW EXECUTE FUNCTION "public"."generate_quote_number"();



CREATE OR REPLACE TRIGGER "quotes_updated_at" BEFORE UPDATE ON "public"."quotes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "rebuttals_guard" BEFORE DELETE OR UPDATE ON "public"."rebuttals" FOR EACH ROW EXECUTE FUNCTION "public"."truedeed_rebuttals_guard"();



CREATE OR REPLACE TRIGGER "reported_outcomes_immutable" BEFORE DELETE OR UPDATE ON "public"."reported_outcomes" FOR EACH ROW EXECUTE FUNCTION "public"."truedeed_forbid_mutation"();



CREATE OR REPLACE TRIGGER "review_flags_defamation_boost" AFTER INSERT ON "public"."review_flags" FOR EACH ROW EXECUTE FUNCTION "public"."boost_defamation_flag_priority"();



CREATE OR REPLACE TRIGGER "reviews_on_created" BEFORE INSERT ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."on_review_created"();



CREATE OR REPLACE TRIGGER "reviews_update_rating_stats" AFTER UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_provider_rating_stats_incremental"();



CREATE OR REPLACE TRIGGER "reviews_updated_at" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "service_provider_details_updated_at" BEFORE UPDATE ON "public"."service_provider_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "service_requests_updated_at" BEFORE UPDATE ON "public"."service_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_agent_agency_profiles_updated_at" BEFORE UPDATE ON "public"."agent_agency_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_agent_branches_updated_at" BEFORE UPDATE ON "public"."agent_branches" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_agent_crm_clients_updated_at" BEFORE UPDATE ON "public"."agent_crm_clients" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_agent_feed_integrations_updated_at" BEFORE UPDATE ON "public"."agent_feed_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_agent_leads_updated_at" BEFORE UPDATE ON "public"."agent_leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_agent_offers_updated_at" BEFORE UPDATE ON "public"."agent_offers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_agent_sale_progressions_updated_at" BEFORE UPDATE ON "public"."agent_sale_progressions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_maintenance_updated_at" BEFORE UPDATE ON "public"."maintenance_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_reminder_date" BEFORE INSERT OR UPDATE OF "expiry_date" ON "public"."property_documents" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_reminder_date"();



CREATE OR REPLACE TRIGGER "set_tenancies_updated_at" BEFORE UPDATE ON "public"."tenancies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "stripe_connect_accounts_updated_at" BEFORE UPDATE ON "public"."stripe_connect_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_certificates_updated_at" BEFORE UPDATE ON "public"."certificates" FOR EACH ROW EXECUTE FUNCTION "public"."update_certificates_updated_at"();



CREATE OR REPLACE TRIGGER "trg_generate_listing_slug" BEFORE INSERT ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."generate_listing_slug"();



CREATE OR REPLACE TRIGGER "trg_payment_schedules_updated_at" BEFORE UPDATE ON "public"."payment_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_payment_schedules_updated_at"();



CREATE OR REPLACE TRIGGER "trg_ppd_updated_at" BEFORE UPDATE ON "public"."price_paid_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_ppd_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_track_price_changes" AFTER UPDATE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."track_price_changes"();



CREATE OR REPLACE TRIGGER "trg_update_listings_updated_at" BEFORE UPDATE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_update_properties_tsv" BEFORE INSERT OR UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_properties_tsv"();



CREATE OR REPLACE TRIGGER "trg_update_properties_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "truedeed_audit_log_immutable" BEFORE DELETE OR UPDATE ON "public"."truedeed_audit_log" FOR EACH ROW EXECUTE FUNCTION "public"."truedeed_forbid_mutation"();



CREATE OR REPLACE TRIGGER "update_sale_progression_updated_at" BEFORE UPDATE ON "public"."sale_progression_stages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_seller_listings_updated_at" BEFORE UPDATE ON "public"."seller_listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_seller_offers_updated_at" BEFORE UPDATE ON "public"."seller_offers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_seller_viewings_updated_at" BEFORE UPDATE ON "public"."seller_viewings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE "public"."activity_log"
    ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_agency_profiles"
    ADD CONSTRAINT "agent_agency_profiles_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agent_agency_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_agency_profiles"
    ADD CONSTRAINT "agent_agency_profiles_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_agency_profiles"
    ADD CONSTRAINT "agent_agency_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_api_keys"
    ADD CONSTRAINT "agent_api_keys_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_branches"
    ADD CONSTRAINT "agent_branches_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_commissions"
    ADD CONSTRAINT "agent_commissions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_commissions"
    ADD CONSTRAINT "agent_commissions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_crm_clients"
    ADD CONSTRAINT "agent_crm_clients_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_crm_clients"
    ADD CONSTRAINT "agent_crm_clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_enquiries"
    ADD CONSTRAINT "agent_enquiries_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_enquiries"
    ADD CONSTRAINT "agent_enquiries_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."seller_listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_enquiries"
    ADD CONSTRAINT "agent_enquiries_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_feed_integrations"
    ADD CONSTRAINT "agent_feed_integrations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_lead_activities"
    ADD CONSTRAINT "agent_lead_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_lead_activities"
    ADD CONSTRAINT "agent_lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."agent_leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_leads"
    ADD CONSTRAINT "agent_leads_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_leads"
    ADD CONSTRAINT "agent_leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_leads"
    ADD CONSTRAINT "agent_leads_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_offer_history"
    ADD CONSTRAINT "agent_offer_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_offer_history"
    ADD CONSTRAINT "agent_offer_history_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."agent_offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_offers"
    ADD CONSTRAINT "agent_offers_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_offers"
    ADD CONSTRAINT "agent_offers_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."agent_leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_offers"
    ADD CONSTRAINT "agent_offers_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_profiles"
    ADD CONSTRAINT "agent_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_sale_progressions"
    ADD CONSTRAINT "agent_sale_progressions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_sale_progressions"
    ADD CONSTRAINT "agent_sale_progressions_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."agent_offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_sale_progressions"
    ADD CONSTRAINT "agent_sale_progressions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_team_members"
    ADD CONSTRAINT "agent_team_members_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_team_members"
    ADD CONSTRAINT "agent_team_members_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."agent_branches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_team_members"
    ADD CONSTRAINT "agent_team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_vendor_reports"
    ADD CONSTRAINT "agent_vendor_reports_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_vendor_reports"
    ADD CONSTRAINT "agent_vendor_reports_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_viewing_feedback"
    ADD CONSTRAINT "agent_viewing_feedback_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_viewing_feedback"
    ADD CONSTRAINT "agent_viewing_feedback_viewing_slot_id_fkey" FOREIGN KEY ("viewing_slot_id") REFERENCES "public"."agent_viewing_slots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_viewing_slots"
    ADD CONSTRAINT "agent_viewing_slots_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_viewing_slots"
    ADD CONSTRAINT "agent_viewing_slots_booked_by_fkey" FOREIGN KEY ("booked_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_viewing_slots"
    ADD CONSTRAINT "agent_viewing_slots_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_match_preferences"
    ADD CONSTRAINT "ai_match_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_match_results"
    ADD CONSTRAINT "ai_match_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auth_audit_log"
    ADD CONSTRAINT "auth_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."billing_events"
    ADD CONSTRAINT "billing_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."booking_status_history"
    ADD CONSTRAINT "booking_status_history_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_status_history"
    ADD CONSTRAINT "booking_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_verifications"
    ADD CONSTRAINT "business_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chain_links"
    ADD CONSTRAINT "chain_links_downstream_progression_id_fkey" FOREIGN KEY ("downstream_progression_id") REFERENCES "public"."agent_sale_progressions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chain_links"
    ADD CONSTRAINT "chain_links_upstream_progression_id_fkey" FOREIGN KEY ("upstream_progression_id") REFERENCES "public"."agent_sale_progressions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chain_risk_scores"
    ADD CONSTRAINT "chain_risk_scores_progression_id_fkey" FOREIGN KEY ("progression_id") REFERENCES "public"."agent_sale_progressions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chain_risk_scores"
    ADD CONSTRAINT "chain_risk_scores_slowest_link_id_fkey" FOREIGN KEY ("slowest_link_id") REFERENCES "public"."agent_sale_progressions"("id");



ALTER TABLE ONLY "public"."cms_articles"
    ADD CONSTRAINT "cms_articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."consent_records"
    ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_reports"
    ADD CONSTRAINT "content_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_reports"
    ADD CONSTRAINT "content_reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."conversation_read_status"
    ADD CONSTRAINT "conversation_read_status_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_read_status"
    ADD CONSTRAINT "conversation_read_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_participant_1_id_fkey" FOREIGN KEY ("participant_1_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_participant_2_id_fkey" FOREIGN KEY ("participant_2_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deletion_requests"
    ADD CONSTRAINT "deletion_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."deposit_registrations"
    ADD CONSTRAINT "deposit_registrations_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "public"."tenancies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_campaigns"
    ADD CONSTRAINT "email_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."financial_entries"
    ADD CONSTRAINT "financial_entries_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_entries"
    ADD CONSTRAINT "financial_entries_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "public"."tenancies"("id");



ALTER TABLE ONLY "public"."financial_entries"
    ADD CONSTRAINT "financial_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gdpr_requests"
    ADD CONSTRAINT "gdpr_requests_fulfilled_by_fkey" FOREIGN KEY ("fulfilled_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."gdpr_requests"
    ADD CONSTRAINT "gdpr_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."introduction_events"
    ADD CONSTRAINT "introduction_events_introduction_id_fkey" FOREIGN KEY ("introduction_id") REFERENCES "public"."introductions"("id");



ALTER TABLE ONLY "public"."introduction_status_history"
    ADD CONSTRAINT "introduction_status_history_introduction_id_fkey" FOREIGN KEY ("introduction_id") REFERENCES "public"."introductions"("id");



ALTER TABLE ONLY "public"."introductions"
    ADD CONSTRAINT "introductions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."introductions"
    ADD CONSTRAINT "introductions_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."introductions"
    ADD CONSTRAINT "introductions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."agent_branches"("id");



ALTER TABLE ONLY "public"."introductions"
    ADD CONSTRAINT "introductions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id");



ALTER TABLE ONLY "public"."inventory_reports"
    ADD CONSTRAINT "inventory_reports_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."inventory_reports"
    ADD CONSTRAINT "inventory_reports_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_reports"
    ADD CONSTRAINT "inventory_reports_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "public"."tenancies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_redeemed_by_fkey" FOREIGN KEY ("redeemed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invoice_candidates"
    ADD CONSTRAINT "invoice_candidates_introduction_id_fkey" FOREIGN KEY ("introduction_id") REFERENCES "public"."introductions"("id");



ALTER TABLE ONLY "public"."invoice_candidates"
    ADD CONSTRAINT "invoice_candidates_ppd_match_id_fkey" FOREIGN KEY ("ppd_match_id") REFERENCES "public"."ppd_match_candidates"("id");



ALTER TABLE ONLY "public"."invoice_candidates"
    ADD CONSTRAINT "invoice_candidates_reported_outcome_id_fkey" FOREIGN KEY ("reported_outcome_id") REFERENCES "public"."reported_outcomes"("id");



ALTER TABLE ONLY "public"."invoice_disputes"
    ADD CONSTRAINT "invoice_disputes_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invoice_disputes"
    ADD CONSTRAINT "invoice_disputes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."invoice_disputes"
    ADD CONSTRAINT "invoice_disputes_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invoice_events"
    ADD CONSTRAINT "invoice_events_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_introduction_id_fkey" FOREIGN KEY ("introduction_id") REFERENCES "public"."introductions"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_candidate_id_fkey" FOREIGN KEY ("invoice_candidate_id") REFERENCES "public"."invoice_candidates"("id");



ALTER TABLE ONLY "public"."kyc_verifications"
    ADD CONSTRAINT "kyc_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landlord_profiles"
    ADD CONSTRAINT "landlord_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_analytics_events"
    ADD CONSTRAINT "listing_analytics_events_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."seller_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_description_attempts"
    ADD CONSTRAINT "listing_description_attempts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."seller_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_description_attempts"
    ADD CONSTRAINT "listing_description_attempts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_moderation"
    ADD CONSTRAINT "listing_moderation_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."agent_branches"("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "public"."tenancies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mobility_scores"
    ADD CONSTRAINT "mobility_scores_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moderation_queue"
    ADD CONSTRAINT "moderation_queue_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."moderation_queue"
    ADD CONSTRAINT "moderation_queue_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moving_checklist_items"
    ADD CONSTRAINT "moving_checklist_items_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."moving_checklist_items"
    ADD CONSTRAINT "moving_checklist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_status_history"
    ADD CONSTRAINT "offer_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."offer_status_history"
    ADD CONSTRAINT "offer_status_history_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_solicitor_id_fkey" FOREIGN KEY ("solicitor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_schedules"
    ADD CONSTRAINT "payment_schedules_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_schedules"
    ADD CONSTRAINT "payment_schedules_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."provider_invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_schedules"
    ADD CONSTRAINT "payment_schedules_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_schedules"
    ADD CONSTRAINT "payment_schedules_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."platform_events"
    ADD CONSTRAINT "platform_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ppd_match_candidates"
    ADD CONSTRAINT "ppd_match_candidates_introduction_id_fkey" FOREIGN KEY ("introduction_id") REFERENCES "public"."introductions"("id");



ALTER TABLE ONLY "public"."ppd_match_candidates"
    ADD CONSTRAINT "ppd_match_candidates_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id");



ALTER TABLE ONLY "public"."ppd_match_candidates"
    ADD CONSTRAINT "ppd_match_candidates_ppd_tuid_fkey" FOREIGN KEY ("ppd_tuid") REFERENCES "public"."ppd_transactions"("ppd_tuid");



ALTER TABLE ONLY "public"."ppd_transactions"
    ADD CONSTRAINT "ppd_transactions_ingest_run_id_fkey" FOREIGN KEY ("ingest_run_id") REFERENCES "public"."ppd_ingest_runs"("id");



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."property_documents"
    ADD CONSTRAINT "property_documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_documents"
    ADD CONSTRAINT "property_documents_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "public"."tenancies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_documents"
    ADD CONSTRAINT "property_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_insights"
    ADD CONSTRAINT "property_insights_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_media"
    ADD CONSTRAINT "property_media_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_media"
    ADD CONSTRAINT "property_media_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."property_renovation_scenarios"
    ADD CONSTRAINT "property_renovation_scenarios_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_renovation_scenarios"
    ADD CONSTRAINT "property_renovation_scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_views"
    ADD CONSTRAINT "property_views_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_analytics_daily"
    ADD CONSTRAINT "provider_analytics_daily_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_availability"
    ADD CONSTRAINT "provider_availability_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_badges"
    ADD CONSTRAINT "provider_badges_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_boosts"
    ADD CONSTRAINT "provider_boosts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_documents"
    ADD CONSTRAINT "provider_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."provider_documents"
    ADD CONSTRAINT "provider_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_invoices"
    ADD CONSTRAINT "provider_invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."provider_invoices"
    ADD CONSTRAINT "provider_invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."provider_invoices"
    ADD CONSTRAINT "provider_invoices_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_portfolio_items"
    ADD CONSTRAINT "provider_portfolio_items_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_rating_stats"
    ADD CONSTRAINT "provider_rating_stats_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_references"
    ADD CONSTRAINT "provider_references_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_referrals"
    ADD CONSTRAINT "provider_referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."provider_referrals"
    ADD CONSTRAINT "provider_referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_service_areas"
    ADD CONSTRAINT "provider_service_areas_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_services"
    ADD CONSTRAINT "provider_services_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_verifications"
    ADD CONSTRAINT "provider_verifications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."provider_verifications"
    ADD CONSTRAINT "provider_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rebuttals"
    ADD CONSTRAINT "rebuttals_introduction_id_fkey" FOREIGN KEY ("introduction_id") REFERENCES "public"."introductions"("id");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_codes_v2"
    ADD CONSTRAINT "referral_codes_v2_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_conversions"
    ADD CONSTRAINT "referral_conversions_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_conversions"
    ADD CONSTRAINT "referral_conversions_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_rewards"
    ADD CONSTRAINT "referral_rewards_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_rewards"
    ADD CONSTRAINT "referral_rewards_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."refund_requests"
    ADD CONSTRAINT "refund_requests_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."refund_requests"
    ADD CONSTRAINT "refund_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."renter_preferences"
    ADD CONSTRAINT "renter_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reported_outcomes"
    ADD CONSTRAINT "reported_outcomes_introduction_id_fkey" FOREIGN KEY ("introduction_id") REFERENCES "public"."introductions"("id");



ALTER TABLE ONLY "public"."review_flags"
    ADD CONSTRAINT "review_flags_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_flags"
    ADD CONSTRAINT "review_flags_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."review_flags"
    ADD CONSTRAINT "review_flags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_helpfulness"
    ADD CONSTRAINT "review_helpfulness_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_helpfulness"
    ADD CONSTRAINT "review_helpfulness_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_progression_stages"
    ADD CONSTRAINT "sale_progression_stages_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."seller_offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_progression_stages"
    ADD CONSTRAINT "sale_progression_stages_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sdr_campaigns"
    ADD CONSTRAINT "sdr_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sdr_messages"
    ADD CONSTRAINT "sdr_messages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."sdr_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sdr_messages"
    ADD CONSTRAINT "sdr_messages_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."sdr_targets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sdr_targets"
    ADD CONSTRAINT "sdr_targets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."sdr_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_analytics"
    ADD CONSTRAINT "search_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."seller_listings"
    ADD CONSTRAINT "seller_listings_managed_by_agent_id_fkey" FOREIGN KEY ("managed_by_agent_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."seller_listings"
    ADD CONSTRAINT "seller_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seller_offers"
    ADD CONSTRAINT "seller_offers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."seller_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seller_offers"
    ADD CONSTRAINT "seller_offers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seller_viewings"
    ADD CONSTRAINT "seller_viewings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."seller_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seller_viewings"
    ADD CONSTRAINT "seller_viewings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_areas"
    ADD CONSTRAINT "service_areas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_job_milestones"
    ADD CONSTRAINT "service_job_milestones_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."service_provider_details"
    ADD CONSTRAINT "service_provider_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."social_links"
    ADD CONSTRAINT "social_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider_details"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenancies"
    ADD CONSTRAINT "tenancies_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenancies"
    ADD CONSTRAINT "tenancies_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_applications"
    ADD CONSTRAINT "tenant_applications_applicant_user_id_fkey" FOREIGN KEY ("applicant_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tenant_applications"
    ADD CONSTRAINT "tenant_applications_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_applications"
    ADD CONSTRAINT "tenant_applications_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_milestones"
    ADD CONSTRAINT "transaction_milestones_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_backup_codes"
    ADD CONSTRAINT "user_backup_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_documents"
    ADD CONSTRAINT "user_documents_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_documents"
    ADD CONSTRAINT "user_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewing_history"
    ADD CONSTRAINT "viewing_history_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewing_history"
    ADD CONSTRAINT "viewing_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewing_slots"
    ADD CONSTRAINT "viewing_slots_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewings"
    ADD CONSTRAINT "viewings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."viewing_slots"("id");



ALTER TABLE ONLY "public"."viewings"
    ADD CONSTRAINT "viewings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all flags" ON "public"."review_flags" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can manage moderation queue" ON "public"."moderation_queue" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can read cron audit logs" ON "public"."compliance_cron_runs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can read invite codes" ON "public"."invite_codes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can update all profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() = true)) WITH CHECK (("public"."is_admin"() = true));



CREATE POLICY "Admins can view all documents" ON "public"."provider_documents" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("public"."is_admin"() = true));



CREATE POLICY "Admins manage invite codes" ON "public"."invite_codes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins only — campaigns" ON "public"."sdr_campaigns" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins only — messages" ON "public"."sdr_messages" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins only — targets" ON "public"."sdr_targets" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Agents manage own profile" ON "public"."agent_profiles" USING (("id" = "auth"."uid"()));



CREATE POLICY "Anyone can read agencies" ON "public"."agencies" FOR SELECT USING (true);



CREATE POLICY "Anyone can read agent profiles" ON "public"."agent_profiles" FOR SELECT USING (true);



CREATE POLICY "Anyone can read service areas" ON "public"."service_areas" FOR SELECT USING (true);



CREATE POLICY "Anyone can read social links" ON "public"."social_links" FOR SELECT USING (true);



CREATE POLICY "Anyone can record analytics" ON "public"."listing_analytics_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view transitions" ON "public"."booking_state_transitions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can redeem their own invite" ON "public"."invite_codes" FOR UPDATE TO "authenticated" USING (("redeemed_at" IS NULL)) WITH CHECK ((("redeemed_at" IS NOT NULL) AND ("redeemed_by" = "auth"."uid"())));



CREATE POLICY "Authenticated users can view profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "Booking parties can update" ON "public"."bookings" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("provider_id" = "auth"."uid"()))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("provider_id" = "auth"."uid"())));



CREATE POLICY "Booking parties can view history" ON "public"."booking_status_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "booking_status_history"."booking_id") AND (("bookings"."user_id" = "auth"."uid"()) OR ("bookings"."provider_id" = "auth"."uid"()))))));



CREATE POLICY "Landlords manage own tenancies" ON "public"."tenancies" TO "authenticated" USING (("landlord_id" = "auth"."uid"()));



CREATE POLICY "PPD is public read" ON "public"."price_paid_transactions" FOR SELECT USING (true);



CREATE POLICY "PPD sync log public read" ON "public"."ppd_sync_log" FOR SELECT USING (true);



CREATE POLICY "Property owners manage documents" ON "public"."property_documents" TO "authenticated" USING ((("uploaded_by" = "auth"."uid"()) OR ("property_id" IN ( SELECT "listings"."property_id"
   FROM "public"."listings"
  WHERE ("listings"."user_id" = "auth"."uid"())))));



CREATE POLICY "Property owners manage maintenance" ON "public"."maintenance_requests" TO "authenticated" USING ((("reported_by" = "auth"."uid"()) OR ("property_id" IN ( SELECT "listings"."property_id"
   FROM "public"."listings"
  WHERE ("listings"."user_id" = "auth"."uid"())))));



CREATE POLICY "Providers can manage own availability" ON "public"."provider_availability" TO "authenticated" USING (("provider_id" = "auth"."uid"())) WITH CHECK (("provider_id" = "auth"."uid"()));



CREATE POLICY "Providers can manage own details" ON "public"."service_provider_details" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Providers can manage own documents" ON "public"."provider_documents" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Providers can manage own quotes" ON "public"."quotes" TO "authenticated" USING (("provider_id" = "auth"."uid"())) WITH CHECK (("provider_id" = "auth"."uid"()));



CREATE POLICY "Providers can update own response" ON "public"."reviews" FOR UPDATE TO "authenticated" USING (("provider_id" = "auth"."uid"())) WITH CHECK (("provider_id" = "auth"."uid"()));



CREATE POLICY "Providers can view their bookings" ON "public"."bookings" FOR SELECT TO "authenticated" USING (("provider_id" = "auth"."uid"()));



CREATE POLICY "Public can view approved reviews" ON "public"."reviews" FOR SELECT TO "authenticated" USING ((("moderation_status" = 'approved'::"text") AND ("deleted_at" IS NULL)));



CREATE POLICY "Public can view provider availability" ON "public"."provider_availability" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public can view rating stats" ON "public"."provider_rating_stats" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public can view verified providers" ON "public"."service_provider_details" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "service_provider_details"."user_id") AND ("profiles"."provider_verification_status" = 'verified'::"public"."provider_verification_status") AND ("profiles"."deleted_at" IS NULL)))));



CREATE POLICY "RFQ owners can view quotes for their RFQs" ON "public"."quotes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."service_requests"
  WHERE (("service_requests"."id" = "quotes"."service_request_id") AND ("service_requests"."user_id" = "auth"."uid"())))));



CREATE POLICY "Reviewers can view own reviews" ON "public"."reviews" FOR SELECT TO "authenticated" USING (("reviewer_id" = "auth"."uid"()));



CREATE POLICY "Sellers manage own agent enquiries" ON "public"."agent_enquiries" USING (("seller_id" = "auth"."uid"()));



CREATE POLICY "Sellers manage own attempts" ON "public"."listing_description_attempts" USING (("seller_id" = "auth"."uid"()));



CREATE POLICY "Sellers manage own listings" ON "public"."seller_listings" USING (("seller_id" = "auth"."uid"()));



CREATE POLICY "Sellers manage own offers" ON "public"."seller_offers" USING (("seller_id" = "auth"."uid"()));



CREATE POLICY "Sellers manage own sale progression" ON "public"."sale_progression_stages" USING (("seller_id" = "auth"."uid"()));



CREATE POLICY "Sellers manage own viewings" ON "public"."seller_viewings" USING (("seller_id" = "auth"."uid"()));



CREATE POLICY "Sellers read own listing analytics" ON "public"."listing_analytics_events" FOR SELECT USING (("listing_id" IN ( SELECT "seller_listings"."id"
   FROM "public"."seller_listings"
  WHERE ("seller_listings"."seller_id" = "auth"."uid"()))));



CREATE POLICY "Service role full access referral_codes_v2" ON "public"."referral_codes_v2" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access referral_rewards" ON "public"."referral_rewards" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access referrals" ON "public"."referrals" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "System can insert history" ON "public"."booking_status_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "booking_status_history"."booking_id") AND (("bookings"."user_id" = "auth"."uid"()) OR ("bookings"."provider_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create bookings" ON "public"."bookings" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create own referral code" ON "public"."referral_codes_v2" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create reviews for own completed bookings" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK ((("reviewer_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "reviews"."booking_id") AND ("bookings"."user_id" = "auth"."uid"()) AND ("bookings"."status" = 'completed'::"public"."booking_status"))))));



CREATE POLICY "Users can flag reviews" ON "public"."review_flags" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own consent" ON "public"."consent_records" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own deletion requests" ON "public"."deletion_requests" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own roles" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own verifications" ON "public"."provider_verifications" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert referrals for themselves" ON "public"."referrals" FOR INSERT WITH CHECK (("auth"."uid"() = "referrer_id"));



CREATE POLICY "Users can manage own RFQs" ON "public"."service_requests" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own helpfulness votes" ON "public"."review_helpfulness" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own landlord profile" ON "public"."landlord_profiles" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can report content" ON "public"."content_reports" FOR INSERT TO "authenticated" WITH CHECK (("reporter_id" = "auth"."uid"()));



CREATE POLICY "Users can update own consent" ON "public"."consent_records" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own renter preferences" ON "public"."renter_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can upsert own renter preferences" ON "public"."renter_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own auth audit" ON "public"."auth_audit_log" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own bookings" ON "public"."bookings" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own consent" ON "public"."consent_records" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own consent audit" ON "public"."consent_audit_log" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own deletion requests" ON "public"."deletion_requests" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own flags" ON "public"."review_flags" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "id") AND ("deleted_at" IS NULL)));



CREATE POLICY "Users can view own referral code" ON "public"."referral_codes_v2" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own referrals" ON "public"."referrals" FOR SELECT USING ((("auth"."uid"() = "referrer_id") OR ("auth"."uid"() = "referred_id")));



CREATE POLICY "Users can view own renter preferences" ON "public"."renter_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own rewards" ON "public"."referral_rewards" FOR SELECT USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can view own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own verifications" ON "public"."provider_verifications" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own backup codes" ON "public"."user_backup_codes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own agency" ON "public"."agencies" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users manage own business verification" ON "public"."business_verifications" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage own financial entries" ON "public"."financial_entries" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage own push subscriptions" ON "public"."push_subscriptions" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage own service areas" ON "public"."service_areas" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage own social links" ON "public"."social_links" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users read own KYC" ON "public"."kyc_verifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Verified providers can view open RFQs" ON "public"."service_requests" FOR SELECT TO "authenticated" USING ((("status" = 'open'::"public"."rfq_status") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."provider_verification_status" = 'verified'::"public"."provider_verification_status"))))));



ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_log_2026_03" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_log_2026_04" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_log_2026_05" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_log_2026_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_log_2026_07" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_log_2026_08" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_log_2026_09" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_log_2026_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_log_2026_11" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_log_2026_12" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_log_2027_01" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_log_2027_02" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_log_insert" ON "public"."activity_log" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "activity_log_select" ON "public"."activity_log" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."admin_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_audit_log_insert" ON "public"."admin_audit_log" FOR INSERT WITH CHECK (("admin_id" = "auth"."uid"()));



CREATE POLICY "admin_audit_log_select" ON "public"."admin_audit_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



ALTER TABLE "public"."agencies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_agency_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_agency_profiles_delete" ON "public"."agent_agency_profiles" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_agency_profiles_insert" ON "public"."agent_agency_profiles" FOR INSERT WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_agency_profiles_public_read" ON "public"."agent_agency_profiles" FOR SELECT USING (true);



CREATE POLICY "agent_agency_profiles_select" ON "public"."agent_agency_profiles" FOR SELECT USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_agency_profiles_update" ON "public"."agent_agency_profiles" FOR UPDATE USING (("agent_id" = "auth"."uid"())) WITH CHECK (("agent_id" = "auth"."uid"()));



ALTER TABLE "public"."agent_api_keys" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_api_keys_delete" ON "public"."agent_api_keys" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_api_keys_insert" ON "public"."agent_api_keys" FOR INSERT WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_api_keys_select" ON "public"."agent_api_keys" FOR SELECT USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_api_keys_update" ON "public"."agent_api_keys" FOR UPDATE USING (("agent_id" = "auth"."uid"())) WITH CHECK (("agent_id" = "auth"."uid"()));



ALTER TABLE "public"."agent_branches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_branches_delete" ON "public"."agent_branches" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_branches_insert" ON "public"."agent_branches" FOR INSERT WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_branches_select" ON "public"."agent_branches" FOR SELECT USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_branches_update" ON "public"."agent_branches" FOR UPDATE USING (("agent_id" = "auth"."uid"())) WITH CHECK (("agent_id" = "auth"."uid"()));



ALTER TABLE "public"."agent_commissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_commissions_delete" ON "public"."agent_commissions" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_commissions_insert" ON "public"."agent_commissions" FOR INSERT WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_commissions_select" ON "public"."agent_commissions" FOR SELECT USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_commissions_update" ON "public"."agent_commissions" FOR UPDATE USING (("agent_id" = "auth"."uid"())) WITH CHECK (("agent_id" = "auth"."uid"()));



ALTER TABLE "public"."agent_crm_clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_crm_clients_delete" ON "public"."agent_crm_clients" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_crm_clients_insert" ON "public"."agent_crm_clients" FOR INSERT WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_crm_clients_select" ON "public"."agent_crm_clients" FOR SELECT USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_crm_clients_update" ON "public"."agent_crm_clients" FOR UPDATE USING (("agent_id" = "auth"."uid"())) WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_delete_own_chain_links" ON "public"."chain_links" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."agent_sale_progressions" "asp"
  WHERE (("asp"."agent_id" = "auth"."uid"()) AND (("asp"."id" = "chain_links"."upstream_progression_id") OR ("asp"."id" = "chain_links"."downstream_progression_id"))))));



ALTER TABLE "public"."agent_enquiries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_feed_integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_feed_integrations_delete" ON "public"."agent_feed_integrations" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_feed_integrations_insert" ON "public"."agent_feed_integrations" FOR INSERT WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_feed_integrations_select" ON "public"."agent_feed_integrations" FOR SELECT USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_feed_integrations_update" ON "public"."agent_feed_integrations" FOR UPDATE USING (("agent_id" = "auth"."uid"())) WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_insert_own_chain_links" ON "public"."chain_links" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."agent_sale_progressions" "asp"
  WHERE (("asp"."agent_id" = "auth"."uid"()) AND (("asp"."id" = "chain_links"."upstream_progression_id") OR ("asp"."id" = "chain_links"."downstream_progression_id"))))));



ALTER TABLE "public"."agent_lead_activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_lead_activities_insert" ON "public"."agent_lead_activities" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."agent_leads"
  WHERE (("agent_leads"."id" = "agent_lead_activities"."lead_id") AND (("agent_leads"."agent_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "agent_team_members"."user_id"
           FROM "public"."agent_team_members"
          WHERE (("agent_team_members"."agent_id" = "agent_leads"."agent_id") AND ("agent_team_members"."status" = 'active'::"text")))))))));



CREATE POLICY "agent_lead_activities_select" ON "public"."agent_lead_activities" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."agent_leads"
  WHERE (("agent_leads"."id" = "agent_lead_activities"."lead_id") AND (("agent_leads"."agent_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "agent_team_members"."user_id"
           FROM "public"."agent_team_members"
          WHERE (("agent_team_members"."agent_id" = "agent_leads"."agent_id") AND ("agent_team_members"."status" = 'active'::"text")))))))));



ALTER TABLE "public"."agent_leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_leads_delete" ON "public"."agent_leads" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_leads_insert" ON "public"."agent_leads" FOR INSERT WITH CHECK ((("agent_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "agent_team_members"."user_id"
   FROM "public"."agent_team_members"
  WHERE (("agent_team_members"."agent_id" = "agent_leads"."agent_id") AND ("agent_team_members"."status" = 'active'::"text"))))));



CREATE POLICY "agent_leads_select" ON "public"."agent_leads" FOR SELECT USING ((("agent_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "agent_team_members"."user_id"
   FROM "public"."agent_team_members"
  WHERE (("agent_team_members"."agent_id" = "agent_leads"."agent_id") AND ("agent_team_members"."status" = 'active'::"text"))))));



CREATE POLICY "agent_leads_update" ON "public"."agent_leads" FOR UPDATE USING ((("agent_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "agent_team_members"."user_id"
   FROM "public"."agent_team_members"
  WHERE (("agent_team_members"."agent_id" = "agent_leads"."agent_id") AND ("agent_team_members"."status" = 'active'::"text"))))));



ALTER TABLE "public"."agent_offer_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_offer_history_insert" ON "public"."agent_offer_history" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."agent_offers"
  WHERE (("agent_offers"."id" = "agent_offer_history"."offer_id") AND (("agent_offers"."agent_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "agent_team_members"."user_id"
           FROM "public"."agent_team_members"
          WHERE (("agent_team_members"."agent_id" = "agent_offers"."agent_id") AND ("agent_team_members"."status" = 'active'::"text")))))))));



CREATE POLICY "agent_offer_history_select" ON "public"."agent_offer_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."agent_offers"
  WHERE (("agent_offers"."id" = "agent_offer_history"."offer_id") AND (("agent_offers"."agent_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "agent_team_members"."user_id"
           FROM "public"."agent_team_members"
          WHERE (("agent_team_members"."agent_id" = "agent_offers"."agent_id") AND ("agent_team_members"."status" = 'active'::"text")))))))));



ALTER TABLE "public"."agent_offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_offers_delete" ON "public"."agent_offers" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_offers_insert" ON "public"."agent_offers" FOR INSERT WITH CHECK ((("agent_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "agent_team_members"."user_id"
   FROM "public"."agent_team_members"
  WHERE (("agent_team_members"."agent_id" = "agent_offers"."agent_id") AND ("agent_team_members"."status" = 'active'::"text"))))));



CREATE POLICY "agent_offers_select" ON "public"."agent_offers" FOR SELECT USING ((("agent_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "agent_team_members"."user_id"
   FROM "public"."agent_team_members"
  WHERE (("agent_team_members"."agent_id" = "agent_offers"."agent_id") AND ("agent_team_members"."status" = 'active'::"text"))))));



CREATE POLICY "agent_offers_update" ON "public"."agent_offers" FOR UPDATE USING ((("agent_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "agent_team_members"."user_id"
   FROM "public"."agent_team_members"
  WHERE (("agent_team_members"."agent_id" = "agent_offers"."agent_id") AND ("agent_team_members"."status" = 'active'::"text"))))));



ALTER TABLE "public"."agent_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_read_own_chain_links" ON "public"."chain_links" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."agent_sale_progressions" "asp"
  WHERE (("asp"."agent_id" = "auth"."uid"()) AND (("asp"."id" = "chain_links"."upstream_progression_id") OR ("asp"."id" = "chain_links"."downstream_progression_id"))))));



CREATE POLICY "agent_read_own_risk_scores" ON "public"."chain_risk_scores" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."agent_sale_progressions" "asp"
  WHERE (("asp"."agent_id" = "auth"."uid"()) AND ("asp"."id" = "chain_risk_scores"."progression_id")))));



ALTER TABLE "public"."agent_sale_progressions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_sale_progressions_delete" ON "public"."agent_sale_progressions" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_sale_progressions_insert" ON "public"."agent_sale_progressions" FOR INSERT WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_sale_progressions_select" ON "public"."agent_sale_progressions" FOR SELECT USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_sale_progressions_update" ON "public"."agent_sale_progressions" FOR UPDATE USING (("agent_id" = "auth"."uid"())) WITH CHECK (("agent_id" = "auth"."uid"()));



ALTER TABLE "public"."agent_team_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_team_members_delete" ON "public"."agent_team_members" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_team_members_insert" ON "public"."agent_team_members" FOR INSERT WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_team_members_select" ON "public"."agent_team_members" FOR SELECT USING ((("agent_id" = "auth"."uid"()) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "agent_team_members_update" ON "public"."agent_team_members" FOR UPDATE USING (("agent_id" = "auth"."uid"())) WITH CHECK (("agent_id" = "auth"."uid"()));



ALTER TABLE "public"."agent_vendor_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_vendor_reports_delete" ON "public"."agent_vendor_reports" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_vendor_reports_insert" ON "public"."agent_vendor_reports" FOR INSERT WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_vendor_reports_select" ON "public"."agent_vendor_reports" FOR SELECT USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_vendor_reports_update" ON "public"."agent_vendor_reports" FOR UPDATE USING (("agent_id" = "auth"."uid"())) WITH CHECK (("agent_id" = "auth"."uid"()));



ALTER TABLE "public"."agent_viewing_feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_viewing_feedback_delete" ON "public"."agent_viewing_feedback" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_viewing_feedback_insert" ON "public"."agent_viewing_feedback" FOR INSERT WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_viewing_feedback_select" ON "public"."agent_viewing_feedback" FOR SELECT USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_viewing_feedback_update" ON "public"."agent_viewing_feedback" FOR UPDATE USING (("agent_id" = "auth"."uid"())) WITH CHECK (("agent_id" = "auth"."uid"()));



ALTER TABLE "public"."agent_viewing_slots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_viewing_slots_delete" ON "public"."agent_viewing_slots" FOR DELETE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_viewing_slots_insert" ON "public"."agent_viewing_slots" FOR INSERT WITH CHECK (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_viewing_slots_select_booked_buyer" ON "public"."agent_viewing_slots" FOR SELECT USING ((("is_booked" = true) AND ("booked_by" = "auth"."uid"())));



CREATE POLICY "agent_viewing_slots_select_owner" ON "public"."agent_viewing_slots" FOR SELECT USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "agent_viewing_slots_update" ON "public"."agent_viewing_slots" FOR UPDATE USING (("agent_id" = "auth"."uid"())) WITH CHECK (("agent_id" = "auth"."uid"()));



ALTER TABLE "public"."ai_match_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_match_preferences_delete" ON "public"."ai_match_preferences" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "ai_match_preferences_insert" ON "public"."ai_match_preferences" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "ai_match_preferences_select" ON "public"."ai_match_preferences" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "ai_match_preferences_update" ON "public"."ai_match_preferences" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."ai_match_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_match_results_delete" ON "public"."ai_match_results" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "ai_match_results_insert" ON "public"."ai_match_results" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "ai_match_results_select" ON "public"."ai_match_results" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "ai_match_results_update" ON "public"."ai_match_results" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "anon_insert_views" ON "public"."property_views" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."auth_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."billing_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "billing_events_service_role_all" ON "public"."billing_events" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."booking_state_transitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."broadband_coverage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "broadband_coverage_public_read" ON "public"."broadband_coverage" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."business_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chain_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chain_risk_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cms_articles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cms_articles_admin" ON "public"."cms_articles" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "cms_articles_published_public" ON "public"."cms_articles" FOR SELECT USING (("status" = 'published'::"text"));



ALTER TABLE "public"."compliance_cron_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consent_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consent_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_reports_admin_read" ON "public"."content_reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



ALTER TABLE "public"."conversation_read_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_insert" ON "public"."conversations" FOR INSERT WITH CHECK ((("auth"."uid"() = "participant_1_id") OR ("auth"."uid"() = "participant_2_id")));



CREATE POLICY "conversations_select" ON "public"."conversations" FOR SELECT USING ((("auth"."uid"() = "participant_1_id") OR ("auth"."uid"() = "participant_2_id")));



ALTER TABLE "public"."deletion_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deposit_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "email_campaigns_admin" ON "public"."email_campaigns" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



ALTER TABLE "public"."email_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "email_logs_admin_all" ON "public"."email_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "email_logs_service_insert" ON "public"."email_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "email_logs_user_read" ON "public"."email_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "events_insert" ON "public"."platform_events" FOR INSERT WITH CHECK (("actor_id" = "auth"."uid"()));



CREATE POLICY "events_select_actor" ON "public"."platform_events" FOR SELECT USING (("actor_id" = "auth"."uid"()));



CREATE POLICY "events_select_entity" ON "public"."platform_events" FOR SELECT USING ((("entity_type" = 'conversation'::"text") AND ("entity_id" IN ( SELECT "conversations"."id"
   FROM "public"."conversations"
  WHERE (("conversations"."participant_1_id" = "auth"."uid"()) OR ("conversations"."participant_2_id" = "auth"."uid"()))))));



ALTER TABLE "public"."feature_flags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feature_flags_admin_select" ON "public"."feature_flags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "feature_flags_write" ON "public"."feature_flags" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



ALTER TABLE "public"."financial_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gdpr_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "gdpr_requests_admin" ON "public"."gdpr_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "gdpr_requests_own" ON "public"."gdpr_requests" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "intro_events_select" ON "public"."introduction_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."introductions" "i"
  WHERE (("i"."id" = "introduction_events"."introduction_id") AND (("i"."agent_id" = "auth"."uid"()) OR ("i"."applicant_id" = "auth"."uid"()) OR (("i"."branch_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."agent_team_members" "tm"
          WHERE (("tm"."branch_id" = "i"."branch_id") AND ("tm"."user_id" = "auth"."uid"()))))))))));



CREATE POLICY "intro_select_agent" ON "public"."introductions" FOR SELECT USING ((("agent_id" = "auth"."uid"()) OR (("branch_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."agent_team_members" "tm"
  WHERE (("tm"."branch_id" = "introductions"."branch_id") AND ("tm"."user_id" = "auth"."uid"())))))));



CREATE POLICY "intro_select_applicant" ON "public"."introductions" FOR SELECT USING (("applicant_id" = "auth"."uid"()));



CREATE POLICY "intro_status_select" ON "public"."introduction_status_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."introductions" "i"
  WHERE (("i"."id" = "introduction_status_history"."introduction_id") AND (("i"."agent_id" = "auth"."uid"()) OR ("i"."applicant_id" = "auth"."uid"()) OR (("i"."branch_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."agent_team_members" "tm"
          WHERE (("tm"."branch_id" = "i"."branch_id") AND ("tm"."user_id" = "auth"."uid"()))))))))));



ALTER TABLE "public"."introduction_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."introduction_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."introductions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invite_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_candidates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoice_candidates_select_admin" ON "public"."invoice_candidates" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND "p"."is_admin"))));



ALTER TABLE "public"."invoice_disputes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoice_disputes_insert_own" ON "public"."invoice_disputes" FOR INSERT WITH CHECK ((("raised_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_disputes"."invoice_id") AND ("i"."org_agent_id" = "auth"."uid"()))))));



CREATE POLICY "invoice_disputes_select_own_or_admin" ON "public"."invoice_disputes" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_disputes"."invoice_id") AND ("i"."org_agent_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND "p"."is_admin")))));



ALTER TABLE "public"."invoice_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoice_events_select_via_invoice" ON "public"."invoice_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_events"."invoice_id") AND (("i"."org_agent_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND "p"."is_admin"))))))));



ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoices_select_own_or_admin" ON "public"."invoices" FOR SELECT USING ((("org_agent_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND "p"."is_admin")))));



CREATE POLICY "job_milestones_select" ON "public"."service_job_milestones" FOR SELECT USING (("updated_by" = "auth"."uid"()));



CREATE POLICY "job_milestones_update" ON "public"."service_job_milestones" FOR UPDATE USING (("updated_by" = "auth"."uid"())) WITH CHECK (("updated_by" = "auth"."uid"()));



ALTER TABLE "public"."jwt_claims_errors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kyc_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landlord_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "landlords_manage_own_applications" ON "public"."tenant_applications" USING (("landlord_id" = "auth"."uid"())) WITH CHECK (("landlord_id" = "auth"."uid"()));



CREATE POLICY "landlords_manage_own_inventory" ON "public"."inventory_reports" USING (("landlord_id" = "auth"."uid"())) WITH CHECK (("landlord_id" = "auth"."uid"()));



ALTER TABLE "public"."listing_analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_description_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_moderation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "listings_delete" ON "public"."listings" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "listings_insert" ON "public"."listings" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "listings_select_active" ON "public"."listings" FOR SELECT USING ((("status" = 'active'::"public"."listing_status") AND ("deleted_at" IS NULL)));



CREATE POLICY "listings_select_own" ON "public"."listings" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "listings_update" ON "public"."listings" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."maintenance_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_pricing" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "market_pricing_select" ON "public"."market_pricing" FOR SELECT USING (true);



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_insert" ON "public"."messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND ("conversation_id" IN ( SELECT "conversations"."id"
   FROM "public"."conversations"
  WHERE (("conversations"."participant_1_id" = "auth"."uid"()) OR ("conversations"."participant_2_id" = "auth"."uid"()))))));



CREATE POLICY "messages_select" ON "public"."messages" FOR SELECT USING (("conversation_id" IN ( SELECT "conversations"."id"
   FROM "public"."conversations"
  WHERE (("conversations"."participant_1_id" = "auth"."uid"()) OR ("conversations"."participant_2_id" = "auth"."uid"())))));



ALTER TABLE "public"."mobility_scores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mobility_scores_public_read" ON "public"."mobility_scores" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."moderation_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moving_checklist_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "moving_checklist_items_delete" ON "public"."moving_checklist_items" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "moving_checklist_items_insert" ON "public"."moving_checklist_items" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "moving_checklist_items_select" ON "public"."moving_checklist_items" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "moving_checklist_items_update" ON "public"."moving_checklist_items" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."offer_status_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "offer_status_history_select_agent" ON "public"."offer_status_history" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "listings"."user_id"
   FROM "public"."listings"
  WHERE ("listings"."id" = ( SELECT "offers"."listing_id"
           FROM "public"."offers"
          WHERE ("offers"."id" = "offer_status_history"."offer_id"))))));



CREATE POLICY "offer_status_history_select_buyer" ON "public"."offer_status_history" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "offers"."user_id"
   FROM "public"."offers"
  WHERE ("offers"."id" = "offer_status_history"."offer_id"))));



ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "offers_insert" ON "public"."offers" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "offers_select" ON "public"."offers" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() IN ( SELECT "listings"."user_id"
   FROM "public"."listings"
  WHERE ("listings"."id" = "offers"."listing_id")))));



CREATE POLICY "offers_update_blocked" ON "public"."offers" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "outcome_insert_branch" ON "public"."reported_outcomes" FOR INSERT WITH CHECK ((("reported_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."introductions" "i"
  WHERE (("i"."id" = "reported_outcomes"."introduction_id") AND (("i"."agent_id" = "auth"."uid"()) OR (("i"."branch_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."agent_team_members" "tm"
          WHERE (("tm"."branch_id" = "i"."branch_id") AND ("tm"."user_id" = "auth"."uid"())))))))))));



CREATE POLICY "outcome_select_branch" ON "public"."reported_outcomes" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."introductions" "i"
  WHERE (("i"."id" = "reported_outcomes"."introduction_id") AND (("i"."agent_id" = "auth"."uid"()) OR (("i"."branch_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."agent_team_members" "tm"
          WHERE (("tm"."branch_id" = "i"."branch_id") AND ("tm"."user_id" = "auth"."uid"()))))))))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND "p"."is_admin")))));



ALTER TABLE "public"."payment_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."platform_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ppd_ingest_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ppd_match_candidates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ppd_public_read" ON "public"."price_paid_data" FOR SELECT USING (true);



CREATE POLICY "ppd_service_write" ON "public"."price_paid_data" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."ppd_sync_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ppd_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."price_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "price_history_select" ON "public"."price_history" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."price_paid_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."price_paid_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "promo_codes_admin" ON "public"."promo_codes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "properties_insert" ON "public"."properties" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "properties_select" ON "public"."properties" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "properties_update" ON "public"."properties" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."property_id" = "properties"."id") AND ("l"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."property_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_insights" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "property_insights_public_read" ON "public"."property_insights" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."property_id" = "property_insights"."property_id") AND ("l"."status" = 'active'::"public"."listing_status") AND ("l"."deleted_at" IS NULL)))));



CREATE POLICY "property_insights_service_write" ON "public"."property_insights" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."property_media" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "property_media_delete" ON "public"."property_media" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "property_media"."listing_id") AND ("l"."user_id" = "auth"."uid"())))));



CREATE POLICY "property_media_insert" ON "public"."property_media" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "property_media"."listing_id") AND ("l"."user_id" = "auth"."uid"())))));



CREATE POLICY "property_media_select" ON "public"."property_media" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "property_media"."listing_id") AND (("l"."status" = 'active'::"public"."listing_status") OR ("l"."user_id" = "auth"."uid"()))))));



CREATE POLICY "property_media_update" ON "public"."property_media" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "property_media"."listing_id") AND ("l"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."property_renovation_scenarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_views" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "property_views_insert" ON "public"."property_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "property_views_service_read" ON "public"."property_views" FOR SELECT USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."provider_analytics_daily" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_analytics_daily_select_own" ON "public"."provider_analytics_daily" FOR SELECT USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_analytics_select_own" ON "public"."provider_analytics_daily" FOR SELECT USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."provider_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_badges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_badges_delete_own" ON "public"."provider_badges" FOR DELETE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_badges_insert_own" ON "public"."provider_badges" FOR INSERT WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_badges_select_own" ON "public"."provider_badges" FOR SELECT USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_badges_update_own" ON "public"."provider_badges" FOR UPDATE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"())))) WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."provider_boosts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_boosts_delete_own" ON "public"."provider_boosts" FOR DELETE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_boosts_insert_own" ON "public"."provider_boosts" FOR INSERT WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_boosts_select_own" ON "public"."provider_boosts" FOR SELECT USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_boosts_update_own" ON "public"."provider_boosts" FOR UPDATE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"())))) WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_delete_own_payment_schedules" ON "public"."payment_schedules" FOR DELETE USING (("provider_id" = "auth"."uid"()));



ALTER TABLE "public"."provider_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_insert_own_certificates" ON "public"."certificates" FOR INSERT WITH CHECK (("provider_id" = "auth"."uid"()));



CREATE POLICY "provider_insert_own_payment_schedules" ON "public"."payment_schedules" FOR INSERT WITH CHECK (("provider_id" = "auth"."uid"()));



ALTER TABLE "public"."provider_invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_invoices_delete_own" ON "public"."provider_invoices" FOR DELETE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_invoices_insert_own" ON "public"."provider_invoices" FOR INSERT WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_invoices_select_client" ON "public"."provider_invoices" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "provider_invoices_select_own" ON "public"."provider_invoices" FOR SELECT USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_invoices_update_own" ON "public"."provider_invoices" FOR UPDATE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"())))) WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."provider_portfolio_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_rating_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_references" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_references_delete_own" ON "public"."provider_references" FOR DELETE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_references_insert_own" ON "public"."provider_references" FOR INSERT WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_references_select_own" ON "public"."provider_references" FOR SELECT USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_references_update_own" ON "public"."provider_references" FOR UPDATE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"())))) WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."provider_referrals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_referrals_insert_own" ON "public"."provider_referrals" FOR INSERT WITH CHECK (("referrer_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_referrals_select_own" ON "public"."provider_referrals" FOR SELECT USING (("referrer_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_referrals_update_own" ON "public"."provider_referrals" FOR UPDATE USING (("referrer_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"())))) WITH CHECK (("referrer_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_select_own_certificates" ON "public"."certificates" FOR SELECT USING (("provider_id" = "auth"."uid"()));



CREATE POLICY "provider_select_own_payment_schedules" ON "public"."payment_schedules" FOR SELECT USING (("provider_id" = "auth"."uid"()));



ALTER TABLE "public"."provider_service_areas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_service_areas_delete_own" ON "public"."provider_service_areas" FOR DELETE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_service_areas_insert_own" ON "public"."provider_service_areas" FOR INSERT WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_service_areas_select_own" ON "public"."provider_service_areas" FOR SELECT USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_service_areas_update_own" ON "public"."provider_service_areas" FOR UPDATE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"())))) WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."provider_services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_services_delete_own" ON "public"."provider_services" FOR DELETE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_services_insert_own" ON "public"."provider_services" FOR INSERT WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_services_select_own" ON "public"."provider_services" FOR SELECT USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_services_update_own" ON "public"."provider_services" FOR UPDATE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"())))) WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "provider_update_own_certificates" ON "public"."certificates" FOR UPDATE USING (("provider_id" = "auth"."uid"())) WITH CHECK (("provider_id" = "auth"."uid"()));



CREATE POLICY "provider_update_own_payment_schedules" ON "public"."payment_schedules" FOR UPDATE USING (("provider_id" = "auth"."uid"())) WITH CHECK (("provider_id" = "auth"."uid"()));



ALTER TABLE "public"."provider_verifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_read_benchmarks" ON "public"."renovation_type_benchmarks" FOR SELECT USING (true);



CREATE POLICY "public_read_insights" ON "public"."property_insights" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "property_insights"."property_id") AND ("p"."deleted_at" IS NULL)))));



ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read_status_all" ON "public"."conversation_read_status" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "rebuttal_insert" ON "public"."rebuttals" FOR INSERT WITH CHECK ((("submitted_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."introductions" "i"
  WHERE (("i"."id" = "rebuttals"."introduction_id") AND (("i"."agent_id" = "auth"."uid"()) OR (("i"."branch_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."agent_team_members" "tm"
          WHERE (("tm"."branch_id" = "i"."branch_id") AND ("tm"."user_id" = "auth"."uid"())))))) AND ("i"."rebuttal_deadline" IS NOT NULL) AND ("now"() <= "i"."rebuttal_deadline"))))));



CREATE POLICY "rebuttal_select" ON "public"."rebuttals" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."introductions" "i"
  WHERE (("i"."id" = "rebuttals"."introduction_id") AND (("i"."agent_id" = "auth"."uid"()) OR (("i"."branch_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."agent_team_members" "tm"
          WHERE (("tm"."branch_id" = "i"."branch_id") AND ("tm"."user_id" = "auth"."uid"()))))))))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND "p"."is_admin")))));



ALTER TABLE "public"."rebuttals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "referral_codes_insert" ON "public"."referral_codes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "referral_codes_select" ON "public"."referral_codes" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."referral_codes_v2" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_conversions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "referral_conversions_select" ON "public"."referral_conversions" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "referrer_id") OR ("auth"."uid"() = "referred_id")));



ALTER TABLE "public"."referral_rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."refund_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "refund_requests_insert_own" ON "public"."refund_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "refund_requests_select_own" ON "public"."refund_requests" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "refund_requests_service_role_all" ON "public"."refund_requests" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "renovation_benchmarks_admin_write" ON "public"."renovation_type_benchmarks" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "renovation_benchmarks_public_read" ON "public"."renovation_type_benchmarks" FOR SELECT USING (true);



CREATE POLICY "renovation_scenarios_own" ON "public"."property_renovation_scenarios" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."renovation_type_benchmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."renter_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reported_outcomes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_helpfulness" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sale_progression_stages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_properties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "saved_properties_delete" ON "public"."saved_properties" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "saved_properties_insert" ON "public"."saved_properties" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "saved_properties_select" ON "public"."saved_properties" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "saved_properties_update" ON "public"."saved_properties" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."saved_searches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "saved_searches_delete" ON "public"."saved_searches" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "saved_searches_insert" ON "public"."saved_searches" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "saved_searches_select" ON "public"."saved_searches" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "saved_searches_update" ON "public"."saved_searches" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."sdr_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sdr_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sdr_targets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."search_analytics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "search_analytics_insert" ON "public"."search_analytics" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "search_analytics_select" ON "public"."search_analytics" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."is_admin" = true)))));



ALTER TABLE "public"."seller_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seller_offers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seller_viewings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_areas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_job_milestones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_provider_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."social_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_connect_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stripe_connect_accounts_insert_own" ON "public"."stripe_connect_accounts" FOR INSERT WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "stripe_connect_accounts_select_own" ON "public"."stripe_connect_accounts" FOR SELECT USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "stripe_connect_accounts_update_own" ON "public"."stripe_connect_accounts" FOR UPDATE USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"())))) WITH CHECK (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



CREATE POLICY "stripe_connect_select_own" ON "public"."stripe_connect_accounts" FOR SELECT USING (("provider_id" = ( SELECT "service_provider_details"."user_id"
   FROM "public"."service_provider_details"
  WHERE ("service_provider_details"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."stripe_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stripe_events_service_role_only" ON "public"."stripe_events" USING (false) WITH CHECK (false);



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_select_own" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "subscriptions_service_role_all" ON "public"."subscriptions" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."tenancies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_milestones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transport_stops" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transport_stops_public_read" ON "public"."transport_stops" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."truedeed_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "truedeed_audit_select_admin" ON "public"."truedeed_audit_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND "p"."is_admin"))));



CREATE POLICY "txn_milestones_select" ON "public"."transaction_milestones" FOR SELECT USING (("updated_by" = "auth"."uid"()));



CREATE POLICY "txn_milestones_update" ON "public"."transaction_milestones" FOR UPDATE USING (("updated_by" = "auth"."uid"())) WITH CHECK (("updated_by" = "auth"."uid"()));



ALTER TABLE "public"."user_backup_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_documents_delete" ON "public"."user_documents" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_documents_insert" ON "public"."user_documents" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user_documents_select" ON "public"."user_documents" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() IN ( SELECT "offers"."agent_id"
   FROM "public"."offers"
  WHERE (("offers"."id" = "user_documents"."offer_id") AND ("offers"."agent_id" IS NOT NULL)))) OR ("auth"."uid"() IN ( SELECT "offers"."solicitor_id"
   FROM "public"."offers"
  WHERE (("offers"."id" = "user_documents"."offer_id") AND ("offers"."solicitor_id" IS NOT NULL))))));



CREATE POLICY "user_documents_update" ON "public"."user_documents" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_own_scenarios" ON "public"."property_renovation_scenarios" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."viewing_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "viewing_history_delete" ON "public"."viewing_history" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "viewing_history_insert" ON "public"."viewing_history" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "viewing_history_select" ON "public"."viewing_history" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "viewing_history_update" ON "public"."viewing_history" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."viewing_slots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "viewing_slots_insert" ON "public"."viewing_slots" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "agent_id"));



CREATE POLICY "viewing_slots_select" ON "public"."viewing_slots" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "agent_id"));



CREATE POLICY "viewing_slots_update" ON "public"."viewing_slots" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "agent_id"));



ALTER TABLE "public"."viewings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "viewings_select" ON "public"."viewings" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() IN ( SELECT "listings"."user_id"
   FROM "public"."listings"
  WHERE ("listings"."id" = "viewings"."listing_id")))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."box2d_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2d_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."box2d_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2d_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2d_out"("public"."box2d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2d_out"("public"."box2d") TO "anon";
GRANT ALL ON FUNCTION "public"."box2d_out"("public"."box2d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2d_out"("public"."box2d") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2df_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2df_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."box2df_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2df_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2df_out"("public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2df_out"("public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."box2df_out"("public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2df_out"("public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3d_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3d_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."box3d_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3d_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3d_out"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3d_out"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."box3d_out"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3d_out"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_analyze"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_analyze"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_analyze"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_analyze"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_out"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_out"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_out"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_out"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_send"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_send"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_send"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_send"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_typmod_out"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_typmod_out"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_typmod_out"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_typmod_out"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_analyze"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_analyze"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_analyze"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_analyze"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_out"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_out"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_out"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_out"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_recv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_recv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_recv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_recv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_send"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_send"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_send"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_send"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_typmod_out"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_typmod_out"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_typmod_out"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_typmod_out"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gidx_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gidx_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gidx_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gidx_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gidx_out"("public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."gidx_out"("public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."gidx_out"("public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gidx_out"("public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";



GRANT ALL ON FUNCTION "public"."spheroid_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."spheroid_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."spheroid_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."spheroid_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."spheroid_out"("public"."spheroid") TO "postgres";
GRANT ALL ON FUNCTION "public"."spheroid_out"("public"."spheroid") TO "anon";
GRANT ALL ON FUNCTION "public"."spheroid_out"("public"."spheroid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."spheroid_out"("public"."spheroid") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3d"("public"."box2d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3d"("public"."box2d") TO "anon";
GRANT ALL ON FUNCTION "public"."box3d"("public"."box2d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3d"("public"."box2d") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("public"."box2d") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box2d") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box2d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box2d") TO "service_role";



GRANT ALL ON FUNCTION "public"."box"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."box"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2d"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2d"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."box2d"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2d"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."geography"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."bytea"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography"("public"."geography", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography"("public"."geography", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."geography"("public"."geography", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography"("public"."geography", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."box"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."box"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."box"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."box2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."box3d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."bytea"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geography"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("public"."geometry", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geometry", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geometry", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geometry", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."json"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."json"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."json"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."json"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."jsonb"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."jsonb"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."jsonb"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."jsonb"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."path"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."path"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."path"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."path"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."point"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."point"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."point"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."point"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."polygon"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."polygon"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."polygon"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."polygon"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."text"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."text"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."text"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."text"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("path") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("path") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("path") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("path") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("point") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("point") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("point") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("point") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("polygon") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("polygon") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("polygon") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("polygon") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("text") TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."_postgis_deprecate"("oldname" "text", "newname" "text", "version" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_deprecate"("oldname" "text", "newname" "text", "version" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_deprecate"("oldname" "text", "newname" "text", "version" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_deprecate"("oldname" "text", "newname" "text", "version" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_index_extent"("tbl" "regclass", "col" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_index_extent"("tbl" "regclass", "col" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_index_extent"("tbl" "regclass", "col" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_index_extent"("tbl" "regclass", "col" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_join_selectivity"("regclass", "text", "regclass", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_join_selectivity"("regclass", "text", "regclass", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_join_selectivity"("regclass", "text", "regclass", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_join_selectivity"("regclass", "text", "regclass", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_pgsql_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_pgsql_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_pgsql_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_pgsql_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_scripts_pgsql_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_scripts_pgsql_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_scripts_pgsql_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_scripts_pgsql_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_selectivity"("tbl" "regclass", "att_name" "text", "geom" "public"."geometry", "mode" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_selectivity"("tbl" "regclass", "att_name" "text", "geom" "public"."geometry", "mode" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_selectivity"("tbl" "regclass", "att_name" "text", "geom" "public"."geometry", "mode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_selectivity"("tbl" "regclass", "att_name" "text", "geom" "public"."geometry", "mode" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_stats"("tbl" "regclass", "att_name" "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_stats"("tbl" "regclass", "att_name" "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_stats"("tbl" "regclass", "att_name" "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_stats"("tbl" "regclass", "att_name" "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_asgml"(integer, "public"."geometry", integer, integer, "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_asgml"(integer, "public"."geometry", integer, integer, "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_asgml"(integer, "public"."geometry", integer, integer, "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_asgml"(integer, "public"."geometry", integer, integer, "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_asx3d"(integer, "public"."geometry", integer, integer, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_asx3d"(integer, "public"."geometry", integer, integer, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_asx3d"(integer, "public"."geometry", integer, integer, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_asx3d"(integer, "public"."geometry", integer, integer, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography", double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography", double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography", double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography", double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_expand"("public"."geography", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_expand"("public"."geography", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_expand"("public"."geography", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_expand"("public"."geography", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_geomfromgml"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_geomfromgml"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_geomfromgml"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_geomfromgml"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_pointoutside"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_pointoutside"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_pointoutside"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_pointoutside"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_sortablehash"("geom" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_sortablehash"("geom" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_sortablehash"("geom" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_sortablehash"("geom" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_voronoi"("g1" "public"."geometry", "clip" "public"."geometry", "tolerance" double precision, "return_polygons" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_voronoi"("g1" "public"."geometry", "clip" "public"."geometry", "tolerance" double precision, "return_polygons" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_voronoi"("g1" "public"."geometry", "clip" "public"."geometry", "tolerance" double precision, "return_polygons" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_voronoi"("g1" "public"."geometry", "clip" "public"."geometry", "tolerance" double precision, "return_polygons" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_offer_cascade"("p_offer_id" "uuid", "p_seller_id" "uuid", "p_solicitor_name" "text", "p_solicitor_email" "text", "p_solicitor_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_offer_cascade"("p_offer_id" "uuid", "p_seller_id" "uuid", "p_solicitor_name" "text", "p_solicitor_email" "text", "p_solicitor_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_offer_cascade"("p_offer_id" "uuid", "p_seller_id" "uuid", "p_solicitor_name" "text", "p_solicitor_email" "text", "p_solicitor_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."addauth"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."addauth"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."addauth"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."addauth"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_role_atomic"("p_user_id" "uuid", "p_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_role_atomic"("p_user_id" "uuid", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_role_atomic"("p_user_id" "uuid", "p_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."atomic_flag_review"("p_review_id" "uuid", "p_user_id" "uuid", "p_reason" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."atomic_flag_review"("p_review_id" "uuid", "p_user_id" "uuid", "p_reason" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."atomic_flag_review"("p_review_id" "uuid", "p_user_id" "uuid", "p_reason" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."atomic_vote_review"("p_review_id" "uuid", "p_user_id" "uuid", "p_is_helpful" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."atomic_vote_review"("p_review_id" "uuid", "p_user_id" "uuid", "p_is_helpful" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."atomic_vote_review"("p_review_id" "uuid", "p_user_id" "uuid", "p_is_helpful" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."book_viewing_slot"("p_slot_id" "uuid", "p_user_id" "uuid", "p_listing_id" "uuid", "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."book_viewing_slot"("p_slot_id" "uuid", "p_user_id" "uuid", "p_listing_id" "uuid", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."book_viewing_slot"("p_slot_id" "uuid", "p_user_id" "uuid", "p_listing_id" "uuid", "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."boost_defamation_flag_priority"() TO "anon";
GRANT ALL ON FUNCTION "public"."boost_defamation_flag_priority"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."boost_defamation_flag_priority"() TO "service_role";



GRANT ALL ON FUNCTION "public"."box3dtobox"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3dtobox"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."box3dtobox"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3dtobox"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_reminder_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_reminder_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_reminder_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_viewing"("p_viewing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_viewing"("p_viewing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_viewing"("p_viewing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_feature_flag"("p_key" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_feature_flag"("p_key" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_feature_flag"("p_key" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."checkauth"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."checkauth"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."checkauthtrigger"() TO "postgres";
GRANT ALL ON FUNCTION "public"."checkauthtrigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."checkauthtrigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkauthtrigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."contains_2d"("public"."geometry", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."geometry", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."geometry", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."geometry", "public"."box2df") TO "service_role";



REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."decide_invoice_dispute"("p_id" "uuid", "p_admin" "uuid", "p_decision" "text", "p_category" "text", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."decide_invoice_dispute"("p_id" "uuid", "p_admin" "uuid", "p_decision" "text", "p_category" "text", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."decide_rebuttal"("p_rebuttal_id" "uuid", "p_admin_id" "uuid", "p_decision" "text", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."decide_rebuttal"("p_rebuttal_id" "uuid", "p_admin_id" "uuid", "p_decision" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."disablelongtransactions"() TO "postgres";
GRANT ALL ON FUNCTION "public"."disablelongtransactions"() TO "anon";
GRANT ALL ON FUNCTION "public"."disablelongtransactions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."disablelongtransactions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("table_name" character varying, "column_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("table_name" character varying, "column_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("table_name" character varying, "column_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("table_name" character varying, "column_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrytable"("table_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("table_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("table_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("table_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrytable"("schema_name" character varying, "table_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("schema_name" character varying, "table_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("schema_name" character varying, "table_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("schema_name" character varying, "table_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrytable"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."enablelongtransactions"() TO "postgres";
GRANT ALL ON FUNCTION "public"."enablelongtransactions"() TO "anon";
GRANT ALL ON FUNCTION "public"."enablelongtransactions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enablelongtransactions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_stale_quotes"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_stale_quotes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_stale_quotes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_stale_rfqs"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_stale_rfqs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_stale_rfqs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."find_recent_price_drops"() TO "anon";
GRANT ALL ON FUNCTION "public"."find_recent_price_drops"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_recent_price_drops"() TO "service_role";



GRANT ALL ON FUNCTION "public"."find_srid"(character varying, character varying, character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."find_srid"(character varying, character varying, character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."find_srid"(character varying, character varying, character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_srid"(character varying, character varying, character varying) TO "service_role";



REVOKE ALL ON FUNCTION "public"."gdpr_scrub_introductions"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."gdpr_scrub_introductions"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."gdpr_scrub_invoice_disputes"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."gdpr_scrub_invoice_disputes"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_booking_reference"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_booking_reference"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_booking_reference"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_listing_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_listing_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_listing_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_quote_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_quote_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_quote_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."geog_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geog_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geog_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geog_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_cmp"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_cmp"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_cmp"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_cmp"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_distance_knn"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_distance_knn"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_distance_knn"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_distance_knn"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_eq"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_eq"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_eq"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_eq"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_ge"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_ge"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_ge"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_ge"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_consistent"("internal", "public"."geography", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_consistent"("internal", "public"."geography", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_consistent"("internal", "public"."geography", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_consistent"("internal", "public"."geography", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_distance"("internal", "public"."geography", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_distance"("internal", "public"."geography", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_distance"("internal", "public"."geography", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_distance"("internal", "public"."geography", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_same"("public"."box2d", "public"."box2d", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_same"("public"."box2d", "public"."box2d", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_same"("public"."box2d", "public"."box2d", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_same"("public"."box2d", "public"."box2d", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_union"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_union"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_union"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_union"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gt"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gt"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gt"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gt"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_le"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_le"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_le"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_le"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_lt"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_lt"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_lt"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_lt"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_overlaps"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_overlaps"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_overlaps"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_overlaps"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_choose_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_choose_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_choose_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_choose_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_compress_nd"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_compress_nd"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_compress_nd"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_compress_nd"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_config_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_config_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_config_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_config_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_inner_consistent_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_inner_consistent_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_inner_consistent_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_inner_consistent_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_leaf_consistent_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_leaf_consistent_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_leaf_consistent_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_leaf_consistent_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_picksplit_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_picksplit_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_picksplit_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_picksplit_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geom2d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geom2d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geom2d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geom2d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geom3d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geom3d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geom3d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geom3d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geom4d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geom4d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geom4d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geom4d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_above"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_above"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_above"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_above"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_below"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_below"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_below"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_below"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_cmp"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_cmp"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_cmp"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_cmp"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_contained_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_contained_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_contained_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_contained_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_contains_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_contains_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_contains_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_contains_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_contains_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_contains_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_contains_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_contains_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_distance_box"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_distance_box"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_distance_box"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_distance_box"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_distance_centroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_distance_centroid_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_distance_cpa"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_distance_cpa"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_distance_cpa"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_distance_cpa"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_eq"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_eq"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_eq"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_eq"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_ge"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_ge"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_ge"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_ge"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_compress_2d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_2d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_2d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_2d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_compress_nd"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_nd"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_nd"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_nd"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_2d"("internal", "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_2d"("internal", "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_2d"("internal", "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_2d"("internal", "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_nd"("internal", "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_nd"("internal", "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_nd"("internal", "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_nd"("internal", "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_2d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_2d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_2d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_2d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_nd"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_nd"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_nd"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_nd"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_distance_2d"("internal", "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_2d"("internal", "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_2d"("internal", "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_2d"("internal", "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_distance_nd"("internal", "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_nd"("internal", "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_nd"("internal", "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_nd"("internal", "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_2d"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_2d"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_2d"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_2d"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_nd"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_nd"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_nd"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_nd"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_same_2d"("geom1" "public"."geometry", "geom2" "public"."geometry", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_2d"("geom1" "public"."geometry", "geom2" "public"."geometry", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_2d"("geom1" "public"."geometry", "geom2" "public"."geometry", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_2d"("geom1" "public"."geometry", "geom2" "public"."geometry", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_same_nd"("public"."geometry", "public"."geometry", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_nd"("public"."geometry", "public"."geometry", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_nd"("public"."geometry", "public"."geometry", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_nd"("public"."geometry", "public"."geometry", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_sortsupport_2d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_sortsupport_2d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_sortsupport_2d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_sortsupport_2d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_union_2d"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_2d"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_2d"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_2d"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_union_nd"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_nd"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_nd"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_nd"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_hash"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_hash"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_hash"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_hash"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_le"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_le"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_le"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_le"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_left"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_left"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_left"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_left"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_lt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_lt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_lt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_lt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overabove"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overabove"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overabove"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overabove"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overbelow"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overbelow"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overbelow"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overbelow"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overlaps_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overlaps_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overleft"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overleft"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overleft"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overleft"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overright"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overright"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overright"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overright"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_right"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_right"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_right"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_right"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_same"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_same"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_same"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_same"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_same_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_same_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_same_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_same_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_same_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_same_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_same_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_same_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_sortsupport"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_sortsupport"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_sortsupport"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_sortsupport"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_2d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_2d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_2d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_2d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_3d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_3d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_3d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_3d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_nd"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_nd"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_nd"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_nd"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_config_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_config_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_config_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_within_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_within_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_within_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_within_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geomfromewkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."geomfromewkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."geomfromewkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geomfromewkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."geomfromewkt"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."geomfromewkt"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."geomfromewkt"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geomfromewkt"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_agent_dashboard_kpis"("p_agent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_agent_dashboard_kpis"("p_agent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_agent_dashboard_kpis"("p_agent_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_compliance_matrix"("p_landlord_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_compliance_matrix"("p_landlord_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_compliance_matrix"("p_landlord_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_documents_due_for_reminder"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_documents_due_for_reminder"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_documents_due_for_reminder"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inbox_for_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_inbox_for_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inbox_for_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_key_dates"("p_landlord_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_key_dates"("p_landlord_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_key_dates"("p_landlord_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_landlord_health_score"("p_landlord_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_landlord_health_score"("p_landlord_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_landlord_health_score"("p_landlord_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_landlord_portfolio_kpis"("p_landlord_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_landlord_portfolio_kpis"("p_landlord_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_landlord_portfolio_kpis"("p_landlord_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_landlord_portfolio_properties"("p_landlord_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_landlord_portfolio_properties"("p_landlord_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_landlord_portfolio_properties"("p_landlord_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_nearby_transport_stops"("center_lat" double precision, "center_lng" double precision, "radius_meters" double precision, "max_results" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_nearby_transport_stops"("center_lat" double precision, "center_lng" double precision, "radius_meters" double precision, "max_results" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_nearby_transport_stops"("center_lat" double precision, "center_lng" double precision, "radius_meters" double precision, "max_results" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_proj4_from_srid"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."get_proj4_from_srid"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_proj4_from_srid"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_proj4_from_srid"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_property_financial_summary"("p_property_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_property_financial_summary"("p_property_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_property_financial_summary"("p_property_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."gettransactionid"() TO "postgres";
GRANT ALL ON FUNCTION "public"."gettransactionid"() TO "anon";
GRANT ALL ON FUNCTION "public"."gettransactionid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."gettransactionid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_btree_consistent"("internal", smallint, "anyelement", integer, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_btree_consistent"("internal", smallint, "anyelement", integer, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_btree_consistent"("internal", smallint, "anyelement", integer, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_btree_consistent"("internal", smallint, "anyelement", integer, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_anyenum"("anyenum", "anyenum", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_anyenum"("anyenum", "anyenum", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_anyenum"("anyenum", "anyenum", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_anyenum"("anyenum", "anyenum", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bit"(bit, bit, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bit"(bit, bit, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bit"(bit, bit, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bit"(bit, bit, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bool"(boolean, boolean, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bool"(boolean, boolean, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bool"(boolean, boolean, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bool"(boolean, boolean, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bpchar"(character, character, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bpchar"(character, character, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bpchar"(character, character, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bpchar"(character, character, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bytea"("bytea", "bytea", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bytea"("bytea", "bytea", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bytea"("bytea", "bytea", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bytea"("bytea", "bytea", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_char"("char", "char", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_char"("char", "char", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_char"("char", "char", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_char"("char", "char", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_cidr"("cidr", "cidr", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_cidr"("cidr", "cidr", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_cidr"("cidr", "cidr", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_cidr"("cidr", "cidr", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_date"("date", "date", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_date"("date", "date", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_date"("date", "date", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_date"("date", "date", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float4"(real, real, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float4"(real, real, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float4"(real, real, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float4"(real, real, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float8"(double precision, double precision, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float8"(double precision, double precision, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float8"(double precision, double precision, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float8"(double precision, double precision, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_inet"("inet", "inet", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_inet"("inet", "inet", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_inet"("inet", "inet", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_inet"("inet", "inet", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int2"(smallint, smallint, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int2"(smallint, smallint, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int2"(smallint, smallint, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int2"(smallint, smallint, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int4"(integer, integer, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int4"(integer, integer, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int4"(integer, integer, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int4"(integer, integer, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int8"(bigint, bigint, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int8"(bigint, bigint, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int8"(bigint, bigint, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int8"(bigint, bigint, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_interval"(interval, interval, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_interval"(interval, interval, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_interval"(interval, interval, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_interval"(interval, interval, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr"("macaddr", "macaddr", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr"("macaddr", "macaddr", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr"("macaddr", "macaddr", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr"("macaddr", "macaddr", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr8"("macaddr8", "macaddr8", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr8"("macaddr8", "macaddr8", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr8"("macaddr8", "macaddr8", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr8"("macaddr8", "macaddr8", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_money"("money", "money", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_money"("money", "money", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_money"("money", "money", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_money"("money", "money", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_name"("name", "name", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_name"("name", "name", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_name"("name", "name", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_name"("name", "name", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_numeric"(numeric, numeric, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_numeric"(numeric, numeric, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_numeric"(numeric, numeric, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_numeric"(numeric, numeric, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_oid"("oid", "oid", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_oid"("oid", "oid", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_oid"("oid", "oid", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_oid"("oid", "oid", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_text"("text", "text", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_text"("text", "text", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_text"("text", "text", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_text"("text", "text", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_time"(time without time zone, time without time zone, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_time"(time without time zone, time without time zone, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_time"(time without time zone, time without time zone, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_time"(time without time zone, time without time zone, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamp"(timestamp without time zone, timestamp without time zone, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamp"(timestamp without time zone, timestamp without time zone, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamp"(timestamp without time zone, timestamp without time zone, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamp"(timestamp without time zone, timestamp without time zone, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamptz"(timestamp with time zone, timestamp with time zone, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamptz"(timestamp with time zone, timestamp with time zone, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamptz"(timestamp with time zone, timestamp with time zone, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamptz"(timestamp with time zone, timestamp with time zone, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timetz"(time with time zone, time with time zone, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timetz"(time with time zone, time with time zone, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timetz"(time with time zone, time with time zone, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timetz"(time with time zone, time with time zone, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_uuid"("uuid", "uuid", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_uuid"("uuid", "uuid", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_uuid"("uuid", "uuid", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_uuid"("uuid", "uuid", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_varbit"(bit varying, bit varying, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_varbit"(bit varying, bit varying, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_varbit"(bit varying, bit varying, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_varbit"(bit varying, bit varying, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_enum_cmp"("anyenum", "anyenum") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_enum_cmp"("anyenum", "anyenum") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_enum_cmp"("anyenum", "anyenum") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_enum_cmp"("anyenum", "anyenum") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_anyenum"("anyenum", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_anyenum"("anyenum", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_anyenum"("anyenum", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_anyenum"("anyenum", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_bit"(bit, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bit"(bit, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bit"(bit, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bit"(bit, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_bool"(boolean, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bool"(boolean, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bool"(boolean, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bool"(boolean, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_bpchar"(character, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bpchar"(character, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bpchar"(character, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bpchar"(character, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_bytea"("bytea", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bytea"("bytea", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bytea"("bytea", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bytea"("bytea", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_char"("char", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_char"("char", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_char"("char", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_char"("char", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_cidr"("cidr", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_cidr"("cidr", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_cidr"("cidr", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_cidr"("cidr", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_date"("date", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_date"("date", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_date"("date", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_date"("date", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_float4"(real, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float4"(real, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float4"(real, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float4"(real, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_float8"(double precision, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float8"(double precision, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float8"(double precision, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float8"(double precision, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_inet"("inet", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_inet"("inet", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_inet"("inet", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_inet"("inet", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_int2"(smallint, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int2"(smallint, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int2"(smallint, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int2"(smallint, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_int4"(integer, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int4"(integer, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int4"(integer, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int4"(integer, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_int8"(bigint, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int8"(bigint, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int8"(bigint, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int8"(bigint, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_interval"(interval, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_interval"(interval, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_interval"(interval, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_interval"(interval, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr"("macaddr", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr"("macaddr", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr"("macaddr", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr"("macaddr", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr8"("macaddr8", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr8"("macaddr8", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr8"("macaddr8", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr8"("macaddr8", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_money"("money", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_money"("money", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_money"("money", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_money"("money", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_name"("name", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_name"("name", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_name"("name", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_name"("name", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_numeric"(numeric, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_numeric"(numeric, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_numeric"(numeric, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_numeric"(numeric, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_oid"("oid", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_oid"("oid", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_oid"("oid", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_oid"("oid", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_text"("text", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_text"("text", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_text"("text", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_text"("text", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_time"(time without time zone, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_time"(time without time zone, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_time"(time without time zone, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_time"(time without time zone, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamp"(timestamp without time zone, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamp"(timestamp without time zone, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamp"(timestamp without time zone, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamp"(timestamp without time zone, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamptz"(timestamp with time zone, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamptz"(timestamp with time zone, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamptz"(timestamp with time zone, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamptz"(timestamp with time zone, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_timetz"(time with time zone, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timetz"(time with time zone, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timetz"(time with time zone, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timetz"(time with time zone, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_uuid"("uuid", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_uuid"("uuid", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_uuid"("uuid", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_uuid"("uuid", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_varbit"(bit varying, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_varbit"(bit varying, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_varbit"(bit varying, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_varbit"(bit varying, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_anyenum"("anyenum", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_anyenum"("anyenum", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_anyenum"("anyenum", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_anyenum"("anyenum", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_bit"(bit, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bit"(bit, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bit"(bit, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bit"(bit, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_bool"(boolean, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bool"(boolean, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bool"(boolean, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bool"(boolean, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_bpchar"(character, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bpchar"(character, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bpchar"(character, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bpchar"(character, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_bytea"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bytea"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bytea"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bytea"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_char"("char", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_char"("char", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_char"("char", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_char"("char", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_cidr"("cidr", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_cidr"("cidr", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_cidr"("cidr", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_cidr"("cidr", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_date"("date", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_date"("date", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_date"("date", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_date"("date", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_float4"(real, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float4"(real, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float4"(real, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float4"(real, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_float8"(double precision, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float8"(double precision, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float8"(double precision, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float8"(double precision, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_inet"("inet", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_inet"("inet", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_inet"("inet", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_inet"("inet", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_int2"(smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int2"(smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int2"(smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int2"(smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_int4"(integer, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int4"(integer, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int4"(integer, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int4"(integer, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_int8"(bigint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int8"(bigint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int8"(bigint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int8"(bigint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_interval"(interval, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_interval"(interval, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_interval"(interval, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_interval"(interval, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr"("macaddr", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr"("macaddr", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr"("macaddr", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr"("macaddr", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr8"("macaddr8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr8"("macaddr8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr8"("macaddr8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr8"("macaddr8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_money"("money", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_money"("money", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_money"("money", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_money"("money", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_name"("name", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_name"("name", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_name"("name", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_name"("name", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_numeric"(numeric, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_numeric"(numeric, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_numeric"(numeric, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_numeric"(numeric, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_oid"("oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_oid"("oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_oid"("oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_oid"("oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_text"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_text"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_text"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_text"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_time"(time without time zone, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_time"(time without time zone, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_time"(time without time zone, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_time"(time without time zone, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamp"(timestamp without time zone, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamp"(timestamp without time zone, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamp"(timestamp without time zone, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamp"(timestamp without time zone, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamptz"(timestamp with time zone, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamptz"(timestamp with time zone, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamptz"(timestamp with time zone, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamptz"(timestamp with time zone, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_timetz"(time with time zone, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timetz"(time with time zone, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timetz"(time with time zone, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timetz"(time with time zone, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_uuid"("uuid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_uuid"("uuid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_uuid"("uuid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_uuid"("uuid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_varbit"(bit varying, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_varbit"(bit varying, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_varbit"(bit varying, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_varbit"(bit varying, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_numeric_cmp"(numeric, numeric) TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_numeric_cmp"(numeric, numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."gin_numeric_cmp"(numeric, numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_numeric_cmp"(numeric, numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_2d"("internal", "oid", "internal", smallint) TO "postgres";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_2d"("internal", "oid", "internal", smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_2d"("internal", "oid", "internal", smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_2d"("internal", "oid", "internal", smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_nd"("internal", "oid", "internal", smallint) TO "postgres";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_nd"("internal", "oid", "internal", smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_nd"("internal", "oid", "internal", smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_nd"("internal", "oid", "internal", smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_2d"("internal", "oid", "internal", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_2d"("internal", "oid", "internal", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_2d"("internal", "oid", "internal", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_2d"("internal", "oid", "internal", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_nd"("internal", "oid", "internal", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_nd"("internal", "oid", "internal", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_nd"("internal", "oid", "internal", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_nd"("internal", "oid", "internal", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_favorite_count"("p_listing_id" "uuid", "p_delta" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_favorite_count"("p_listing_id" "uuid", "p_delta" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_favorite_count"("p_listing_id" "uuid", "p_delta" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_listing_view_count"("p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_listing_view_count"("p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_listing_view_count"("p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."geometry", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."geometry", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."geometry", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."geometry", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", timestamp without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text", timestamp without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text", timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text", timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text", timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "text", "p_metadata" "jsonb", "p_ip_address" "inet", "p_success" boolean, "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "text", "p_metadata" "jsonb", "p_ip_address" "inet", "p_success" boolean, "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "text", "p_metadata" "jsonb", "p_ip_address" "inet", "p_success" boolean, "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_consent_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_consent_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_consent_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."longtransactionsenabled"() TO "postgres";
GRANT ALL ON FUNCTION "public"."longtransactionsenabled"() TO "anon";
GRANT ALL ON FUNCTION "public"."longtransactionsenabled"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."longtransactionsenabled"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_introduction_notified"("p_id" "uuid", "p_notified_at" timestamp with time zone, "p_deadline" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_introduction_notified"("p_id" "uuid", "p_notified_at" timestamp with time zone, "p_deadline" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."next_invoice_number"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."next_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."on_review_created"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_review_created"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_review_created"() TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."geometry", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."geometry", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."geometry", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."geometry", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."geography", "public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."geography", "public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."geography", "public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."geography", "public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."geometry", "public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."geometry", "public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."geometry", "public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."geometry", "public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_combinefn"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_combinefn"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_combinefn"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_combinefn"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_deserialfn"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_deserialfn"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_deserialfn"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_deserialfn"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_serialfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_serialfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_serialfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_serialfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterintersecting_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterintersecting_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterintersecting_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterintersecting_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterwithin_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterwithin_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterwithin_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterwithin_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_collect_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_collect_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_collect_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_collect_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_makeline_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_makeline_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_makeline_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_makeline_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_polygonize_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_polygonize_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_polygonize_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_polygonize_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_combinefn"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_combinefn"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_combinefn"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_combinefn"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_deserialfn"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_deserialfn"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_deserialfn"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_deserialfn"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_serialfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_serialfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_serialfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_serialfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("tbl_oid" "oid", "use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("tbl_oid" "oid", "use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("tbl_oid" "oid", "use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("tbl_oid" "oid", "use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_addbbox"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_addbbox"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_addbbox"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_addbbox"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_cache_bbox"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_cache_bbox"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_cache_bbox"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_cache_bbox"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_constraint_dims"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_constraint_dims"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_constraint_dims"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_constraint_dims"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_constraint_srid"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_constraint_srid"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_constraint_srid"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_constraint_srid"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_constraint_type"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_constraint_type"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_constraint_type"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_constraint_type"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_dropbbox"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_dropbbox"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_dropbbox"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_dropbbox"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_extensions_upgrade"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_extensions_upgrade"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_extensions_upgrade"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_extensions_upgrade"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_full_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_full_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_full_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_full_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_geos_noop"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_geos_noop"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_geos_noop"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_geos_noop"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_geos_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_geos_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_geos_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_geos_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_getbbox"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_getbbox"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_getbbox"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_getbbox"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_hasbbox"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_hasbbox"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_hasbbox"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_hasbbox"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_index_supportfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_index_supportfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_index_supportfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_index_supportfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_lib_build_date"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_lib_build_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_lib_build_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_lib_build_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_lib_revision"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_lib_revision"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_lib_revision"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_lib_revision"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_lib_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_lib_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_lib_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_lib_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_libjson_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_libjson_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_libjson_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_libjson_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_liblwgeom_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_liblwgeom_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_liblwgeom_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_liblwgeom_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_libprotobuf_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_libprotobuf_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_libprotobuf_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_libprotobuf_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_libxml_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_libxml_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_libxml_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_libxml_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_noop"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_noop"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_noop"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_noop"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_proj_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_proj_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_proj_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_proj_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_scripts_build_date"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_scripts_build_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_scripts_build_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_scripts_build_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_scripts_installed"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_scripts_installed"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_scripts_installed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_scripts_installed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_scripts_released"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_scripts_released"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_scripts_released"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_scripts_released"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_svn_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_svn_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_svn_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_svn_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_transform_geometry"("geom" "public"."geometry", "text", "text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_transform_geometry"("geom" "public"."geometry", "text", "text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_transform_geometry"("geom" "public"."geometry", "text", "text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_transform_geometry"("geom" "public"."geometry", "text", "text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_type_name"("geomname" character varying, "coord_dimension" integer, "use_new_name" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_type_name"("geomname" character varying, "coord_dimension" integer, "use_new_name" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_type_name"("geomname" character varying, "coord_dimension" integer, "use_new_name" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_type_name"("geomname" character varying, "coord_dimension" integer, "use_new_name" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_typmod_dims"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_typmod_dims"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_typmod_dims"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_typmod_dims"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_typmod_srid"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_typmod_srid"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_typmod_srid"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_typmod_srid"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_typmod_type"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_typmod_type"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_typmod_type"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_typmod_type"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_wagyu_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_wagyu_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_wagyu_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_wagyu_version"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_deleted_user"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_deleted_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."purge_deleted_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_search_listings"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_search_listings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_search_listings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reschedule_viewing"("p_viewing_id" "uuid", "p_new_slot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reschedule_viewing"("p_viewing_id" "uuid", "p_new_slot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reschedule_viewing"("p_viewing_id" "uuid", "p_new_slot_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."review_invoice_candidate"("p_id" "uuid", "p_reviewer" "uuid", "p_new_status" "text", "p_note" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."review_invoice_candidate"("p_id" "uuid", "p_reviewer" "uuid", "p_new_status" "text", "p_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_listings_by_polygon"("polygon_geojson" "text", "p_listing_type" "public"."listing_type", "p_min_price" numeric, "p_max_price" numeric, "p_min_bedrooms" integer, "p_property_type" "public"."property_type", "p_limit" integer, "p_cursor" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."search_listings_by_polygon"("polygon_geojson" "text", "p_listing_type" "public"."listing_type", "p_min_price" numeric, "p_max_price" numeric, "p_min_bedrooms" integer, "p_property_type" "public"."property_type", "p_limit" integer, "p_cursor" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_listings_by_polygon"("polygon_geojson" "text", "p_listing_type" "public"."listing_type", "p_min_price" numeric, "p_max_price" numeric, "p_min_bedrooms" integer, "p_property_type" "public"."property_type", "p_limit" integer, "p_cursor" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_listings_by_radius"("center_lat" double precision, "center_lng" double precision, "radius_meters" double precision, "p_listing_type" "public"."listing_type", "p_min_price" numeric, "p_max_price" numeric, "p_min_bedrooms" integer, "p_property_type" "public"."property_type", "p_limit" integer, "p_cursor" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."search_listings_by_radius"("center_lat" double precision, "center_lng" double precision, "radius_meters" double precision, "p_listing_type" "public"."listing_type", "p_min_price" numeric, "p_max_price" numeric, "p_min_bedrooms" integer, "p_property_type" "public"."property_type", "p_limit" integer, "p_cursor" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_listings_by_radius"("center_lat" double precision, "center_lng" double precision, "radius_meters" double precision, "p_listing_type" "public"."listing_type", "p_min_price" numeric, "p_max_price" numeric, "p_min_bedrooms" integer, "p_property_type" "public"."property_type", "p_limit" integer, "p_cursor" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_providers"("p_service_category" "public"."service_category", "p_postcode" "text", "p_lat" double precision, "p_lng" double precision, "p_radius_miles" integer, "p_min_rating" numeric, "p_search_query" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_providers"("p_service_category" "public"."service_category", "p_postcode" "text", "p_lat" double precision, "p_lng" double precision, "p_radius_miles" integer, "p_min_rating" numeric, "p_search_query" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_providers"("p_service_category" "public"."service_category", "p_postcode" "text", "p_lat" double precision, "p_lng" double precision, "p_radius_miles" integer, "p_min_rating" numeric, "p_search_query" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."select_roles_atomic"("p_user_id" "uuid", "p_roles" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."select_roles_atomic"("p_user_id" "uuid", "p_roles" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."select_roles_atomic"("p_user_id" "uuid", "p_roles" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_property_coordinates"("p_property_id" "uuid", "p_lng" double precision, "p_lat" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."set_property_coordinates"("p_property_id" "uuid", "p_lng" double precision, "p_lat" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_property_coordinates"("p_property_id" "uuid", "p_lng" double precision, "p_lat" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dclosestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dclosestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dclosestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dclosestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3ddistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3ddistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3ddistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3ddistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dlength"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dlength"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dlength"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dlength"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dlineinterpolatepoint"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dlineinterpolatepoint"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dlineinterpolatepoint"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dlineinterpolatepoint"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dlongestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dlongestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dlongestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dlongestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dmakebox"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dmakebox"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dmakebox"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dmakebox"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dmaxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dmaxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dmaxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dmaxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dperimeter"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dperimeter"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dperimeter"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dperimeter"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dshortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dshortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dshortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dshortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_addmeasure"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_addmeasure"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_addmeasure"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_addmeasure"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_angle"("line1" "public"."geometry", "line2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_angle"("line1" "public"."geometry", "line2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_angle"("line1" "public"."geometry", "line2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_angle"("line1" "public"."geometry", "line2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_angle"("pt1" "public"."geometry", "pt2" "public"."geometry", "pt3" "public"."geometry", "pt4" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_angle"("pt1" "public"."geometry", "pt2" "public"."geometry", "pt3" "public"."geometry", "pt4" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_angle"("pt1" "public"."geometry", "pt2" "public"."geometry", "pt3" "public"."geometry", "pt4" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_angle"("pt1" "public"."geometry", "pt2" "public"."geometry", "pt3" "public"."geometry", "pt4" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_area"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_area"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_area"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_area"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_area"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_area"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_area"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_area"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_area"("geog" "public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_area"("geog" "public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_area"("geog" "public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_area"("geog" "public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_area2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_area2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_area2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_area2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asencodedpolyline"("geom" "public"."geometry", "nprecision" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asencodedpolyline"("geom" "public"."geometry", "nprecision" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asencodedpolyline"("geom" "public"."geometry", "nprecision" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asencodedpolyline"("geom" "public"."geometry", "nprecision" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeojson"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeojson"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeojson"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeojson"("r" "record", "geom_column" "text", "maxdecimaldigits" integer, "pretty_bool" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("r" "record", "geom_column" "text", "maxdecimaldigits" integer, "pretty_bool" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("r" "record", "geom_column" "text", "maxdecimaldigits" integer, "pretty_bool" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("r" "record", "geom_column" "text", "maxdecimaldigits" integer, "pretty_bool" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_askml"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_askml"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_askml"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_askml"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_askml"("geog" "public"."geography", "maxdecimaldigits" integer, "nprefix" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_askml"("geog" "public"."geography", "maxdecimaldigits" integer, "nprefix" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_askml"("geog" "public"."geography", "maxdecimaldigits" integer, "nprefix" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_askml"("geog" "public"."geography", "maxdecimaldigits" integer, "nprefix" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_askml"("geom" "public"."geometry", "maxdecimaldigits" integer, "nprefix" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_askml"("geom" "public"."geometry", "maxdecimaldigits" integer, "nprefix" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_askml"("geom" "public"."geometry", "maxdecimaldigits" integer, "nprefix" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_askml"("geom" "public"."geometry", "maxdecimaldigits" integer, "nprefix" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_aslatlontext"("geom" "public"."geometry", "tmpl" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_aslatlontext"("geom" "public"."geometry", "tmpl" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_aslatlontext"("geom" "public"."geometry", "tmpl" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_aslatlontext"("geom" "public"."geometry", "tmpl" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmarc21"("geom" "public"."geometry", "format" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmarc21"("geom" "public"."geometry", "format" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmarc21"("geom" "public"."geometry", "format" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmarc21"("geom" "public"."geometry", "format" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvtgeom"("geom" "public"."geometry", "bounds" "public"."box2d", "extent" integer, "buffer" integer, "clip_geom" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvtgeom"("geom" "public"."geometry", "bounds" "public"."box2d", "extent" integer, "buffer" integer, "clip_geom" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvtgeom"("geom" "public"."geometry", "bounds" "public"."box2d", "extent" integer, "buffer" integer, "clip_geom" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvtgeom"("geom" "public"."geometry", "bounds" "public"."box2d", "extent" integer, "buffer" integer, "clip_geom" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_assvg"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_assvg"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_assvg"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_assvg"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_assvg"("geog" "public"."geography", "rel" integer, "maxdecimaldigits" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_assvg"("geog" "public"."geography", "rel" integer, "maxdecimaldigits" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_assvg"("geog" "public"."geography", "rel" integer, "maxdecimaldigits" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_assvg"("geog" "public"."geography", "rel" integer, "maxdecimaldigits" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_assvg"("geom" "public"."geometry", "rel" integer, "maxdecimaldigits" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_assvg"("geom" "public"."geometry", "rel" integer, "maxdecimaldigits" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_assvg"("geom" "public"."geometry", "rel" integer, "maxdecimaldigits" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_assvg"("geom" "public"."geometry", "rel" integer, "maxdecimaldigits" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry", "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry", "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry", "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry", "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry"[], "ids" bigint[], "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry"[], "ids" bigint[], "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry"[], "ids" bigint[], "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry"[], "ids" bigint[], "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asx3d"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asx3d"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asx3d"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asx3d"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_azimuth"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_azimuth"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_bdmpolyfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_bdmpolyfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_bdmpolyfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_bdmpolyfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_bdpolyfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_bdpolyfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_bdpolyfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_bdpolyfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_boundary"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_boundary"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_boundary"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_boundary"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_boundingdiagonal"("geom" "public"."geometry", "fits" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_boundingdiagonal"("geom" "public"."geometry", "fits" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_boundingdiagonal"("geom" "public"."geometry", "fits" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_boundingdiagonal"("geom" "public"."geometry", "fits" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_box2dfromgeohash"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_box2dfromgeohash"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_box2dfromgeohash"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_box2dfromgeohash"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "quadsegs" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "quadsegs" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "quadsegs" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "quadsegs" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "options" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "options" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "options" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "options" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buildarea"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buildarea"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_buildarea"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buildarea"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_centroid"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_centroid"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_centroid"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_centroid"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_chaikinsmoothing"("public"."geometry", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_chaikinsmoothing"("public"."geometry", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_chaikinsmoothing"("public"."geometry", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_chaikinsmoothing"("public"."geometry", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_cleangeometry"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_cleangeometry"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_cleangeometry"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_cleangeometry"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clipbybox2d"("geom" "public"."geometry", "box" "public"."box2d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clipbybox2d"("geom" "public"."geometry", "box" "public"."box2d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_clipbybox2d"("geom" "public"."geometry", "box" "public"."box2d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clipbybox2d"("geom" "public"."geometry", "box" "public"."box2d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_closestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_closestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_closestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_closestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_closestpointofapproach"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_closestpointofapproach"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_closestpointofapproach"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_closestpointofapproach"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterdbscan"("public"."geometry", "eps" double precision, "minpoints" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterdbscan"("public"."geometry", "eps" double precision, "minpoints" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterdbscan"("public"."geometry", "eps" double precision, "minpoints" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterdbscan"("public"."geometry", "eps" double precision, "minpoints" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterkmeans"("geom" "public"."geometry", "k" integer, "max_radius" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterkmeans"("geom" "public"."geometry", "k" integer, "max_radius" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterkmeans"("geom" "public"."geometry", "k" integer, "max_radius" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterkmeans"("geom" "public"."geometry", "k" integer, "max_radius" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry"[], double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry"[], double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry"[], double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry"[], double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collect"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collect"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_collect"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collect"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collectionhomogenize"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collectionhomogenize"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_collectionhomogenize"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collectionhomogenize"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box2d", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box2d", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box2d", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box2d", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_concavehull"("param_geom" "public"."geometry", "param_pctconvex" double precision, "param_allow_holes" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_concavehull"("param_geom" "public"."geometry", "param_pctconvex" double precision, "param_allow_holes" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_concavehull"("param_geom" "public"."geometry", "param_pctconvex" double precision, "param_allow_holes" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_concavehull"("param_geom" "public"."geometry", "param_pctconvex" double precision, "param_allow_holes" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_convexhull"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_convexhull"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_convexhull"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_convexhull"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_coorddim"("geometry" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_coorddim"("geometry" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_coorddim"("geometry" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_coorddim"("geometry" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_coveredby"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_coveredby"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_coveredby"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_coveredby"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_covers"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_covers"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_covers"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_covers"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_cpawithin"("public"."geometry", "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_cpawithin"("public"."geometry", "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_cpawithin"("public"."geometry", "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_cpawithin"("public"."geometry", "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_curvetoline"("geom" "public"."geometry", "tol" double precision, "toltype" integer, "flags" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_curvetoline"("geom" "public"."geometry", "tol" double precision, "toltype" integer, "flags" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_curvetoline"("geom" "public"."geometry", "tol" double precision, "toltype" integer, "flags" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_curvetoline"("geom" "public"."geometry", "tol" double precision, "toltype" integer, "flags" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_delaunaytriangles"("g1" "public"."geometry", "tolerance" double precision, "flags" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_delaunaytriangles"("g1" "public"."geometry", "tolerance" double precision, "flags" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_delaunaytriangles"("g1" "public"."geometry", "tolerance" double precision, "flags" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_delaunaytriangles"("g1" "public"."geometry", "tolerance" double precision, "flags" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_difference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_difference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_difference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_difference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dimension"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dimension"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dimension"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dimension"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_disjoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_disjoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_disjoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_disjoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distance"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distance"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distance"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distance"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distance"("geog1" "public"."geography", "geog2" "public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distance"("geog1" "public"."geography", "geog2" "public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_distance"("geog1" "public"."geography", "geog2" "public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distance"("geog1" "public"."geography", "geog2" "public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancecpa"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancecpa"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancecpa"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancecpa"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry", "radius" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry", "radius" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry", "radius" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry", "radius" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry", "public"."spheroid") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry", "public"."spheroid") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry", "public"."spheroid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry", "public"."spheroid") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dump"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dump"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dump"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dump"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dumppoints"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dumppoints"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dumppoints"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dumppoints"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dumprings"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dumprings"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dumprings"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dumprings"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dumpsegments"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dumpsegments"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dumpsegments"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dumpsegments"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dwithin"("text", "text", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dwithin"("text", "text", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_dwithin"("text", "text", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dwithin"("text", "text", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_endpoint"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_endpoint"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_endpoint"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_endpoint"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_envelope"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_envelope"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_envelope"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_envelope"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("public"."box2d", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box2d", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box2d", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box2d", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("public"."box3d", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box3d", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box3d", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box3d", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box2d", "dx" double precision, "dy" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box2d", "dx" double precision, "dy" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box2d", "dx" double precision, "dy" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box2d", "dx" double precision, "dy" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box3d", "dx" double precision, "dy" double precision, "dz" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box3d", "dx" double precision, "dy" double precision, "dz" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box3d", "dx" double precision, "dy" double precision, "dz" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box3d", "dx" double precision, "dy" double precision, "dz" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("geom" "public"."geometry", "dx" double precision, "dy" double precision, "dz" double precision, "dm" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("geom" "public"."geometry", "dx" double precision, "dy" double precision, "dz" double precision, "dm" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("geom" "public"."geometry", "dx" double precision, "dy" double precision, "dz" double precision, "dm" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("geom" "public"."geometry", "dx" double precision, "dy" double precision, "dz" double precision, "dm" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_exteriorring"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_exteriorring"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_exteriorring"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_exteriorring"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_filterbym"("public"."geometry", double precision, double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_filterbym"("public"."geometry", double precision, double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_filterbym"("public"."geometry", double precision, double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_filterbym"("public"."geometry", double precision, double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_flipcoordinates"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_flipcoordinates"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_flipcoordinates"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_flipcoordinates"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_force2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force3d"("geom" "public"."geometry", "zvalue" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force3d"("geom" "public"."geometry", "zvalue" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_force3d"("geom" "public"."geometry", "zvalue" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force3d"("geom" "public"."geometry", "zvalue" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force3dm"("geom" "public"."geometry", "mvalue" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force3dm"("geom" "public"."geometry", "mvalue" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_force3dm"("geom" "public"."geometry", "mvalue" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force3dm"("geom" "public"."geometry", "mvalue" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force3dz"("geom" "public"."geometry", "zvalue" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force3dz"("geom" "public"."geometry", "zvalue" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_force3dz"("geom" "public"."geometry", "zvalue" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force3dz"("geom" "public"."geometry", "zvalue" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force4d"("geom" "public"."geometry", "zvalue" double precision, "mvalue" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force4d"("geom" "public"."geometry", "zvalue" double precision, "mvalue" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_force4d"("geom" "public"."geometry", "zvalue" double precision, "mvalue" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force4d"("geom" "public"."geometry", "zvalue" double precision, "mvalue" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcecollection"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcecollection"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcecollection"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcecollection"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcecurve"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcecurve"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcecurve"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcecurve"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcepolygonccw"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcepolygonccw"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcepolygonccw"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcepolygonccw"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcepolygoncw"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcepolygoncw"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcepolygoncw"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcepolygoncw"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcerhr"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcerhr"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcerhr"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcerhr"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry", "version" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry", "version" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry", "version" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry", "version" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_frechetdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_frechetdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_frechetdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_frechetdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_fromflatgeobuf"("anyelement", "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuf"("anyelement", "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuf"("anyelement", "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuf"("anyelement", "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_fromflatgeobuftotable"("text", "text", "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuftotable"("text", "text", "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuftotable"("text", "text", "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuftotable"("text", "text", "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer, "seed" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer, "seed" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer, "seed" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer, "seed" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geogfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geogfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geogfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geogfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geogfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geogfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geogfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geogfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geographyfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geographyfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geographyfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geographyfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geohash"("geog" "public"."geography", "maxchars" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geohash"("geog" "public"."geography", "maxchars" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geohash"("geog" "public"."geography", "maxchars" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geohash"("geog" "public"."geography", "maxchars" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geohash"("geom" "public"."geometry", "maxchars" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geohash"("geom" "public"."geometry", "maxchars" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geohash"("geom" "public"."geometry", "maxchars" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geohash"("geom" "public"."geometry", "maxchars" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometricmedian"("g" "public"."geometry", "tolerance" double precision, "max_iter" integer, "fail_if_not_converged" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometricmedian"("g" "public"."geometry", "tolerance" double precision, "max_iter" integer, "fail_if_not_converged" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometricmedian"("g" "public"."geometry", "tolerance" double precision, "max_iter" integer, "fail_if_not_converged" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometricmedian"("g" "public"."geometry", "tolerance" double precision, "max_iter" integer, "fail_if_not_converged" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometryn"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometryn"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometryn"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometryn"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometrytype"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometrytype"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometrytype"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometrytype"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromewkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromewkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromewkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromewkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromewkt"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromewkt"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromewkt"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromewkt"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgeohash"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgeohash"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgeohash"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgeohash"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"(json) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"(json) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"(json) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"(json) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromkml"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromkml"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromkml"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromkml"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfrommarc21"("marc21xml" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfrommarc21"("marc21xml" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfrommarc21"("marc21xml" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfrommarc21"("marc21xml" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromtwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromtwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromtwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromtwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_gmltosql"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_gmltosql"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hasarc"("geometry" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hasarc"("geometry" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_hasarc"("geometry" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hasarc"("geometry" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hexagon"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hexagon"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_hexagon"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hexagon"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hexagongrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hexagongrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_hexagongrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hexagongrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_interiorringn"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_interiorringn"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_interiorringn"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_interiorringn"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_interpolatepoint"("line" "public"."geometry", "point" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_interpolatepoint"("line" "public"."geometry", "point" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_interpolatepoint"("line" "public"."geometry", "point" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_interpolatepoint"("line" "public"."geometry", "point" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersection"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersection"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersection"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersection"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersection"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersection"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersection"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersection"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersection"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersection"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersection"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersection"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersects"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersects"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersects"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersects"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersects"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersects"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersects"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersects"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isclosed"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isclosed"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isclosed"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isclosed"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_iscollection"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_iscollection"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_iscollection"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_iscollection"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isempty"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isempty"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isempty"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isempty"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ispolygonccw"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ispolygonccw"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ispolygonccw"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ispolygonccw"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ispolygoncw"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ispolygoncw"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ispolygoncw"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ispolygoncw"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isring"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isring"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isring"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isring"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_issimple"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_issimple"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_issimple"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_issimple"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvaliddetail"("geom" "public"."geometry", "flags" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvaliddetail"("geom" "public"."geometry", "flags" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvaliddetail"("geom" "public"."geometry", "flags" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvaliddetail"("geom" "public"."geometry", "flags" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalidtrajectory"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalidtrajectory"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalidtrajectory"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalidtrajectory"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_length"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_length"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length"("geog" "public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length"("geog" "public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_length"("geog" "public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length"("geog" "public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_length2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length2dspheroid"("public"."geometry", "public"."spheroid") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length2dspheroid"("public"."geometry", "public"."spheroid") TO "anon";
GRANT ALL ON FUNCTION "public"."st_length2dspheroid"("public"."geometry", "public"."spheroid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length2dspheroid"("public"."geometry", "public"."spheroid") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_lengthspheroid"("public"."geometry", "public"."spheroid") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_lengthspheroid"("public"."geometry", "public"."spheroid") TO "anon";
GRANT ALL ON FUNCTION "public"."st_lengthspheroid"("public"."geometry", "public"."spheroid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_lengthspheroid"("public"."geometry", "public"."spheroid") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_letters"("letters" "text", "font" json) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_letters"("letters" "text", "font" json) TO "anon";
GRANT ALL ON FUNCTION "public"."st_letters"("letters" "text", "font" json) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_letters"("letters" "text", "font" json) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromencodedpolyline"("txtin" "text", "nprecision" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromencodedpolyline"("txtin" "text", "nprecision" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromencodedpolyline"("txtin" "text", "nprecision" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromencodedpolyline"("txtin" "text", "nprecision" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefrommultipoint"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefrommultipoint"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefrommultipoint"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefrommultipoint"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoint"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoint"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoint"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoint"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoints"("public"."geometry", double precision, "repeat" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoints"("public"."geometry", double precision, "repeat" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoints"("public"."geometry", double precision, "repeat" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoints"("public"."geometry", double precision, "repeat" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linelocatepoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linelocatepoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linelocatepoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linelocatepoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linesubstring"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linesubstring"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linesubstring"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linesubstring"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linetocurve"("geometry" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linetocurve"("geometry" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linetocurve"("geometry" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linetocurve"("geometry" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_locatealong"("geometry" "public"."geometry", "measure" double precision, "leftrightoffset" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_locatealong"("geometry" "public"."geometry", "measure" double precision, "leftrightoffset" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_locatealong"("geometry" "public"."geometry", "measure" double precision, "leftrightoffset" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_locatealong"("geometry" "public"."geometry", "measure" double precision, "leftrightoffset" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_locatebetween"("geometry" "public"."geometry", "frommeasure" double precision, "tomeasure" double precision, "leftrightoffset" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_locatebetween"("geometry" "public"."geometry", "frommeasure" double precision, "tomeasure" double precision, "leftrightoffset" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_locatebetween"("geometry" "public"."geometry", "frommeasure" double precision, "tomeasure" double precision, "leftrightoffset" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_locatebetween"("geometry" "public"."geometry", "frommeasure" double precision, "tomeasure" double precision, "leftrightoffset" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_locatebetweenelevations"("geometry" "public"."geometry", "fromelevation" double precision, "toelevation" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_locatebetweenelevations"("geometry" "public"."geometry", "fromelevation" double precision, "toelevation" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_locatebetweenelevations"("geometry" "public"."geometry", "fromelevation" double precision, "toelevation" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_locatebetweenelevations"("geometry" "public"."geometry", "fromelevation" double precision, "toelevation" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_m"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_m"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_m"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_m"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makebox2d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makebox2d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makebox2d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makebox2d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makeenvelope"(double precision, double precision, double precision, double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makeenvelope"(double precision, double precision, double precision, double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makeenvelope"(double precision, double precision, double precision, double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makeenvelope"(double precision, double precision, double precision, double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makeline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makeline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makeline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makeline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepointm"(double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepointm"(double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepointm"(double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepointm"(double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry", "public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry", "public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry", "public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry", "public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makevalid"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makevalid"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makevalid"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makevalid"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makevalid"("geom" "public"."geometry", "params" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makevalid"("geom" "public"."geometry", "params" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makevalid"("geom" "public"."geometry", "params" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makevalid"("geom" "public"."geometry", "params" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_maximuminscribedcircle"("public"."geometry", OUT "center" "public"."geometry", OUT "nearest" "public"."geometry", OUT "radius" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_maximuminscribedcircle"("public"."geometry", OUT "center" "public"."geometry", OUT "nearest" "public"."geometry", OUT "radius" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_maximuminscribedcircle"("public"."geometry", OUT "center" "public"."geometry", OUT "nearest" "public"."geometry", OUT "radius" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_maximuminscribedcircle"("public"."geometry", OUT "center" "public"."geometry", OUT "nearest" "public"."geometry", OUT "radius" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_memsize"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_memsize"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_memsize"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_memsize"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_minimumboundingcircle"("inputgeom" "public"."geometry", "segs_per_quarter" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_minimumboundingcircle"("inputgeom" "public"."geometry", "segs_per_quarter" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_minimumboundingcircle"("inputgeom" "public"."geometry", "segs_per_quarter" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_minimumboundingcircle"("inputgeom" "public"."geometry", "segs_per_quarter" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_minimumboundingradius"("public"."geometry", OUT "center" "public"."geometry", OUT "radius" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_minimumboundingradius"("public"."geometry", OUT "center" "public"."geometry", OUT "radius" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_minimumboundingradius"("public"."geometry", OUT "center" "public"."geometry", OUT "radius" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_minimumboundingradius"("public"."geometry", OUT "center" "public"."geometry", OUT "radius" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_minimumclearance"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_minimumclearance"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_minimumclearance"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_minimumclearance"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_minimumclearanceline"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_minimumclearanceline"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_minimumclearanceline"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_minimumclearanceline"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multi"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multi"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multi"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multi"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multilinefromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multilinefromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multilinefromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multilinefromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipointfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipointfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipointfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipointfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ndims"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ndims"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ndims"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ndims"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_node"("g" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_node"("g" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_node"("g" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_node"("g" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_normalize"("geom" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_normalize"("geom" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_normalize"("geom" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_normalize"("geom" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_npoints"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_npoints"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_npoints"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_npoints"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_nrings"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_nrings"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_nrings"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_nrings"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numgeometries"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numgeometries"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numgeometries"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numgeometries"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numinteriorring"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numinteriorring"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numinteriorring"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numinteriorring"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numinteriorrings"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numinteriorrings"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numinteriorrings"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numinteriorrings"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numpatches"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numpatches"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numpatches"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numpatches"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numpoints"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numpoints"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numpoints"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numpoints"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_offsetcurve"("line" "public"."geometry", "distance" double precision, "params" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_offsetcurve"("line" "public"."geometry", "distance" double precision, "params" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_offsetcurve"("line" "public"."geometry", "distance" double precision, "params" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_offsetcurve"("line" "public"."geometry", "distance" double precision, "params" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_orientedenvelope"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_orientedenvelope"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_orientedenvelope"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_orientedenvelope"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_patchn"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_patchn"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_patchn"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_patchn"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_perimeter"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_perimeter"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_perimeter"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_perimeter"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_perimeter"("geog" "public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_perimeter"("geog" "public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_perimeter"("geog" "public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_perimeter"("geog" "public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_perimeter2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_perimeter2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_perimeter2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_perimeter2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision, "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision, "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision, "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision, "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromgeohash"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromgeohash"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromgeohash"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromgeohash"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointinsidecircle"("public"."geometry", double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointinsidecircle"("public"."geometry", double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointinsidecircle"("public"."geometry", double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointinsidecircle"("public"."geometry", double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointm"("xcoordinate" double precision, "ycoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointm"("xcoordinate" double precision, "ycoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointm"("xcoordinate" double precision, "ycoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointm"("xcoordinate" double precision, "ycoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointn"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointn"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointn"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointn"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointonsurface"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointonsurface"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointonsurface"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointonsurface"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_points"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_points"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_points"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_points"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointz"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointz"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointz"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointz"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointzm"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointzm"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointzm"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointzm"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygon"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygon"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygon"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygon"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_project"("geog" "public"."geography", "distance" double precision, "azimuth" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_project"("geog" "public"."geography", "distance" double precision, "azimuth" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_project"("geog" "public"."geography", "distance" double precision, "azimuth" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_project"("geog" "public"."geography", "distance" double precision, "azimuth" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_quantizecoordinates"("g" "public"."geometry", "prec_x" integer, "prec_y" integer, "prec_z" integer, "prec_m" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_quantizecoordinates"("g" "public"."geometry", "prec_x" integer, "prec_y" integer, "prec_z" integer, "prec_m" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_quantizecoordinates"("g" "public"."geometry", "prec_x" integer, "prec_y" integer, "prec_z" integer, "prec_m" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_quantizecoordinates"("g" "public"."geometry", "prec_x" integer, "prec_y" integer, "prec_z" integer, "prec_m" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_reduceprecision"("geom" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_reduceprecision"("geom" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_reduceprecision"("geom" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_reduceprecision"("geom" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_relatematch"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_relatematch"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_relatematch"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_relatematch"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_removepoint"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_removepoint"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_removepoint"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_removepoint"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_removerepeatedpoints"("geom" "public"."geometry", "tolerance" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_removerepeatedpoints"("geom" "public"."geometry", "tolerance" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_removerepeatedpoints"("geom" "public"."geometry", "tolerance" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_removerepeatedpoints"("geom" "public"."geometry", "tolerance" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_reverse"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_reverse"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_reverse"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_reverse"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotatex"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotatex"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotatex"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotatex"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotatey"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotatey"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotatey"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotatey"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotatez"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotatez"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotatez"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotatez"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry", "origin" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry", "origin" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry", "origin" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry", "origin" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scroll"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scroll"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_scroll"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scroll"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_segmentize"("geog" "public"."geography", "max_segment_length" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_segmentize"("geog" "public"."geography", "max_segment_length" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_segmentize"("geog" "public"."geography", "max_segment_length" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_segmentize"("geog" "public"."geography", "max_segment_length" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_segmentize"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_segmentize"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_segmentize"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_segmentize"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_seteffectivearea"("public"."geometry", double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_seteffectivearea"("public"."geometry", double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_seteffectivearea"("public"."geometry", double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_seteffectivearea"("public"."geometry", double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_setpoint"("public"."geometry", integer, "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_setpoint"("public"."geometry", integer, "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_setpoint"("public"."geometry", integer, "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_setpoint"("public"."geometry", integer, "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_setsrid"("geog" "public"."geography", "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geog" "public"."geography", "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geog" "public"."geography", "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geog" "public"."geography", "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_setsrid"("geom" "public"."geometry", "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geom" "public"."geometry", "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geom" "public"."geometry", "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geom" "public"."geometry", "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_sharedpaths"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_sharedpaths"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_sharedpaths"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_sharedpaths"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_shiftlongitude"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_shiftlongitude"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_shiftlongitude"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_shiftlongitude"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_shortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_shortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_shortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_shortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplifypolygonhull"("geom" "public"."geometry", "vertex_fraction" double precision, "is_outer" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplifypolygonhull"("geom" "public"."geometry", "vertex_fraction" double precision, "is_outer" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplifypolygonhull"("geom" "public"."geometry", "vertex_fraction" double precision, "is_outer" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplifypolygonhull"("geom" "public"."geometry", "vertex_fraction" double precision, "is_outer" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplifypreservetopology"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplifypreservetopology"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplifypreservetopology"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplifypreservetopology"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplifyvw"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplifyvw"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplifyvw"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplifyvw"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snap"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snap"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snap"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snap"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snaptogrid"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_split"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_split"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_split"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_split"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_square"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_square"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_square"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_square"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_squaregrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_squaregrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_squaregrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_squaregrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_srid"("geog" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_srid"("geog" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_srid"("geog" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_srid"("geog" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_srid"("geom" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_srid"("geom" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_srid"("geom" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_srid"("geom" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_startpoint"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_startpoint"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_startpoint"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_startpoint"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_subdivide"("geom" "public"."geometry", "maxvertices" integer, "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_subdivide"("geom" "public"."geometry", "maxvertices" integer, "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_subdivide"("geom" "public"."geometry", "maxvertices" integer, "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_subdivide"("geom" "public"."geometry", "maxvertices" integer, "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_summary"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_summary"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_swapordinates"("geom" "public"."geometry", "ords" "cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_swapordinates"("geom" "public"."geometry", "ords" "cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."st_swapordinates"("geom" "public"."geometry", "ords" "cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_swapordinates"("geom" "public"."geometry", "ords" "cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_symdifference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_symdifference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_symdifference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_symdifference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_symmetricdifference"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_symmetricdifference"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_symmetricdifference"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_symmetricdifference"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_tileenvelope"("zoom" integer, "x" integer, "y" integer, "bounds" "public"."geometry", "margin" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_tileenvelope"("zoom" integer, "x" integer, "y" integer, "bounds" "public"."geometry", "margin" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_tileenvelope"("zoom" integer, "x" integer, "y" integer, "bounds" "public"."geometry", "margin" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_tileenvelope"("zoom" integer, "x" integer, "y" integer, "bounds" "public"."geometry", "margin" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transform"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transform"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_transform"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transform"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "to_proj" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "to_proj" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "to_proj" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "to_proj" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_proj" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_proj" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_proj" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_proj" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transscale"("public"."geometry", double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transscale"("public"."geometry", double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_transscale"("public"."geometry", double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transscale"("public"."geometry", double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_triangulatepolygon"("g1" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_triangulatepolygon"("g1" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_triangulatepolygon"("g1" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_triangulatepolygon"("g1" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_unaryunion"("public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_unaryunion"("public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_unaryunion"("public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_unaryunion"("public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_voronoilines"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_voronoilines"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_voronoilines"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_voronoilines"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_voronoipolygons"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_voronoipolygons"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_voronoipolygons"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_voronoipolygons"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_wkbtosql"("wkb" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_wkbtosql"("wkb" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_wkbtosql"("wkb" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_wkbtosql"("wkb" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_wkttosql"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_wkttosql"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_wkttosql"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_wkttosql"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_wrapx"("geom" "public"."geometry", "wrap" double precision, "move" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_wrapx"("geom" "public"."geometry", "wrap" double precision, "move" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_wrapx"("geom" "public"."geometry", "wrap" double precision, "move" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_wrapx"("geom" "public"."geometry", "wrap" double precision, "move" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_x"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_x"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_x"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_x"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_xmax"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_xmax"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_xmax"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_xmax"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_xmin"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_xmin"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_xmin"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_xmin"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_y"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_y"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_y"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_y"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ymax"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ymax"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ymax"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ymax"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ymin"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ymin"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ymin"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ymin"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_z"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_z"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_z"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_z"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_zmax"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_zmax"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_zmax"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_zmax"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_zmflag"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_zmflag"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_zmflag"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_zmflag"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_zmin"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_zmin"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_zmin"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_zmin"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."switch_role_atomic"("p_user_id" "uuid", "p_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."switch_role_atomic"("p_user_id" "uuid", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."switch_role_atomic"("p_user_id" "uuid", "p_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_price_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_price_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_price_changes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."transition_introduction"("p_id" "uuid", "p_new_status" "text", "p_reason" "text", "p_actor" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."transition_introduction"("p_id" "uuid", "p_new_status" "text", "p_reason" "text", "p_actor" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."transition_invoice"("p_id" "uuid", "p_event" "text", "p_days_overdue" integer, "p_actor" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."transition_invoice"("p_id" "uuid", "p_event" "text", "p_days_overdue" integer, "p_actor" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."truedeed_fill_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."truedeed_fill_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."truedeed_fill_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."truedeed_forbid_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."truedeed_forbid_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."truedeed_forbid_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."truedeed_introductions_guard"() TO "anon";
GRANT ALL ON FUNCTION "public"."truedeed_introductions_guard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."truedeed_introductions_guard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."truedeed_invoice_candidates_guard"() TO "anon";
GRANT ALL ON FUNCTION "public"."truedeed_invoice_candidates_guard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."truedeed_invoice_candidates_guard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."truedeed_invoice_disputes_guard"() TO "anon";
GRANT ALL ON FUNCTION "public"."truedeed_invoice_disputes_guard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."truedeed_invoice_disputes_guard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."truedeed_invoices_guard"() TO "anon";
GRANT ALL ON FUNCTION "public"."truedeed_invoices_guard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."truedeed_invoices_guard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."truedeed_rebuttals_guard"() TO "anon";
GRANT ALL ON FUNCTION "public"."truedeed_rebuttals_guard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."truedeed_rebuttals_guard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."truedeed_set_intro_hash"() TO "anon";
GRANT ALL ON FUNCTION "public"."truedeed_set_intro_hash"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."truedeed_set_intro_hash"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unlockrows"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unlockrows"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."unlockrows"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unlockrows"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_certificates_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_certificates_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_certificates_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_completed_jobs_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_completed_jobs_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_completed_jobs_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_schedules_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_schedules_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_schedules_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ppd_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ppd_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ppd_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_properties_tsv"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_properties_tsv"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_properties_tsv"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_provider_rating_stats_incremental"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_provider_rating_stats_incremental"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_provider_rating_stats_incremental"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, character varying, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, character varying, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, character varying, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, character varying, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."updategeometrysrid"("catalogn_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"("catalogn_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"("catalogn_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"("catalogn_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";












GRANT ALL ON FUNCTION "public"."st_3dextent"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dextent"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dextent"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dextent"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_extent"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_extent"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_extent"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_extent"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_memcollect"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_memcollect"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_memcollect"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_memcollect"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_memunion"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_memunion"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_memunion"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_memunion"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry", double precision) TO "service_role";















GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."activity_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."activity_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."activity_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log_2026_03" TO "anon";
GRANT ALL ON TABLE "public"."activity_log_2026_03" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log_2026_03" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log_2026_04" TO "anon";
GRANT ALL ON TABLE "public"."activity_log_2026_04" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log_2026_04" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log_2026_05" TO "anon";
GRANT ALL ON TABLE "public"."activity_log_2026_05" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log_2026_05" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log_2026_06" TO "anon";
GRANT ALL ON TABLE "public"."activity_log_2026_06" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log_2026_06" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log_2026_07" TO "anon";
GRANT ALL ON TABLE "public"."activity_log_2026_07" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log_2026_07" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log_2026_08" TO "anon";
GRANT ALL ON TABLE "public"."activity_log_2026_08" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log_2026_08" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log_2026_09" TO "anon";
GRANT ALL ON TABLE "public"."activity_log_2026_09" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log_2026_09" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log_2026_10" TO "anon";
GRANT ALL ON TABLE "public"."activity_log_2026_10" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log_2026_10" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log_2026_11" TO "anon";
GRANT ALL ON TABLE "public"."activity_log_2026_11" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log_2026_11" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log_2026_12" TO "anon";
GRANT ALL ON TABLE "public"."activity_log_2026_12" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log_2026_12" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log_2027_01" TO "anon";
GRANT ALL ON TABLE "public"."activity_log_2027_01" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log_2027_01" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log_2027_02" TO "anon";
GRANT ALL ON TABLE "public"."activity_log_2027_02" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log_2027_02" TO "service_role";



GRANT ALL ON TABLE "public"."admin_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."agencies" TO "anon";
GRANT ALL ON TABLE "public"."agencies" TO "authenticated";
GRANT ALL ON TABLE "public"."agencies" TO "service_role";



GRANT ALL ON TABLE "public"."agent_agency_profiles" TO "anon";
GRANT ALL ON TABLE "public"."agent_agency_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_agency_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."agent_api_keys" TO "anon";
GRANT ALL ON TABLE "public"."agent_api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."agent_branches" TO "anon";
GRANT ALL ON TABLE "public"."agent_branches" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_branches" TO "service_role";



GRANT ALL ON TABLE "public"."agent_commissions" TO "anon";
GRANT ALL ON TABLE "public"."agent_commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_commissions" TO "service_role";



GRANT ALL ON TABLE "public"."agent_crm_clients" TO "anon";
GRANT ALL ON TABLE "public"."agent_crm_clients" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_crm_clients" TO "service_role";



GRANT ALL ON TABLE "public"."agent_enquiries" TO "anon";
GRANT ALL ON TABLE "public"."agent_enquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_enquiries" TO "service_role";



GRANT ALL ON TABLE "public"."agent_feed_integrations" TO "anon";
GRANT ALL ON TABLE "public"."agent_feed_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_feed_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."agent_lead_activities" TO "anon";
GRANT ALL ON TABLE "public"."agent_lead_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_lead_activities" TO "service_role";



GRANT ALL ON TABLE "public"."agent_leads" TO "anon";
GRANT ALL ON TABLE "public"."agent_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_leads" TO "service_role";



GRANT ALL ON TABLE "public"."agent_offer_history" TO "anon";
GRANT ALL ON TABLE "public"."agent_offer_history" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_offer_history" TO "service_role";



GRANT ALL ON TABLE "public"."agent_offers" TO "anon";
GRANT ALL ON TABLE "public"."agent_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_offers" TO "service_role";



GRANT ALL ON TABLE "public"."agent_profiles" TO "anon";
GRANT ALL ON TABLE "public"."agent_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."agent_sale_progressions" TO "anon";
GRANT ALL ON TABLE "public"."agent_sale_progressions" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_sale_progressions" TO "service_role";



GRANT ALL ON TABLE "public"."agent_team_members" TO "anon";
GRANT ALL ON TABLE "public"."agent_team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_team_members" TO "service_role";



GRANT ALL ON TABLE "public"."agent_vendor_reports" TO "anon";
GRANT ALL ON TABLE "public"."agent_vendor_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_vendor_reports" TO "service_role";



GRANT ALL ON TABLE "public"."agent_viewing_feedback" TO "anon";
GRANT ALL ON TABLE "public"."agent_viewing_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_viewing_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."agent_viewing_slots" TO "anon";
GRANT ALL ON TABLE "public"."agent_viewing_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_viewing_slots" TO "service_role";



GRANT ALL ON TABLE "public"."ai_match_preferences" TO "anon";
GRANT ALL ON TABLE "public"."ai_match_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_match_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."ai_match_results" TO "anon";
GRANT ALL ON TABLE "public"."ai_match_results" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_match_results" TO "service_role";



GRANT ALL ON TABLE "public"."provider_rating_stats" TO "anon";
GRANT ALL ON TABLE "public"."provider_rating_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_rating_stats" TO "service_role";



GRANT ALL ON TABLE "public"."service_provider_details" TO "anon";
GRANT ALL ON TABLE "public"."service_provider_details" TO "authenticated";
GRANT ALL ON TABLE "public"."service_provider_details" TO "service_role";



GRANT ALL ON TABLE "public"."area_rating_stats" TO "anon";
GRANT ALL ON TABLE "public"."area_rating_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."area_rating_stats" TO "service_role";



GRANT ALL ON TABLE "public"."auth_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."auth_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_audit_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."auth_audit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."auth_audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."auth_audit_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."billing_events" TO "anon";
GRANT ALL ON TABLE "public"."billing_events" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_events" TO "service_role";



GRANT ALL ON TABLE "public"."booking_state_transitions" TO "anon";
GRANT ALL ON TABLE "public"."booking_state_transitions" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_state_transitions" TO "service_role";



GRANT ALL ON TABLE "public"."booking_status_history" TO "anon";
GRANT ALL ON TABLE "public"."booking_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."broadband_coverage" TO "anon";
GRANT ALL ON TABLE "public"."broadband_coverage" TO "authenticated";
GRANT ALL ON TABLE "public"."broadband_coverage" TO "service_role";



GRANT ALL ON TABLE "public"."business_verifications" TO "anon";
GRANT ALL ON TABLE "public"."business_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."business_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."certificates" TO "anon";
GRANT ALL ON TABLE "public"."certificates" TO "authenticated";
GRANT ALL ON TABLE "public"."certificates" TO "service_role";



GRANT ALL ON TABLE "public"."chain_links" TO "anon";
GRANT ALL ON TABLE "public"."chain_links" TO "authenticated";
GRANT ALL ON TABLE "public"."chain_links" TO "service_role";



GRANT ALL ON TABLE "public"."chain_risk_scores" TO "anon";
GRANT ALL ON TABLE "public"."chain_risk_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."chain_risk_scores" TO "service_role";



GRANT ALL ON TABLE "public"."cms_articles" TO "anon";
GRANT ALL ON TABLE "public"."cms_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."cms_articles" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_cron_runs" TO "anon";
GRANT ALL ON TABLE "public"."compliance_cron_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_cron_runs" TO "service_role";



GRANT ALL ON TABLE "public"."consent_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."consent_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_audit_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."consent_audit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."consent_audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."consent_audit_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."consent_records" TO "anon";
GRANT ALL ON TABLE "public"."consent_records" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_records" TO "service_role";



GRANT ALL ON TABLE "public"."content_reports" TO "anon";
GRANT ALL ON TABLE "public"."content_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."content_reports" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_read_status" TO "anon";
GRANT ALL ON TABLE "public"."conversation_read_status" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_read_status" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."deletion_requests" TO "anon";
GRANT ALL ON TABLE "public"."deletion_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."deletion_requests" TO "service_role";



GRANT ALL ON TABLE "public"."deposit_registrations" TO "anon";
GRANT ALL ON TABLE "public"."deposit_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."deposit_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."email_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."email_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."email_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."email_logs" TO "anon";
GRANT ALL ON TABLE "public"."email_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."email_logs" TO "service_role";



GRANT ALL ON TABLE "public"."feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";



GRANT ALL ON TABLE "public"."financial_entries" TO "anon";
GRANT ALL ON TABLE "public"."financial_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_entries" TO "service_role";



GRANT ALL ON TABLE "public"."gdpr_requests" TO "anon";
GRANT ALL ON TABLE "public"."gdpr_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."gdpr_requests" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."introduction_events" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."introduction_events" TO "authenticated";
GRANT ALL ON TABLE "public"."introduction_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."introduction_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."introduction_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."introduction_events_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."introduction_status_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."introduction_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."introduction_status_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."introduction_status_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."introduction_status_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."introduction_status_history_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."introductions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."introductions" TO "authenticated";
GRANT ALL ON TABLE "public"."introductions" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_reports" TO "anon";
GRANT ALL ON TABLE "public"."inventory_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_reports" TO "service_role";



GRANT ALL ON TABLE "public"."invite_codes" TO "anon";
GRANT ALL ON TABLE "public"."invite_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."invite_codes" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."invoice_candidates" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."invoice_candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_candidates" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."invoice_disputes" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."invoice_disputes" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_disputes" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."invoice_events" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."invoice_events" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invoice_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoice_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoice_events_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invoice_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoice_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoice_number_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."invoices" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."jwt_claims_errors" TO "anon";
GRANT ALL ON TABLE "public"."jwt_claims_errors" TO "authenticated";
GRANT ALL ON TABLE "public"."jwt_claims_errors" TO "service_role";



GRANT ALL ON TABLE "public"."kyc_verifications" TO "anon";
GRANT ALL ON TABLE "public"."kyc_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."kyc_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."landlord_profiles" TO "anon";
GRANT ALL ON TABLE "public"."landlord_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."landlord_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."listing_analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."listing_analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."listing_description_attempts" TO "anon";
GRANT ALL ON TABLE "public"."listing_description_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_description_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."listing_moderation" TO "anon";
GRANT ALL ON TABLE "public"."listing_moderation" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_moderation" TO "service_role";



GRANT ALL ON TABLE "public"."listings" TO "anon";
GRANT ALL ON TABLE "public"."listings" TO "authenticated";
GRANT ALL ON TABLE "public"."listings" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance_requests" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "service_role";



GRANT ALL ON TABLE "public"."market_pricing" TO "anon";
GRANT ALL ON TABLE "public"."market_pricing" TO "authenticated";
GRANT ALL ON TABLE "public"."market_pricing" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."mobility_scores" TO "anon";
GRANT ALL ON TABLE "public"."mobility_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."mobility_scores" TO "service_role";



GRANT ALL ON TABLE "public"."moderation_queue" TO "anon";
GRANT ALL ON TABLE "public"."moderation_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_queue" TO "service_role";



GRANT ALL ON TABLE "public"."moving_checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."moving_checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."moving_checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."offer_status_history" TO "anon";
GRANT ALL ON TABLE "public"."offer_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON TABLE "public"."payment_schedules" TO "anon";
GRANT ALL ON TABLE "public"."payment_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."platform_events" TO "anon";
GRANT ALL ON TABLE "public"."platform_events" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."platform_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."platform_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."platform_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ppd_ingest_runs" TO "anon";
GRANT ALL ON TABLE "public"."ppd_ingest_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."ppd_ingest_runs" TO "service_role";



GRANT ALL ON TABLE "public"."ppd_match_candidates" TO "anon";
GRANT ALL ON TABLE "public"."ppd_match_candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."ppd_match_candidates" TO "service_role";



GRANT ALL ON TABLE "public"."ppd_sync_log" TO "anon";
GRANT ALL ON TABLE "public"."ppd_sync_log" TO "authenticated";
GRANT ALL ON TABLE "public"."ppd_sync_log" TO "service_role";



GRANT ALL ON TABLE "public"."ppd_transactions" TO "anon";
GRANT ALL ON TABLE "public"."ppd_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."ppd_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."price_history" TO "anon";
GRANT ALL ON TABLE "public"."price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."price_history" TO "service_role";



GRANT ALL ON TABLE "public"."price_paid_data" TO "anon";
GRANT ALL ON TABLE "public"."price_paid_data" TO "authenticated";
GRANT ALL ON TABLE "public"."price_paid_data" TO "service_role";



GRANT ALL ON TABLE "public"."price_paid_transactions" TO "anon";
GRANT ALL ON TABLE "public"."price_paid_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."price_paid_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."profiles" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."promo_codes" TO "anon";
GRANT ALL ON TABLE "public"."promo_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_codes" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."property_documents" TO "anon";
GRANT ALL ON TABLE "public"."property_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."property_documents" TO "service_role";



GRANT ALL ON TABLE "public"."property_insights" TO "anon";
GRANT ALL ON TABLE "public"."property_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."property_insights" TO "service_role";



GRANT ALL ON TABLE "public"."property_media" TO "anon";
GRANT ALL ON TABLE "public"."property_media" TO "authenticated";
GRANT ALL ON TABLE "public"."property_media" TO "service_role";



GRANT ALL ON TABLE "public"."property_renovation_scenarios" TO "anon";
GRANT ALL ON TABLE "public"."property_renovation_scenarios" TO "authenticated";
GRANT ALL ON TABLE "public"."property_renovation_scenarios" TO "service_role";



GRANT ALL ON TABLE "public"."property_views" TO "anon";
GRANT ALL ON TABLE "public"."property_views" TO "authenticated";
GRANT ALL ON TABLE "public"."property_views" TO "service_role";



GRANT ALL ON TABLE "public"."provider_analytics_daily" TO "anon";
GRANT ALL ON TABLE "public"."provider_analytics_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_analytics_daily" TO "service_role";



GRANT ALL ON TABLE "public"."provider_availability" TO "anon";
GRANT ALL ON TABLE "public"."provider_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_availability" TO "service_role";



GRANT ALL ON TABLE "public"."provider_badges" TO "anon";
GRANT ALL ON TABLE "public"."provider_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_badges" TO "service_role";



GRANT ALL ON TABLE "public"."provider_boosts" TO "anon";
GRANT ALL ON TABLE "public"."provider_boosts" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_boosts" TO "service_role";



GRANT ALL ON TABLE "public"."provider_documents" TO "anon";
GRANT ALL ON TABLE "public"."provider_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_documents" TO "service_role";



GRANT ALL ON TABLE "public"."provider_invoices" TO "anon";
GRANT ALL ON TABLE "public"."provider_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."provider_portfolio_items" TO "anon";
GRANT ALL ON TABLE "public"."provider_portfolio_items" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_portfolio_items" TO "service_role";



GRANT ALL ON TABLE "public"."provider_references" TO "anon";
GRANT ALL ON TABLE "public"."provider_references" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_references" TO "service_role";



GRANT ALL ON TABLE "public"."provider_referrals" TO "anon";
GRANT ALL ON TABLE "public"."provider_referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_referrals" TO "service_role";



GRANT ALL ON TABLE "public"."provider_service_areas" TO "anon";
GRANT ALL ON TABLE "public"."provider_service_areas" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_service_areas" TO "service_role";



GRANT ALL ON TABLE "public"."provider_services" TO "anon";
GRANT ALL ON TABLE "public"."provider_services" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_services" TO "service_role";



GRANT ALL ON TABLE "public"."provider_verifications" TO "anon";
GRANT ALL ON TABLE "public"."provider_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."quotes" TO "anon";
GRANT ALL ON TABLE "public"."quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."quotes" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."rebuttals" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."rebuttals" TO "authenticated";
GRANT ALL ON TABLE "public"."rebuttals" TO "service_role";



GRANT ALL ON TABLE "public"."referral_codes" TO "anon";
GRANT ALL ON TABLE "public"."referral_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_codes" TO "service_role";



GRANT ALL ON TABLE "public"."referral_codes_v2" TO "anon";
GRANT ALL ON TABLE "public"."referral_codes_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_codes_v2" TO "service_role";



GRANT ALL ON TABLE "public"."referral_conversions" TO "anon";
GRANT ALL ON TABLE "public"."referral_conversions" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_conversions" TO "service_role";



GRANT ALL ON TABLE "public"."referral_rewards" TO "anon";
GRANT ALL ON TABLE "public"."referral_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."refund_requests" TO "anon";
GRANT ALL ON TABLE "public"."refund_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."refund_requests" TO "service_role";



GRANT ALL ON TABLE "public"."renovation_type_benchmarks" TO "anon";
GRANT ALL ON TABLE "public"."renovation_type_benchmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."renovation_type_benchmarks" TO "service_role";



GRANT ALL ON TABLE "public"."renter_preferences" TO "anon";
GRANT ALL ON TABLE "public"."renter_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."renter_preferences" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."reported_outcomes" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."reported_outcomes" TO "authenticated";
GRANT ALL ON TABLE "public"."reported_outcomes" TO "service_role";



GRANT ALL ON TABLE "public"."review_flags" TO "anon";
GRANT ALL ON TABLE "public"."review_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."review_flags" TO "service_role";



GRANT ALL ON TABLE "public"."review_helpfulness" TO "anon";
GRANT ALL ON TABLE "public"."review_helpfulness" TO "authenticated";
GRANT ALL ON TABLE "public"."review_helpfulness" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."sale_progression_stages" TO "anon";
GRANT ALL ON TABLE "public"."sale_progression_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."sale_progression_stages" TO "service_role";



GRANT ALL ON TABLE "public"."saved_properties" TO "anon";
GRANT ALL ON TABLE "public"."saved_properties" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_properties" TO "service_role";



GRANT ALL ON TABLE "public"."saved_searches" TO "anon";
GRANT ALL ON TABLE "public"."saved_searches" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_searches" TO "service_role";



GRANT ALL ON TABLE "public"."sdr_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."sdr_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."sdr_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."sdr_messages" TO "anon";
GRANT ALL ON TABLE "public"."sdr_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."sdr_messages" TO "service_role";



GRANT ALL ON TABLE "public"."sdr_targets" TO "anon";
GRANT ALL ON TABLE "public"."sdr_targets" TO "authenticated";
GRANT ALL ON TABLE "public"."sdr_targets" TO "service_role";



GRANT ALL ON TABLE "public"."search_analytics" TO "anon";
GRANT ALL ON TABLE "public"."search_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."search_analytics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."search_analytics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."search_analytics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."search_analytics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."search_listings" TO "anon";
GRANT ALL ON TABLE "public"."search_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."search_listings" TO "service_role";



GRANT ALL ON TABLE "public"."seller_listings" TO "anon";
GRANT ALL ON TABLE "public"."seller_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."seller_listings" TO "service_role";



GRANT ALL ON TABLE "public"."seller_offers" TO "anon";
GRANT ALL ON TABLE "public"."seller_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."seller_offers" TO "service_role";



GRANT ALL ON TABLE "public"."seller_viewings" TO "anon";
GRANT ALL ON TABLE "public"."seller_viewings" TO "authenticated";
GRANT ALL ON TABLE "public"."seller_viewings" TO "service_role";



GRANT ALL ON TABLE "public"."service_areas" TO "anon";
GRANT ALL ON TABLE "public"."service_areas" TO "authenticated";
GRANT ALL ON TABLE "public"."service_areas" TO "service_role";



GRANT ALL ON TABLE "public"."service_job_milestones" TO "anon";
GRANT ALL ON TABLE "public"."service_job_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."service_job_milestones" TO "service_role";



GRANT ALL ON TABLE "public"."service_requests" TO "anon";
GRANT ALL ON TABLE "public"."service_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."service_requests" TO "service_role";



GRANT ALL ON TABLE "public"."social_links" TO "anon";
GRANT ALL ON TABLE "public"."social_links" TO "authenticated";
GRANT ALL ON TABLE "public"."social_links" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_connect_accounts" TO "anon";
GRANT ALL ON TABLE "public"."stripe_connect_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_connect_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_events" TO "anon";
GRANT ALL ON TABLE "public"."stripe_events" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_events" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";
GRANT SELECT ON TABLE "public"."subscriptions" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."tenancies" TO "anon";
GRANT ALL ON TABLE "public"."tenancies" TO "authenticated";
GRANT ALL ON TABLE "public"."tenancies" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_applications" TO "anon";
GRANT ALL ON TABLE "public"."tenant_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_applications" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_milestones" TO "anon";
GRANT ALL ON TABLE "public"."transaction_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_milestones" TO "service_role";



GRANT ALL ON TABLE "public"."transport_stops" TO "anon";
GRANT ALL ON TABLE "public"."transport_stops" TO "authenticated";
GRANT ALL ON TABLE "public"."transport_stops" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."truedeed_audit_log" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."truedeed_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."truedeed_audit_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."truedeed_audit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."truedeed_audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."truedeed_audit_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_backup_codes" TO "anon";
GRANT ALL ON TABLE "public"."user_backup_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."user_backup_codes" TO "service_role";



GRANT ALL ON TABLE "public"."user_documents" TO "anon";
GRANT ALL ON TABLE "public"."user_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."user_documents" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."viewing_history" TO "anon";
GRANT ALL ON TABLE "public"."viewing_history" TO "authenticated";
GRANT ALL ON TABLE "public"."viewing_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."viewing_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."viewing_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."viewing_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."viewing_slots" TO "anon";
GRANT ALL ON TABLE "public"."viewing_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."viewing_slots" TO "service_role";



GRANT ALL ON TABLE "public"."viewings" TO "anon";
GRANT ALL ON TABLE "public"."viewings" TO "authenticated";
GRANT ALL ON TABLE "public"."viewings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































