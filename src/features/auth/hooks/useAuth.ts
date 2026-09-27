import { useAuthContext } from "../../../app/providers/AuthProvider";

export function useAuth() {
  const { session, profile, loading, signInWithPassword, signUp, signOut } =
    useAuthContext();

  return {
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    isAuthenticated: !!session,
    loading,
    signInWithPassword,
    signUp,
    signOut,
  };
}
