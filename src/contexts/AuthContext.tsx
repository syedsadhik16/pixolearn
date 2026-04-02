import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'student' | 'parent' | 'admin';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  subscription_type: 'free' | 'premium';
  trial_started_at: string | null;
  trial_expires_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  roles: UserRole[];
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
  hasRole: (role: UserRole) => boolean;
  isMultiRole: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem('pixo-active-role');
    return saved as UserRole | null;
  });

  const setActiveRole = useCallback((role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem('pixo-active-role', role);
  }, []);

  const hasRole = useCallback((role: UserRole) => roles.includes(role), [roles]);
  const isMultiRole = roles.length > 1;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoles(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!error && data) {
        const userRoles = data.map(r => r.role as UserRole);
        setRoles(userRoles);
        
        // Set active role if not set or invalid
        const savedRole = localStorage.getItem('pixo-active-role') as UserRole | null;
        if (savedRole && userRoles.includes(savedRole)) {
          setActiveRoleState(savedRole);
        } else if (userRoles.length === 1) {
          setActiveRole(userRoles[0]);
        } else if (userRoles.length > 1 && !savedRole) {
          // Will need role selection - don't set yet
          setActiveRoleState(null);
        }
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, subscription_type, trial_started_at, trial_expires_at')
        .eq('id', userId)
        .single();

      if (!error && data) {
        const profileData = data as unknown as Profile;
        if (
          profileData.subscription_type === 'premium' &&
          profileData.trial_expires_at &&
          new Date(profileData.trial_expires_at) < new Date()
        ) {
          profileData.subscription_type = 'free';
          supabase
            .from('profiles')
            .update({ subscription_type: 'free' } as any)
            .eq('id', userId)
            .then(() => {});
        }
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
    setActiveRoleState(null);
    localStorage.removeItem('pixo-active-role');
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });

    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        roles,
        activeRole,
        setActiveRole,
        hasRole,
        isMultiRole,
        signUp,
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
