
-- ============================================================
-- FIX 1: Secure shop purchases with server-side XP validation
-- ============================================================
CREATE OR REPLACE FUNCTION public.purchase_shop_item(_student_id uuid, _item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_cost INTEGER;
  current_xp INTEGER;
  item_name TEXT;
  item_icon TEXT;
BEGIN
  -- Verify item exists and is available
  SELECT xp_cost, name, icon INTO item_cost, item_name, item_icon
  FROM public.shop_items WHERE id = _item_id AND is_available = true;
  IF item_cost IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found or unavailable');
  END IF;

  -- Check if already purchased
  IF EXISTS (SELECT 1 FROM public.purchased_items WHERE student_id = _student_id AND item_id = _item_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item already purchased');
  END IF;

  -- Get current XP
  SELECT total_xp INTO current_xp FROM public.student_xp WHERE student_id = _student_id;
  IF current_xp IS NULL OR current_xp < item_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient XP');
  END IF;

  -- Deduct XP
  UPDATE public.student_xp SET total_xp = total_xp - item_cost, updated_at = now() WHERE student_id = _student_id;

  -- Record purchase
  INSERT INTO public.purchased_items (student_id, item_id) VALUES (_student_id, _item_id);

  -- Log XP spend
  INSERT INTO public.xp_history (student_id, xp_amount, source, source_id)
  VALUES (_student_id, -item_cost, 'shop_purchase', _item_id::text);

  RETURN jsonb_build_object('success', true, 'new_xp', current_xp - item_cost, 'item_name', item_name, 'item_icon', item_icon, 'xp_cost', item_cost);
END;
$$;

-- ============================================================
-- FIX 2: Secure badge claiming with server-side validation
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_badge(_student_id uuid, _badge_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge_rec RECORD;
  completion_count INTEGER;
  total_xp_val INTEGER;
  saved_words_count INTEGER;
  streak_val INTEGER;
  has_high BOOLEAN;
  has_perfect BOOLEAN;
  earned BOOLEAN := false;
BEGIN
  -- Check if already earned
  IF EXISTS (SELECT 1 FROM public.student_badges WHERE student_id = _student_id AND badge_id = _badge_id) THEN
    RETURN false;
  END IF;

  -- Get badge requirements
  SELECT * INTO badge_rec FROM public.badges WHERE id = _badge_id;
  IF badge_rec IS NULL THEN RETURN false; END IF;

  -- Validate requirement
  CASE badge_rec.requirement_type
    WHEN 'lessons_completed' THEN
      SELECT count(*) INTO completion_count FROM public.lesson_completions WHERE student_id = _student_id;
      earned := completion_count >= badge_rec.requirement_value;
    WHEN 'total_xp' THEN
      SELECT COALESCE(total_xp, 0) INTO total_xp_val FROM public.student_xp WHERE student_id = _student_id;
      earned := total_xp_val >= badge_rec.requirement_value;
    WHEN 'saved_words' THEN
      SELECT count(*) INTO saved_words_count FROM public.saved_words WHERE student_id = _student_id;
      earned := saved_words_count >= badge_rec.requirement_value;
    WHEN 'streak' THEN
      -- Simplified: check attendance streak
      SELECT count(*) INTO streak_val FROM public.attendance 
      WHERE student_id = _student_id AND is_present = true AND lesson_completed = true
      AND date >= CURRENT_DATE - badge_rec.requirement_value;
      earned := streak_val >= badge_rec.requirement_value;
    WHEN 'high_score' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.lesson_completions WHERE student_id = _student_id
        AND COALESCE(pronunciation_score,0) + COALESCE(fluency_score,0) + COALESCE(clarity_score,0) + COALESCE(confidence_score,0) >= 360
      ) INTO has_high;
      earned := has_high;
    WHEN 'perfect_score' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.lesson_completions WHERE student_id = _student_id
        AND pronunciation_score = 100 AND fluency_score = 100 AND clarity_score = 100 AND confidence_score = 100
      ) INTO has_perfect;
      earned := has_perfect;
    ELSE
      earned := false;
  END CASE;

  IF NOT earned THEN RETURN false; END IF;

  -- Award badge
  INSERT INTO public.student_badges (student_id, badge_id) VALUES (_student_id, _badge_id);

  -- Award XP reward if any
  IF badge_rec.xp_reward > 0 THEN
    PERFORM public.award_xp(_student_id, badge_rec.xp_reward, 'badge_reward', _badge_id::text);
  END IF;

  RETURN true;
END;
$$;

-- ============================================================
-- FIX 3: Validate parent-child relationship on INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_parent_child_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify child_id exists and is a student
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.child_id AND role = 'student') THEN
    RAISE EXCEPTION 'Invalid child: user does not exist or is not a student';
  END IF;
  -- Prevent self-linking
  IF NEW.parent_id = NEW.child_id THEN
    RAISE EXCEPTION 'Cannot link yourself as your own child';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_parent_child_link_trigger ON public.parent_children;
