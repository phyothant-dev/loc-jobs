# LocJobs — Full App Flow (Markdown)

A complete end-to-end walkthrough of the app, written in plain Markdown (no diagrams). Read it top-to-bottom as a single user journey, with branch points spelled out.

---

## 0. End-to-End Overview

```
Launch → Onboarding → Auth → Tab Navigator
                                   │
     ┌──────────────┬──────────────┼──────────────┬──────────────┐
   Nearby         Explore       My Jobs       Chat          Profile
   (browse)       (browse)      (post/manage) (messages)    (account)
      │              │                              │              │
      └──────┬───────┘                              │              │
        Job Detail (/job/[id])                       │              │
             │                                       │              │
   ┌─────────┼───────────────┬───────────────┐       │              │
 Save       Share         Apply (seeker)  Manage (poster)          │
   │          │               │               │                     │
   │          │          pending appl.   applicants list            │
   │          │               │               │                     │
   │          │          accept/reject    accept/reject             │
   │          │               │               │                     │
   │          │            Chat opens ◄────────┘                    │
   │          │               │                                     │
   │          │         job completed → reviews → verified badge    │
   │          │                                                     │
   └─ landing page → download app / deep link back to job ──────────┘
```

---

## 1. Launch & Auth

| Step | Action | Detail |
|------|--------|--------|
| 1.1 | **App Launch** | Splash screen; load fonts (Expo), theme, and locale (`LocaleProvider` EN + MY). |
| 1.2 | **Onboarding check** | Read onboarding-complete flag from `AsyncStorage`. |
| 1.3 | **Onboarding** | If not complete → show onboarding screens (language select). On "Done", mark complete. |
| 1.4 | **Session restore** | `AuthProvider` restores session via `supabase.auth`. |
| 1.5 | **Decision** | **No session?** → Login screen. **Session?** → Main Tab Navigator (skip auth). |

### 1.1 Auth options (no session)

| Option | Flow |
|--------|------|
| **Email/Password login** | `signInWithPassword` → back to session restore. |
| **Register** | `signUp` with `options.data.display_name` (so display name persists through email verification) → verify-email screen → login. |
| **Forgot password** | Email recovery link → `reset-password` screen on `PASSWORD_RECOVERY` event. |
| **Google OAuth** | `signInWithOAuth` — iOS uses `exp://auth/callback`, Android dev build uses `locjobs://auth/callback`; callback captures tokens → session restore. |

---

## 2. Main Tab Navigator (5 tabs)

`FilterCountProvider` wraps the tab navigator and powers unread badges on Nearby, Explore, and Chat tabs.

| Tab | Screen | Purpose |
|-----|--------|---------|
| **Nearby** | `(tabs)/index.tsx` | Map + job list around current location |
| **Explore** | `(tabs)/explore.tsx` | Full-filtered job search |
| **My Jobs** | `(tabs)/my-jobs.tsx` | Jobs I posted + jobs I've been accepted into |
| **Chat** | `(tabs)/chat.tsx` | Conversation list with unread badge (capped at "9+") |
| **Profile** | `(tabs)/profile.tsx` | My account, stats, settings |

---

## 3. Browsing (Nearby & Explore)

### 3.1 Nearby tab

1. Request location (`Accuracy.High`, 20s timeout).
2. Show `MapView` with job markers + a resizable bottom sheet (25%–90%) listing jobs.
3. Filter chips for **category** and **work type** (updates the tab badge via `FilterCountContext`).
4. Tapping a marker callout or a list card → **Job Detail**.
5. Realtime subscription to `jobs` channel DELETE/UPDATE keeps the list current.
6. On fetch error → retry button in the empty state.

### 3.2 Explore tab

1. Full search bar + filter panel:
   - Search text
   - Work type (all / gig / professional)
   - Employment type (`employmentTypes.*` — full-time, part-time, freelance, contract, internship, seasonal)
   - Region + City (localized pickers, ~15 regions, ~290 cities)
   - Category (26+ localized categories)
   - **Price range (min–max) + currency picker** (10 currencies; selecting a currency alone filters to that currency, `currencyFilterActive`)
2. Price filter matching:
   - `job.price` within [min, max] **OR**
   - `salary_min` / `salary_max` endpoint within [min, max] **OR**
   - salary interval overlaps [min, max]
3. Active filters update the Explore tab badge; saved searches persist (incl. currency).
4. Cards show title, location, price/salary, work type, posted-time label ("Posted 3h ago").
5. Tap card → **Job Detail**. Realtime DELETE/UPDATE subscription keeps results fresh.

---

## 4. Job Detail (`/job/[id]`)

| Section | Content |
|---------|---------|
| Info | Title, category, work type, employment type, region/city, **price + salary range formatted in the job's currency** (e.g. `100,000 Ks` or `500 $`), description |
| Photos | Carousel of job images |
| Uploader | Uploader card: avatar/name, verified badge, rating, CV access |
| Applicants | (poster view) applicant list with Accept/Reject buttons below |

### Decisions from Job Detail

