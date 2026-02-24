# 🏆 SportMatch - 운동 종목별 매칭 플랫폼 프로젝트 기획서

---

## 1. 프로젝트 개요

### 1.1 서비스 소개

**SportMatch**는 운동 종목별로 함께 운동할 사람을 매칭해주는 모바일 앱이다. 배달의민족처럼 하나의 플랫폼 메인 화면에서 운동 종목(카테고리)을 선택하고, 해당 종목 내에서 방을 만들거나 참여하여 운동 파트너를 찾을 수 있다.

### 1.2 핵심 컨셉

- **호스트**: 코트/장소를 확보한 사용자가 모집 방을 생성
- **참여자**: 조건에 맞는 방을 탐색하고 참가 신청
- **플랫폼**: 종목별 카테고리 기반으로 매칭을 중개

### 1.3 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | React Native + Expo | 크로스플랫폼 (iOS/Android) |
| 언어 | TypeScript | 타입 안정성 확보 |
| 백엔드 | Supabase | Auth, DB, Realtime, Storage, Edge Functions |
| 네비게이션 | Expo Router | 파일 기반 라우팅 |
| 상태 관리 | Zustand + React Query | 클라이언트/서버 상태 분리 |
| UI 라이브러리 | NativeWind (Tailwind CSS) | 일관된 스타일링 |
| 푸시 알림 | Expo Notifications | 매칭 알림 |
| IDE | VS Code | 주 개발 환경 |

---

## 2. 사용자 정의

### 2.1 사용자 유형

| 유형 | 설명 |
|------|------|
| **호스트 (Host)** | 장소를 확보하고 운동 모집 방을 생성하는 사용자 |
| **참여자 (Participant)** | 방을 탐색하고 참가 신청하는 사용자 |

> 모든 사용자는 호스트와 참여자 역할을 동시에 수행할 수 있다.

### 2.2 사용자 프로필 정보

- 닉네임
- 프로필 사진
- 선호 종목 (복수 선택)
- 활동 지역
- 실력 수준 (종목별: 초급 / 중급 / 상급)
- 매너 점수 (참여 후 상호 평가)

---

## 3. 주요 기능 설계

### 3.1 기능 목록

| 구분 | 기능 | 우선순위 | MVP 포함 |
|------|------|----------|----------|
| 인증 | 소셜 로그인 (카카오, 구글, 애플) | P0 | ✅ |
| 인증 | 이메일 로그인 | P1 | ✅ |
| 프로필 | 프로필 등록/수정 | P0 | ✅ |
| 프로필 | 선호 종목/실력 수준 설정 | P0 | ✅ |
| 메인 | 종목 카테고리 메인 화면 | P0 | ✅ |
| 매칭 | 방 생성 (호스트) | P0 | ✅ |
| 매칭 | 방 목록 조회/필터링 | P0 | ✅ |
| 매칭 | 방 참가 신청/취소 | P0 | ✅ |
| 매칭 | 방 상태 관리 (모집중/마감/완료) | P0 | ✅ |
| 알림 | 푸시 알림 (참가 확정, 인원 변동) | P1 | ✅ |
| 소통 | 방 내 채팅 | P2 | ❌ |
| 평가 | 운동 후 매너 평가 | P2 | ❌ |
| 결제 | 참가비 정산 | P3 | ❌ |
| 지도 | 장소 지도 표시 | P1 | ✅ |

### 3.2 운동 종목 카테고리 (초기 지원)

| 종목 | 아이콘 | 최소 인원 | 최대 인원 |
|------|--------|-----------|-----------|
| 테니스 | 🎾 | 2 | 4 |
| 풋살 | ⚽ | 6 | 12 |
| 배드민턴 | 🏸 | 2 | 4 |
| 농구 | 🏀 | 4 | 10 |
| 탁구 | 🏓 | 2 | 4 |
| 러닝 | 🏃 | 2 | 20 |
| 자전거 | 🚴 | 2 | 15 |
| 볼링 | 🎳 | 2 | 6 |
| 클라이밍 | 🧗 | 2 | 8 |
| 골프 | ⛳ | 2 | 4 |

> 추후 사용자 요청에 따라 종목 확장 가능

---

## 4. 화면 구조 (Screen Architecture)

### 4.1 네비게이션 구조

