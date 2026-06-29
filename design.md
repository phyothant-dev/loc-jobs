# LocJobs Design System

## Brand Palette

| Token        | Hex       | Usage                        |
|-------------|-----------|------------------------------|
| `primary`   | `#FF6B35` | Buttons, active states, links |
| `primaryLight` | `#FFF4ED` | Badge backgrounds, highlights |
| `primaryDark` | `#E55A2B` | Pressed states               |
| `success`   | `#2ECC71` | Open status, confirmations    |
| `successLight` | `#E8F8F0` | Open status badge bg         |
| `warning`   | `#F1C40F` | Accepted / full status       |
| `warningLight` | `#FEF9E7` | Accepted status badge bg     |
| `danger`    | `#E74C3C` | Delete, sign out, cancel     |
| `dangerLight` | `#FDEDEC` | Danger button bg             |
| `white`     | `#FFFFFF` | Cards, inputs, modals        |
| `bg`        | `#FFF8F4` | Screen backgrounds           |
| `border`    | `#F0E4DA` | Card dividers                |
| `borderLight` | `#F8F0EA` | Input borders                |
| `placeholder` | `#C4B5A6` | Input placeholder text       |
| `text`      | `#2D2B2A` | Primary text                 |
| `textSecondary` | `#A09388` | Secondary text, captions   |
| `overlay`   | `rgba(0,0,0,0.35)` | Modal backdrops      |

## Typography

**Font:** Inter (via `@expo-google-fonts/inter`)

| Style       | Size  | Weight   | Usage                        |
|------------|-------|----------|------------------------------|
| `title`    | 34    | 700      | Large hero text              |
| `subtitle` | 22    | 700      | Section headings             |
| `xl`       | 26    | 700      | Screen headers               |
| `md`       | 17    | 700      | Card titles                  |
| `base`     | 15    | 500      | Body text, inputs            |
| `sm`       | 13    | 500/700  | Small text, badges           |
| `caption`  | 11    | 500      | Meta info, labels            |
| `price`    | 16    | 700      | Price/salary display (primary color)|

## Spacing

| Token   | Pixels |
|---------|--------|
| `half`  | 2      |
| `one`   | 4      |
| `two`   | 8      |
| `three` | 12     |
| `four`  | 16     |
| `five`  | 24     |
| `six`   | 32     |
| `seven` | 48     |

## Border Radius

| Token | Pixels | Usage                |
|-------|--------|----------------------|
| `sm`  | 8      | Inputs, pills, badges|
| `md`  | 12     | Buttons              |
| `lg`  | 16     | Cards, modals        |
| `xl`  | 20     | Bottom sheets        |
| `full`| 9999   | Avatars, FABs        |

## Shadows

- **`card`** — Subtle (opacity 0.06, y 2, radius 8) for job cards, info cards, modals
- **`elevated`** — Stronger (opacity 0.1, y 4, radius 12) for buttons, FABs, primary CTAs

## Layout

- **Screen bg:** `#FFF8F4`
- **Card bg:** `#FFFFFF`
- **Screen padding:** `Spacing.four` (16px)
- **Bottom inset:** 50px iOS / 80px Android (tab bar offset)
- **Headers:** Flex row, `justifyContent: space-between`, `alignItems: center`, `paddingVertical: Spacing.four`

## Screens

### Home (`(tabs)/index.tsx`)
- Full-screen map with user location and nearby job markers
- Top bar: white pill with "LocJobs" logo + notification bell with unread badge
- Bottom sheet (25%/55%/90%) lists nearby jobs sorted by distance
- Each card: title, description preview, city/region, distance, time ago, price/salary, directions, save toggle
- Filter bar: work type pills (onsite/remote/hybrid)
- Real-time DELETE/UPDATE subscription — jobs removed/updated instantly without pull-to-refresh
- Error state with retry button when API fetch fails

### All Jobs / Explore (`(tabs)/explore.tsx`)
- Grouped 2-column grid by work type (onsite/remote/hybrid) with color-coded sections
- Search bar, work type dropdown, employment type dropdown, region dropdown, city pill chips
- Category horizontal scroll with multi-select chips
- Price range inputs (min–max MMK)
- Cards: work type bar, category badge, title, location, price or salary range, status badge, save button, vacancies
- Real-time insert/update/delete subscription

