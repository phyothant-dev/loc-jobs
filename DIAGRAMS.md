# LocJobs — Diagrams

All diagrams for the LocJobs app in one file: full app flowchart, ER diagram, class diagram, sequence diagram, use-case diagram, and the database tables.

---

## 1. Full App Flowchart

One flowchart for the whole app. Shape legend:

| Shape | Meaning |
|-------|---------|
| `[ box ]` | Process / action |
| `{ diamond }` | Decision (Yes / No) |
| `( [ stadium ] )` | Start / End |

```mermaid
%%{init: {"flowchart": {"curve": "stepAfter", "nodeSpacing": 60, "rankSpacing": 60}}}%%
flowchart TB
    Start(["Start"]) --> Onb{"Onboarded?"}
    Onb -- No --> Intro["Onboarding +<br/>Language Select"]
    Intro --> Auth{"Logged in?"}
    Onb -- Yes --> Auth
    Auth -- No --> Login["Login / Register"]
    Login --> Auth
    Auth -- Yes --> Tabs["Main Tabs<br/>(Nearby · Explore · My Jobs · Chat · Profile)"]
    Tabs --> Detail["Job Detail"]
    Detail --> Post{"Post or<br/>Apply?"}
    Post -- Post --> PostJob["Post Job<br/>(price · currency · location)"]
    PostJob -->|insert job| DB[("Database<br/>(Supabase/Postgres)")]
    PostJob --> Pending["Application Pending<br/>(notify poster)"]
    Post -- Apply --> Pending
    Pending -->|insert application| DB
    Pending --> Decide{"Accept?"}
    Decide -- No --> Reject["Rejected<br/>(reason sent)"]
    Decide -- Yes --> Chat["Realtime Chat"]
    Chat -->|insert message| DB
    Chat --> Comp{"Marked<br/>Complete?"}
    Comp -- No --> Chat
    Comp -- Yes --> Review["Both Parties Review"]
    Review -->|insert review| DB
    Review --> Badge{"≥ 3 Completed<br/>Jobs?"}
    Badge -- No --> End1(["End"])
    Badge -- Yes --> Verified["Verified Badge<br/>Auto-Granted"]
    Verified -->|update verified| DB
    Verified --> End2(["End"])
    Reject --> End1
```

---

## 2. ER Diagram

```mermaid
erDiagram
    USERS ||--o{ JOBS : "uploads"
    USERS ||--o{ APPLICATIONS : "applies"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ MESSAGES : "receives"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ SAVED_JOBS : "saves"
    USERS ||--o{ REVIEWS : "gives"
    USERS ||--o{ REVIEWS : "receives"
    USERS ||--o{ REPORTS : "files"
    JOBS ||--o{ APPLICATIONS : "has"
    JOBS ||--o{ MESSAGES : "has"
    JOBS ||--o{ SAVED_JOBS : "has"
    JOBS ||--o{ REVIEWS : "has"
    JOBS ||--o{ REPORTS : "has"
    MESSAGES ||--o{ MESSAGES : "replies to"
    USERS {
        uuid id PK
        text display_name
        user_role role
        text phone
        text city
        text region
        text avatar_url
        boolean verified
        text bio
        text cv_url
        text cv_name
        timestamp created_at
        timestamp updated_at
    }
    JOBS {
        uuid id PK
        uuid uploader_id FK
        text title
        text description
        work_type work_type
        job_status status
        numeric price
        text currency
        integer vacancies
        text category
        text employment_type
        numeric salary_min
        numeric salary_max
        text salary_period
        text city
        text region
        numeric lat
        numeric lng
        text image_urls
        boolean deleted
        timestamp created_at
        timestamp updated_at
    }
    APPLICATIONS {
        uuid id PK
        uuid job_id FK
        uuid searcher_id FK
        application_status status
        text message
        text reject_reason
        timestamp created_at
    }
    MESSAGES {
        uuid id PK
        uuid job_id FK
        uuid sender_id FK
        uuid receiver_id FK
        text content
        text image_url
        boolean deleted
        uuid reply_to_id FK
        timestamp read_at
        timestamp created_at
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        text type
        text title
        text body
        jsonb data
        boolean read
        timestamp created_at
    }
    SAVED_JOBS {
        uuid id PK
        uuid user_id FK
        uuid job_id FK
        timestamp created_at
    }
    REVIEWS {
        uuid id PK
        uuid job_id FK
        uuid reviewer_id FK
        uuid reviewee_id FK
        integer rating
        text comment
        timestamp created_at
    }
    REPORTS {
        uuid id PK
        uuid job_id FK
        uuid reporter_id FK
        text reason
        timestamp created_at
    }
```

