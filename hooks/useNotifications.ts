import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Notification } from '../lib/types';

export function useNotifications() {
  const [isLoading, setIsLoading] = useState(false);

  // 내 알림 목록 조회
  const getNotifications = async (userId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    setIsLoading(false);
    return { data: data as Notification[] | null, error };
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    return { error };
  };

  // 전체 읽음 처리
  const markAllAsRead = async (userId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { error };
  };

  // 읽지 않은 알림 수
  const getUnreadCount = async (userId: string) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { count: count || 0, error };
  };

  return {
    isLoading,
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
  };
}
