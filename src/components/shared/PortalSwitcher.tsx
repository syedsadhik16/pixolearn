import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Users, Shield, ArrowLeftRight } from 'lucide-react';

const ROLE_META = {
  student: { title: 'Student', icon: GraduationCap, path: '/student', color: 'text-blue-500' },
  parent: { title: 'Parent', icon: Users, path: '/parent', color: 'text-emerald-500' },
  admin: { title: 'Admin', icon: Shield, path: '/admin', color: 'text-purple-500' },
} as const;

export function PortalSwitcher() {
  const { roles, activeRole, setActiveRole, isMultiRole } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isMultiRole || !activeRole) return null;

  const current = ROLE_META[activeRole];
  const CurrentIcon = current.icon;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-sm font-medium"
        title="Switch Portal"
      >
        <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
        <CurrentIcon className={`h-4 w-4 ${current.color}`} />
        <span className="hidden sm:inline">{current.title}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-card shadow-lg z-50 py-1 animate-scale-in">
          <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Switch Portal
          </p>
          {roles.map(role => {
            const meta = ROLE_META[role];
            const Icon = meta.icon;
            return (
              <button
                key={role}
                onClick={() => {
                  setActiveRole(role);
                  navigate(meta.path);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 transition-colors ${
                  role === activeRole ? 'bg-primary/10 font-semibold text-primary' : ''
                }`}
              >
                <Icon className={`h-4 w-4 ${meta.color}`} />
                <span>{meta.title} Portal</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