---

## 3. Class Diagram — Full App Coverage

Covers the whole app: all 8 domain entities, the context providers, the services (Supabase client, currency, i18n), every screen, and the shared components — grouped into namespaces.

```mermaid
classDiagram
    namespace Domain {
        class User {
            +uuid id
            +string display_name
            +user_role role
            +string phone
            +string city
            +string region
            +string avatar_url
            +boolean verified
            +string bio
            +string cv_url
            +string cv_name
        }
        class Job {
            +uuid id
            +uuid uploader_id
            +string title
            +string description
            +work_type work_type
            +job_status status
            +number price
            +string currency
            +number salary_min
            +number salary_max
            +string salary_period
            +string category
            +string employment_type
            +string city
            +string region
            +number lat
            +number lng
            +string[] image_urls
            +number vacancies
            +boolean deleted
        }
        class Application {
            +uuid id
            +uuid job_id
            +uuid searcher_id
            +application_status status
            +string message
            +string reject_reason
        }
        class Message {
            +uuid id
            +uuid job_id
            +uuid sender_id
            +uuid receiver_id
            +string content
            +string image_url
            +uuid reply_to_id
            +datetime read_at
            +boolean deleted
        }
        class Notification {
            +uuid id
            +uuid user_id
            +string type
            +string title
            +string body
            +jsonb data
            +boolean read
        }
        class SavedJob {
            +uuid id
            +uuid user_id
            +uuid job_id
        }
        class Review {
            +uuid id
            +uuid job_id
            +uuid reviewer_id
            +uuid reviewee_id
            +integer rating
            +string comment
        }
        class Report {
            +uuid id
            +uuid job_id
            +uuid reporter_id
            +string reason
        }
    }
    namespace Contexts {
        class AuthProvider {
            -User? user
            +signInWithPassword(email, password)
            +signUp(email, password, display_name)
            +signInWithGoogle()
            +signOut()
        }
        class LocaleProvider {
            -string locale
            +t(key) string
            +setLocale(locale)
        }
        class ThemeProvider {
            -string theme
            +toggleTheme()
        }
        class FilterCountProvider {
            -Map counts
            +setCount(tab, count)
        }
    }
    namespace Services {
        class SupabaseClient {
            -SupabaseClient client
            +from(table) Query
            +rpc(fn, params)
            +channel(name) Channel
            +auth Auth
            +storage Storage
        }
        class Currency {
            +string[] CURRENCIES
            +Map CURRENCY_SYMBOLS
            +formatPrice(amount, currency) string
            +currencyLabel(code) string
        }
        class I18n {
            -Map en
            -Map my
            +t(key, locale) string
        }
    }
    namespace Screens {
        class OnboardingScreen {
            +selectLanguage(locale)
        }
        class LoginScreen {
            +login(email, password)
        }
        class RegisterScreen {
            +register(email, password, display_name)
        }
        class NearbyScreen {
            +loadJobs()
            +setCount(tab, count)
        }
        class ExploreScreen {
            +loadJobs(filters)
            +jobMatchesPriceFilter(job)
            +setCount(tab, count)
        }
        class JobDetailScreen {
            +loadJob(id)
            +apply(message)
            +toggleSave()
            +handleShare()
            +openReviewModal()
            +submitReview(rating, comment)
        }
        class PostJobScreen {
            +submit(params)
            +formatPricePreview()
        }
        class MyJobsScreen {
            +loadJobs()
            +acceptApplication(id)
            +rejectApplication(id, reason)
            +complete(id)
            +submitReview(rating, comment)
        }
        class ChatListScreen {
            +fetchAll()
            +handlePress(conversation)
        }
        class ChatDetailScreen {
            +loadPage()
            +sendMessage(content, replyToId)
            +markRead()
        }
        class NotificationsScreen {
            +load()
            +markRead(id)
        }
        class ProfileScreen {
            +saveProfile()
            +uploadCV(file)
            +signOut()
        }
        class SupportScreen {
            +toggleFaq(index)
        }
        class UserJobsScreen {
            +loadUserJobs(id)
        }
    }
    namespace Components {
        class AppTabs {
            +renderBadge(tab, count)
        }
        class NetworkBanner {
            -boolean isOffline
            +listenNetInfo()
        }
        class ReviewCard {
            +renderReview(review)
        }
        class PickerModal {
            -string[] options
            +onSelect(value)
        }
    }

    User "1" --> "many" Job : uploads
    User "1" --> "many" Application : applies
    Job "1" --> "many" Application : has
    Job "1" --> "many" Message : has
    User "1" --> "many" Message : sends
    User "1" --> "many" Message : receives
    User "1" --> "many" Notification : receives
    User "1" --> "many" SavedJob : saves
    Job "1" --> "many" SavedJob : has
    User "1" --> "many" Review : as reviewer
    User "1" --> "many" Review : as reviewee
    Job "1" --> "many" Review : has
    User "1" --> "many" Report : files
    Job "1" --> "many" Report : has
    Message "0..1" --> "1" Message : reply_to
    AuthProvider "1" --> "1" User : session
    LocaleProvider ..> I18n : t(key)
    FilterCountProvider ..> AppTabs : badges
```

