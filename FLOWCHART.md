# LocJobs — Flowcharts

System and user-flow diagrams for the LocJobs app.

## 1. App Architecture Overview

```mermaid
flowchart TB
    subgraph Client["React Native App (Expo SDK 56)"]
        Root["Root Layout<br/>(_layout.tsx)"]
        subgraph Providers["Providers"]
            Theme["ThemeProvider"]
            Locale["LocaleProvider<br/>(EN + MY)"]
            Auth["AuthProvider<br/>(supabase.auth)"]
        end
        subgraph Screens["Screens"]
            Onboard["Onboarding"]
            AuthScreens["Auth Screens<br/>Login / Register / Verify / Reset"]
            Tabs["Tab Navigator (5 tabs)"]
            Post["Post Job (modal)"]
            JobDetail["Job Detail /job/[id]"]
            ChatDetail["Chat Detail<br/>/chat/[jobId]/[otherUserId]"]
            Other["Edit Profile · Notifications<br/>Reviews · Search Users<br/>User Profile · Support"]
        end
    end

    subgraph Backend["Supabase"]
        DB[("PostgreSQL<br/>26 migrations")]
        AuthSvc["Auth Service<br/>Email/Password + Google OAuth"]
        Realtime["Realtime<br/>(jobs, chat, notifications)"]
        Storage["Storage<br/>(job images, avatars, chat images)"]
        RPC["RPC Functions<br/>nearby_jobs, delete_user_account"]
    end

    subgraph External["External"]
        Maps["react-native-maps<br/>Markers + Directions"]
        OAuth["Google OAuth"]
        Web["Landing Page<br/>landing/job.html"]
    end

    Root --> Providers
    Auth -->|session check| Screens
    Screens --> DB
    Screens --> AuthSvc
    Screens --> Realtime
    Screens --> Storage
    Screens --> RPC
    Screens --> Maps
    AuthSvc <--> OAuth
    Web -->|deep link locjobs://| JobDetail
```

## 2. Launch, Onboarding & Auth Flow

```mermaid
flowchart TD
    A["App Launch<br/>Splash Screen"] --> B{"Fonts loaded &<br/>onboarding status read?"}
    B -- "No" --> B
    B -- "Yes" --> C{"Onboarding complete?<br/>(AsyncStorage)"}
    C -- "No" --> D["Onboarding Screen"]
    D -- "Done" --> E["AuthProvider loads session"]
    C -- "Yes" --> E
    E --> F{"Session exists?"}
    F -- "No" --> G["Login"]
    G --> H{"Auth method"}
    H -- "Email/Password" --> I["supabase.auth.signInWithPassword"]
    H -- "Register" --> J["signUp with display_name<br/>options.data"]
    H -- "Forgot password" --> K["Email recovery link"]
    H -- "Google OAuth" --> L["signInWithOAuth<br/>iOS: exp:// · Android: locjobs://"]
    J --> M["Verify email screen"]
    M --> I
    K --> N["reset-password screen<br/>(PASSWORD_RECOVERY event)"]
    I --> E
    L --> O["Callback captures tokens"]
    O --> E
    F -- "Yes" --> P["Main Tab Navigator"]
```

## 3. Main Tabs Structure

```mermaid
flowchart LR
    Tabs["Tab Navigator<br/>(NativeTabs + FilterCountProvider)"]

    Tabs --> Nearby["Nearby<br/>(index.tsx)"]
    Tabs --> Explore["Explore"]
    Tabs --> MyJobs["My Jobs"]
    Tabs --> Chat["Chat"]
    Tabs --> Profile["Profile"]

    Nearby --> NearbyMap["MapView<br/>+ markers + bottom sheet"]
    Nearby --> NearbyList["Job list 25%–90%<br/>radius + filter chips"]
    Explore --> ExploreList["Job list<br/>full filter + search"]
    MyJobs --> MyJobsList["Posted jobs<br/>edit / delete / applicants"]
    Chat --> ChatList["Conversations<br/>unread badge"]
    Profile --> ProfileCards["Profile card, stats,<br/>accordions, settings"]
```

