# LocJobs — Detailed Manual Test Cases

---

## 1. Theme / Dark Mode

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 1.1 | Toggle to dark mode | App is in light mode | 1. Go to Profile tab<br>2. Tap the dark mode switch (moon icon) | Entire UI switches to dark theme:<br>- Page background: `#12121C`<br>- Cards/sections: `#252540`<br>- Text: `#EAEAEA`<br>- Borders: `#2D2D44`<br>- Orange accent (Brand.primary): unchanged |
| 1.2 | Toggle back to light mode | App is in dark mode | 1. Go to Profile tab<br>2. Tap the dark mode switch (sun icon) | Entire UI switches back to light theme:<br>- Page background: `#FFF8F4`<br>- Cards: `#FFFFFF`<br>- Text: `#2D2B2A`<br>- Borders: `#F0E4DA` |
| 1.3 | Persist after restart | Dark mode is ON | 1. Kill the app (swipe up from recents)<br>2. Reopen the app | App loads in dark mode (no flash of light mode) |
| 1.4 | Persist after restart (light) | Light mode is ON | 1. Kill the app<br>2. Reopen | App loads in light mode |
| 1.5 | All screens — dark mode consistency | Dark mode is ON | 1. Visit Nearby tab<br>2. Visit Explore tab<br>3. Visit My Jobs tab<br>4. Visit Profile tab | Every screen uses dark colors. No white backgrounds, no black text, no unreadable elements. |
| 1.6 | Sub-screens — dark mode | Dark mode is ON | 1. Open Edit Profile<br>2. Open Notifications<br>3. Open Post Job screen<br>4. Open any user profile<br>5. Open Job Detail | All sub-screens use dark theme correctly. TextInput fields show entered text in light color (not black). |
| 1.7 | Theme change — mid-scroll | Dark mode is ON, on any long list | 1. Scroll down a list<br>2. Toggle to light mode | List items re-render with light colors. No half-dark/half-light state. |
| 1.8 | Danger button colors | Dark mode is ON | 1. Go to Profile<br>2. Check Sign Out and Delete Account buttons | Background: `#3A1A1A` (dark red), Text: `#E74C3C` (red) |
| 1.9 | Danger button colors | Light mode is ON | 1. Go to Profile<br>2. Check Sign Out and Delete Account buttons | Background: `#FDEDEC` (light pink), Text: `#E74C3C` (red) |

## 2. Authentication

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 2.1 | Sign out | User is logged in, on Profile tab | 1. Scroll to bottom of Profile<br>2. Tap "Sign Out"<br>3. Confirm | User is signed out, redirected to auth screen. All cached user data cleared. |
| 2.2 | Delete account | User is logged in | 1. Scroll to bottom of Profile<br>2. Tap "Delete Account"<br>3. Confirm the alert | Account and all associated data are deleted. Redirected to auth screen. |
| 2.3 | Sign Out button — light mode | Light mode ON | 1. Look at the Sign Out button on Profile tab | Button: light pink bg (`#FDEDEC`), red text (`#E74C3C`) |
| 2.4 | Sign Out button — dark mode | Dark mode ON | 1. Look at the Sign Out button on Profile tab | Button: dark red bg (`#3A1A1A`), red text (`#E74C3C`) |
| 2.5 | Delete Account button — light/dark | Both themes | 1. Check in light mode<br>2. Toggle to dark mode<br>3. Check again | Same color behavior as Sign Out button |

