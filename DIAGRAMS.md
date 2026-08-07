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
flowchart TB
    Start(["App Launch<br/>splash · fonts · theme"]) --> Onb{"Onboarding complete?"}
    Onb -- No --> Intro["Onboarding screens<br/>language select"]
    Intro -- Done --> LoadS["AuthProvider loads session"]
    Onb -- Yes --> LoadS
    LoadS --> Sess{"Session exists?"}
    Sess -- No --> Auth["Login / Register /<br/>Forgot · Google OAuth"]
    Auth -- success --> LoadS
    Sess -- Yes --> Tabs["Main Tab Navigator<br/>(5 tabs)"]
    Tabs --> N["Nearby"]
    Tabs --> E["Explore"]
    Tabs --> M["My Jobs"]
    Tabs --> C["Chat"]
    Tabs --> P["Profile"]
    N --> N2["Map + bottom sheet<br/>radius + chips"]
    E --> E2["Search + filters<br/>price · currency · region/city"]
    N2 --> JD["JOB DETAIL<br/>/job/[id]"]
    E2 --> JD
    JD --> S1{"Save?"}
    S1 -- Yes --> SV["saved_jobs toggle"]
    SV --> JD
    JD --> S2{"Share?"}
    S2 -- Yes --> LP["Landing page<br/>(Netlify, fetch via REST)"]
    LP --> LP2["Render card<br/>title · price/salary in job currency"]
    LP2 --> LP3{"User has app?"}
    LP3 -- Yes --> DL["Deep link locjobs://job/{id}"] --> JD
    LP3 -- No --> DW["Download app<br/>(Expo build)"]
    JD --> S3{"Applicant?"}
    S3 -- Yes --> AM["Apply modal + message"]
    AM --> PD["application: pending<br/>notify poster"]
    JD --> S4{"Uploader?"}
    S4 -- Yes --> MG["Manage (My Jobs)"]
    M --> MG
    PD --> DC{"Poster decision"}
    MG --> DC
    DC -- Accept --> AC["accepted + chat opens"]
    DC -- Reject --> RJ["rejected + reason<br/>notify seeker"]
    AC --> CH["Chat detail<br/>(load 30 · send · reply · read)"]
    C --> CH
    CH --> CP{"Uploader marks<br/>complete?"}
    CP -- Yes --> CO["job: completed"]
    CO --> RV["both review each other<br/>(rating + comment)"]
    RV --> VB{"≥ 3 completed<br/>jobs?"}
    VB -- Yes --> VBD["Verified badge<br/>auto-granted"]
    VB -- No --> END(["App keeps running —<br/>realtime updates"])
    VBD --> END
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

## 3. Class Diagram (Frontend + Domain)

```mermaid
classDiagram
    class Job {
        +string id
        +string uploader_id
        +string title
        +string description
        +string work_type
        +string status
        +number price
        +string currency
        +number salary_min
        +number salary_max
        +string salary_period
        +string category
        +string city
        +string region
        +number lat
        +number lng
        +string[] image_urls
        +number vacancies
        +boolean deleted
    }
    class User {
        +string id
        +string display_name
        +string role
        +string phone
        +string city
        +string region
        +string avatar_url
        +boolean verified
        +string bio
        +string cv_url
        +string cv_name
    }
    class Application {
        +string id
        +string job_id
        +string searcher_id
        +string status
        +string message
        +string reject_reason
    }
    class Message {
        +string id
        +string job_id
        +string sender_id
        +string receiver_id
        +string content
        +string image_url
        +string reply_to_id
        +datetime read_at
    }
    class Review {
        +string id
        +string job_id
        +string reviewer_id
        +string reviewee_id
        +number rating
        +string comment
    }
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
    class NearbyScreen {
        +loadJobs()
        +setCount(tab, count)
    }
    class ExploreScreen {
        +loadJobs(filters)
        +jobMatchesPriceFilter(job)
    }
    class JobDetailScreen {
        +openReviewModal()
        +handleShare()
    }
    class PostJobScreen {
        +submit(params)
    }
    class ChatScreen {
        +loadPage()
        +sendMessage()
    }
    Job --> User : uploader
    Application --> Job
    Application --> User
    Message --> Job
    Review --> Job
    AuthProvider --> User
    LocaleProvider ..> AuthProvider : labels UI
    FilterCountProvider ..> NearbyScreen
    FilterCountProvider ..> ExploreScreen
    JobDetailScreen --> PostJobScreen : manage
    ChatScreen --> Job
```

---

## 4. Sequence Diagram — Full App Flow

The full app lifecycle in five phases: onboarding/auth, posting, browsing/applying, realtime chat, and completion/reviews/badge.

