# Job Workflow — Manual Test Cases

---

## Prerequisites

- Two user accounts: **User A (uploader/poster)** and **User B (seeker/applicant)**
- Both accounts should have different roles (User A = "Both" or "Uploader", User B = "Both" or "Searcher")
- App is running on device/simulator

---

## 1. Post a Job

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 1.1 | Post a gig job (fixed price) | User A logged in | 1. Go to My Jobs tab<br>2. Tap "+" button<br>3. Fill title, description<br>4. Select work type (e.g. Onsite)<br>5. Set category (e.g. Cleaning)<br>6. Enter price (e.g. 50000)<br>7. Select region + city<br>8. Set vacancies (e.g. 2)<br>9. Tap Submit | Toast "Job posted!" appears. Auto-navigates back to My Jobs. Job appears in Posted tab. |
| 1.2 | Post a salaried job (employment type) | User A logged in | 1. Tap "+"<br>2. Fill title, description<br>3. Select work type (e.g. Remote)<br>4. Select employment type (e.g. Full-Time)<br>5. Set category (e.g. Software Development)<br>6. Select region + city<br>7. Tap Submit | Job posts successfully. My Jobs shows the new job. |
| 1.3 | Post with images | User A logged in | 1. Tap "+"<br>2. Fill required fields<br>3. Tap "+" on image picker<br>4. Select 2-3 images from gallery<br>5. Tap Submit | Images upload. Job detail shows image carousel. |
| 1.4 | Post with exact location | User A logged in, GPS on | 1. Tap "+"<br>2. Select work type "Onsite"<br>3. Toggle "Exact location" ON<br>4. Tap "Use My Current Location"<br>5. Fill other fields<br>5. Submit | Job is geotagged. Appears on Nearby map. |
| 1.5 | Post for remote work | User A logged in | 1. Tap "+"<br>2. Select work type "Remote"<br>3. Notice "Exact location" toggle is hidden<br>4. Fill other fields<br>5. Submit | Job posts with remote badge. No location required. |
| 1.6 | Validation — empty title | User A logged in | 1. Tap "+"<br>2. Leave title empty<br>3. Tap Submit | Red error "Title is required" below the title field. |
| 1.7 | Validation — empty required fields | User A logged in | 1. Tap "+"<br>2. Leave all fields empty<br>3. Tap Submit | Validation errors shown for each required field. |
| 1.8 | Validation — vacancies exceeds max | User A logged in | 1. Tap "+"<br>2. Tap vacancies "+" repeatedly | Vacancies capped at 50. Orange +/- buttons visible. |
| 1.9 | Image remove in post | User A logged in | 1. Add 2 images<br>2. Tap the X overlay on the first image | Image removed. Remaining images re-arrange. |
| 1.10 | Cancel post | User A logged in | 1. Tap "+"<br>2. Fill partial fields<br>3. Press back | Returns to My Jobs. No job created. |

---

