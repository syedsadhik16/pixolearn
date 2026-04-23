import { ReactNode } from 'react';
import '@/styles/premium-lesson.css';

interface TrailStep {
  icon: string;
  label: string;
}

interface PremiumLessonShellProps {
  /** Ordered list of stages to show in the top progress trail */
  trail: TrailStep[];
  /** Index of the currently active step (0-based) */
  activeIndex: number;
  /** XP shown in the bottom XP bar */
  xpCurrent?: number;
  xpMax?: number;
  /** Hide the XP bar entirely */
  hideXpBar?: boolean;
  children: ReactNode;
}

/**
 * PremiumLessonShell
 * Dark navy + gold premium wrapper for the lesson and practice screens.
 * Provides ambient orbs, progress trail, and XP bar around the existing
 * lesson content — no logic changes required.
 */
export function PremiumLessonShell({
  trail,
  activeIndex,
  xpCurrent = 0,
  xpMax = 2000,
  hideXpBar = false,
  children,
}: PremiumLessonShellProps) {
  const xpPct = Math.min(100, Math.max(0, (xpCurrent / Math.max(1, xpMax)) * 100));

  return (
    <div className="lesson-premium-shell">
      <div className="lp-bg-canvas">
        <div className="lp-orb o1" />
        <div className="lp-orb o2" />
        <div className="lp-orb o3" />
      </div>
      <div className="lp-bg-grid" />

      <div className="lp-content max-w-lg mx-auto px-4 pb-10 pt-6">
        {/* Progress trail */}
        {trail.length > 0 && (
          <div className="lp-trail">
            {trail.map((step, i) => {
              const state =
                i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'locked';
              return (
                <div key={`${step.label}-${i}`} className="contents">
                  <div className={`lp-trail-step ${state}`}>
                    <div className="lp-trail-icon" aria-hidden>
                      {step.icon}
                    </div>
                    <span className="lp-trail-label">{step.label}</span>
                  </div>
                  {i < trail.length - 1 && (
                    <div
                      className={`lp-trail-connector ${i < activeIndex ? 'filled' : ''}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Lesson body — original content untouched */}
        {children}

        {/* XP bar */}
        {!hideXpBar && (
          <div className="lp-xp-bar">
            <span className="lp-xp-label">XP</span>
            <div className="lp-xp-track">
              <div className="lp-xp-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <span className="lp-xp-pts">
              {xpCurrent.toLocaleString()} / {xpMax.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
