import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { GraduationCap, Users, Shield } from 'lucide-react';
import pixoLogo from '@/assets/pixo-logo.png';

const ROLE_CONFIG = {
  student: {
    title: 'Student Portal',
    description: 'Access your lessons, track progress, earn rewards',
    icon: GraduationCap,
    path: '/student',
    gradient: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
  },
  parent: {
    title: 'Parent Portal',
    description: "Monitor your child's learning journey and insights",
    icon: Users,
    path: '/parent',
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  admin: {
    title: 'Admin Portal',
    description: 'Manage curriculum, users, and organization settings',
    icon: Shield,
    path: '/admin',
    gradient: 'from-purple-500 to-violet-600',
    bgLight: 'bg-purple-50 dark:bg-purple-950/30',
  },
} as const;

export default function RoleSelect() {
  const { user, loading, roles, setActiveRole, activeRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    // If only one role, skip selection
    if (!loading && roles.length === 1) {
      setActiveRole(roles[0]);
      navigate(ROLE_CONFIG[roles[0]].path);
    }
  }, [user, loading, roles, navigate, setActiveRole]);

  const handleRoleSelect = (role: 'student' | 'parent' | 'admin') => {
    setActiveRole(role);
    navigate(ROLE_CONFIG[role].path);
  };

  if (loading || roles.length <= 1) {
    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading portals...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-lg space-y-8 animate-fade-in">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <img src={pixoLogo} alt="PIXO Learn" className="h-16 mx-auto" />
            <h1 className="text-3xl font-display font-bold">Choose Your Portal</h1>
            <p className="text-muted-foreground">
              You have access to multiple areas. Select where you'd like to go.
            </p>
          </div>

          {/* Role Cards */}
          <div className="space-y-4">
            {roles.map((role) => {
              const config = ROLE_CONFIG[role];
              if (!config) return null;
              const Icon = config.icon;

              return (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-border
                    hover:border-primary/50 hover:shadow-pixo-md transition-all duration-300
                    ${config.bgLight} text-left group`}
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient}
                    flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-lg">{config.title}</p>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    →
                  </div>
                </button>
              );
            })}
          </div>

          {/* Organization note */}
          <p className="text-center text-xs text-muted-foreground">
            PIXO Learn • Organization Access Only
          </p>
        </div>
      </div>
    </Layout>
  );
}
