import { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Room,
  RoomWithDetails,
  RoomDetailWithParticipants,
  CreateRoomInput,
  RoomStatus,
} from '../lib/types';

export function useRooms() {
  const [isLoading, setIsLoading] = useState(false);

  // 종목별 모집 중인 방 목록 조회
  const getRoomsBySport = async (sportId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*, sports(*), users!host_id(*)')
      .eq('sport_id', sportId)
      .eq('status', 'recruiting')
      .gte('play_date', new Date().toISOString())
      .order('play_date', { ascending: true });

    setIsLoading(false);
    return { data: data as RoomWithDetails[] | null, error };
  };

  // 전체 모집 중인 방 목록 (홈 화면용)
  const getRecruitingRooms = async (limit: number = 10) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*, sports(*), users!host_id(*)')
      .eq('status', 'recruiting')
      .gte('play_date', new Date().toISOString())
      .order('play_date', { ascending: true })
      .limit(limit);

    setIsLoading(false);
    return { data: data as RoomWithDetails[] | null, error };
  };

  // 방 상세 조회 (참가자 포함)
  const getRoomDetail = async (roomId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select(
        `*,
        sports(*),
        users!host_id(*),
        room_participants(*, users(*))`
      )
      .eq('id', roomId)
      .single();

    setIsLoading(false);
    return { data: data as RoomDetailWithParticipants | null, error };
  };

  // 방 생성
  // Note: Host is tracked via rooms.host_id, NOT via room_participants.
  // The DB trigger counts approved participants + 1 for the host.
  const createRoom = async (input: CreateRoomInput, hostId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        ...input,
        host_id: hostId,
        status: 'recruiting',
        current_participants: 1,
      })
      .select()
      .single();

    setIsLoading(false);
    return { data: data as Room | null, error };
  };

  // 방 상태 변경
  const updateRoomStatus = async (roomId: string, status: RoomStatus) => {
    const { error } = await supabase
      .from('rooms')
      .update({ status })
      .eq('id', roomId);

    return { error };
  };

  // 참가 신청
  const joinRoom = async (roomId: string, userId: string) => {
    // Check if user is the host (host is already counted separately)
    const { data: room } = await supabase
      .from('rooms')
      .select('host_id, current_participants, max_participants, status')
      .eq('id', roomId)
      .single();

    if (room?.host_id === userId) {
      return { data: null, error: { message: '방장은 이미 참가 중입니다.' } };
    }

    if (room?.status !== 'recruiting') {
      return { data: null, error: { message: '모집이 마감된 방입니다.' } };
    }

    if (room && room.current_participants >= room.max_participants) {
      return { data: null, error: { message: '정원이 가득 찼습니다.' } };
    }

    const { data, error } = await supabase
      .from('room_participants')
      .insert({
        room_id: roomId,
        user_id: userId,
        status: 'approved',
      })
      .select()
      .single();

    return { data, error };
  };

  // 참가 취소
  const leaveRoom = async (roomId: string, userId: string) => {
    const { error } = await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    return { error };
  };

  // 내가 참여 중인 방 목록
  const getMyRooms = async (userId: string) => {
    setIsLoading(true);

    // 내가 호스트인 방
    const { data: hostedRooms } = await supabase
      .from('rooms')
      .select('*, sports(*), users!host_id(*)')
      .eq('host_id', userId)
      .order('play_date', { ascending: true });

    // 내가 참가한 방
    const { data: participatingRoomIds } = await supabase
      .from('room_participants')
      .select('room_id')
      .eq('user_id', userId)
      .eq('status', 'approved');

    let participatingRooms: RoomWithDetails[] = [];
    if (participatingRoomIds && participatingRoomIds.length > 0) {
      const roomIds = participatingRoomIds.map((r) => r.room_id);
      const { data } = await supabase
        .from('rooms')
        .select('*, sports(*), users!host_id(*)')
        .in('id', roomIds)
        .order('play_date', { ascending: true });

      participatingRooms = (data as RoomWithDetails[]) || [];
    }

    setIsLoading(false);
    return {
      hostedRooms: (hostedRooms as RoomWithDetails[]) || [],
      participatingRooms,
    };
  };

  return {
    isLoading,
    getRoomsBySport,
    getRecruitingRooms,
    getRoomDetail,
    createRoom,
    updateRoomStatus,
    joinRoom,
    leaveRoom,
    getMyRooms,
  };
}
