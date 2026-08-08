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

## 3. Class Diagram

A medium-size diagram covering the app: the 8 domain entities, the 4 context providers, the key services, and the main screens — grouped into namespaces.

```mermaid
classDiagram
    namespace Domain {
        class User {
            +uuid id
            +string display_name
            +user_role role
            +string city
            +string region
            +boolean verified
            +string cv_url
        }
        class Job {
            +uuid id
            +uuid uploader_id
            +string title
            +work_type work_type
            +job_status status
            +number price
            +string currency
            +number salary_min
            +number salary_max
            +string category
            +string city
            +string region
            +number lat
            +number lng
            +string[] image_urls
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
            +uuid reply_to_id
            +datetime read_at
        }
        class Notification {
            +uuid id
            +uuid user_id
            +string type
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
            +from(table) Query
            +rpc(fn, params)
            +channel(name) Channel
        }
        class Currency {
            +formatPrice(amount, currency) string
            +currencyLabel(code) string
        }
    }
    namespace Screens {
        class NearbyScreen {
            +loadJobs()
        }
        class ExploreScreen {
            +loadJobs(filters)
        }
        class JobDetailScreen {
            +apply(message)
            +handleShare()
            +submitReview(rating, comment)
        }
        class PostJobScreen {
            +submit(params)
        }
        class MyJobsScreen {
            +acceptApplication(id)
            +rejectApplication(id, reason)
            +complete(id)
        }
        class ChatScreen {
            +loadPage()
            +sendMessage(content, replyToId)
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
    User "1" --> "many" Review : reviews
    Job "1" --> "many" Review : has
    User "1" --> "many" Report : files
    Job "1" --> "many" Report : has
    Message "0..1" --> "1" Message : reply_to
    AuthProvider "1" --> "1" User : session
    LocaleProvider ..> AuthProvider : t() labels
    FilterCountProvider ..> NearbyScreen : count
    FilterCountProvider ..> ExploreScreen : count
    PostJobScreen --> Currency : formatPrice
    JobDetailScreen --> Currency : formatPrice
```

Cross-cutting wiring (not drawn, to keep lines from overlapping): all screens read/write through the **SupabaseClient** (REST · RPC · Realtime); **ThemeProvider** supplies theme styles to the screens; **AuthProvider** mounts **NetworkBanner**; `JobDetailScreen`/`MyJobsScreen` render **ReviewCard**; `PostJobScreen`/`ExploreScreen` open **PickerModal**.

---

## 4. Sequence Diagram

One diagram covers the whole frontend app flow in order: onboarding & auth → post a job → browse / save / share → apply → accept / reject → chat → complete → review → verified badge. Every screen is its own lifeline; all interactions stay inside the React Native app — no Supabase shown.

```mermaid
sequenceDiagram
    actor Seeker
    actor Poster
    participant OB as Onboarding
    participant AU as Auth Screens<br/>(login · register · OAuth)
    participant TB as Main Tabs<br/>(Nearby · Explore)
    participant JD as Job Detail
    participant PJ as Post Job
    participant MJ as My Jobs
    participant CH as Chat
    participant PF as Profile
    participant CO as App Core<br/>(Providers · Router · State)

    Seeker->>OB: launch app
    OB->>CO: setLocale(locale) → relabel screens
    OB->>AU: open login / register
    Seeker->>AU: login / register (or Google OAuth)
    AU->>CO: save session (role, verified)
    CO-->>TB: navigate to Main Tabs

    Poster->>PJ: fill title, category, price + currency, map pin, images
    PJ->>CO: submit job
    CO-->>MJ: job added (edit / delete)

    Seeker->>TB: browse Nearby (map markers) / Explore (filters)
    TB->>CO: apply filters → tab badge
    TB->>JD: open job detail
    Seeker->>JD: Save / Share
    Seeker->>JD: Apply + message
    JD->>CO: application → pending

    Poster->>MJ: open applicant list
    Poster->>MJ: Accept / Reject (reason)
    MJ->>CO: update application status
    alt accepted
        MJ->>CH: open chat
    else rejected
        MJ->>MJ: show rejection + reason
    end

    Seeker->>CH: open conversation
    CH->>CO: load recent messages (local cache)
    Seeker->>CH: send message / reply
    CH->>CO: append + render bubble + seen
    Poster->>MJ: mark job complete
    MJ->>CO: job status → completed
    Seeker->>JD: submit review (rating + comment)
    JD->>CO: save review
    Poster->>MJ: review seeker
    MJ->>CO: save review
    CO->>CO: verified after 3 completed jobs
    CO-->>PF: show Verified badge
    Seeker->>PF: edit profile / upload CV
    PF->>CO: update profile
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
            U3(("💬 Chat with poster"))
            U4(("🗣️ Review poster"))
        end
        subgraph G2["Poster use cases"]
            U5(("📦 Post a job"))
            U6(("📋 Manage applicants"))
            U7(("✅ Accept / reject applications"))
            U8(("🏁 Mark job complete"))
        end
        subgraph G3["Any-user use cases"]
            U9(("🔑 Register / login"))
            U10(("🪪 Manage profile + CV"))
        end
    end
    A1(["👤 Seeker"]) --> U1
    A1 --> U2
    A1 --> U3
    A1 --> U4
    A2(["👤 Poster"]) --> U5
    A2 --> U6
    A2 --> U7
    A2 --> U8
    A3(["👤 Any user"]) --> U9
    A3 --> U10
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