## 2. Browse / Discover Jobs

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 2.1 | Nearby tab — see jobs on map | Jobs exist with location | 1. Go to Nearby tab<br>2. Observe map | Markers on the map at job locations. |
| 2.2 | Nearby tab — tap marker | Map markers visible | 1. Tap a marker<br>2. Tap the callout | Navigates to job detail. |
| 2.3 | Nearby tab — bottom sheet list | Jobs exist | 1. Pull up the bottom sheet<br>2. Scroll the list | Jobs listed sorted by distance. Each card shows title, distance, posted time, price. |
| 2.4 | Nearby tab — category filter | Jobs exist | 1. Tap a category chip (e.g. "Tutoring") | Only matching jobs shown. Filter badge appears on tab. |
| 2.5 | Explore tab — search by keyword | Jobs exist | 1. Go to Explore tab<br>2. Type in search bar | Jobs filter in real-time as you type. |
| 2.6 | Explore tab — filter by work type | Jobs exist | 1. Open "Type" dropdown<br>2. Select "Remote" | Only remote jobs shown. |
| 2.7 | Explore tab — filter by employment type | Jobs exist | 1. Open "Employment Type" dropdown<br>2. Select "Full-Time" | Only full-time jobs shown. |
| 2.8 | Explore tab — filter by region | Jobs exist in various regions | 1. Open "Region" dropdown<br>2. Select a region | City chips update. Jobs filtered by region. |
| 2.9 | Explore tab — filter by city | Jobs exist in various cities | 1. Tap a city chip (e.g. "Yangon") | Only Yangon jobs shown. |
| 2.10 | Explore tab — price range filter | Jobs with prices exist | 1. Enter min price "10000"<br>2. Enter max price "50000" | Only jobs in that price range shown. |
| 2.11 | Explore tab — category chips | Jobs exist | 1. Tap a category chip (e.g. "Cleaning") | Jobs filtered. Multi-select works. |
| 2.12 | Explore tab — grid layout | Jobs exist | 1. Scroll the results | Jobs grouped by work type (Onsite/Remote/Hybrid). Collapsible sections. |
| 2.13 | Explore tab — filter badge updates | Any filter active | 1. Look at Explore tab icon | Badge shows count of active filters. |
| 2.14 | Empty state — no results | Filters match nothing | 1. Set very restrictive filters | Empty state with icon + "No jobs found" message. |
| 2.15 | Explore tab — retry on error | Airplane mode ON | 1. Go to Explore tab | Error message + "Retry" button shown. |
| 2.16 | Saved job — toggle from card | Job card visible | 1. Tap bookmark icon on a card | Icon fills (saved). Tap again → unfills (unsaved). |
| 2.17 | Job posted time visible | Job exists | 1. Look at any job card | Shows relative time: "Posted 3h ago", "Posted 2d ago". |
| 2.18 | Real-time job removal (DELETE) | A job visible | 1. As uploader, delete the job<br>2. As seeker, observe explore/nearby | Job disappears without pull-to-refresh. |

---

## 3. View Job Detail

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 3.1 | Job detail — all info displayed | A job exists | 1. Tap any job card | Title, description, price/salary, work type, employment type, location, uploader info, posted time, category displayed. |
| 3.2 | Job detail — image carousel | Job has images | 1. Open job with images<br>2. Swipe left/right on images | Images scroll horizontally. |
| 3.3 | Job detail — gig price display | Gig job (fixed price) | 1. Open a gig job | Price shown prominently (e.g. "50,000 MMK"). |
| 3.4 | Job detail — salary range display | Salaried job | 1. Open a salaried job | Salary range displayed (e.g. "300,000 – 500,000 MMK/month"). |
| 3.5 | Job detail — status badge | Job has a status | 1. Open a job | Badge shows "Open" (green), "Full" (orange), "Completed" (primary), or "Cancelled" (red). |
| 3.6 | Job detail — uploader info | — | 1. Open a job<br>2. Find uploader section | Shows uploader name, avatar, rating, verified badge (if applicable). |
| 3.7 | Job detail — share | — | 1. Tap share icon | Native share sheet opens with job link (Netlify landing page). |
| 3.8 | Job detail — save toggle | — | 1. Tap bookmark icon | Job saved/unsaved. Icon updates. |
| 3.9 | Job detail — report | — | 1. Scroll to Report section<br>2. Select a reason<br>3. Submit | "Report submitted" confirmation. |
| 3.10 | Job detail — self-own job | User A viewing their own job | 1. Open a job posted by yourself | Shows "Edit" button. No "Apply" button. |
| 3.11 | Job detail — edit (uploader) | User A is the uploader | 1. Open own job<br>2. Tap "Edit" | Navigates to edit job screen with pre-filled fields. |
| 3.12 | Job detail — navigate to uploader profile | — | 1. Tap uploader name/avatar | Navigates to user profile. |

---

