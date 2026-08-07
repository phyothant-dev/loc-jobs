# LocJobs — Full App Flowchart

A single end-to-end flowchart covering the entire LocJobs app, from launch through auth, browsing, applying, chatting, reviewing, posting, and sharing.

```mermaid
flowchart TB

    %% ================= 1. LAUNCH & AUTH =================
    subgraph Auth["Launch & Auth"]
        A["App Launch<br/>(splash, load fonts)"]
        B{"Onboarding complete?<br/>(AsyncStorage)"}
        C["Onboarding screens<br/>(language select)"]
        D{"Session restored?<br/>(AuthProvider + supabase.auth)"}
        E["Login / Register<br/>Forgot password · Google OAuth"]
        F["Main Tab Navigator<br/>(5 tabs)"]
        A --> B
        B -->|No| C
        C -->|Done| D
        B -->|Yes| D
        D -->|No| E
        E -->|"Credentials / OAuth callback"| D
        D -->|Yes| F
    end

    %% ================= 2. BROWSE =================
    subgraph Browse["Browsing (Nearby · Explore)"]
        T1["Nearby tab<br/>(index.tsx)"]
        T2["Explore tab<br/>(explore.tsx)"]
        M["MapView + markers<br/>bottom sheet (25–90%)"]
        L["Radius + filter chips<br/>category · work type"]
        S["Search bar"]
        FL["Filters<br/>work type · employment type · region · city<br/>category · price min–max · currency"]
        CR["Job cards<br/>title · location · price/salary<br/>work type · status · save"]
        T1 --> M
        T1 --> L
        T2 --> S
        T2 --> FL
        L --> CR
        FL --> CR
        M -->|tap marker| JD
        CR --> JD
    end

    %% ================= 3. JOB DETAIL =================
    subgraph Detail["Job Detail (/job/[id])"]
        JD["Job detail screen"]
        JI["Info: title · category · work type<br/>employment type · region/city<br/>price + salary range (job currency)"]
        IMG["Photo carousel"]
        UP["Uploader card<br/>verified badge · rating · CV"]
        JD --> JI
        JD --> IMG
        JD --> UP
        JD --> SAVE{"Save job?"}
        SAVE -->|"Yes / unsave"| SV["saved_jobs insert / delete<br/>bookmark toggles"]
        JD --> SHARE{"Share?"}
        SHARE -->|"Yes"| LP
        JD --> APPLY{"Applicant?"}
        JD --> POSTER{"Uploader?"}
    end

    %% ================= 4. APPLY / SEEKER =================
    subgraph Apply["Apply Flow (Seeker)"]
        AP["Apply modal + message"]
        APD["application: pending<br/>notification to poster"]
        APC{"Poster decision"}
        ACC["application: accepted<br/>chat channel opens"]
        REJ["application: rejected<br/>+ reject_reason"]
        DONE2{"Uploader marks complete?"}
        AP --> APD
        APD --> APC
        APC -->|Accept| ACC
        APC -->|Reject| REJ
        ACC --> DONE2
        DONE2 -->|"Yes"| COMP
    end

    %% ================= 5. CHAT =================
    subgraph Chat["Real-time Chat"]
        CL["Chat tab<br/>conversation list · unread badge"]
        CH["Chat detail<br/>/chat/[jobId]/[otherUserId]"]
        CHL["Load last 30 msgs<br/>+ subscribe channel"]
        SEND["Send text / image<br/>reply · read receipts"]
        PAG{"Older messages?"}
        CL --> CH
        CH --> CHL
        CH --> SEND
        SEND --> DONE2
        PAG -->|"Yes"| CHL
        PAG -->|"No"| SEND
    end

    %% ================= 6. POSTER FLOW =================
    subgraph Poster["Post & Manage (Poster)"]
        PJ["Post job form"]
        PJE["Fields: title · desc · work type · category<br/>employment type · region/city · location<br/>currency + price · vacancies · photos"]
        PJB["Validate → post_job RPC<br/>job status: open"]
        MJ["My Jobs dashboard<br/>(Posted / Accepted tabs)"]
        ED{"Edit / Delete?"}
        EDI["Edit job<br/>(currency changeable)"]
        DEL["Soft delete job"]
        APL["Applicant list<br/>accept / reject · view CV"]
        PJ --> PJE
        PJE --> PJB
        PJB --> MJ
        MJ --> ED
        ED -->|Edit| EDI
        ED -->|Delete| DEL
        ED -->|Applicants| APL
        APL --> APC
        MJ --> DONE2
    end

    %% ================= 7. COMPLETION & REVIEWS =================
    subgraph Review["Completion & Reviews"]
        COMP["job status: completed"]
        RV["Both parties review each other<br/>(rating + comment)"]
        VF{"Completed ≥ 3 jobs?"}
        VB["Verified badge auto-granted"]
        COMP --> RV
        RV --> VF
        VF -->|"Yes"| VB
        VF -->|"No"| END
        VB --> END
    end

    %% ================= 8. PROFILE & SETTINGS =================
    subgraph Profile["Profile & Settings"]
        PR["Profile tab"]
        PI["Info: avatar · name · phone · email<br/>city · region · rating · CV"]
        EP["Edit Profile<br/>avatar · bio · region/city · CV upload"]
        SET["Settings<br/>language EN/MY · dark mode<br/>help & support · onboarding"]
        DO{"Delete account?"}
        DA["delete_user_account RPC<br/>+ sign out"]
        LLS["Relabel whole UI<br/>(i18n en/my)"]
        PR --> PI
        PR --> EP
        PR --> SET
        PR --> DO
        DO -->|"Yes"| DA
        SET -->|"language switch"| LLS
    end

    %% ================= 9. SHARING / LANDING =================
    subgraph Share["Sharing & Landing Page"]
        LP["Netlify link<br/>?id={jobId}"]
        LPW["landing/index.html<br/>fetch job via Supabase REST"]
        LPR["Render card (title · price/salary<br/>in job currency · photos · uploader)"]
        OI{"User has app?"}
        DL["locjobs://job/{id} deep link"]
        DB["Download App (Expo build)"]
        LP --> LPW
        LPW --> LPR
        LPR --> OI
        OI -->|"Yes"| DL
        OI -->|"No"| DB
        DL --> JD
    end

    END["App keeps running —<br/>realtime updates everywhere"]

    F --> T1
    F --> T2
    F --> MJ
    F --> CL
    F --> PR
    APPLY -->|"Yes"| AP
    POSTER -->|"Yes"| MJ
    DA -->|"sign out"| E
    LLS --> PR
    DB --> F
