// ============================================
// Enum 타입
// ============================================
export type SkillLevel = number; // 0~10

export function isValidSkillLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 0 && level <= 10;
}

export type RoomStatus = 'recruiting' | 'closed' | 'completed' | 'cancelled';
export type ParticipantStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type NotificationType =
  | 'join_request'
  | 'approved'
  | 'rejected'
  | 'room_full'
  | 'room_cancelled'
  | 'room_completed';

// ============================================
// 테이블 Row 타입
// ============================================
export interface User {
  id: string;
  nickname: string;
  avatar_url: string | null;
  region: string | null;
  manner_score: number;
  created_at: string;
  updated_at: string;
}

export interface Sport {
  id: string;
  name: string;
  icon: string;
  min_players: number;
  max_players: number;
  is_active: boolean;
  created_at: string;
}

export interface UserSport {
  id: string;
  user_id: string;
  sport_id: string;
  skill_level: SkillLevel;
}

export interface Room {
  id: string;
  host_id: string;
  sport_id: string;
  title: string;
  description: string | null;
  location_name: string;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  play_date: string;
  max_participants: number;
  current_participants: number;
  cost_per_person: number;
  min_skill_level: SkillLevel;
  max_skill_level: SkillLevel;
  view_count: number;
  status: RoomStatus;
  created_at: string;
  updated_at: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  status: ParticipantStatus;
  joined_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  room_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface FavoritePlace {
  id: string;
  user_id: string;
  place_name: string;
  address_name: string;
  road_address_name: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  created_at: string;
}

// ============================================
// 조인 타입 (방 목록 조회 시)
// ============================================
export interface RoomWithDetails extends Room {
  sports: Sport;
  users: User; // host
}

export interface RoomDetailWithParticipants extends RoomWithDetails {
  room_participants: (RoomParticipant & {
    users: User;
  })[];
}

// ============================================
// 폼 입력 타입
// ============================================
export interface CreateRoomInput {
  sport_id: string;
  title?: string;
  description?: string;
  location_name: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  play_date: string;
  max_participants: number;
  cost_per_person: number;
  min_skill_level: SkillLevel;
  max_skill_level: SkillLevel;
}

export interface UpdateProfileInput {
  nickname: string;
  avatar_url?: string;
  region?: string;
}

// ============================================
// Supabase Database 타입 (제네릭용)
// ============================================
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at' | 'manner_score'> & {
          manner_score?: number;
        };
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
        Relationships: [];
      };
      sports: {
        Row: Sport;
        Insert: Omit<Sport, 'id' | 'created_at' | 'is_active'>;
        Update: Partial<Omit<Sport, 'id' | 'created_at'>>;
        Relationships: [];
      };
      user_sports: {
        Row: UserSport;
        Insert: Omit<UserSport, 'id'>;
        Update: Partial<Omit<UserSport, 'id'>>;
        Relationships: [];
      };
      rooms: {
        Row: Room;
        Insert: Omit<Room, 'id' | 'created_at' | 'updated_at' | 'current_participants' | 'status' | 'view_count'> & {
          status?: RoomStatus;
          current_participants?: number;
          view_count?: number;
        };
        Update: Partial<Omit<Room, 'id' | 'created_at' | 'host_id'>>;
        Relationships: [];
      };
      room_participants: {
        Row: RoomParticipant;
        Insert: Omit<RoomParticipant, 'id' | 'joined_at' | 'status'> & {
          status?: ParticipantStatus;
        };
        Update: Partial<Omit<RoomParticipant, 'id' | 'joined_at'>>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'is_read'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
        Relationships: [];
      };
      favorite_places: {
        Row: FavoritePlace;
        Insert: Omit<FavoritePlace, 'id' | 'created_at'>;
        Update: Partial<Omit<FavoritePlace, 'id' | 'created_at' | 'user_id'>>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      room_status: RoomStatus;
      participant_status: ParticipantStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: {};
  };
}