## 4. Apply for a Job

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 4.1 | Apply — success | User B logged in, job is "open" | 1. Open an "open" job<br>2. Tap "Apply" button | Application submitted. Button changes to "Applied" (disabled state). |
| 4.2 | Apply — already applied | User B already applied | 1. Open the same job again | Shows "Applied" status. Cannot apply again. |
| 4.3 | Apply — own job | User A opens own job | 1. Open own job | "Apply" button is not shown. Only "Edit" options visible. |
| 4.4 | Apply — job is "full" | Job has all vacancies filled | 1. Open a "full" job | "Apply" button is hidden or disabled. Status shows "Full". |
| 4.5 | Apply — job is "cancelled" | Uploader cancelled the job | 1. Open a cancelled job | "Apply" button is hidden. Status shows "Cancelled". |
| 4.6 | Application appears in My Jobs (Applied tab) | User B applied | 1. Go to My Jobs<br>2. Tap "Applied" tab | Job appears with "Pending" status badge. |

---

## 5. Accept / Reject Applications (Uploader)

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 5.1 | View applicants | User A has a job with applications | 1. Open own job<br>2. Scroll to "Applicants" section | List of applicants shown with name, avatar, applied date. |
| 5.2 | Accept application | User A, applicant exists | 1. Tap "Accept" next to an applicant | Application status changes to "Accepted". Notification sent to applicant. |
| 5.3 | Job becomes "full" when vacancies filled | Vacancies = 1, accept 1 applicant | 1. Accept the only remaining vacancy | Job status changes to "Full". "Apply" hidden for other users. |
| 5.4 | Reject application with reason | User A, applicant exists | 1. Tap "Reject"<br>2. Enter a reason<br>3. Tap Confirm | Application status changes to "Rejected". Applicant sees the rejection reason. |
| 5.5 | Applicant sees "Accepted" status | User B was accepted | 1. Login as User B<br>2. Go to My Jobs → Applied tab | Status shows "Accepted" (green). |
| 5.6 | Applicant sees "Rejected" status + reason | User B was rejected | 1. Login as User B<br>2. Go to My Jobs → Applied tab | Status shows "Rejected" (red). Rejection reason displayed. |

---

## 6. Chat After Acceptance

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 6.1 | Chat button on applicant row | User A has accepted an applicant | 1. Open the job<br>2. Find the accepted applicant<br>3. Tap "Chat" | Opens chat conversation with the applicant. |
| 6.2 | Chat from My Jobs (Applied) | User B was accepted | 1. Go to My Jobs → Applied tab<br>2. Tap the job | Opens job detail. "Chat" button available. |
| 6.3 | Send message | Chat conversation open | 1. Type a message<br>2. Tap send | Message appears in the chat. Other user receives it in real-time. |
| 6.4 | Send image | Chat open | 1. Tap "+"<br>2. Select an image | Image uploaded and sent. Other user sees it. |
| 6.5 | Edit own message | Message was sent | 1. Long-press own message<br>2. Tap "Edit"<br>3. Modify text<br>4. Tap "Send" | Message updates. "edited" label appears. |
| 6.6 | Delete own message | Message was sent | 1. Long-press own message<br>2. Tap "Delete"<br>3. Confirm | Message shows "Message deleted" placeholder. |
| 6.7 | Reply to message | Message exists | 1. Long-press any message<br>2. Tap "Reply"<br>3. Type reply<br>4. Send | Original message quoted above input. Sent message shows replied-to content with left border. |
| 6.8 | Pagination — load older messages | 30+ messages in conversation | 1. Scroll to top of chat | "Load earlier messages" appears. Tap to load next 30. |
| 6.9 | Read receipt — seen indicator | User B sent a message | 1. As User A, open the chat | User B's message shows "Seen" indicator under it. |
| 6.10 | Connection indicator | Internet drops | 1. Enable airplane mode while in chat | Yellow "Reconnecting..." bar appears. |
| 6.11 | Unread badge on Chat tab | User B sent a new message | 1. As User A, look at Chat tab icon | Badge shows unread count. |

---