```
App
├── (auth)                          # 인증 그룹 (비로그인)
│   ├── login                       # 로그인 화면
│   ├── signup                      # 회원가입 화면
│   └── onboarding                  # 온보딩 (선호 종목/지역 설정)
│
├── (tabs)                          # 메인 탭 그룹 (로그인 후)
│   ├── home                        # 🏠 홈 (종목 카테고리 메인)
│   │   └── [sport]                 # 종목별 방 목록
│   │       └── [roomId]            # 방 상세
│   │
│   ├── search                      # 🔍 탐색 (전체 방 검색/필터)
│   │
│   ├── create                      # ➕ 방 만들기
│   │
│   ├── my-matches                  # 📋 내 매칭 (참여 중인 방 목록)
│   │
│   └── profile                     # 👤 마이페이지
│       ├── edit                    # 프로필 수정
│       ├── my-rooms                # 내가 만든 방
│       └── settings                # 설정
│
└── (modals)                        # 모달
    ├── room-create                 # 방 생성 모달
    ├── participants                # 참가자 목록
    └── notifications               # 알림 목록
```

### 4.2 주요 화면 상세

#### 🏠 홈 화면 (Home)
메인 진입점. 배달의민족 스타일로 종목 카테고리를 그리드 형태로 배치한다.

```
┌──────────────────────────────┐
│  📍 서울 강남구        🔔     │  ← 위치 + 알림
├──────────────────────────────┤
│  🔍 어떤 운동을 찾고 있나요?   │  ← 검색바
├──────────────────────────────┤
│                              │
│  🎾 테니스    ⚽ 풋살         │
│  🏸 배드민턴  🏀 농구         │  ← 종목 카테고리 그리드
│  🏓 탁구     🏃 러닝         │
│  🚴 자전거   🎳 볼링         │
│                              │
├──────────────────────────────┤
│  🔥 지금 모집 중인 방          │
│  ┌────────────────────────┐  │
│  │ 🎾 테니스 복식 한 판!    │  │
│  │ 📍 올림픽공원 테니스장   │  │  ← 추천 방 리스트
│  │ 🕐 오늘 18:00           │  │
│  │ 👥 2/4명                │  │
│  └────────────────────────┘  │
├──────────────────────────────┤
│  🏠    🔍    ➕    📋    👤  │  ← 하단 탭 바
└──────────────────────────────┘
```

#### 📋 방 목록 화면 (Room List)
특정 종목 선택 시 진입. 모집 중인 방을 리스트로 보여준다.

```
┌──────────────────────────────┐
│  ← 🎾 테니스           필터 ↓ │
├──────────────────────────────┤
│  필터: [날짜] [지역] [실력]   │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ 테니스 복식 한 판!      │  │
│  │ 📍 올림픽공원 테니스장   │  │
│  │ 🕐 2/15 (토) 18:00     │  │
│  │ 👥 2/4명  💰 15,000원   │  │
│  │ 🏅 중급 이상            │  │
│  │            [참가하기]    │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 주말 테니스 같이 쳐요    │  │
│  │ 📍 잠실 테니스코트       │  │
│  │ 🕐 2/16 (일) 10:00     │  │
│  │ 👥 1/2명  💰 20,000원   │  │
│  │ 🏅 초급~중급            │  │
│  │            [참가하기]    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

#### ➕ 방 생성 화면 (Create Room)
호스트가 모집 방을 만드는 폼 화면.

```
┌──────────────────────────────┐
│  ← 방 만들기                  │
├──────────────────────────────┤
│                              │
│  종목 선택                    │
│  [🎾 테니스 ▼]               │
│                              │
│  제목                        │
│  [테니스 복식 한 판!        ]  │
│                              │
│  날짜 및 시간                 │
│  [2025.02.15 (토) 18:00   ]  │
│                              │
│  장소                        │
│  [📍 올림픽공원 테니스장    ]  │
│  [지도에서 선택]              │
│                              │
│  모집 인원                    │
│  [- 3 +] / 최대 4명          │
│                              │
│  참가비                      │
│  [15,000] 원 (1인당)         │
│                              │
│  실력 수준                    │
│  [초급] [중급✓] [상급✓]      │
│                              │
│  상세 설명                    │
│  [코트 예약 완료했습니다.    ] │
│  [라켓 있으신 분만 신청...   ] │
│                              │
│  ┌────────────────────────┐  │
│  │      방 만들기          │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

#### 📄 방 상세 화면 (Room Detail)

