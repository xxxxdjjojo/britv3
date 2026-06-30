-- Deposit registrations are owned through their tenancy.
--
-- The hosted schema does not expose deposit_registrations.landlord_id, and the
-- app now scopes deposits by deposit_registrations.tenancy_id -> tenancies.landlord_id.
-- Keep RLS aligned with that normalized ownership contract.

DROP POLICY IF EXISTS "Landlords can manage their own deposit registrations"
  ON public.deposit_registrations;

DROP POLICY IF EXISTS "Landlords can manage deposits for owned tenancies"
  ON public.deposit_registrations;

CREATE POLICY "Landlords can manage deposits for owned tenancies"
  ON public.deposit_registrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.tenancies
      WHERE public.tenancies.id = deposit_registrations.tenancy_id
        AND public.tenancies.landlord_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tenancies
      WHERE public.tenancies.id = deposit_registrations.tenancy_id
        AND public.tenancies.landlord_id = auth.uid()
    )
  );

ALTER TABLE public.deposit_registrations
  DROP COLUMN IF EXISTS landlord_id;
