import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName = 'rooms' | 'room_participants' | 'notifications' | 'favorite_places';
type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions {
  table: TableName;
  event?: ChangeEvent;
  filter?: string;
  onData: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export function useRealtime({ table, event = '*', filter, onData }: UseRealtimeOptions) {
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  useEffect(() => {
    let active = true;

    const channelConfig: any = {
      event,
      schema: 'public',
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(`realtime-${table}-${filter || 'all'}`)
      .on('postgres_changes', channelConfig, (payload) => {
        if (active) {
          onDataRef.current(payload);
        }
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [table, event, filter]);
}

// 방 참가자 변동 실시간 구독 (방 상세 화면용)
export function useRoomRealtime(
  roomId: string,
  onParticipantChange: () => void
) {
  useRealtime({
    table: 'room_participants',
    filter: `room_id=eq.${roomId}`,
    onData: () => {
      onParticipantChange();
    },
  });
}

// 내 알림 실시간 구독
export function useNotificationRealtime(
  userId: string,
  onNewNotification: (payload: any) => void
) {
  useRealtime({
    table: 'notifications',
    event: 'INSERT',
    filter: `user_id=eq.${userId}`,
    onData: onNewNotification,
  });
}
