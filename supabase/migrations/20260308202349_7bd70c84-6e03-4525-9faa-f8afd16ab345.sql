
-- Update award_xp function to use 180-level scale (20 XP per level)
CREATE OR REPLACE FUNCTION public.award_xp(_student_id uuid, _xp_amount integer, _source text, _source_id text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  new_total INTEGER;
  new_level INTEGER;
BEGIN
  INSERT INTO public.student_xp (student_id, total_xp, xp_level)
  VALUES (_student_id, 0, 1)
  ON CONFLICT (student_id) DO NOTHING;

  UPDATE public.student_xp
  SET total_xp = total_xp + _xp_amount,
      xp_level = LEAST(180, GREATEST(1, FLOOR((total_xp + _xp_amount) / 20.0) + 1)::INTEGER),
      updated_at = now()
  WHERE student_id = _student_id
  RETURNING total_xp INTO new_total;

  INSERT INTO public.xp_history (student_id, xp_amount, source, source_id)
  VALUES (_student_id, _xp_amount, _source, _source_id);

  RETURN new_total;
END;
$$;
