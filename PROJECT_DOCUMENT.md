# LocJobs — Location-Based Job Search & Posting App

## 1. Project Title

**LocJobs: A Location-Based Mobile Job Marketplace for Local Work Opportunities**

---

## 2. Abstract

LocJobs is a mobile application that connects job seekers and job posters based on geographic proximity. Unlike traditional job platforms that focus on professional careers, LocJobs targets informal and local work opportunities — such as shop assistance, cleaning, delivery, and remote tasks. Users can register in dual roles (uploader and/or searcher), post jobs with optional photos, browse nearby opportunities via an interactive map, and accept jobs directly through the app.

The backend is powered by Supabase, utilizing PostgreSQL with PostGIS for location-based queries, Row Level Security for data access control, and Supabase Storage for image uploads. The frontend is built with React Native (Expo), supporting both iOS and Android platforms. The app provides real-time location tracking, city-based filtering, job lifecycle management (open → accepted → completed), and user profile management with role selection.

---

## 3. Objectives

### General Objective
To develop a mobile application that facilitates the posting and finding of local job opportunities based on user location, enabling efficient matching between job providers and job seekers in the same geographic area.

### Specific Objectives

1. **Location-Based Job Discovery** — To allow users to view job listings sorted by distance from their current location, using PostGIS spatial queries to filter jobs within a configurable radius.

2. **Dual-Role User System** — To implement a flexible user role system where a single user can act as both a job uploader and a job seeker, with appropriate permissions enforced via Row Level Security.

3. **Job Posting with Media Support** — To enable users to create job listings with titles, descriptions, work types (onsite/remote/hybrid), pricing, and optional image uploads stored in cloud storage.

4. **Job Acceptance and Lifecycle Management** — To provide a complete job workflow from posting through acceptance to completion, with status tracking and notifications between uploaders and seekers.

5. **Geographic Browsing and Search** — To offer an alternative "All Jobs" view that allows users to browse jobs by city, region, or keyword search, independent of their current location.

6. **User Profile and Role Management** — To allow users to manage their profile information, select their preferred role, and update their location details.

---

## 4. Project Scope

### Included Features

- User authentication (email/password registration and login)
- Location-based job discovery using GPS and PostGIS spatial queries
- Interactive map view showing job markers near the user
- Job posting form with title, description, work type, location, price, and optional photos
- Image upload to Supabase Storage
- Job acceptance system with one-acceptance-per-job constraint
- Job status lifecycle: open → accepted → completed
- All Jobs browsing with city filtering and keyword search
- My Jobs dashboard showing posted and accepted jobs
- User profile management (display name, phone, role, city, region)
- Row Level Security enforcement for data access control
- Session persistence across app restarts

### Out of Scope

- Real-time chat or messaging between users
- Push notifications for job updates
- Payment processing or in-app transactions
- Rating and review system for users
- Admin dashboard or analytics panel
- Web application version (mobile-only)
- Job categories or tags beyond work type
- Advanced search filters (price range, date range)
- Social login (Google, Facebook, etc.) — email only
- Offline mode

### Target Users

- **Job Posters (Uploaders)** — Individuals or small business owners who need temporary or part-time help for tasks such as shop assistance, cleaning, delivery, or other local services.
- **Job Seekers (Searchers)** — Individuals looking for nearby work opportunities, including students, part-time workers, or anyone seeking flexible local employment.

### Technical Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React Native (Expo SDK 56) |
| Backend | Supabase (PostgreSQL, PostGIS, Auth, Storage, RLS) |
| Language | TypeScript |
| Maps | react-native-maps (Apple Maps / Google Maps) |
| Location | expo-location |
| Image Picker | expo-image-picker |
| Image Display | expo-image |
| Routing | Expo Router (file-based) |
| Authentication | Supabase Auth (email/password) |

### Platform Support

- iOS (primary target)
- Android
- Web (limited support via Expo web)
