# LocJobs

A location-based job marketplace built with React Native (Expo) and Supabase. Supports both gig/temporary work and professional permanent positions with employment types, rich categories, real-time chat, reviews, and Google OAuth.

## Stack

- **Frontend:** React Native (Expo SDK 56), Expo Router, TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Maps:** `react-native-maps`
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Offline Detection:** `@react-native-community/netinfo`
- **i18n:** English + Burmese (my)

## Get Started

```bash
npm install
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator.

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Web client ID |

## Features

- **Dual-role system** — users can post and/or apply for jobs
- **Job types** — gig (fixed-price) and salaried (employment type)
- **Categories** — 29 categories spanning gig services and professional fields
- **Real-time chat** — per-job messaging with image sharing, unread indicators, reply, read receipts, and pagination
- **Saved jobs** — bookmark jobs with toggle from any listing
- **Reviews & ratings** — star ratings on completed jobs
- **Verified badges** — auto-granted after 3 completed jobs
- **Notifications** — in-app notification bell with real-time updates
- **Google OAuth** — iOS (ASWebAuthenticationSession); Android requires dev build
- **Email/password auth** — registration, login, forgot/reset password flow
- **Profile** — avatar (initials/image), bio, phone, email, city, region
- **Job lifecycle** — open → accepted → completed; cancellations, reject reason
- **Reports & abuse** — flag inappropriate jobs
- **Soft delete** — jobs and accounts use `deleted`/`deleted_at`
- **i18n** — full English and Burmese (my) translations
- **Offline banner** — slide-in indicator when internet drops, with i18n
- **Help & Support** — FAQ accordion + Contact Us screen
- **Error + retry UI** — fetch error states with retry buttons on list screens
- **Posted time labels** — "Posted 3h ago" / "Posted 2d ago" on all job cards
- **Realtime job sync** — DELETE/UPDATE subscriptions keep job lists current
- **Display name fix** — passed via `options.data` on signup so it persists through email verification

## Migrations

All migrations are in `supabase/migrations/` (`00001`–`00022`). Run them manually via the Supabase Dashboard SQL Editor.

## Storage

Bucket `job-images` is public. Uploads use `expo-file-system/legacy` `uploadAsync` with `BINARY_CONTENT` + `PUT` method.
