-- Allow tenants to read their own tenancy records
DROP POLICY IF EXISTS "Tenants can view own tenancies" ON tenancies;
CREATE POLICY "Tenants can view own tenancies"
  ON tenancies FOR SELECT TO authenticated
  USING (tenant_user_id = auth.uid());