## 7. Complete a Job

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 7.1 | Uploader marks job as complete | Job has accepted applicant(s) | 1. Open the job (as uploader)<br>2. Tap "Mark Complete"<br>3. Confirm | Job status changes to "Completed". Notification sent to applicant. |
| 7.2 | Applicant sees "Completed" status | User B's job was completed | 1. Go to My Jobs → Applied tab | Status shows "Completed". "Rate Poster" button appears. |
| 7.3 | Uploader sees "Completed" status | User A's job was completed | 1. Go to My Jobs → Posted tab | Job shows "Completed" badge. |
| 7.4 | Completed job — review button (seeker) | User B's job completed | 1. Open the job<br>2. Tap "Write Review"<br>3. Select 1-5 stars<br>4. Write comment<br>5. Submit | Review posted. Uploader's profile rating updates. |
| 7.5 | Completed job — review button (uploader) | User A marked complete | 1. Tap "Review" on the completed job | Can leave a review for the applicant. |
| 7.6 | Verify "Completed" count updates | User A has completed jobs | 1. Go to Profile tab | "Completed Jobs" count incremented. |

---

## 8. Cancel a Job

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 8.1 | Cancel — open job | Job has no accepted applicants | 1. Open own job<br>2. Tap "Cancel"<br>3. Confirm | Job status changes to "Cancelled". Disappears from explore/nearby. |
| 8.2 | Cancel — job with applicants | Job has pending applicants | 1. Cancel the job | All pending applications auto-rejected. Job status = "Cancelled". |
| 8.3 | Cancelled job in My Jobs | User A cancelled a job | 1. Go to My Jobs → Posted tab | Job shows "Cancelled" badge. |
| 8.4 | Cancelled job — applicant view | User B applied to a cancelled job | 1. Go to My Jobs → Applied tab | Application shows "Rejected" or job shows as cancelled. |

---

## 9. Edit a Job

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 9.1 | Edit — change title | Own open job | 1. Open job detail<br>2. Tap "Edit"<br>3. Change title<br>4. Save | Title updated. Visible on job detail and search results. |
| 9.2 | Edit — change price | Own open job | 1. Edit the job<br>2. Change price<br>3. Save | Price updated. |
| 9.3 | Edit — add/remove images | Own open job | 1. Edit the job<br>2. Add a new image<br>3. Remove an existing image<br>3. Save | Images update. |
| 9.4 | Edit — cannot edit accepted/completed job | Job is "accepted" or "completed" | 1. Open a completed job | "Edit" button is hidden. |

---

## 10. Delete a Job

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 10.1 | Delete — open job with no applicants | Own open job | 1. Open job detail<br>2. Tap "Delete"<br>3. Confirm | Job soft-deleted. Removed from all lists. |
| 10.2 | Delete — verify job gone | Job was deleted | 1. Search for the job on explore<br>2. Check nearby tab | Job not visible anywhere. |
| 10.3 | Delete — verify in My Jobs | Job was deleted | 1. Go to My Jobs → Posted tab | Job no longer appears in the list. |

---

## 11. Saved Jobs

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 11.1 | Save from job card | Any job card visible | 1. Tap bookmark icon | Icon fills. Job saved. |
| 11.2 | Unsave from job card | Job is saved | 1. Tap filled bookmark | Icon unfills. Job unsaved. |
| 11.3 | Save from job detail | Job detail open | 1. Tap bookmark in header | Bookmark fills. |
| 11.4 | Saved jobs in Profile | User has saved jobs | 1. Go to Profile<br>2. Tap "Saved Jobs" | Shows list of saved jobs. |
| 11.5 | Unsave from saved list | Saved jobs screen | 1. Tap bookmark on a saved job | Job removed from saved list. |

---

## 12. Verified Badge

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 12.1 | Verified badge on job detail | Uploader is verified | 1. Open a job by a verified uploader | Green checkmark icon next to uploader name. |
| 12.2 | Verified badge on user profile | User is verified | 1. View a verified user's profile | Checkmark icon near display name. |
| 12.3 | Auto-verify at 3 completed jobs | Uploader completes 3 jobs | 1. Complete 3 jobs as uploader<br>2. Check profile | Badge appears automatically. |