## 3. Nearby Tab (index.tsx)

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 3.1 | LocJobs logo | App loaded | 1. Look at the top-left pill/badge on Nearby tab | Logo text "LocJobs" is orange (`Brand.primary`) |
| 3.2 | Logo pill background | Any theme | 1. Observe the pill behind "LocJobs" | Background is `Brand.white` (white in light, `#252540` in dark) |
| 3.3 | Filter chip — default state | Nearby tab loaded | 1. Observe all category pills (Cleaning, Moving, etc.) | Inactive chips: `Brand.bg` background, `Brand.border` border, text uses ThemedText default |
| 3.4 | Filter chip — active state | Any chip is inactive | 1. Tap a category pill (e.g. "Tutoring") | Active chip: `Brand.primary` background, white `#FFFFFF` bold text |
| 3.5 | Filter chip — deselect | One chip is active | 1. Tap the same active chip again | Chip returns to inactive state. All jobs shown again. |
| 3.6 | Filter chip — swap | One chip is active | 1. Tap a different category chip | Previous chip deactivates, new chip activates. Job list updates to show only matching category. |
| 3.7 | Filter chip — dark mode colours | Dark mode ON | 1. Observe active/inactive chips | Inactive: dark bg (`#12121C`), dark border. Active: orange fill, white text. |
| 3.8 | Job cards — general | Jobs exist | 1. Scroll through the job list | Each card has: title, location, price, work type tag, posted time. Background is `Brand.white`. |
| 3.9 | Job card — tap | Any card visible | 1. Tap a job card | Navigate to job detail screen |
| 3.10 | Job card — save/bookmark | Any card visible | 1. Tap the bookmark icon on a card | Icon fills (saved). Tap again → unfills (unsaved). |
| 3.11 | Notification bell | — | 1. Look at the top-right bell icon | Icon is orange (`Brand.primary`) on a `Brand.white` background circle |
| 3.12 | Notification bell — tap | — | 1. Tap the bell icon | Navigates to Notifications screen |
| 3.13 | Bottom sheet — pull up | Nearby tab loaded | 1. Pull up the bottom sheet by dragging the handle | Sheet slides up. Background is `Brand.white` (`#252540` in dark). |
| 3.14 | Bottom sheet — handle | Sheet visible | 1. Look at the drag handle at the top of the sheet | Handle bar color: `Brand.border` |
| 3.15 | Bottom sheet — content | Sheet is up | 1. Observe content inside the sheet | Text, buttons render correctly. No layout issues. |
| 3.16 | Radius filter (if present) | — | 1. Check the radius selector | Works correctly in both themes |
| 3.17 | Empty state | No jobs within filter | 1. Apply a filter that matches no jobs | Empty state with icon and message is shown |
| 3.18 | Loading state | Fresh load or slow network | 1. Observe while data loads | Skeleton loaders appear for each card |
| 3.19 | Filter badge — no filters (nearby) | App just loaded, no filters active | 1. Look at the Nearby tab icon in the bottom tab bar | No badge (count 0) is shown on the icon |
| 3.20 | Filter badge — show count (nearby) | Nearby tab loaded | 1. Tap a category filter chip (e.g. "Tutoring")<br>2. Look at the Nearby tab icon | Badge shows "1" on the icon |
| 3.21 | Filter badge — two filters (nearby) | Nearby tab loaded | 1. Tap a category filter<br>2. Tap a work type filter<br>3. Look at the Nearby tab icon | Badge shows "2" on the icon |
| 3.22 | Filter badge — clears when filters cleared (nearby) | One filter active, badge showing "1" | 1. Tap the active filter chip to deselect it<br>2. Look at the Nearby tab icon | Badge disappears from the icon |

