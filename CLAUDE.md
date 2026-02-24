# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SportMatch - React Native (Expo) mobile app for matching people to play sports together. Korean-language UI. Backend is Supabase (PostgreSQL, Auth, Realtime).

## Tech Stack

- **Runtime**: Expo SDK 54 + React Native 0.81 + React 19
- **Language**: TypeScript (strict mode, path alias `@/*` → root)
- **Routing**: Expo Router v6 (file-based, typed routes)
- **Backend**: Supabase (Auth, PostgreSQL with RLS, Realtime subscriptions)
- **State**: Zustand (auth/filter state) + React Query (server state)
- **Styling**: React Native StyleSheet (no CSS framework)
- **Maps**: react-native-maps
- **Icons**: @expo/vector-icons (Feather icon set)

## Development Commands

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run web version
```

No lint or test commands are configured.

## Environment Setup

Copy `.env.example` to `.env` and fill in Supabase credentials:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Architecture

### Routing (app/)

```
app/
├── _layout.tsx              # Root: QueryClientProvider, auth guard redirect
├── index.tsx                # Entry redirect (auth check)
├── (auth)/
│   ├── login.tsx
│   └── signup.tsx
└── (tabs)/
    ├── _layout.tsx          # 5-tab bottom nav (홈/탐색/방만들기/내매칭/마이)
    ├── home/
    │   ├── index.tsx        # Sport grid + recent rooms
    │   ├── [sport]/index.tsx    # Rooms filtered by sport
    │   └── [sport]/[roomId].tsx # Room detail with participants
    ├── search.tsx           # Search with sport/skill filters
    ├── create.tsx           # Room creation form
    ├── my-matches.tsx       # Hosted & joined rooms (2 tabs)
    └── profile/index.tsx    # User profile & logout
```

### State Management Pattern

- **Auth state**: `stores/authStore.ts` (Zustand) — session, user, isLoading
- **Filter state**: `stores/filterStore.ts` (Zustand) — date, region, skillLevel
- **Server data**: React Query for fetching/caching room listings, user data
- **Realtime**: `hooks/useRealtime.ts` — Supabase channel subscriptions for participant changes and notifications

### Key Modules

- `lib/supabase.ts` — Supabase client (configured with AsyncStorage for RN)
- `lib/types.ts` — All TypeScript types, enums, database row types, input types
- `lib/constants.ts` — Colors, skill labels, room status labels/colors
- `hooks/useAuth.ts` — Sign in/up/out, profile creation, auth state listener
- `hooks/useRooms.ts` — Room CRUD: getRoomsBySport, createRoom, joinRoom, updateRoomStatus, getMyRooms
- `hooks/useNotifications.ts` — Notification queries and mark-as-read
- `hooks/useRealtime.ts` — Generic + specialized realtime subscriptions

### Database (supabase/schema.sql)

Tables: `users`, `sports`, `user_sports`, `rooms`, `room_participants`, `notifications`

Key design decisions:
- Host is tracked via `rooms.host_id`, NOT as a row in `room_participants`
- DB trigger auto-calculates `current_participants` = approved participants + 1 (host)
- RLS policies enforce ownership rules (only host can update/delete rooms)
- Realtime enabled on rooms, room_participants, notifications
- Enums: `skill_level` (beginner/intermediate/advanced), `room_status` (recruiting/closed/completed/cancelled)

### Conventions

- Korean locale throughout (`toLocaleDateString('ko-KR')`)
- Skill level filtering is done client-side (alphabetical enum ordering doesn't match skill ordering)
- Primary color: `#3B82F6` (blue), defined in `lib/constants.ts`
- Error handling uses `Alert.alert()` for user-facing errors
- VS Code configured with auto-fix, organize imports, and sort members on save