Only the domain and provider relations above are drawn as edges, to keep the lines from overlapping. Cross-cutting wiring (not drawn): all screens read/write through the **SupabaseClient** (REST · RPC · Realtime); **ThemeProvider** supplies theme styles to `AppTabs` and the screens; screens format prices with **Currency** (`formatPrice`); `PostJobScreen`/`ExploreScreen` open **PickerModal**; `JobDetailScreen`/`MyJobsScreen` render **ReviewCard**; **AuthProvider** mounts **NetworkBanner**.

---

## 4. Sequence Diagrams — Full App Flow (per phase)

The RN app is split into its real layers — **screens**, **App Core** (providers · router · i18n) and the **Supabase Client** (REST · RPC · Realtime) — with every screen as its own lifeline. Five phases, one diagram each, so each stays readable.

### 4.1 Phase 1 — Onboarding & Auth

```mermaid
sequenceDiagram
    actor Seeker
    participant OB as Onboarding<br/>(language select)
    participant AU as Auth Screens<br/>(login · register · verify)
    participant APP as App Core<br/>(Providers · Router · i18n)
    participant API as Supabase Client<br/>(REST · RPC · Realtime)
    participant SB as Supabase Backend<br/>(Postgres · triggers · auth)
    participant G as Google OAuth

    Seeker->>OB: launch app (entry)
    OB->>APP: boot _layout
    APP->>APP: ThemeProvider loads theme
    APP->>APP: LocaleProvider reads stored locale (en/my)
    APP->>APP: NetworkBanner subscribes NetInfo (offline detection)
    APP->>APP: AuthProvider.init() → getSession()
    APP->>API: supabase.auth.getSession()
    API->>SB: GET /auth/v1/session
    SB-->>API: session (nil or user)
    API-->>APP: session result
    alt no session
        APP->>OB: show onboarding (language select)
        Seeker->>OB: pick language
        OB->>APP: LocaleProvider.setLocale(locale)
        APP->>OB: t() relabels every screen (en ↔ my)
        Seeker->>AU: open register / login
        AU->>APP: AuthProvider.signUp(email, pass, display_name)
        APP->>API: supabase.auth.signUp({ data: { display_name } })
        API->>SB: POST /auth/v1/signup
        SB->>SB: trigger handle_new_user → insert public.users
        SB-->>API: verify-email / session
        API-->>APP: auth result
        alt email verification pending
            APP->>AU: show verify-email screen
        else Google OAuth
            Seeker->>AU: sign in with Google
            AU->>APP: AuthProvider.signInWithGoogle()
            APP->>API: supabase.auth.signInWithOAuth(google)
            API->>G: WebBrowser.openAuthSessionAsync
            G-->>API: callback (exp:// iOS · locjobs:// Android)
            API-->>APP: Linking listener fallback
            APP->>API: supabase.auth.setSession(session)
            API->>SB: POST /auth/v1/token
            SB-->>API: session user
        end
        APP->>API: upsert user (display_name → public.users)
    else session exists
        APP->>API: getUser()
        API->>SB: GET /auth/v1/user
        SB-->>API: user (role, verified, display_name)
        API-->>APP: user
    end
    APP->>AU: navigate to Main Tab Navigator (5 tabs)
    APP->>API: subscribe realtime (notifications · chat unread)
```

