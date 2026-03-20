import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pixo-lesson-resume';

export interface LessonResumeState {
  lessonId: string;
  phase: string;
  currentIndex: number;
  timestamp: number;
}

/**
 * Persist mid-lesson progress so children can resume where they left off.
 * Runs entirely in the background — no visible UI complexity.
 * Data is saved to localStorage and cleared on lesson completion.
 */
export function useLessonResume(lessonId: string | undefined) {
  const [resumeState, setResumeState] = useState<LessonResumeState | null>(null);
  const [checked, setChecked] = useState(false);

  // On mount, check if there's a saved state for this lesson
  useEffect(() => {
    if (!lessonId) { setChecked(true); return; }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: LessonResumeState = JSON.parse(raw);
        // Only restore if it's the same lesson and less than 24h old
        if (saved.lessonId === lessonId && Date.now() - saved.timestamp < 86400000) {
          setResumeState(saved);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setChecked(true);
  }, [lessonId]);

  // Save progress as the child moves through the lesson
  const saveProgress = useCallback(
    (phase: string, currentIndex: number) => {
      if (!lessonId || phase === 'complete' || phase === 'intro') return;
      const state: LessonResumeState = { lessonId, phase, currentIndex, timestamp: Date.now() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch { /* quota exceeded — ignore silently */ }
    },
    [lessonId]
  );

  // Clear saved state (call on lesson completion)
  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setResumeState(null);
  }, []);

  return { resumeState, checked, saveProgress, clearProgress };
}