```mermaid
sequenceDiagram
    actor Seeker
    actor Poster
    participant App as RN App
    participant SB as Supabase
    participant G as Google OAuth

    rect rgb(235,240,250)
    Note over Seeker,App: Phase 1 — Onboarding & Auth
    Seeker->>App: launch app
    App->>App: load fonts + theme, show splash
    App->>App: onboarding screens (language select)
    App->>SB: supabase.auth.getSession()
    alt no session
        Seeker->>App: register / login (email or Google)
        App->>G: signInWithOAuth (Google)
        G-->>App: callback (exp:// or locjobs:// scheme)
        App->>SB: supabase.auth.setSession(session)
        SB->>SB: trigger handle_new_user → insert into users
        SB-->>App: user (role, display_name, verified)
    else session exists
        App->>SB: getUser()
        SB-->>App: session user
    end
    end

    rect rgb(235,245,235)
    Note over Poster,App: Phase 2 — Posting a Job
    Poster->>App: open Post Job form
    Poster->>App: fill title, description, category, work_type
    Poster->>App: set price + currency (picker, default MMK)
    Poster->>App: set city/region + map pin (lat/lng)
    App->>App: validate + formatPrice() live preview
    App->>SB: rpc post_job(p_currency, price, ...)
    SB-->>Poster: job row (status: open, vacancies, image_urls)
    SB-->>Poster: realtime event on jobs channel
    end

    rect rgb(250,245,235)
    Note over Seeker,App: Phase 3 — Browse, Save, Share, Apply
    Seeker->>App: open Nearby / Explore
    App->>SB: query jobs (filters: radius, category, price range, currency)
    App->>SB: batch fetch uploader verified badges
    SB-->>App: job list (price formatted in job currency)
    Seeker->>App: tap Save toggle
    App->>SB: saved_jobs upsert
    Seeker->>App: tap Share
    App->>SB: landing page fetches job via REST
    SB-->>App: title + price/salary in job currency
    App->>App: deep link locjobs://job/{id} or App Store
    Seeker->>App: open job detail, tap Apply + message
    App->>SB: insert application (status: pending)
    SB-->>Poster: realtime notification (new application)
    Poster->>App: open applicants (My Jobs)
    App->>SB: update application status
    alt accepted
        SB-->>Seeker: notification (application accepted)
        SB-->>App: chat channel opens (chat-messages-{jobId})
    else rejected
        SB-->>Seeker: notification (rejected + reject_reason)
    end
    end

    rect rgb(240,240,250)
    Note over Seeker,Poster: Phase 4 — Realtime Chat
    Seeker->>App: open chat detail
    App->>SB: subscribe chat-messages-{jobId}
    App->>SB: load latest 30 messages
    App->>SB: mark unread as read (read_at)
    SB-->>App: messages (Seen shown on read items)
    Seeker->>App: send message (text or image)
    App->>SB: insert message
    SB-->>Poster: realtime message event
    Poster->>App: long-press message → Reply
    App->>SB: insert reply (reply_to_id)
    SB-->>Seeker: realtime reply event
    Seeker->>App: scroll up (load earlier)
    App->>SB: paginated query (next 30, offset)
    SB-->>App: older messages
    end

    rect rgb(250,240,240)
    Note over Poster,SB: Phase 5 — Complete, Review, Verified Badge
    Poster->>App: mark job complete
    App->>SB: update jobs.status = completed
    SB-->>Seeker: notification (job completed)
    Seeker->>App: submit review (rating 1–5 + comment)
    Poster->>App: submit review
    App->>SB: insert reviews (both sides)
    Note over SB: trigger checks: count completed jobs ≥ 3
    SB-->>App: realtime users.update (verified = true)
    App->>App: show Verified badge in profile + cards
    end
```

---

## 5. Use-Case Diagram

Mermaid has no native use-case diagram, so this uses a flowchart with actors `( ( actor ) )` and use-case ellipses `( ( use case ) )` inside the system boundary.

```mermaid
flowchart LR
    A1(["👤 Seeker"]) --> U1(("🔍 Browse / search jobs"))
    A1 --> U2(("📝 Apply for a job"))
    A1 --> U3(("⭐ Save a job"))
    A1 --> U4(("💬 Chat with poster"))
    A1 --> U5(("🗣️ Review poster"))
    A2(["👤 Poster"]) --> U6(("📦 Post a job"))
    A2 --> U7(("📋 Manage applicants"))
    A2 --> U8(("✅ Accept / reject applications"))
    A2 --> U9(("🏁 Mark job complete"))
    A2 --> U10(("🗣️ Review seeker"))
    A3(["👤 Any user"]) --> U11(("🔑 Register / login"))
    A3 --> U12(("🪪 Manage profile + CV"))
    A3 --> U13(("🔔 Receive notifications"))
    A3 --> U14(("🚩 Report a job"))
    A3 --> U15(("🔗 Share a job"))

    subgraph SYSTEM["📱 LocJobs App (system boundary)"]
        U1
        U2
        U3
        U4
        U5
        U6
        U7
        U8
        U9
        U10
        U11
        U12
        U13
        U14
        U15
    end
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
