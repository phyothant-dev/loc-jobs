# LocJobs — Full App Flowchart (ASCII)

A real flowchart of the entire app, drawn in text so it renders anywhere.

```
                    +------------------------------+
                    |          1. APP LAUNCH       |
                    |   splash · fonts · theme ·   |
                    |   locale (EN / MY)           |
                    +------------------------------+
                                   |
                                   v
                    +------------------------------+
                    |  2. Onboarding complete?     |
                    |     (AsyncStorage)           |
                    +------------------------------+
                                   | Yes                 | No
                                   v                    v
                    +------------------------------+   +------------------------------+
                    |  4. Load session            |   |  3. ONBOARDING                |
                    |     AuthProvider            |   |     intro · language          |
                    |     supabase.auth           |   |     select                    |
                    +------------------------------+   +------------------------------+
                                   |                              | (Done)
                                   v                              v
                                   +------------------------------+
                                   |
                                   v
                    +------------------------------+
                    |  5. Session exists?          |
                    +------------------------------+
                                   | Yes                 | No
                                   v                    v
                    +--------------------------------------+   +--------------------------------------+
                    |  7. MAIN TAB NAVIGATOR               |   |  6. AUTH                              |
                    |     (5 tabs, FilterCountContext      |   |     login · register ·               |
                    |     badge counts)                    |   |     forgot · Google OAuth            |
                    +--------------------------------------+   +--------------------------------------+
                                      |                                        (6) AUTH success →
                                      v                                        back to session (5)
     +-------------+-------------+----+--------+-------------+
     |             |             |    |        |             |
     v             v             v    v        v             v
+----------+  +----------+  +----------+  +----------+  +----------+
|  8.      |  |  9.      |  | 10.      |  | 11.      |  | 12.      |
| NEARBY   |  | EXPLORE  |  | MY JOBS  |  | CHAT     |  | PROFILE  |
+----------+  +----------+  +----------+  +----------+  +----------+
     |             |             |             |             |
     v             v             v             v             v
+----------+  +----------+  +----------+  +----------+  +----------+
| map +    |  | search + |  | Posted / |  | conv.    |  | account· |
| bottom   |  | filters +|  | Accepted |  | list +   |  | settings |
| sheet    |  | price +  |  | tabs     |  | unread   |  | · CV ·   |
| radius+  |  | currency |  |          |  | badge    |  | delete   |
| chips    |  | range    |  |          |  |          |  |          |
+----------+  +----------+  +----------+  +----------+  +----------+
     |             |             |             |             |
     +---------+---+             |             |             |
               |                 |             |             |
               v                 |(A)          |(B)          |(C)
+--------------------------------+
| 13. JOB DETAIL  /job/[id]      |
+--------------------------------+
      +---------+-----+-----------------------------+---------------+
      |         |     |                             |               |
      v         v     v                             v               v
+----------+  +----------+            +----------+  +----------+
|  14.     |  |  20.     |            |  15.     |  |  19.     |
| SAVE     |  | SHARE    |            | APPLY    |  | MANAGE   |
+----------+  +----------+            +----------+  +----------+
      |         |     |                             |               |
      v         v     v                             v               v
+----------+  +---------------------------+    +----------+         |
| toggle   |  | 1. landing fetch job      |    | 16. app.  |         |
| saved_   |  |    via Supabase REST      |    |    pending|         |
| jobs     |  |                           |    | + notify  |         |
+----------+  +---------------------------+    +----------+         |
      |         |                                 |               |
      v         v                                 v               v
   back to 13  +---------------------------+    +------------------------------------------+
              | 2. render card             |    | 17. poster decision?                      |
              |    (title · price/salary   |    |     Accept ↓        Reject →              |
              |    in job currency,        |    +------------------------------------------+
              |    photos · uploader)      |                                |              |
              +---------------------------+                                v              v
              +---------------------------+    +-----------------------------------+  +---------------------------+
              | 3. user has the app?      |    | 18. accepted + chat opens         |  | rejected + reject reason |
              +---------------------------+    |      (B) Chat tab also opens here |  |     + notify seeker      |
                  | Yes        | No            +-----------------------------------+  +---------------------------+
                  v            v                           |
        (deep link    (download app                        v
         locjobs://     — Expo build)         +-----------------------------------+
         job/{id})                            | 21. uploader marks complete?      |
              |                               +-----------------------------------+
              v                                        | Yes
              +---------------------------+                     v
              |        back to 13        |    +-----------------------------------+
              +---------------------------+    | 22. job completed                  |
                                             |     both review each other         |
                                             +-----------------------------------+
                                                               |
                                                               v
                                             +-----------------------------------+
                                             | 23. completed ≥ 3 jobs?            |
                                             +-----------------------------------+
                                                      | Yes                 | No
                                                      v                     v
                                             VERIFIED BADGE        (no badge —
                                             auto-granted           keep going)
                                                      |
                                                      v
                                      (app continues — realtime updates)

                                          +---------------------------+
                                          | 12. PROFILE (C):           |
                                          | account · settings · CV · |
                                          | language · delete account |
                                          +---------------------------+
                                                       |  delete → sign out
                                                       v
                                          (back to AUTH 6)
```

## Legend

| Symbol | Meaning |
|--------|---------|
| `[ box ]` | Process / action |
| `( ? )` | Decision with Yes/No branches |
| `v` / `|` | Direction of flow |
| `(A)` `(B)` `(C)` | Connector labels to matching markers below |
| `back to 13` | Loop back to the Job Detail step |

## Notes

- **Tabs 8–12** hang under the Main Tab Navigator (7). Nearby (8) and Explore (9) converge into Job Detail (13). My Jobs (10) → MANAGE (A); Chat (11) → the chat box in the accepted flow (B); Profile (12) → the PROFILE flow (C).
- **Save (14)** toggles `saved_jobs` and loops back to Job Detail. **Share (20)** goes through the landing page (fetch via Supabase REST → render card with the job's currency) then deep-links back to Job Detail or prompts a download.
- **Apply (15)** and **MANAGE (19)** both feed the poster decision (17). Accept opens the chat channel (also reachable from the Chat tab); reject notifies the seeker with a reason.
- Completing a job (22) unlocks reviews; 3+ completed jobs (23) auto-grant the verified badge.
- **PROFILE (C)** covers account info, settings, CV upload, language switch, and delete account (back to AUTH 6).
