-- ============================================
-- SportMatch Database Schema
-- Supabase SQL Editor에서 실행
-- ============================================

-- 1. ENUM 타입 생성
-- skill_level은 INTEGER 0~10 사용 (ENUM 대신)
CREATE TYPE room_status AS ENUM ('recruiting', 'closed', 'completed', 'cancelled');
CREATE TYPE participant_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE notification_type AS ENUM ('join_request', 'approved', 'rejected', 'room_full', 'room_cancelled', 'room_completed');

-- 2. users 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  region TEXT,
  manner_score FLOAT DEFAULT 3.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. sports 테이블 (종목 마스터)
CREATE TABLE sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  min_players INT NOT NULL DEFAULT 2,
  max_players INT NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. user_sports 테이블 (사용자 선호 종목)
CREATE TABLE user_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  skill_level INT NOT NULL DEFAULT 0 CHECK (skill_level BETWEEN 0 AND 10),
  UNIQUE(user_id, sport_id)
);

-- 5. rooms 테이블 (매칭 방)
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES sports(id),
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT NOT NULL,
  location_address TEXT,
  latitude FLOAT,
  longitude FLOAT,
  play_date TIMESTAMPTZ NOT NULL,
  max_participants INT NOT NULL,
  current_participants INT DEFAULT 1,
  cost_per_person INT DEFAULT 0,
  min_skill_level INT DEFAULT 0 CHECK (min_skill_level BETWEEN 0 AND 10),
  max_skill_level INT DEFAULT 10 CHECK (max_skill_level BETWEEN 0 AND 10),
  status room_status DEFAULT 'recruiting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. room_participants 테이블 (방 참가자)
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status participant_status DEFAULT 'approved',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 7. notifications 테이블 (알림)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 인덱스
-- ============================================
CREATE INDEX idx_rooms_sport_id ON rooms(sport_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_play_date ON rooms(play_date);
CREATE INDEX idx_rooms_host_id ON rooms(host_id);
CREATE INDEX idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_user_sports_user_id ON user_sports(user_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_all" ON users
  FOR SELECT USING (true);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- sports
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sports_select_all" ON sports
  FOR SELECT USING (true);

-- user_sports
ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sports_select_all" ON user_sports
  FOR SELECT USING (true);

CREATE POLICY "user_sports_insert_own" ON user_sports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_sports_update_own" ON user_sports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_sports_delete_own" ON user_sports
  FOR DELETE USING (auth.uid() = user_id);

-- rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_select_all" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "rooms_insert_auth" ON rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "rooms_update_host" ON rooms
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "rooms_delete_host" ON rooms
  FOR DELETE USING (auth.uid() = host_id);

-- room_participants
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_select_all" ON room_participants
  FOR SELECT USING (true);

CREATE POLICY "participants_insert_auth" ON room_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participants_update_own" ON room_participants
  FOR UPDATE USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT host_id FROM rooms WHERE id = room_id)
  );

CREATE POLICY "participants_delete_own" ON room_participants
  FOR DELETE USING (auth.uid() = user_id);

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_auth" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 참가자 수 자동 갱신 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE rooms SET current_participants = (
      SELECT COUNT(*) + 1  -- +1 for host
      FROM room_participants
      WHERE room_id = NEW.room_id AND status = 'approved'
    ) WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE rooms SET current_participants = (
      SELECT COUNT(*) + 1
      FROM room_participants
      WHERE room_id = OLD.room_id AND status = 'approved'
    ) WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER participant_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON room_participants
  FOR EACH ROW EXECUTE FUNCTION update_participant_count();

-- ============================================
-- 초기 종목 데이터
-- ============================================
INSERT INTO sports (name, icon, min_players, max_players) VALUES
  ('테니스', '🎾', 2, 4),
  ('풋살', '⚽', 6, 12),
  ('배드민턴', '🏸', 2, 4),
  ('농구', '🏀', 4, 10),
  ('탁구', '🏓', 2, 4),
  ('러닝', '🏃', 2, 20),
  ('자전거', '🚴', 2, 15),
  ('볼링', '🎳', 2, 6),
  ('클라이밍', '🧗', 2, 8),
  ('골프', '⛳', 2, 4);

-- ============================================
-- Realtime 활성화
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
