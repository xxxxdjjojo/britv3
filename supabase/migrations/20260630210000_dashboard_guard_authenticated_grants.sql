-- Dashboard pages query through the anon key. RLS scopes rows, but PostgreSQL
-- still needs table privileges before RLS can apply.

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.consent_records TO authenticated;

GRANT SELECT (
  user_id,
  status,
  plan_name
) ON public.subscriptions TO authenticated;

GRANT SELECT ON public.properties TO authenticated;
GRANT SELECT ON public.listings TO authenticated;
GRANT SELECT ON public.saved_properties TO authenticated;
GRANT SELECT ON public.tenancies TO authenticated;
GRANT SELECT ON public.maintenance_requests TO authenticated;
GRANT SELECT ON public.property_documents TO authenticated;
GRANT SELECT ON public.deposit_registrations TO authenticated;