CREATE TRIGGER validate_parent_child_link_trigger
  BEFORE INSERT ON public.parent_children
  FOR EACH ROW EXECUTE FUNCTION public.validate_parent_child_link();

-- ============================================================
-- FIX 4: Lock down RLS policies
-- ============================================================

-- 4a: Remove direct INSERT on student_badges (use claim_badge function)
DROP POLICY IF EXISTS "Students can earn badges" ON public.student_badges;

-- 4b: Remove direct INSERT/UPDATE on purchased_items (use purchase_shop_item function)
DROP POLICY IF EXISTS "Students can insert own purchases" ON public.purchased_items;
DROP POLICY IF EXISTS "Students can update own purchases" ON public.purchased_items;
-- Keep SELECT for viewing purchases
-- Add UPDATE only for is_equipped toggle (safe operation)
CREATE POLICY "Students can toggle equipped status"
  ON public.purchased_items FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- 4c: Remove direct INSERT on xp_history (only award_xp function should write)
DROP POLICY IF EXISTS "Students can insert own XP history" ON public.xp_history;

-- 4d: Remove direct INSERT/UPDATE on student_xp (only award_xp/purchase functions should write)
DROP POLICY IF EXISTS "Students can insert own XP" ON public.student_xp;
DROP POLICY IF EXISTS "Students can update own XP" ON public.student_xp;

-- 4e: Restrict learner_day_attempts - change ALL to INSERT+SELECT+UPDATE (no DELETE)
DROP POLICY IF EXISTS "Students can manage own day attempts" ON public.learner_day_attempts;
CREATE POLICY "Students can insert own day attempts"
  ON public.learner_day_attempts FOR INSERT TO authenticated
  WITH CHECK (learner_id = auth.uid());
CREATE POLICY "Students can view own day attempts"
  ON public.learner_day_attempts FOR SELECT TO authenticated
  USING (learner_id = auth.uid());
CREATE POLICY "Students can update own day attempts"
  ON public.learner_day_attempts FOR UPDATE TO authenticated
  USING (learner_id = auth.uid());

-- 4f: Restrict learner_hidden_mastery - change ALL to INSERT+SELECT+UPDATE (no DELETE)
DROP POLICY IF EXISTS "Students can manage own hidden mastery" ON public.learner_hidden_mastery;
CREATE POLICY "Students can insert own hidden mastery"
  ON public.learner_hidden_mastery FOR INSERT TO authenticated
  WITH CHECK (learner_id = auth.uid());
CREATE POLICY "Students can view own hidden mastery"
  ON public.learner_hidden_mastery FOR SELECT TO authenticated
  USING (learner_id = auth.uid());
CREATE POLICY "Students can update own hidden mastery"
  ON public.learner_hidden_mastery FOR UPDATE TO authenticated
  USING (learner_id = auth.uid());