| Branch | Action |
|--------|--------|
| **Save?** | Heart/bookmark toggles `saved_jobs` insert/delete. |
| **Share?** | Builds Netlify link `https://locjobs-landing.netlify.app/?id={jobId}` → landing page (see §10). |
| **Applicant?** | → Apply flow (see §5). |
| **Uploader?** | → Manage flow / My Jobs (see §6). |

---

## 5. Apply Flow (Seeker)

```
Apply modal + message
        │
        ▼
application: pending  ──►  notification to poster
        │
        ▼
   poster decision
     /        \
  accept       reject
   │            │
   │        reason + notification
   ▼
accepted + chat channel opens
   │
   ▼
uploader marks complete?
   │  No → job stays open, continue chatting
   ▼  Yes → job completed (see §8)
```

- Application row is `pending` until the poster accepts or rejects (with a reject reason).
- Acceptance notifies the seeker and opens the chat channel (`chat-messages-{jobId}`).

---

## 6. Post & Manage Flow (Poster)

### 6.1 Post a job

1. Tap the Post action (modal) from anywhere.
2. Fill the form:
   - Title, description
   - Work type, category, employment type
   - Region / city / location
   - **Currency picker + price** (multi-currency: MMK, USD, EUR, GBP, SGD, THB, JPY, KRW, CNY, INR)
   - Vacancies, photos
3. Validate → `post_job` RPC with `p_currency` → job status `open`.
4. Job appears in Nearby + Explore immediately.

### 6.2 Manage from My Jobs

```
My Jobs dashboard (Posted / Accepted tabs)
        │
   Edit / Delete?
   /        \
Edit       Delete          Applicants
  │          │                 │
  │      soft delete          list
  ▼          ▼                 │
form      job removed      accept / reject
prefilled  from listings    each applicant
(currency                   (→ apply flow)
changeable)
```

- Accepted jobs also appear here (Accepted tab) and can be marked **completed** by the uploader.

---

## 7. Real-time Chat

1. **Chat tab** → conversation list (last 300 messages), unread count → badge.
2. Open conversation → **Chat detail** (`/chat/[jobId]/[otherUserId]`):
   - Load last 30 messages, subscribe to `chat-messages-{jobId}` channel.
   - Real-time INSERT/UPDATE events append messages; date separators (Today/Yesterday).
3. Send text or image; **reply** to a message (long-press → Reply); **read receipts** ("Seen"); "Reconnecting…" indicator when the channel drops.
4. Load earlier pages (30 at a time) when scrolling up.
5. Messages are marked read when the chat opens; tapping a conversation updates the unread badge.

---

## 8. Completion, Reviews & Verified Badge

```
job status: completed
        │
        ▼
both parties review each other
(rating + comment)
        │
        ▼
completed ≥ 3 jobs?
    /         \
  Yes          No
   │            │
   ▼            ▼
verified     (no badge)
badge
auto-granted
```

- Reviews are only meaningful on **completed** jobs.
- After 3 completed jobs, the verified badge is auto-granted and shows on the uploader card and profile.

---

## 9. Profile & Settings

| Action | Flow |
|--------|------|
| **View profile** | Avatar (image or initials), name, phone, email, city/region (localized), rating, CV, own jobs preview. |
| **Edit profile** | Change avatar, bio, phone, **region/city pickers (localized options + reverse lookup)**. |
| **CV upload** | PDF-only via `expo-document-picker` → storage `cvs/{userId}/cv.pdf` → save `cv_url` + `cv_name`. Visible on own profile, public profiles, and applicant list ("View CV" opens the PDF). |
| **Settings** | Language EN/MY (relabels whole UI instantly), dark mode, Help & Support (FAQ accordion + Contact Us), onboarding replay. |
| **Notifications** | Bell with real-time unread count; marked read only on tap. |
| **Delete account** | Confirmation → `delete_user_account` RPC → sign out. |
| **Reports** | Flag inappropriate jobs → admin handling. |

---

## 10. Sharing & Landing Page

```
share job → https://locjobs-landing.netlify.app/?id={jobId}
                     │
                     ▼
        landing/index.html fetches job via Supabase REST
                     │
                     ▼
        renders card: title · price/salary in job currency
                     · photos · uploader
                     │
              user has app?
              /          \
            Yes           No
             │             │
             ▼             ▼
   locjobs://job/{id}   Download App
   deep link → job detail   (Expo build)
```

---

## 11. Cross-cutting Flows

| Concern | Flow |
|---------|------|
| **Realtime sync** | Jobs channel (DELETE/UPDATE) keeps lists fresh; chat channel streams messages; notifications channel updates badge counts. |
| **i18n** | `LocaleProvider` + `t()` everywhere. DB stores English enum values; screens translate at display time; pickers reverse-lookup to save English keys. `en.ts` and `my.ts` MUST keep identical keys (typecheck enforces it). |
| **Offline** | `NetworkBanner` (netinfo) slides in over any authenticated screen when the connection drops; auto-translated. |
| **Unread badges** | `FilterCountContext` (stable `setCount`) tracks Nearby, Explore, Chat, and Notifications counts; badge hidden when 0. |
| **Deep links** | `locjobs://` scheme configured in `app.json`; landing page deep links back into a specific job. |