### 4.2 Phase 2 — Posting a Job

```mermaid
sequenceDiagram
    actor Poster
    participant PJ as Post Job Screen
    participant MJ as My Jobs (manage)
    participant APP as App Core<br/>(Providers · Router · i18n)
    participant API as Supabase Client<br/>(REST · RPC · Realtime)
    participant SB as Supabase Backend<br/>(Postgres · triggers · auth)

    Poster->>PJ: open Post Job screen
    PJ->>APP: router.push /post
    Poster->>PJ: fill title, description
    Poster->>PJ: pick category + work type (localized t() labels)
    Poster->>PJ: set price + currency (PickerModal, default MMK)
    PJ->>APP: formatPrice(price, currency) live preview
    Poster->>PJ: set city/region + map pin (lat/lng)
    Poster->>PJ: pick images (image_urls)
    Poster->>PJ: tap submit
    PJ->>APP: PostJobScreen.submit(params)
    APP->>API: rpc post_job(p_currency, price, ...)
    API->>SB: POST /rest/v1/rpc/post_job
    SB-->>API: job row (status: open, vacancies, image_urls)
    API-->>APP: job
    APP->>MJ: show new job in My Jobs (edit / delete)
    APP->>API: subscribe jobs channel (UPDATE/DELETE)
    SB-->>API: realtime event (job created)
    API-->>APP: payload
    APP->>MJ: My Jobs list updates live
```

### 4.3 Phase 3 — Browse, Save, Share, Apply

```mermaid
sequenceDiagram
    actor Seeker
    actor Poster
    participant NT as Nearby Tab<br/>(map + bottom sheet)
    participant EX as Explore Tab<br/>(search + filters)
    participant JD as Job Detail<br/>(/job/[id])
    participant MJ as My Jobs<br/>(applicants)
    participant NF as Notifications
    participant CT as Chat List (tab)
    participant APP as App Core<br/>(Providers · Router · i18n)
    participant API as Supabase Client<br/>(REST · RPC · Realtime)
    participant SB as Supabase Backend<br/>(Postgres · triggers · auth)

    Seeker->>NT: Nearby tab (map + markers)
    NT->>APP: loadJobs (GPS Accuracy.High, 20s timeout)
    APP->>API: query nearby jobs (radius)
    API->>SB: GET /rest/v1/jobs
    SB-->>API: job rows
    APP->>API: batch fetch uploader verified badges
    API->>SB: GET /rest/v1/users?id=in.(...)
    SB-->>API: verified map
    APP->>NT: render markers + cards (formatPrice in job currency)
    Seeker->>NT: tap marker callout
    NT->>JD: router.push /job/{id}
    Seeker->>EX: Explore tab
    EX->>APP: setCount(explore) on every filter change → badge
    EX->>APP: loadJobs(filters: city, region, work type, category, price, currency, search)
    APP->>API: query jobs with filters
    API->>SB: GET /rest/v1/jobs
    SB-->>API: rows
    APP->>EX: render list + FilterCount badge
    Seeker->>JD: tap Save
    JD->>APP: toggle save
    APP->>API: saved_jobs upsert
    API->>SB: POST /rest/v1/saved_jobs
    Seeker->>JD: tap Share
    JD->>APP: handleShare()
    APP->>API: landing page fetch job via REST
    API->>SB: GET (landing Netlify → Supabase REST)
    SB-->>API: title + price/salary in job currency
    APP->>JD: share sheet / deep link locjobs://job/{id}
    Seeker->>JD: tap Apply + message
    JD->>APP: JobDetailScreen.apply()
    APP->>API: insert application (status: pending)
    API->>SB: POST /rest/v1/applications
    SB-->>NF: realtime notification (new application)
    Poster->>NF: tap notification
    NF->>MJ: navigate to My Jobs → applicant list
    Poster->>MJ: open applicant list
    MJ->>APP: load applications for job
    APP->>API: query applications
    API->>SB: GET /rest/v1/applications
    SB-->>API: rows
    Poster->>MJ: Accept / Reject
    MJ->>APP: update application status
    APP->>API: PATCH application
    API->>SB: PATCH /rest/v1/applications
    alt accepted
        SB-->>NF: notification (accepted) → Seeker
        APP->>APP: subscribe chat-messages-{jobId}
        APP->>CT: chat opens (Chat tab)
    else rejected
        API->>SB: PATCH (rejected + reject_reason)
        SB-->>NF: notification (rejected + reason)
    end
```