## 4. Job Lifecycle — Seeker & Poster

```mermaid
flowchart TD
    P1["Poster creates job<br/>(gig price or salary)"] --> P2["Job status: open"]
    P2 --> P3["Job appears in<br/>Nearby + Explore"]

    S1["Seeker sees job"] --> S2{"Interested?"}
    S2 -- "No" --> S3["Continue browsing"]
    S2 -- "Yes, save" --> S4["saved_jobs insert<br/>(heart toggle)"]
    S2 -- "Yes, apply" --> S5["Apply modal with message"]
    S5 --> S6["application status: pending<br/>+ notification to poster"]

    P3 --> P7["Poster sees applicants"]
    P7 --> P8{"Vacancies?"}
    P8 -- "Accept" --> P9["application: accepted<br/>notification + chat channel"]
    P8 -- "Reject" --> P10["application: rejected<br/>+ reject_reason"]
    P9 --> P11{"All vacancies filled?"}
    P11 -- "Yes" --> P12["job status: full"]
    P11 -- "No" --> P7

    P9 --> C1["Chat between poster & seeker<br/>(chat-messages-{jobId})"]
    P12 --> P13["Poster marks job completed"]
    P13 --> P14["job status: completed"]
    P14 --> P15["Both can review each other<br/>(reviews table)"]
    P14 --> P16{"Completed ≥ 3 jobs?"}
    P16 -- "Yes" --> P17["Verified badge auto-granted"]
```

## 5. Real-time Chat Flow

```mermaid
flowchart TD
    A["Open conversation"] --> B["Fetch last 30 messages"]
    B --> C["Subscribe to channel<br/>chat-messages-{jobId}"]
    C --> D["Real-time INSERT/UPDATE events"]
    D --> E["Append message to list<br/>+ mark read_at"]
    A --> F{"Need older messages?"}
    F -- "Yes" --> G["Load earlier page (30)"]
    F -- "No" --> H["Send message<br/>(images, reply_to)"]
    H --> I["Insert into DB"]
    I --> J["Update conversation list<br/>(deferred via InteractionManager)"]
    J --> K["Update unread badge<br/>(FilterCountContext)"]
```

## 6. CV / Resume Upload & Viewing

```mermaid
flowchart TD
    U["User opens Edit Profile"] --> P["Tap Upload CV<br/>(expo-document-picker, .pdf only)"]
    P --> V{"File valid?"}
    V -- "No" --> P
    V -- "Yes" --> Up["Upload PDF to storage<br/>bucket: cvs/{userId}/cv.pdf"]
    Up --> Save["Save cv_url + cv_name<br/>on users row"]
    Save --> Pub["CV visible on:<br/>own profile · public profile<br/>· applicant list (View CV button)"]
    Pub --> Open["Viewer taps View CV"]
    Open --> Link["Linking.openURL(public URL)"]
    Link --> Browser["PDF opens in browser"]
```

## 7. Job Sharing & Landing Page

```mermaid
flowchart LR
    A["User shares job in app"] --> B["Link:<br/>https://locjobs.netlify.app/?id={jobId}"]
    B --> C["landing/job.html<br/>fetches job via Supabase REST"]
    C --> D["Render job card<br/>+ posted-by + photos"]
    D --> E{"User has app?"}
    E -- "Yes" --> F["Open in App →<br/>locjobs://job/{id} deep link"]
    E -- "No / silent fail" --> G["Download App button<br/>(Expo APK build)"]
```

## 8. Data Flow — Real-time Sync

```mermaid
sequenceDiagram
    participant App as React Native App
    participant SB as Supabase
    participant DB as PostgreSQL

    App->>SB: Subscribe jobs channel (DELETE/UPDATE)
    App->>SB: Subscribe chat channel chat-messages-{jobId}
    App->>SB: Subscribe notifications channel (INSERT/UPDATE)
    Note over SB,DB: WAL events propagate to subscribed clients
    DB-->>SB: change event
    SB-->>App: payload
    App->>App: Update local state (jobs list, messages, badge counts)
```
