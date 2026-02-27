import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { User } from '../lib/types';

export function useAuth() {
  const { session, user, isLoading, setSession, setUser, setLoading, reset } =
    useAuthStore();

  useEffect(() => {
    let currentRequestId = 0;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const requestId = ++currentRequestId;
        fetchUser(session.user.id, requestId, () => requestId === currentRequestId);
      } else {
        currentRequestId++;
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      currentRequestId++;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async (
    userId: string,
    _requestId: number,
    isCurrent: () => boolean
  ) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!isCurrent()) return;

      if (error) {
        console.warn('Failed to fetch user profile:', error.message);
        setUser(null);
      } else if (data) {
        setUser(data as User);
      }
    } catch (e) {
      if (!isCurrent()) return;
      console.warn('Unexpected error fetching user profile:', e);
      setUser(null);
    } finally {
      if (isCurrent()) {
        setLoading(false);
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    reset();
  };

  const createUserProfile = async (
    userId: string,
    nickname: string,
    region?: string
  ) => {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        nickname,
        region: region || null,
        avatar_url: null,
      })
      .select()
      .single();

    if (data) {
      setUser(data as User);
    }
    return { data, error };
  };

  return {
    session,
    user,
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    createUserProfile,
    fetchUser,
  };
}