## 4. Explore Tab (explore.tsx)

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 4.1 | Search bar | Explore tab loaded | 1. Look at the search input at the top | Search icon + placeholder text visible. Background is `Brand.white`. |
| 4.2 | Search — type | — | 1. Type in the search bar | Results filter in real-time. Clear button appears (if implemented). |
| 4.3 | Work type dropdown | — | 1. Tap "Type" dropdown | Picker modal opens with: All Types, Onsite, Remote, Hybrid |
| 4.4 | Work type — selection | Picker is open | 1. Select "Remote" | Dropdown shows "Remote". Jobs filtered to remote only. |
| 4.5 | Work type — clear selection | A type is selected | 1. Open picker → select "All Types" | Dropdown shows "All Types". No work type filter. |
| 4.6 | Employment type dropdown | — | 1. Tap "Employment Type" dropdown | Picker modal opens with all employment types |
| 4.7 | Employment type — selection | Picker open | 1. Select "Full-Time" | Dropdown shows "Full-Time". Jobs filtered. |
| 4.8 | Region dropdown | — | 1. Tap "Region" dropdown | Picker modal opens with all regions |
| 4.9 | Region — selection | Picker open | 1. Select "Yangon Region" | Dropdown shows "Yangon Region". City list updates to Yangon cities. |
| 4.10 | City chips — default | Any state | 1. Observe the city row | "All" chip is active (orange, white text). Other chips are inactive (border only). |
| 4.11 | City chips — select a city | — | 1. Tap a city name (e.g. "Yangon") | Tapped city becomes active (orange fill, white text). "All" becomes inactive. Jobs filtered by city. |
| 4.12 | City chips — deselect | A city is selected | 1. Tap the same city again | Chip returns to inactive. "All" becomes active. All cities shown. |
| 4.13 | City chips — swap | City A is selected | 1. Tap City B | City A deactivates, City B activates. |
| 4.14 | City chips — region change | Any region selected | 1. Change the Region dropdown | City chips update to show cities in the new region |
| 4.15 | Category chips — default | — | 1. Scroll to the category row | "All" chip is active. All categories shown as inactive chips. |
| 4.16 | Category chips — select | — | 1. Tap "Cleaning" | "Cleaning" becomes active (orange fill, white text). Jobs filtered. |
| 4.17 | Category chips — deselect | A category is active | 1. Tap active category again | Returns to "All" active state. |
| 4.18 | City chips — dark mode | Dark mode ON | 1. Observe active/inactive city chips | Inactive: `Brand.bg` bg + `Brand.border` border. Active: orange fill, white text. |
| 4.19 | Category chips — dark mode | Dark mode ON | 1. Observe active/inactive category chips | Same as city chips. |
| 4.20 | Price range — min field | — | 1. Type a number in "Min" | Input accepts numbers only |
| 4.21 | Price range — max field | — | 1. Type a number in "Max" | Input accepts numbers only |
| 4.22 | Price range — both fields | — | 1. Set min to 50000, max to 200000 | Jobs filtered to show only jobs within that price range |
| 4.23 | Price range — clear | Values set | 1. Clear both fields | No price filter applied |
| 4.24 | Saved searches — save | — | 1. Set some filters<br>2. Tap bookmark icon (+)<br>3. Enter a name<br>4. Tap Save | Saved search appears as a chip below the search bar |
| 4.25 | Saved searches — apply | Saved searches exist | 1. Tap a saved search chip | All filters restore to the saved state. Job list updates. |
| 4.26 | Saved searches — delete (long-press) | Saved searches exist | 1. Long-press a saved search chip<br>2. Tap "Delete" | Saved search chip disappears |
| 4.27 | Saved search chip — style | Dark mode ON | 1. Observe saved search chips | Orange-tinted background, primary color text |
| 4.28 | Job list — grouped by work type | Jobs exist | 1. Scroll through results | Jobs grouped under "Onsite", "Remote", "Hybrid" headers |
| 4.29 | Section header — tap | Any section visible | 1. Tap a section header (e.g. "Remote") | Collapses or expands the section |
| 4.30 | Loading state | Fresh load | 1. Observe while data loads | Skeleton cards appear |
| 4.31 | Empty state — no results | Filters match no jobs | 1. Apply filters that return 0 results | Empty state with icon + "No jobs found" message |
| 4.32 | Job card — tap | Any card visible | 1. Tap a job card | Navigates to job detail |
| 4.33 | Filter badge — no filters (explore) | App just loaded, no filters active | 1. Look at the Explore tab icon in the bottom tab bar | No badge (count 0) is shown on the icon |
| 4.34 | Filter badge — one filter (explore) | Explore tab loaded | 1. Select a work type (e.g. "Remote")<br>2. Look at the Explore tab icon | Badge shows "1" on the icon |
| 4.35 | Filter badge — multiple filters (explore) | Explore tab loaded | 1. Select a work type<br>2. Select a category<br>3. Type in search<br>4. Look at the Explore tab icon | Badge shows "3" on the icon |
| 4.36 | Filter badge — price range counts as one filter (explore) | Explore tab loaded | 1. Set a min price<br>2. Look at the Explore tab icon | Badge shows "1" (min price counts as one filter) |
| 4.37 | Filter badge — price range both fields counts as two (explore) | Explore tab loaded | 1. Set min price AND max price<br>2. Look at the Explore tab icon | Badge shows "2" |
| 4.38 | Filter badge — clears when filters reset (explore) | Multiple filters active, badge showing count | 1. Clear all filters (search, price, dropdowns, chips)<br>2. Look at the Explore tab icon | Badge disappears from the icon |
| 4.39 | Filter badge — persists across tab switches (explore) | Explore tab has active filters | 1. Switch to Nearby tab<br>2. Switch back to Explore tab | Badge still shows the same count on the Explore icon |

