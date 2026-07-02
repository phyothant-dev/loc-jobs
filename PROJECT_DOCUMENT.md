# LocJobs — Location-Based Job Marketplace

## 1. Project Title

**LocJobs: A Location-Based Mobile Job Marketplace for Local and Professional Work**

---

## 2. Abstract

LocJobs is a mobile application that connects job seekers and job posters based on geographic proximity. It supports both gig/temporary work (fixed-price tasks like cleaning, delivery, moving) and professional permanent positions (salaried roles like software developer, marketing, finance). Users can register as uploaders, seekers, or both; post jobs with photos, categories, work types, and salary ranges; browse nearby opportunities via an interactive map; apply, chat, review, and complete jobs — all within the app.

The backend is powered by Supabase (PostgreSQL, Auth, Storage, RLS). The frontend is built with React Native (Expo), supporting iOS, Android, and web.

---

## 3. Objectives

### General Objective
To develop a mobile application that facilitates the posting and finding of local job opportunities — both temporary gig work and permanent professional roles — enabling efficient matching between job providers and job seekers based on location.

### Specific Objectives

1. **Location-Based Job Discovery** — Allow users to discover jobs near them using GPS and a configurable distance radius, with both map and list views.

2. **Dual-Role User System** — Implement a flexible role system where a single user can act as both uploader and seeker, with RLS-enforced permissions.

3. **Job Posting with Rich Metadata** — Enable job listings with title, description, work type (onsite/remote/hybrid), employment type (full-time, part-time, contract, permanent, freelance, internship, temporary), salary range and period (hourly–yearly), category (29 options spanning gig and professional fields), price (gig), vacancies, and optional images.

4. **Job Lifecycle Management** — Full workflow: post → apply/accept → complete/cancel, with status tracking, reject reasons, and soft delete.

5. **Real-Time Chat** — Per-job messaging with image sharing, conversation list, unread indicators, and real-time subscriptions.

6. **Reviews & Ratings** — Star-based reviews on completed jobs with average rating display on user profiles.

7. **User Profiles** — Avatars, bios, phone, location, verified badges (auto-granted after 3 completed jobs), and public profile pages.

8. **Google OAuth** — Sign in with Google on iOS (ASWebAuthenticationSession); Android requires a dev build.

---

## 4. Project Scope

### Included Features

- User authentication: email/password + Google OAuth (iOS)
- Location-based job discovery with map view and bottom sheet list
- Job posting: title, description, work type, employment type, salary (range + period), category, price, vacancies, location, images
- Image upload to Supabase Storage via `expo-file-system/legacy`
- Job lifecycle: open, full, accepted, completed, cancelled; uploader reject with reason
- Saved jobs with toggle from listings and detail
- Real-time per-job chat with image sharing and unread indicators
- In-app notifications with real-time subscriptions and tap routing
- Reviews and ratings (star-based) on completed jobs
- Verified badge auto-granted at 3 completed jobs
- User profiles with avatar, bio, phone, email, city, region, ratings
- Report/flag inappropriate jobs
- All Jobs browsing: search, work type, employment type, region, city, category, price range filters
- My Jobs dashboard: posted + accepted tabs with edit/delete actions
- Edit profile: avatar upload, display name, phone, bio, region, city
- Password reset via email + deep link (`locjobs://reset-password`)
- Email verification on signup
- Display name passed to `supabase.auth.signUp()` via `options.data` for immediate DB trigger population
- Offline detection banner (`network-banner.tsx`) with i18n support
- Error + retry UI on list screens (explore, nearby)
- FAQ + Contact Us help screen with collapsible FAQ accordion
- i18n for help/support content (en + my translations)
- Realtime job updates (DELETE/UPDATE subscriptions) on explore and nearby screens
- Soft delete for jobs and accounts
- Row Level Security on all tables
- Session persistence via AsyncStorage
- Performance optimizations: chat list pagination (300 msg limit), `InteractionManager` deferred state updates, `useCallback` memoization, split OR queries into parallel index seeks
- Chat navigation loading spinner for immediate visual feedback
- Notification badge read fix (no longer auto-marks as read on receipt)
- `notifications` field added to `FilterCountContext` for unread notification badge

### Out of Scope

- Push notifications (requires dev build with `expo-dev-client`)
- Payment processing or in-app transactions
- Admin dashboard or analytics panel
- Full offline mode (basic offline banner exists via `@react-native-community/netinfo`)
- Android Google OAuth in Expo Go (requires dev build)

### Target Users

- **Job Posters** — Anyone hiring: from individuals needing temporary help (cleaning, moving, delivery) to companies seeking permanent employees (software developers, designers, marketers).
- **Job Seekers** — Anyone looking for work: students and part-timers seeking local gigs, or professionals seeking full-time salaried positions.

### Technical Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React Native (Expo SDK 56) |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Language | TypeScript |
| Maps | `react-native-maps` (Apple Maps / Google Maps) |
| Location | `expo-location` |
| Image Picker | `expo-image-picker` |
| Routing | Expo Router (file-based) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Animations | Lottie (`lottie-react-native`) |
| Offline Detection | `@react-native-community/netinfo` |
| Chat | In-app real-time via Supabase Realtime |

### Platform Support

- iOS (primary target)
- Android
- Web (limited via Expo web — tab bar only has home, explore, my jobs, chat, profile)

### Database Migrations

All migrations are in `supabase/migrations/` (`00001`–`00021`). Run manually via the Supabase Dashboard SQL Editor. Key migrations:

- `00001_schema.sql` — Core tables, enums, RLS policies, triggers
- `00005_messages.sql` — Chat messages table + real-time
- `00006_apply.sql` — Job applications with RLS
- `00008_notifications.sql` — Notifications table + real-time
- `00011_saved_jobs.sql` — Saved/bookmarked jobs
- `00012_reviews.sql` — Reviews and ratings
- `00013_category.sql` — Category column on jobs
- `00015_verified.sql` — Verified badge logic + RPC
- `00021_employment_type.sql` — Employment type, salary range/period columns

### Auth Flow

- **Email/password**: Register → verify email → login
- **Google OAuth (iOS)**: `supabase.auth.signInWithOAuth` → `WebBrowser.openAuthSessionAsync` with `redirectTo: 'exp://auth/callback'` — iOS `ASWebAuthenticationSession` intercepts `exp://` callback → parse `access_token`/`refresh_token` from fragment → `setSession`
- **Password reset**: Forgot password → email with `locjobs://reset-password` deep link → reset form

### Storage

Bucket `job-images` is public. Uploads use `expo-file-system/legacy` `uploadAsync` with `BINARY_CONTENT` + `PUT` method + auth Bearer token. Files are namespaced by user ID.