### My Jobs (`(tabs)/my-jobs.tsx`)
- Tab bar: Posted / Accepted
- "+" header button to post new jobs
- Posted tab: each card shows title, status, location, work type, price/salary; edit + delete action buttons
- Accepted tab: cards show applicant info; "Mark Complete" button
- Delete shows Alert confirmation; uses soft delete

### Chat (`(tabs)/chat.tsx`)
- FlatList of conversations keyed by `jobId-otherUserId`
- Each row: avatar, other user name, job title, last message preview, time, unread dot indicator
- Real-time subscription to `messages` table — new messages update/prepend the conversation
- Tap to open `chat/[jobId]/[otherUserId].tsx`

### Chat Detail (`chat/[jobId]/[otherUserId].tsx`)
- Message list with real-time subscription, auto-scroll to bottom
- FlatList with inverted render + text input + send button
- Image picker with upload via `expo-file-system/legacy`
- Separator per user, header with back button, other user name/job title

### Profile (`(tabs)/profile.tsx`)
- Avatar (image or initial fallback), email
- Info card: display name, phone, bio, city, region
- Stats row: completed jobs, reviews received, saved jobs
- Language switcher (English / Burmese) — persisted via AsyncStorage
- Dark mode toggle — persisted, no flash on restart
- Help & Support link → FAQ + Contact Us screen
- Edit Profile button, Delete Account (confirmation alert), Sign Out in header
- Uses `react-native-maps` for map-based UI (no PostGIS)

### Edit Profile (`edit-profile.tsx`)
- Avatar with tap-to-change, live local preview
- Form: display name, phone, bio, region picker, city picker
- Region picker filters available cities
- Image uploads with `upsert=true` via `expo-file-system/legacy`
- Field-level validation on all inputs

### Post Job / Edit Job (`post.tsx`)
- Title, description, employment type picker, category picker
- Category picker (29 categories: gig + professional)
- Work type picker dropdown (onsite/remote/hybrid), region/city pickers
- Onsite/hybrid: toggle exact location + "Use My Current Location"
- Vacancies stepper (1–50) with orange +/- buttons, multiple image upload with X-remove overlay
- Submits via `post_job` RPC (new) or direct update (edit mode)
- Field-level validation; success via Toast + auto-navigate back

### Job Detail (`job/[id].tsx`)
- Header: back, share (Netlify landing page URL), edit (uploader), delete (uploader), save toggle
- Title, status badge, work type, vacancies filled count
- Price (gig) or salary range (permanent) display
- Image carousel (horizontal scroll, full-width)
- Description card, location card (address + directions button), uploader info card
- Accept button (open jobs), Mark Complete (accepted/uploader), Cancel
- Chat with Poster button, Report button (flag)
- Reviews section: existing reviews + write review modal
- Verified badge on uploader info if applicable
- Share uses web URL (Netlify) that tries deep link first, app card fallback

### Auth Screens (`login.tsx`, `register.tsx`)
- Centered layout with app name + form card
- Email + password inputs, primary button
- Field-level validation on all inputs
- Link to toggle between sign in / sign up
- Google sign in button (iOS: ASWebAuthenticationSession; Android: `Linking.openURL` + event listener)
- Forgot password link → reset flow with deep link
- Verify email reminder on signup
- Display name passed via `options.data` on signup for immediate DB insert

### Notifications (`notifications.tsx`)
- FlatList of notifications with real-time subscription
- Each row: type icon, message, time, read/unread state
- Tap routes: `new_message` → chat conversation, other types → job detail
- Header: Mark All Read button

### Other Screens
- **User Profile** (`user/[id].tsx`) — Public profile with avatar, bio, contact info, rating
- **Forgot Password** (`(auth)/forgot-password.tsx`) — Email input, sends reset via `locjobs://reset-password`
- **Reset Password** (`(auth)/reset-password.tsx`) — New password confirmation form
- **Verify Email** (`(auth)/verify-email.tsx`) — Post-signup confirmation screen
- **Onboarding** (`onboarding.tsx`) — Splash with Lottie animation + Get Started button
- **FAQ / Support** (`support.tsx`) — Collapsible FAQ accordion with 8 questions, Contact Us section with email/website, full i18n (en + my)
- **Network Banner** (`components/network-banner.tsx`) — Absolute-positioned slide-in banner when offline, uses `@react-native-community/netinfo`, i18n support, safe area aware