```
┌──────────────────────────────┐
│  ← 방 상세              ⋮    │
├──────────────────────────────┤
│  🎾 테니스 복식 한 판!        │
│  모집중                      │
├──────────────────────────────┤
│  👤 호스트: 테니스왕김코치     │
│  ⭐ 매너점수 4.8              │
├──────────────────────────────┤
│  📅 2025.02.15 (토) 18:00    │
│  📍 올림픽공원 테니스장        │
│  [지도 보기]                  │
│  💰 15,000원 / 인             │
│  🏅 중급 이상                 │
├──────────────────────────────┤
│  📝 상세 설명                 │
│  코트 예약 완료했습니다.       │
│  라켓 있으신 분만 신청해주세요. │
│  주차 가능합니다.              │
├──────────────────────────────┤
│  👥 참가자 (2/4)              │
│  ┌──────────┬──────────┐     │
│  │ 🧑 김코치  │ 🧑 이선수 │     │
│  │  (호스트)  │  (참여자) │     │
│  └──────────┴──────────┘     │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │      참가 신청하기       │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

---

## 5. 데이터베이스 설계 (Supabase)

### 5.1 ERD 개요

```
users ──┐
        ├──< rooms ──< room_participants
        │
        ├──< notifications
        │
        └──< user_sports (선호 종목)

sports (종목 마스터)
```

### 5.2 테이블 정의

#### `users` - 사용자

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | Supabase Auth UID |
| nickname | text | 닉네임 |
| avatar_url | text | 프로필 사진 URL |
| region | text | 활동 지역 |
| manner_score | float | 매너 점수 (기본 3.0) |
| created_at | timestamptz | 가입일 |
| updated_at | timestamptz | 수정일 |

#### `sports` - 운동 종목 마스터

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 종목 ID |
| name | text | 종목명 |
| icon | text | 아이콘 이모지 |
| min_players | int | 최소 인원 |
| max_players | int | 최대 인원 |
| is_active | boolean | 활성 여부 |

#### `user_sports` - 사용자별 선호 종목

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| user_id | uuid (FK → users) | 사용자 |
| sport_id | uuid (FK → sports) | 종목 |
| skill_level | enum | 'beginner' / 'intermediate' / 'advanced' |

#### `rooms` - 매칭 방

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 방 ID |
| host_id | uuid (FK → users) | 호스트 |
| sport_id | uuid (FK → sports) | 종목 |
| title | text | 방 제목 |
| description | text | 상세 설명 |
| location_name | text | 장소명 |
| location_address | text | 주소 |
| latitude | float | 위도 |
| longitude | float | 경도 |
| play_date | timestamptz | 운동 일시 |
| max_participants | int | 최대 인원 |
| current_participants | int | 현재 인원 (캐시) |
| cost_per_person | int | 1인당 참가비 (원) |
| min_skill_level | enum | 최소 실력 수준 |
| max_skill_level | enum | 최대 실력 수준 |
| status | enum | 'recruiting' / 'closed' / 'completed' / 'cancelled' |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

#### `room_participants` - 방 참가자

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| room_id | uuid (FK → rooms) | 방 |
| user_id | uuid (FK → users) | 참가자 |
| status | enum | 'pending' / 'approved' / 'rejected' / 'cancelled' |
| joined_at | timestamptz | 참가 신청일 |

#### `notifications` - 알림

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| user_id | uuid (FK → users) | 수신자 |
| type | enum | 'join_request' / 'approved' / 'room_full' / 'room_cancelled' |
| title | text | 알림 제목 |
| body | text | 알림 내용 |
| room_id | uuid (FK → rooms) | 관련 방 |
| is_read | boolean | 읽음 여부 |
| created_at | timestamptz | 생성일 |

### 5.3 Row Level Security (RLS) 정책

```sql
-- users: 본인만 수정 가능, 조회는 모두 가능
-- rooms: 누구나 조회 가능, 생성은 로그인 사용자, 수정/삭제는 호스트만
-- room_participants: 해당 방 참가자와 호스트만 조회, 본인만 참가/취소
-- notifications: 본인 알림만 조회
```

---

## 6. API 설계 (Supabase 기반)

### 6.1 인증

| 기능 | 방식 | 설명 |
|------|------|------|
| 소셜 로그인 | `supabase.auth.signInWithOAuth()` | 카카오, 구글, 애플 |
| 이메일 로그인 | `supabase.auth.signInWithPassword()` | 이메일/비밀번호 |
| 로그아웃 | `supabase.auth.signOut()` | |
| 세션 확인 | `supabase.auth.getSession()` | |

### 6.2 주요 쿼리

```typescript
// 종목별 모집 중인 방 목록 조회
const { data: rooms } = await supabase
  .from('rooms')
  .select('*, sports(*), users!host_id(*)')
  .eq('sport_id', sportId)
  .eq('status', 'recruiting')
  .gte('play_date', new Date().toISOString())
  .order('play_date', { ascending: true });

