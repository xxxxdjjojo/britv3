-- Allow tenants to read their own tenancy records
CREATE POLICY "Tenants can view own tenancies"
  ON tenancies FOR SELECT TO authenticated
  USING (tenant_user_id = auth.uid());
