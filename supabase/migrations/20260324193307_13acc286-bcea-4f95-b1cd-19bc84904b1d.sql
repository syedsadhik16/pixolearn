-- Fix EXPOSED_SENSITIVE_DATA: Change profiles policies from public to authenticated
DROP POLICY IF EXISTS "Parents can view children profiles" ON public.profiles;
CREATE POLICY "Parents can view children profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM parent_children
    WHERE parent_children.parent_id = auth.uid()
      AND parent_children.child_id = profiles.id
  ));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Fix PRIVILEGE_ESCALATION: Change parent_children policies from public to authenticated
DROP POLICY IF EXISTS "Parents can create relationships" ON public.parent_children;
CREATE POLICY "Parents can create relationships"
  ON public.parent_children FOR INSERT TO authenticated
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can delete relationships" ON public.parent_children;
CREATE POLICY "Parents can delete relationships"
  ON public.parent_children FOR DELETE TO authenticated
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can view own relationships" ON public.parent_children;
CREATE POLICY "Parents can view own relationships"
  ON public.parent_children FOR SELECT TO authenticated
  USING (parent_id = auth.uid());