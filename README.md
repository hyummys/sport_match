# SportMatch

함께 운동할 사람을 찾아주는 스포츠 매칭 모바일 앱입니다.

종목별 방을 만들거나 참가하여 근처에서 같이 운동할 파트너를 쉽게 찾을 수 있습니다.

## 주요 기능

- **종목별 매칭** — 테니스, 풋살, 배드민턴, 농구, 탁구, 러닝, 자전거, 볼링, 클라이밍, 골프 등 10개 종목 지원
- **방 생성/참가** — 장소, 날짜, 인원, 실력 범위를 설정하여 매칭 방을 만들고 참가
- **실시간 알림** — 참가 신청, 승인/거절, 방 상태 변경 시 실시간 알림
- **지도 기반 장소 선택** — Kakao Local API + react-native-maps를 활용한 장소 검색 및 지도 표시
- **실력 필터링** — 0~10 레벨 기반으로 원하는 실력대의 상대를 찾기
- **내 매칭 관리** — 내가 만든 방과 참가한 방을 한눈에 확인

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Expo SDK 54 + React Native 0.81 + React 19 |
| Language | TypeScript (strict mode) |
| Routing | Expo Router v6 (file-based, typed routes) |
| Backend | Supabase (Auth, PostgreSQL + RLS, Realtime) |
| State | Zustand (클라이언트) + React Query (서버) |
| Maps | react-native-maps |
| Icons | @expo/vector-icons (Feather) |

## 시작하기

### 사전 요구사항

- Node.js 18+
- npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase](https://supabase.com) 프로젝트
- (선택) [Kakao Developers](https://developers.kakao.com) 앱 (장소 검색용)

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd sport_match

# 의존성 설치
npm install
```

### 환경 변수 설정

`.env.example`을 `.env`로 복사한 뒤 값을 채워주세요.

```bash
cp .env.example .env
```

```env
# Supabase 설정 (Settings > API에서 확인)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Kakao Local API (장소 검색)
EXPO_PUBLIC_KAKAO_REST_API_KEY=your-kakao-rest-api-key-here
```

### 데이터베이스 설정

Supabase SQL Editor에서 `supabase/schema.sql`을 실행하면 테이블, RLS 정책, 트리거, 초기 종목 데이터가 생성됩니다.

### 실행

```bash
npm start          # Expo 개발 서버 시작
npm run android    # Android 실행
npm run ios        # iOS 실행
npm run web        # 웹 실행
```

## 프로젝트 구조

```
sport_match/
├── app/                        # Expo Router 페이지
│   ├── _layout.tsx             # 루트 레이아웃 (QueryClient, 인증 가드)
│   ├── index.tsx               # 진입점 (인증 체크 후 리다이렉트)
│   ├── (auth)/                 # 인증 화면
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── (tabs)/                 # 메인 탭 화면
│       ├── _layout.tsx         # 하단 5탭 (홈/탐색/방만들기/내매칭/마이)
│       ├── home/               # 홈 - 종목 그리드 + 방 목록
│       ├── search.tsx          # 탐색 - 종목/실력 필터 검색
│       ├── create.tsx          # 방 만들기 폼
│       ├── my-matches.tsx      # 내 매칭 (주최/참가 탭)
│       └── profile/            # 프로필 & 로그아웃
├── components/                 # 공통 컴포넌트
├── hooks/                      # 커스텀 훅
│   ├── useAuth.ts              # 인증 (로그인/회원가입/로그아웃)
│   ├── useRooms.ts             # 방 CRUD
│   ├── useNotifications.ts     # 알림 조회/읽음 처리
│   └── useRealtime.ts          # Supabase Realtime 구독
├── stores/                     # Zustand 스토어
│   ├── authStore.ts            # 인증 상태
│   └── filterStore.ts          # 필터 상태 (날짜, 지역, 실력)
├── lib/                        # 유틸리티
│   ├── supabase.ts             # Supabase 클라이언트
│   ├── types.ts                # TypeScript 타입 정의
│   └── constants.ts            # 색상, 레이블 상수
├── supabase/
│   └── schema.sql              # DB 스키마 (테이블, RLS, 트리거)
├── assets/                     # 이미지, 폰트
└── docs/                       # 기획 문서
```

## 데이터베이스 구조

```
users              사용자 프로필
sports             종목 마스터 (10개)
user_sports        사용자별 선호 종목 + 실력
rooms              매칭 방
room_participants  방 참가자 (호스트 제외)
notifications      알림
```

- 호스트는 `rooms.host_id`로 관리하며, `room_participants`에는 포함되지 않음
- `current_participants`는 DB 트리거로 자동 계산 (승인된 참가자 + 1)
- RLS로 소유권 기반 접근 제어 적용
- `rooms`, `room_participants`, `notifications` 테이블에 Realtime 활성화

## 라이선스

Private
