# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## User Search
- `search-users.tsx` — tapping a user navigates to `/user/{id}/jobs` (dedicated screen showing that user's open/full jobs)
- `user/[id]/jobs.tsx` — shows user avatar/name + FlatList of their jobs, swipe to go back
- `user/[id]/index.tsx` — profile screen now also shows up to 3 of the user's jobs with "See all jobs" link to `user/[id]/jobs`

## Self-Profile Redirect
- Any profile link pointing to the current user's own ID (`id === user?.id`) navigates to `/(tabs)/profile` instead of `/user/{id}`
- Handled at caller level (job detail, chat header, my-jobs applicant list) — no intermediate redirect flash

## Filter Count Badge on Tab Icons
- `src/contexts/FilterCountContext.tsx` — shared context (`FilterCountProvider`) that holds filter counts for `nearby` and `explore` tabs
- `src/components/app-tabs.tsx` — renders `<NativeTabs.Trigger.Badge>` on the nearby and explore triggers, hidden when count is 0
- `src/app/(tabs)/explore.tsx` — uses `useFilterCount().setCount` to update the explore badge count whenever any filter (city, region, work type, category, employment type, min/max price, search) changes
- `src/app/(tabs)/index.tsx` — uses `useFilterCount().setCount` to update the nearby badge count when category or work type filters change
- Provider is wrapped in `src/app/(tabs)/_layout.tsx` above `AppTabs` so both the tab navigator and screen components can access it

## Map & Location
- Map in `index.tsx` uses `react-native-maps` with markers; tapping a marker's callout navigates to `/job/{id}`
- Location is fetched with `Accuracy.High` + 20s timeout for reliable GPS on emulator
- Pull-to-refresh was removed from index.tsx because it interfered with map gestures

## Applicant Section (Job Detail)
- Buttons (Accept/Reject) are placed below the applicant list in a separate section
- Status badges use compact background-filled pills with `flex: 1` layout for even distribution
- Same bordered card style as my-jobs edit/delete buttons

## Verified Badges / UploaderInfo
- Verified badges are fetched in batch from the `users` table (via `uploader_id`) — used across index.tsx, explore.tsx, my-jobs.tsx, and job-detail.tsx
- Stored in a `Map<string, { name: string; verified: boolean }>` state variable per screen

## OAuth / Google Sign-In for Android Dev Builds
- `src/contexts/AuthContext.tsx` — `signInWithGoogle` uses platform-specific redirect URLs:
  - **iOS (Expo Go):** `exp://auth/callback` (stable Expo Go URL)
  - **Android (dev build):** `locjobs://auth/callback` (app's custom scheme)
  - **NEVER use `Linking.createURL()`** for the `redirectTo` — Expo Go adds `/--/` prefix and IP address, breaking the Supabase allowlist match
- On Android, if `WebBrowser.openAuthSessionAsync` doesn't return the redirect URL, a `Linking` event listener fallback captures the OAuth callback
- **Supabase Dashboard > Authentication > Redirect URLs** must include:
  - `exp://auth/callback` (iOS Expo Go)
  - `locjobs://auth/callback` (Android dev build)
  - `exp://*/--/auth/callback` (optional, for Expo Go with `/--/` prefix)
- **Google Cloud Console > OAuth credential > Authorized redirect URIs** must have:
  - `https://<project>.supabase.co/auth/v1/callback` (Supabase callback)
  - `https://auth.expo.io/@<username>/<project-slug>` (Expo proxy, if used)
- **Android SHA-1 fingerprint** from the dev build keystore must be added to the Google Cloud Console OAuth credential (for native Google Sign-In configured in Supabase dashboard)
- The app's custom scheme (`locjobs`) is configured in `app.json` under `"scheme": "locjobs"`

## Display Name on Signup
- `src/app/(auth)/register.tsx` passes `options: { data: { display_name } }` to `supabase.auth.signUp()` so the DB trigger `handle_new_user` inserts the display name into `public.users` immediately, regardless of email confirmation state
- The upsert to `public.users` always runs after signup (even when email confirmation redirects to verify-email screen)

## Salary Fields Removed from Post Job
- `salaryMin`, `salaryMax`, `salaryPeriod` states, validation, submit params, picker, and `SALARY_PERIODS`/`SALARY_PERIOD_LABELS` import removed from `src/app/post.tsx`

## Posted Time Labels
- "Posted X ago" labels (e.g. "Posted 3h ago", "Posted 2d ago") shown on job cards in:
  - `src/app/(tabs)/explore.tsx`
  - `src/app/(tabs)/my-jobs.tsx`
  - `src/app/user/[id]/jobs.tsx`
  - Already present in `index.tsx`, `chat.tsx`, `notifications.tsx`, `review-card.tsx`

## Live Job Updates via Realtime
- `src/app/(tabs)/explore.tsx` — subscribes to `jobs` channel DELETE/UPDATE events so removed jobs disappear without pull-to-refresh
- `src/app/(tabs)/index.tsx` — same DELETE/UPDATE subscription

## Offline Detection (NetworkBanner)
- `src/components/network-banner.tsx` — absolute-positioned banner at top of screen using `@react-native-community/netinfo`
- Shows "You are offline" / "သင်သည် အော့ဖ်လိုင်းဖြစ်နေသည်" (auto-switches with app language)
- Rendered inside `AuthProvider` in `src/app/_layout.tsx` — visible on all authenticated screens
- Animated slide-in/out with `Animated.Value`

## Error + Retry UI
- `src/app/(tabs)/explore.tsx` — `fetchError` state; retry button shown in `ListEmptyComponent` when fetch fails
- `src/app/(tabs)/index.tsx` — `retryKey` counter; same retry pattern in empty state

## FAQ + Contact Us Screen
- `src/app/support.tsx` — collapsible FAQ accordion (press question to reveal answer), Contact Us section with email link + website URL
- Full i18n support: all FAQ Q&A and contact labels translated in `src/lib/i18n/en.ts` and `src/lib/i18n/my.ts` under the `support` key
- Linked from profile settings via "Help & Support" button
- Uses `t('profile.helpSupport')` — translates to "Help & Support" (en) / "အကူအညီနှင့် ပံ့ပိုးကူညီမှု" (my)