### 4.4 Phase 4 — Realtime Chat

```mermaid
sequenceDiagram
    actor Seeker
    actor Poster
    participant CT as Chat List (tab)
    participant CD as Chat Detail<br/>(/chat/[jobId])
    participant APP as App Core<br/>(Providers · Router · i18n)
    participant API as Supabase Client<br/>(REST · RPC · Realtime)
    participant SB as Supabase Backend<br/>(Postgres · triggers · auth)

    Seeker->>CT: Chat tab
    CT->>APP: fetchAll (300 most recent)
    APP->>API: query conversations
    API->>SB: GET /rest/v1/messages
    SB-->>API: rows
    APP->>CT: conversations + unread count (badge capped at 9+)
    Seeker->>CT: tap conversation
    CT->>CD: router.push /chat/{jobId}
    CD->>APP: subscribe chat-messages-{jobId}
    CD->>APP: loadPage (latest 30, 2 parallel equality queries)
    APP->>API: GET /rest/v1/messages
    API->>SB: GET /rest/v1/messages
    SB-->>API: 30 messages
    CD->>APP: mark incoming as read
    APP->>API: PATCH read_at
    API->>SB: PATCH /rest/v1/messages
    SB-->>API: ok
    APP->>CD: render bubbles + date separators + "Seen"
    Seeker->>CD: send message (text / image)
    CD->>APP: ChatScreen.sendMessage()
    APP->>API: insert message
    API->>SB: POST /rest/v1/messages
    SB-->>Poster: realtime message event
    API-->>APP: confirmation
    CD->>CD: clear input only on success (sendError → retry)
    Poster->>CD: long-press message → Reply
    CD->>APP: sendMessage(reply_to_id)
    API->>SB: POST /rest/v1/messages (reply_to_id)
    SB-->>Seeker: realtime reply event
    APP->>CD: fetchReplyDetails → reply preview bar
    Seeker->>CD: scroll up → load earlier
    CD->>APP: loadPage(offset)
    APP->>API: GET next 30 (offset)
    API->>SB: GET /rest/v1/messages
    SB-->>API: older messages
    CD->>CD: connection indicator (Reconnecting… on drop)
```

### 4.5 Phase 5 — Complete, Review, Verified Badge

```mermaid
sequenceDiagram
    actor Seeker
    actor Poster
    participant MJ as My Jobs (manage)
    participant JD as Job Detail<br/>(/job/[id])
    participant PR as Profile
    participant APP as App Core<br/>(Providers · Router · i18n)
    participant API as Supabase Client<br/>(REST · RPC · Realtime)
    participant SB as Supabase Backend<br/>(Postgres · triggers · auth)

    Poster->>MJ: mark job complete
    MJ->>APP: complete()
    APP->>API: update jobs.status = completed
    API->>SB: PATCH /rest/v1/jobs
    SB-->>Seeker: notification (job completed)
    Seeker->>JD: open job detail (leave review)
    JD->>APP: openReviewModal()
    Seeker->>JD: rating 1–5 + comment
    JD->>APP: submit review
    APP->>API: insert review
    API->>SB: POST /rest/v1/reviews
    SB-->>API: ok
    Poster->>MJ: open applicants → review seeker
    MJ->>APP: submit review
    APP->>API: insert review
    API->>SB: POST /rest/v1/reviews
    SB-->>API: ok
    Note over SB: trigger: count completed jobs ≥ 3 → verified = true
    SB-->>API: realtime users.update (verified = true)
    API-->>APP: payload
    APP->>PR: show Verified badge (profile header)
    APP->>JD: Verified badge on uploader info
    Seeker->>PR: edit profile / upload CV (cv_url)
    PR->>APP: save profile changes
    APP->>API: update users (cv_url, cv_name, bio)
    API->>SB: PATCH /rest/v1/users
    SB-->>API: ok
    PR->>PR: render updated profile + review summary
```

