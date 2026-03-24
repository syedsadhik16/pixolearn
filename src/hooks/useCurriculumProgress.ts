import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchLevelId, fetchOrCreateProgress, fetchAllDays, fetchMonths, fetchWeeks } from '@/lib/curriculum-service';
import type { CurriculumDay, CurriculumMonth, CurriculumWeek, LearnerCurriculumProgress } from '@/lib/curriculum-types';

interface UseCurriculumProgressResult {
  levelId: string | null;
  progress: LearnerCurriculumProgress | null;
  days: CurriculumDay[];
  months: CurriculumMonth[];
  weeks: CurriculumWeek[];
  todaysDay: CurriculumDay | null;
  completedDayIds: Set<string>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCurriculumProgress(userId: string | undefined): UseCurriculumProgressResult {
  const [levelId, setLevelId] = useState<string | null>(null);
  const [progress, setProgress] = useState<LearnerCurriculumProgress | null>(null);
  const [days, setDays] = useState<CurriculumDay[]>([]);
  const [months, setMonths] = useState<CurriculumMonth[]>([]);
  const [weeks, setWeeks] = useState<CurriculumWeek[]>([]);
  const [completedDayIds, setCompletedDayIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Get level ID
      const lid = await fetchLevelId();
      if (!lid) {
        setError('No curriculum level found');
        setLoading(false);
        return;
      }
      setLevelId(lid);

      // 2. Fetch all curriculum data + progress in parallel
      const [prog, allDays, allMonths, allWeeks, completionsResult] = await Promise.all([
        fetchOrCreateProgress(userId, lid),
        fetchAllDays(lid),
        fetchMonths(lid),
        fetchWeeks(lid),
        supabase
          .from('learner_day_attempts')
          .select('curriculum_day_id')
          .eq('learner_id', userId)
          .eq('completion_status', 'completed'),
      ]);

      setProgress(prog);
      setDays(allDays);
      setMonths(allMonths);
      setWeeks(allWeeks);

      const completedIds = new Set(
        (completionsResult.data || []).map((c: { curriculum_day_id: string }) => c.curriculum_day_id)
      );
      setCompletedDayIds(completedIds);
    } catch (err) {
      console.error('Curriculum progress fetch error:', err);
      setError('Failed to load curriculum data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const todaysDay = progress && days.length > 0
    ? days.find(d => d.day_number === progress.current_day) || days[0]
    : null;

  return { levelId, progress, days, months, weeks, todaysDay, completedDayIds, loading, error, refetch: fetchData };
}