## 5. My Jobs Tab (my-jobs.tsx)

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 5.1 | Header title | My Jobs tab loaded | 1. Look at the top of the screen | Title "My Jobs" is shown |
| 5.2 | + Create button — visibility | Posted tab is active | 1. Look at the header area | Orange circle button with white "+" is visible on the right |
| 5.3 | + Create button — posted tab only | — | 1. Tap "Applied" tab | "+" button disappears<br>2. Tap "Posted" tab | "+" button reappears |
| 5.4 | + Create button — tap | — | 1. Tap the "+" button | Navigates to /post screen |
| 5.5 | + button — color in light mode | Light mode ON | 1. Check the "+" text color | White (#FFFFFF) on orange background |
| 5.6 | Tab row — default state | My Jobs loaded | 1. Observe the tab bar below the header | Background: `Brand.borderLight`. |
| 5.7 | Posted tab — active | — | 1. When "Posted" is selected | Tab has orange background, white bold text |
| 5.8 | Posted tab — inactive | — | 1. Tap "Applied" | "Posted" tab becomes transparent (no bg), default text color |
| 5.9 | Applied tab — active | — | 1. Tap "Applied" | Tab has orange background, white bold text |
| 5.10 | Applied tab — inactive | — | 1. Tap "Posted" | "Applied" tab becomes transparent, default text |
| 5.11 | Posted jobs list | User has posted jobs | 1. Ensure "Posted" tab is active<br>2. Scroll the list | Job cards shown with: title, status badge, created date, applicant count |
| 5.12 | Posted job — status badges | Jobs with different statuses | 1. Check status badges on each card | Open = green, Full = orange/warning, Completed = primary |
| 5.13 | Posted job — tap | Any posted job | 1. Tap a posted job card | Navigates to job detail/applicants view |
| 5.14 | Applied jobs list | User has applied jobs | 1. Tap "Applied" tab<br>2. Scroll the list | Job cards with: title, application status badge (Pending/Accepted/Rejected), employer info |
| 5.15 | Applied job — status badges | — | 1. Check application status | Pending = orange/warning, Accepted = green, Rejected = red |
| 5.16 | Applied job — tap | Any applied job | 1. Tap an applied job card | Navigates to job detail |
| 5.17 | Applied — rating button | Status is "completed" | 1. Look for "Rate Employer" button | Button visible, tap → navigate to rating screen |
| 5.18 | Applied — rejection reason | Status is "rejected" | 1. Check for reason text | Rejection reason displayed below status (if provided) |
| 5.19 | Empty state — posted tab | User has zero posted jobs | 1. Ensure "Posted" tab is active | Empty state: briefcase icon + "No posted jobs yet" message |
| 5.20 | Empty state — applied tab | User has zero applied jobs | 1. Tap "Applied" tab | Empty state: document icon + "No applied jobs yet" message |
| 5.21 | Loading state | — | 1. Observe while data loads | Skeleton or spinner visible |
| 5.22 | Dark mode — full screen | Dark mode ON | 1. Check every element in both tabs | Page bg `#12121C`, cards `#252540`, text `#EAEAEA`, borders `#2D2D44` |

## 6. Profile Tab

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 6.1 | Profile avatar | User has no avatar | 1. Look at the profile card | Circle with initial letter, orange background |
| 6.2 | Profile avatar — with image | User has avatar | 1. Look at the profile card | Avatar image displayed in circle |
| 6.3 | Display name | User has display name set | 1. Look below the avatar | Display name shown in bold, text color is `Brand.text` |
| 6.4 | Display name — absence | No display name set | 1. Look below the avatar | Display name is not shown (no empty line) |
| 6.5 | Verified badge | User is verified | 1. Check next to display name | Green checkmark circle icon is visible |
| 6.6 | Email | — | 1. Look below display name | Email shown in `Brand.textSecondary` color |
| 6.7 | Bio | User has bio | 1. Look below email | Bio text centered, uses `Brand.text` color |
| 6.8 | Bio — absence | No bio set | 1. Check below email | No empty space for bio |
| 6.9 | Rating stars | User has reviews | 1. Look below bio | Star rating + "X.X (N)" in secondary text |
| 6.10 | Rating stars — absence | No reviews | 1. Check below bio | Rating section not shown |
| 6.11 | Info card — phone | — | 1. Find the info card below profile | Row with label "Phone" and value |
| 6.12 | Info card — city | — | 1. Find the city row | Row with label "City" and value or "—" |
| 6.13 | Info card — region | — | 1. Find the region row | Row with label "Region" and value or "—" |
| 6.14 | Info card — dividers | — | 1. Look between each row | Thin divider in `Brand.borderLight` |
| 6.15 | Info card — dark mode text | Dark mode ON | 1. Check phone, city, region values | Values are `Brand.text` (`#EAEAEA`), labels are `Brand.textSecondary` |
| 6.16 | Edit button (pencil) | — | 1. Look at the top-right of profile card | Pencil icon in a circle. Background: `Brand.primaryLight`. |
| 6.17 | Edit button — tap | — | 1. Tap the pencil icon | Navigates to Edit Profile screen |
| 6.18 | Completed jobs section | User has completed jobs | 1. Scroll to the "Completed Jobs" section | Shows count in header. Each completed job shown in a row. |
| 6.19 | Completed job — tap | Jobs listed | 1. Tap a completed job row | Navigates to job detail or review screen |
| 6.20 | Completed jobs — count | — | 1. Check header text | "Completed Jobs (N)" with correct count |
| 6.21 | Saved jobs section | User has saved jobs | 1. Scroll to "Saved Jobs" section | Shows count. Tapping navigates to saved jobs. |
| 6.22 | Reviews section | User has reviews | 1. Scroll to "Reviews" section | Reviews listed with reviewer avatar, name, rating, date, comment |
| 6.23 | Reviews — reviewer tap | Review visible | 1. Tap a reviewer's name/avatar | Navigates to that user's profile |
| 6.24 | Reviews — own review (edit/delete) | User left a review | 1. Find a review by the current user | Edit/delete options available |
| 6.25 | Reviews — absence | No reviews | 1. Scroll to reviews area | Reviews section is not rendered |
| 6.26 | Sign Out button | — | 1. Scroll to bottom of page | Red-styled button with text "Sign Out" |
| 6.27 | Delete Account button | — | 1. Below Sign Out | Red-styled button with text "Delete Account" |
| 6.28 | Profile card — dark mode | Dark mode ON | 1. Check the entire profile card | Card bg `#252540`, all text readable |
| 6.29 | Info card — dark mode | Dark mode ON | 1. Check the info card | Card bg `#252540`, dividers `#2D2D44` |
| 6.30 | Loading state | — | 1. Observe while profile loads | Skeleton placeholders for avatar, name, info rows |
| 6.31 | Edit profile — navigate to | Profile tab | 1. Tap pencil icon | Edit Profile screen opens |

## 7. Edit Profile Screen

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 7.1 | Header | Edit Profile loaded | 1. Look at the top | "Edit Profile" title centered. Close button on left. |
| 7.2 | Close button | — | 1. Tap the close (X) button | Returns to Profile tab |
| 7.3 | Avatar — display | User has avatar | 1. Look at the avatar circle | Current avatar displayed. "Tap to change photo" below. |
| 7.4 | Avatar — change | — | 1. Tap the avatar<br>2. Select a photo from gallery | New photo uploads. Avatar updates. "Uploading..." shown during upload. |
| 7.5 | Avatar — upload error | — | 1. Tap avatar while offline | Error "Upload failed" shown in red |
| 7.6 | Display Name field | — | 1. Look at the text input | Current display name pre-filled. Placeholder: "Your name". |
| 7.7 | Display Name — edit | — | 1. Type a new name | Text appears in white/light color (dark mode) or dark color (light mode) |
| 7.8 | Bio field | — | 1. Look at the text input | Current bio pre-filled in multiline input. Placeholder: "Tell people about yourself...". |
| 7.9 | Bio — edit | — | 1. Type new bio | Text wraps correctly in multiline |
| 7.10 | Phone field | — | 1. Look at the text input | Current phone pre-filled. Number keyboard opens on tap. |
| 7.11 | Phone — edit | — | 1. Type a new number | Only numeric input accepted |
| 7.12 | Region picker | — | 1. Tap "Region" | Picker modal opens with all regions sorted alphabetically |
| 7.13 | Region — select | Picker open | 1. Tap a region | Picker closes. Region field shows selected value. |
| 7.14 | City picker | — | 1. Tap "City" | Picker opens with cities (filtered by selected region, or all cities if no region) |
| 7.15 | City — select | Picker open | 1. Tap a city | Picker closes. City field shows selected value. |
| 7.16 | City — no region selected | No region | 1. Tap "City" without selecting a region | All cities from all regions shown |
| 7.17 | Save button | — | 1. Look at the bottom | Large orange button with "Save" text |
| 7.18 | Save — success | Fields modified | 1. Change a field<br>2. Tap Save<br>3. Wait | Button shows spinner during save. "Saved!" appears briefly. Auto-navigates back to Profile. |
| 7.19 | Save — without changes | No changes | 1. Tap Save without modifying anything | Saves current values (no error). Redirects back. |
| 7.20 | Save — error | Network off | 1. Tap Save while offline | Error message shown in red |
| 7.21 | TextInput — dark mode text | Dark mode ON | 1. Type in any TextInput | Entered text is visible light color (`Brand.text`), not black |
| 7.22 | TextInput — dark mode placeholder | Dark mode ON | 1. Look at empty TextInput | Placeholder text is `Brand.placeholder` (`#5A5A72`) |
| 7.23 | Form field labels | — | 1. Check label above each input | Labels use `Brand.text` via ThemedText |
| 7.24 | Picker (region/city) — selected value | — | 1. After selecting a value, observe the field | Value shown in `Brand.text` (not placeholder color) |
| 7.25 | Picker — unselected | — | 1. When no value, observe the field | Placeholder text in `Brand.placeholder` |
| 7.26 | Keyboard avoidance | — | 1. Tap any text field near the bottom | Screen scrolls up to keep field visible above keyboard |
| 7.27 | Scroll | Many fields | 1. Scroll the whole form | All fields scroll smoothly. No overlap with save button. |
| 7.28 | Loading state | — | 1. Observe while profile data loads | Lottie animation loader shown |
| 7.29 | Error display | An error occurred | 1. Trigger a save error | Error text in red, centered, above the save button |

## 8. Post / Create Job Screen (post.tsx)

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 8.1 | Navigate to post | — | 1. From My Jobs tab, tap "+" button | Post job screen opens |
| 8.2 | All form fields | — | 1. Check all inputs | Title, category, description, price, work type, employment type, city, region, etc. all present |
| 8.3 | Submit — success | All required fields filled | 1. Fill required fields<br>2. Tap Submit | Job created. Redirected to My Jobs. |
| 8.4 | Submit — validation | Required fields empty | 1. Tap Submit without filling | Validation errors shown |
| 8.5 | Cancel | — | 1. Tap back/close | Returns to My Jobs without saving |
| 8.6 | Dark mode | Dark mode ON | 1. Check all elements | All backgrounds, inputs, text use correct dark colors |

## 9. Job Detail Screen

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 9.1 | Job info | — | 1. Tap a job card from any list | Title, description, price, location, work type, poster info all displayed |
| 9.2 | Apply button | Job is open, user is not the poster | 1. Tap "Apply" | Application submitted successfully. Button changes to "Applied". |
| 9.3 | Cancel application | User has applied | 1. Tap "Applied" / "Cancel Application" | Application withdrawn. Button reverts. |
| 9.4 | Already applied state | — | 1. Open a job the user already applied to | Shows "Applied" status. Application status visible. |
| 9.5 | Own job | User is the poster | 1. Open user's own job | Shows "Edit" or manage options instead of "Apply" |
| 9.6 | Save/bookmark | — | 1. Tap bookmark icon | Job saved. Icon fills. |
| 9.7 | Share | — | 1. Tap share icon | Native share sheet opens with job link |
| 9.8 | Poster profile | — | 1. Tap the poster's name/avatar | Navigates to their profile page |
| 9.9 | Dark mode | Dark mode ON | 1. Check all elements | Correct dark colors everywhere |

## 10. User Profile Screen (/user/[id])

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 10.1 | User info | — | 1. Navigate to a user's profile | Avatar, display name, bio, rating shown |
| 10.2 | User jobs list | User has posted jobs | 1. Scroll to "Jobs" section | Up to 3 jobs shown. "See all jobs" link if more. |
| 10.3 | See all jobs | User has >3 jobs | 1. Tap "See all jobs" | Navigates to /user/[id]/jobs |
| 10.4 | Self-profile redirect | User taps own profile link | 1. Tap a link to own profile (e.g., from review) | Redirects to /(tabs)/profile instead of /user/:id |

## 11. Notifications Screen

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 11.1 | Notification list | — | 1. Tap bell icon on Nearby tab | List of notifications shown |
| 11.2 | Notification — tap | — | 1. Tap a notification | Navigates to relevant screen (job detail, profile, etc.) |
| 11.3 | Empty state | No notifications | 1. Open notifications screen | Empty state with message |
| 11.4 | Dark mode | Dark mode ON | 1. Check the screen | Correct dark mode colors |
| 11.5 | Loading state | — | 1. Observe while loading | Skeleton/spinner shown |

## 12. General / Cross-Cutting

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 12.1 | Button press feedback | Any pressable | 1. Tap any button or Pressable | Opacity change or visual feedback on press |
| 12.2 | Skeleton loading | Any screen loading data | 1. Observe during network fetch | Skeleton placeholders for cards, text, avatars |
| 12.3 | Network error | Airplane mode ON | 1. Perform any data operation | Error message in red. App doesn't crash. |
| 12.4 | Empty state — each list | No data | 1. Visit each tab/screen that shows a list | Each shows appropriate empty state with icon + text |
| 12.5 | KeyboardAvoidingView | iOS | 1. Tap into any TextInput near the bottom of a form | View scrolls to keep input visible. Done/return button works. |
| 12.6 | Scroll performance | Many items in a list | 1. Scroll rapidly through a long list | Smooth 60fps scrolling. No blank cells. |
| 12.7 | Pull-to-refresh | Any list screen | 1. Pull down on a list | Refresh indicator appears. List reloads. |
| 12.8 | Back navigation (swipe) | iOS, sub-screen open | 1. Swipe from left edge | Goes back to previous screen |
| 12.9 | Tab navigation | Any screen | 1. Switch between all 4 bottom tabs | Each tab loads its content. No stale data. |
| 12.10 | Memory — deep navigation | — | 1. Navigate through many screens (tap jobs, users, etc.) | No memory warnings. No crashes. Can go back all the way. |
| 12.11 | Deep link — job | — | 1. Open a job link externally | Correct job detail screen opens |
| 12.12 | Deep link — user profile | — | 1. Open a user profile link externally | Correct user profile opens |
| 12.13 | Supabase realtime — notifications | — | 1. Have another user perform an action (apply, review) | Notification/changes arrive without manual refresh |
| 12.14 | Supabase realtime — job DELETE | Another user's job visible | 1. Have the uploader delete their job<br>2. Observe the list on explore/nearby | Job disappears from the list without pull-to-refresh |
| 12.15 | Supabase realtime — job UPDATE | Another user's job visible | 1. Have the uploader change the job title/price<br>2. Observe the list on explore/nearby | Job updates in the list without pull-to-refresh |
| 12.16 | Posted time labels | Any job list | 1. Check any job card on explore, index, my-jobs, user/[id]/jobs | Shows relative time like "Posted 3h ago" or "Posted 2d ago" |
| 12.17 | Posted time — new job | Just posted a job | 1. Navigate to my-jobs tab | Shows "Posted just now" or "Posted 1m ago" |

## 13. Offline Banner

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 13.1 | Offline banner — appears | Online | 1. Enable airplane mode | Red banner slides in from top: "No internet connection" |
| 13.2 | Offline banner — disappears | Airplane mode ON | 1. Disable airplane mode | Banner slides up and disappears |
| 13.3 | Offline banner — animation | Any state | 1. Toggle airplane mode on/off | Banner animates smoothly (slide down on offline, slide up on online) |
| 13.4 | Offline banner — i18n (English) | Locale = English | 1. Enable airplane mode | Banner shows "No internet connection" |
| 13.5 | Offline banner — i18n (Burmese) | Locale = Burmese (my) | 1. Enable airplane mode | Banner shows "အင်တာနက်ချိတ်ဆက်မှုမရှိပါ" |
| 13.6 | Offline banner — remains visible while offline | Airplane mode ON | 1. Navigate between all tabs (Nearby, Explore, My Jobs, Profile) | Banner stays visible on all screens |
| 13.7 | Offline banner — safe area | Device with notch | 1. Enable airplane mode | Banner clears the status bar (not hidden behind it) |

## 14. Help & Support / FAQ Screen

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 14.1 | FAQ — navigate to | Profile tab | 1. Tap "Help & Support" button | Navigates to FAQ screen with accordion list |
| 14.2 | FAQ — accordion open | FAQ screen loaded | 1. Tap any question | Answer slides open below the question. Chevron rotates. |
| 14.3 | FAQ — accordion close | One answer is open | 1. Tap the same question again | Answer slides closed. Chevron returns to original position. |
| 14.4 | FAQ — multiple open | FAQ screen loaded | 1. Tap Question A → open<br>2. Tap Question B → open | Both answers visible simultaneously (independent accordion) |
| 14.5 | FAQ — all 8 questions visible | FAQ screen loaded | 1. Scroll through the full FAQ list | All 8 questions visible: How to apply, How to post, Edit job, Delete job, Contact uploader, Profile setup, Verification, Account deletion |
| 14.6 | FAQ — i18n (English) | Locale = English | 1. Check all FAQ questions and answers | All text in English |
| 14.7 | FAQ — i18n (Burmese) | Locale = Burmese (my) | 1. Switch language to Burmese<br>2. Open FAQ | All FAQ questions and answers in Burmese |
| 14.8 | Contact Us — email | FAQ screen loaded | 1. Scroll to "Contact Us" section<br>2. Tap email link | Opens device email client with pre-filled address |
| 14.9 | Contact Us — website | FAQ screen loaded | 1. Scroll to "Contact Us" section<br>2. Tap website link | Opens browser to the website URL |
| 14.10 | Contact Us — i18n (English) | Locale = English | 1. Check Contact Us labels | "Contact Us", "Email", "Website" labels in English |
| 14.11 | Contact Us — i18n (Burmese) | Locale = Burmese | 1. Check Contact Us labels | Labels in Burmese |
| 14.12 | Help & Support button — i18n (English) | Locale = English | 1. Go to Profile tab | Button label shows "Help & Support" |
| 14.13 | Help & Support button — i18n (Burmese) | Locale = Burmese | 1. Go to Profile tab | Button label shows "အကူအညီနှင့် ပံ့ပိုးကူညီမှု" |

## 15. i18n / Language Switching

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 15.1 | Language switch — to Burmese | English locale | 1. Go to Profile tab<br>2. Tap the language toggle | All UI text switches to Burmese |
| 15.2 | Language switch — to English | Burmese locale | 1. Go to Profile tab<br>2. Tap the language toggle | All UI text switches to English |
| 15.3 | Language — persist after restart | Burmese selected | 1. Kill the app<br>2. Reopen | App loads in Burmese |
| 15.4 | Language — persist after restart | English selected | 1. Kill the app<br>2. Reopen | App loads in English |
| 15.5 | Language — device default auto-detect | Device locale set to Myanmar | 1. Fresh install / clear AsyncStorage<br>2. Open app | App loads in Burmese |
| 15.6 | Language — system location chip i18n | English / Burmese | 1. Switch language | City, region names in DB are still in original language (not translated) |
| 15.7 | Language — offline banner i18n | See 13.4–13.5 | — | Banner text follows current language |

## 16. Error + Retry UI

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 16.1 | Explore — network error | Airplane mode ON | 1. Go to Explore tab | Empty state with error icon + "Network error" message + "Retry" button visible |
| 16.2 | Explore — retry | Error state visible | 1. Disable airplane mode<br>2. Tap "Retry" button | List reloads successfully |
| 16.3 | Nearby — network error | Airplane mode ON | 1. Go to Nearby tab | Empty state with error icon + "Network error" message + "Retry" button |
| 16.4 | Nearby — retry | Error state visible | 1. Disable airplane mode<br>2. Tap "Retry" button | List reloads successfully |
| 16.5 | Error state — i18n (English) | English locale, airplane mode ON | 1. Check empty state on any list | Error message in English |
| 16.6 | Error state — i18n (Burmese) | Burmese locale, airplane mode ON | 1. Check empty state on any list | Error message in Burmese |

## 17. Display Name on Signup

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 17.1 | Display name — saved on signup (email confirmed) | Email verification ON | 1. Register with display name "John"<br>2. Verify email<br>3. Sign in | Profile shows "John" as display name |
| 17.2 | Display name — saved on signup (no email confirm) | Email verification OFF | 1. Register with display name "Jane"<br>2. Sign in | Profile shows "Jane" as display name |
| 17.3 | Display name — empty on signup | No display name entered | 1. Register without display name<br>2. Sign in | Display name is empty/not shown |
| 17.4 | Display name — persists after upsert | Already has display name | 1. Go to Edit Profile<br>2. Change display name to "NewName"<br>3. Save | Display name updated. Revisit profile → shows "NewName". |

## 18. OAuth / Android Dev Build

| # | Test Case | Precondition | Steps | Expected |
|---|-----------|-------------|-------|----------|
| 18.1 | Google Sign-In — iOS (Expo Go) | iOS device/simulator | 1. Tap "Sign in with Google" | ASWebAuthenticationSession opens. After auth, user is signed in. |
| 18.2 | Google Sign-In — Android (dev build) | Android dev build installed | 1. Tap "Sign in with Google" | Browser opens via Linking.openURL. After auth, app captures callback and signs in. |
| 18.3 | OAuth — cold start deep link | App killed | 1. Open app via a deep link (e.g., locjobs://auth/callback#access_token=...) | Auth callback route parses tokens and signs user in. |
