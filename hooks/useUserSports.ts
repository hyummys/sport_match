import { supabase } from '../lib/supabase';
import { UserSport, Sport } from '../lib/types';

export type UserSportWithDetails = UserSport & { sports: Sport };

export function useUserSports() {
  /** 종목 상세 정보 포함 조회 */
  const getUserSports = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_sports')
      .select('*, sports(*)')
      .eq('user_id', userId);

    return { data: data as UserSportWithDetails[] | null, error };
  };

  /** sport_id 목록만 조회 (홈 필터용) */
  const getUserSportIds = async (userId: string): Promise<string[]> => {
    const { data } = await supabase
      .from('user_sports')
      .select('sport_id')
      .eq('user_id', userId);

    return data ? data.map((d: any) => d.sport_id as string) : [];
  };

  /** 배치 저장 (기존 삭제 + 새로 삽입) */
  const saveUserSports = async (
    userId: string,
    selections: { sport_id: string; skill_level: number }[]
  ) => {
    // 기존 관심 종목 삭제
    const { error: deleteError } = await supabase
      .from('user_sports')
      .delete()
      .eq('user_id', userId);

    if (deleteError) return { error: deleteError };
    if (selections.length === 0) return { error: null };

    // 새 관심 종목 삽입
    const { error } = await supabase
      .from('user_sports')
      .insert(
        selections.map((s) => ({
          user_id: userId,
          sport_id: s.sport_id,
          skill_level: s.skill_level,
        }))
      );

    return { error };
  };

  /** 개별 삭제 */
  const removeUserSport = async (userId: string, sportId: string) => {
    const { error } = await supabase
      .from('user_sports')
      .delete()
      .eq('user_id', userId)
      .eq('sport_id', sportId);

    return { error };
  };

  return { getUserSports, getUserSportIds, saveUserSports, removeUserSport };
}
