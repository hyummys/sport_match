-- ============================================
-- 즐겨찾기 장소 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS favorite_places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_name TEXT NOT NULL,
  address_name TEXT NOT NULL,
  road_address_name TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(user_id, place_name, address_name)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_favorite_places_user_id ON favorite_places(user_id);

-- RLS 활성화
ALTER TABLE favorite_places ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 조회
CREATE POLICY "Users can view own favorite places"
  ON favorite_places FOR SELECT
  USING (auth.uid() = user_id);

-- 본인만 추가
CREATE POLICY "Users can insert own favorite places"
  ON favorite_places FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인만 삭제
CREATE POLICY "Users can delete own favorite places"
  ON favorite_places FOR DELETE
  USING (auth.uid() = user_id);

-- Realtime 활성화 (선택)
ALTER PUBLICATION supabase_realtime ADD TABLE favorite_places;
