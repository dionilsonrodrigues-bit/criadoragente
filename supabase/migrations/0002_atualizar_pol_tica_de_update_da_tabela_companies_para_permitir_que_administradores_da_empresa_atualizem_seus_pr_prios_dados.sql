DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;

CREATE POLICY "companies_update_policy" ON public.companies
FOR UPDATE TO authenticated
USING (
  check_is_super_admin() 
  OR id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  check_is_super_admin() 
  OR id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);