// 방 생성
const { data: room } = await supabase
  .from('rooms')
  .insert({
    host_id: userId,
    sport_id: sportId,
    title, description,
    location_name, location_address,
    latitude, longitude,
    play_date, max_participants,
    cost_per_person,
    min_skill_level, max_skill_level,
    status: 'recruiting',
    current_participants: 1,
  })
  .select()
  .single();

// 참가 신청
const { data } = await supabase
  .from('room_participants')
  .insert({
    room_id: roomId,
    user_id: userId,
    status: 'approved', // 또는 'pending' (승인제일 경우)
  });

// 실시간 방 업데이트 구독
const channel = supabase
  .channel('room-updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` },
    (payload) => { /* 참가자 변동 실시간 반영 */ }
  )
  .subscribe();
```

---

## 7. 프로젝트 폴더 구조

```
sport-match/
├── app/                            # Expo Router 페이지
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx             # 탭 레이아웃
│   │   ├── home/
│   │   │   ├── index.tsx           # 홈 (카테고리)
│   │   │   └── [sport]/
│   │   │       ├── index.tsx       # 방 목록
│   │   │       └── [roomId].tsx    # 방 상세
│   │   ├── search.tsx
│   │   ├── create.tsx
│   │   ├── my-matches.tsx
│   │   └── profile/
│   │       ├── index.tsx
│   │       ├── edit.tsx
│   │       └── settings.tsx
│   ├── _layout.tsx                 # 루트 레이아웃
│   └── index.tsx                   # 앱 진입점
│
├── components/                     # 재사용 컴포넌트
│   ├── ui/                         # 공통 UI (Button, Card, Input 등)
│   ├── room/                       # 방 관련 컴포넌트
│   │   ├── RoomCard.tsx
│   │   ├── RoomList.tsx
│   │   ├── RoomDetail.tsx
│   │   └── CreateRoomForm.tsx
│   ├── sport/                      # 종목 관련 컴포넌트
│   │   ├── SportGrid.tsx
│   │   └── SportIcon.tsx
│   └── profile/                    # 프로필 관련 컴포넌트
│       └── ProfileCard.tsx
│
├── lib/                            # 유틸리티 및 설정
│   ├── supabase.ts                 # Supabase 클라이언트 초기화
│   ├── types.ts                    # TypeScript 타입 정의
│   └── constants.ts                # 상수 정의
│
├── hooks/                          # 커스텀 훅
│   ├── useAuth.ts                  # 인증 관련
│   ├── useRooms.ts                 # 방 CRUD
│   ├── useRealtime.ts              # 실시간 구독
│   └── useNotifications.ts         # 알림 관련
│
├── stores/                         # Zustand 상태 관리
│   ├── authStore.ts
│   └── filterStore.ts
│
├── assets/                         # 이미지, 폰트 등
│
├── app.json                        # Expo 설정
├── tsconfig.json
├── package.json
└── .env                            # 환경 변수 (Supabase URL, Key)
```

---

## 8. 사용자 플로우

### 8.1 신규 사용자 플로우

```
앱 실행 → 로그인 화면 → 소셜/이메일 로그인
→ 온보딩 (닉네임, 선호 종목, 활동 지역, 실력 설정)
→ 홈 화면 진입
```

### 8.2 참여자 플로우 (방 참가)

```
홈 화면 → 종목 선택 (예: 테니스)
→ 방 목록 조회 (필터: 날짜, 지역, 실력)
→ 방 선택 → 방 상세 확인
→ [참가 신청하기] 버튼 클릭
→ 참가 확정 알림 수신
→ 내 매칭 탭에서 확인
```

### 8.3 호스트 플로우 (방 생성)

```
홈 화면 → 하단 탭 [➕] 클릭
→ 방 생성 폼 작성 (종목, 제목, 일시, 장소, 인원, 비용, 실력)
→ [방 만들기] 버튼 클릭
→ 방 생성 완료 → 방 상세 화면 이동
→ 참가 신청 알림 수신
→ (선택) 참가자 승인/거절
→ 인원 충족 시 모집 마감
```

### 8.4 운동 완료 플로우

```
운동 일시 경과 → 방 상태 자동 변경 (completed)
→ 참가자 전원에게 평가 알림 발송 (P2)
→ 매너 평가 진행 (P2)
→ 매너 점수 반영 (P2)
```

---

## 9. MVP 개발 로드맵

### Phase 1: 기초 세팅 (1주)

- [ ] Expo 프로젝트 초기화 (TypeScript)
- [ ] Supabase 프로젝트 생성 및 테이블 구축
- [ ] RLS 정책 설정
- [ ] Supabase 클라이언트 연동
- [ ] 기본 네비게이션 구조 세팅 (Expo Router)
- [ ] 공통 UI 컴포넌트 (Button, Card, Input, Header)

### Phase 2: 인증 및 프로필 (1주)

- [ ] 소셜 로그인 (카카오, 구글) 구현
- [ ] 이메일 로그인 구현
- [ ] 온보딩 화면 (선호 종목, 지역, 실력 설정)
- [ ] 프로필 조회/수정
- [ ] 프로필 사진 업로드 (Supabase Storage)

### Phase 3: 핵심 매칭 기능 (2주)

- [ ] 홈 화면 (종목 카테고리 그리드)
- [ ] 종목별 방 목록 화면
- [ ] 방 필터링 (날짜, 지역, 실력)
- [ ] 방 상세 화면
- [ ] 방 생성 폼
- [ ] 참가 신청/취소 기능
- [ ] 방 상태 관리 (모집중 → 마감 → 완료)
- [ ] Supabase Realtime으로 실시간 인원 업데이트

### Phase 4: 부가 기능 (1주)

- [ ] 지도 연동 (장소 표시)
- [ ] 푸시 알림 (Expo Notifications)
- [ ] 알림 목록 화면
- [ ] 내 매칭 탭 (참여 중/완료 구분)
- [ ] 검색 화면 (전체 방 검색)

### Phase 5: 테스트 및 배포 (1주)

- [ ] 통합 테스트
- [ ] UI/UX 개선
- [ ] 앱 아이콘 및 스플래시 화면
- [ ] EAS Build로 빌드
- [ ] TestFlight (iOS) / 내부 테스트 (Android)

**총 예상 기간: 약 6주 (MVP)**

---

## 10. 향후 확장 계획

| 단계 | 기능 | 설명 |
|------|------|------|
| v1.1 | 채팅 | 방 내 실시간 채팅 (Supabase Realtime) |
| v1.2 | 매너 평가 | 운동 후 상호 평가, 매너 점수 반영 |
| v1.3 | 정산 | 참가비 온라인 결제/정산 (토스페이먼츠 등) |
| v2.0 | 정기 모임 | 반복 일정 방 (매주 화요일 테니스 등) |
| v2.1 | 팀 관리 | 고정 팀 생성 및 팀 매칭 |
| v2.2 | 리그/토너먼트 | 종목별 아마추어 리그 시스템 |
| v2.3 | 시설 예약 연동 | 제휴 시설 예약 API 연동 |

---

## 11. 참고 사항

### 11.1 Supabase 활용 범위

| Supabase 서비스 | 활용 목적 |
|-----------------|-----------|
| Auth | 소셜 로그인, 세션 관리 |
| Database (PostgreSQL) | 모든 데이터 저장 |
| Realtime | 방 인원 변동, 새 방 알림 실시간 반영 |
| Storage | 프로필 이미지 저장 |
| Edge Functions | 푸시 알림 발송, 방 자동 마감 처리 |
| Row Level Security | 데이터 접근 권한 관리 |

### 11.2 별도 서버가 필요해지는 시점

- 결제/정산 시스템 도입 시
- 복잡한 매칭 알고리즘 (AI 기반 추천 등)
- 대규모 트래픽 (동시 접속 수천 명 이상)
- 외부 API 연동이 복잡해질 때 (시설 예약 등)

> MVP 단계에서는 Supabase만으로 충분하며, 필요 시 Supabase Edge Functions로 서버리스 확장이 가능하다.
