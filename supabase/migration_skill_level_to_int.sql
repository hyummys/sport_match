-- ============================================
-- Migration: skill_level ENUM → INTEGER (0~10)
-- Supabase SQL Editor에서 실행
-- ============================================

-- 1. rooms 테이블: min_skill_level, max_skill_level 변환
ALTER TABLE rooms
  ALTER COLUMN min_skill_level DROP DEFAULT,
  ALTER COLUMN max_skill_level DROP DEFAULT;

ALTER TABLE rooms
  ALTER COLUMN min_skill_level TYPE INT USING (
    CASE min_skill_level::text
      WHEN 'beginner' THEN 2
      WHEN 'intermediate' THEN 5
      WHEN 'advanced' THEN 8
      ELSE 0
    END
  ),
  ALTER COLUMN max_skill_level TYPE INT USING (
    CASE max_skill_level::text
      WHEN 'beginner' THEN 4
      WHEN 'intermediate' THEN 7
      WHEN 'advanced' THEN 10
      ELSE 10
    END
  );

ALTER TABLE rooms
  ALTER COLUMN min_skill_level SET DEFAULT 0,
  ALTER COLUMN max_skill_level SET DEFAULT 10;

ALTER TABLE rooms
  ADD CONSTRAINT rooms_min_skill_check CHECK (min_skill_level BETWEEN 0 AND 10),
  ADD CONSTRAINT rooms_max_skill_check CHECK (max_skill_level BETWEEN 0 AND 10);

-- 2. user_sports 테이블: skill_level 변환
ALTER TABLE user_sports
  ALTER COLUMN skill_level DROP DEFAULT;

ALTER TABLE user_sports
  ALTER COLUMN skill_level TYPE INT USING (
    CASE skill_level::text
      WHEN 'beginner' THEN 2
      WHEN 'intermediate' THEN 5
      WHEN 'advanced' THEN 8
      ELSE 0
    END
  );

ALTER TABLE user_sports
  ALTER COLUMN skill_level SET DEFAULT 0;

ALTER TABLE user_sports
  ADD CONSTRAINT user_sports_skill_check CHECK (skill_level BETWEEN 0 AND 10);

-- 3. skill_level ENUM 타입 삭제
DROP TYPE IF EXISTS skill_level;
