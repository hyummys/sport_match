import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { UpdateProfileInput, User } from '../lib/types';
import { pickImage, uploadAvatar } from '../lib/storage';

export function useProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  /** 프로필 업데이트 (닉네임, 지역, 아바타) */
  const updateProfile = async (userId: string, input: UpdateProfileInput) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('users')
      .update({
        nickname: input.nickname,
        region: input.region || null,
        avatar_url: input.avatar_url || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (data) {
      setUser(data as User);
    }
    setIsLoading(false);
    return { data: data as User | null, error };
  };

  /** 이미지 선택 → 업로드 통합 */
  const changeAvatar = async (userId: string) => {
    const result = await pickImage();
    if (result.canceled) {
      return { url: null, error: null, cancelled: true, localUri: null };
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      return { url: null, error: '이미지 데이터를 가져올 수 없습니다.', cancelled: false, localUri: null };
    }

    setIsLoading(true);
    const { url, error } = await uploadAvatar(userId, asset.base64);
    setIsLoading(false);

    return { url, error, cancelled: false, localUri: asset.uri };
  };

  /** 유저 통계: 방 생성 횟수 + 참가 횟수 */
  const getUserStats = async (userId: string) => {
    const [hostedResult, participatedResult] = await Promise.all([
      supabase
        .from('rooms')
        .select('id', { count: 'exact', head: true })
        .eq('host_id', userId),
      supabase
        .from('room_participants')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'approved'),
    ]);

    return {
      hostedCount: hostedResult.count ?? 0,
      participatedCount: participatedResult.count ?? 0,
    };
  };

  return {
    isLoading,
    updateProfile,
    changeAvatar,
    getUserStats,
  };
}