---

## 5. Use-Case Diagram

Mermaid has no native use-case diagram, so this uses a flowchart with actors `( ( actor ) )` and use-case ellipses `( ( use case ) )` inside the system boundary.

```mermaid
flowchart LR
    subgraph SYSTEM["📱 LocJobs App (system boundary)"]
        direction TB
        subgraph G1["Seeker use cases"]
            U1(("🔍 Browse / search jobs"))
            U2(("📝 Apply for a job"))
            U3(("⭐ Save a job"))
            U4(("💬 Chat with poster"))
            U5(("🗣️ Review poster"))
        end
        subgraph G2["Poster use cases"]
            U6(("📦 Post a job"))
            U7(("📋 Manage applicants"))
            U8(("✅ Accept / reject applications"))
            U9(("🏁 Mark job complete"))
            U10(("🗣️ Review seeker"))
        end
        subgraph G3["Any-user use cases"]
            U11(("🔑 Register / login"))
            U12(("🪪 Manage profile + CV"))
            U13(("🔔 Receive notifications"))
            U14(("🚩 Report a job"))
            U15(("🔗 Share a job"))
        end
    end
    A1(["👤 Seeker"]) --> U1
    A1 --> U2
    A1 --> U3
    A1 --> U4
    A1 --> U5
    A2(["👤 Poster"]) --> U6
    A2 --> U7
    A2 --> U8
    A2 --> U9
    A2 --> U10
    A3(["👤 Any user"]) --> U11
    A3 --> U12
    A3 --> U13
    A3 --> U14
    A3 --> U15
```

---

## 6. Database Tables

Enums: `user_role` (`both`, …), `work_type` (`onsite`, …), `job_status` (`open`, `full`, `completed`, …), `application_status` (`pending`, `accepted`, `rejected`).

### users

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK → auth.users(id) |
| display_name | text | |
| role | user_role | default `both` |
| location | text | |
| city | text | |
| region | text | |
| phone | text | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |
| avatar_url | text | |
| verified | boolean | default false |
| bio | text | |
| deleted_at | timestamptz | |
| cv_url | text | |
| cv_name | text | |

### jobs

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| uploader_id | uuid | FK → users(id) |
| title | text | NOT NULL |
| description | text | |
| work_type | work_type | default `onsite` |
| location | text | |
| address | text | |
| city | text | |
| region | text | |
| status | job_status | default `open` |
| price | numeric | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |
| image_urls | text[] | default `{}` |
| lat | double precision | |
| lng | double precision | |
| vacancies | integer | default 1 |
| category | text | |
| deleted | boolean | default false |
| employment_type | text | |
| salary_min | numeric | |
| salary_max | numeric | |
| salary_period | text | |
| currency | text | NOT NULL default `MMK` |

### applications

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| job_id | uuid | FK → jobs(id) |
| searcher_id | uuid | FK → users(id) |
| created_at | timestamptz | default now() |
| status | application_status | default `pending` |
| message | text | |
| reject_reason | text | |

### messages

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| job_id | uuid | FK → jobs(id) |
| sender_id | uuid | FK → users(id) |
| receiver_id | uuid | FK → users(id) |
| content | text | NOT NULL |
| created_at | timestamptz | default now() |
| image_url | text | |
| edited_at | timestamptz | |
| deleted | boolean | default false |
| reply_to_id | uuid | FK → messages(id) |
| read_at | timestamptz | |

### notifications

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → users(id) |
| type | text | NOT NULL |
| title | text | NOT NULL |
| body | text | NOT NULL |
| data | jsonb | default `{}` |
| read | boolean | default false |
| created_at | timestamptz | default now() |

### saved_jobs

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → users(id) |
| job_id | uuid | FK → jobs(id) |
| created_at | timestamptz | default now() |

### reviews

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| job_id | uuid | FK → jobs(id) |
| reviewer_id | uuid | FK → users(id) |
| reviewee_id | uuid | FK → users(id) |
| rating | integer | CHECK 1–5 |
| comment | text | |
| created_at | timestamptz | default now() |

### reports

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| job_id | uuid | FK → jobs(id) |
| reporter_id | uuid | FK → users(id) |
| reason | text | NOT NULL |
| created_at | timestamptz | default now() |
