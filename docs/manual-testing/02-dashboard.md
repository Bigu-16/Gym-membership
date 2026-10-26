# Manual Testing Guide: Dashboard Overview

This guide details steps for testing the central control hub of the gym management application. Test these features as a manager running day-to-day operations.

---

## 1. Visual Verification & Navigation
* **Sidebar Controls:** Try clicking all sidebar icons (Overview, Directory, Registration, Schedule, Analytics, Notifications). Verify that pages transition smoothly and the active icon lights up.
* **Header Indicators:** Check that the top-right metrics display **Total Members** and **Active Now** counts. These values should auto-update.
* **Theme Switching:** Click the sun/moon icon next to the logout button. The page should toggle between a sleek dark mode and a clean light mode instantly.
* **Sign Out:** Click the logout button (arrow pointing out of door). It should immediately clear user session data and return you to the login screen.

---

## 2. Interactive Features & Workflows

### Test Case 2.1: Live Member Check-In Flow
1. Look for the **"Live Member Check-In"** card in the dashboard.
2. In the search box, start typing the name or phone number of an existing member (e.g., "John" or a phone number like "+1").
3. *Expected Result:* A dropdown of matching members will display.
4. Select a member from the dropdown and click the **"Check In"** button next to their name.
5. *Expected Result:*
   * A green banner pops up: `"Successfully checked in [Member Name]!"`.
   * The **"Active Now"** count in the header increments by 1.
   * The checked-in member appears in the **"Active Now"** roster list.
6. Try checking in the *same* member again.
7. *Expected Result:* A warning banner pops up: `"[Member Name] is already checked in."`

### Test Case 2.2: Active Now & Check-Out Flow
1. Locate the **"Active Now"** panel on the dashboard showing currently checked-in members.
2. Locate a member you checked in during the previous test.
3. Click the **"Check Out"** button next to their name.
4. *Expected Result:*
   * The member is removed from the "Active Now" list.
   * The **"Active Now"** header count decrements by 1.
   * A banner displays confirming: `"[Member Name] has been checked out."`

### Test Case 2.3: Session Category Filters
1. Locate the horizontal category selector buttons under the **"Active Training Sessions"** section (e.g., *All, Taekwondo, Karate, Yoga, Fitness, Personal Training*).
2. Click on different categories.
3. *Expected Result:* The list of cards beneath changes, displaying only the classes or sessions belonging to the clicked category.

### Test Case 2.4: Session Checklist & Progress Tracking
1. Find an **In-Progress** or **Upcoming** session card.
2. Locate the checklist inside the card (e.g., "Safety warm-up completed", etc.).
3. Check one of the items.
4. *Expected Result:*
   * The checklist box highlights as checked.
   * The session's visual progress bar updates dynamically (e.g., moves to 33% or 66% completion).
5. Add a custom item: Type text in the *"Add task..."* field at the bottom of the checklist and press enter or click the **"+"** button.
6. *Expected Result:* The new task is appended to the bottom of the session checklist.
7. Click the trash icon next to any checklist item.
8. *Expected Result:*
   * A prompt appears: `"Are you sure you want to delete this task from the checklist?"`
   * Confirming with "OK" removes the task, and the progress bar adjusts accordingly.

### Test Case 2.5: Session State Transitions (Start/Complete/Reopen)
1. Locate an **Upcoming** session.
2. Click the **"Start Session"** button (green play icon or text button).
3. *Expected Result:* The session status badge transitions to **"In Progress"** and a timer begins.
4. Click the **"Complete Session"** button.
5. *Expected Result:* The session status badge transitions to **"Completed"**, showing a checkmark.
6. Click the **"Reopen Session"** button.
7. *Expected Result:* The session goes back to **"In Progress"**.

### Test Case 2.6: Recent Activity Stream
1. Perform a check-in or checkout activity.
2. Look at the **"Recent Activities"** stream at the bottom/side of the dashboard.
3. *Expected Result:* The activity you just performed is logged at the top of the timeline with a timestamp.

---

## 3. Client Sign-Off Checklist

- [ ] Sidebar links navigate to their respective pages.
- [ ] Theme toggler switches colors seamlessly between light and dark modes.
- [ ] Sign Out button terminates the session and returns user to the Login screen.
- [ ] Searching a member in the check-in card displays matching dropdown suggestions.
- [ ] Clicking Check-In correctly marks a member as active, increments the header stats, and shows a success banner.
- [ ] Clicking Check-Out correctly removes the member from the active list and decrements header stats.
- [ ] Category buttons filter the displayed training sessions.
- [ ] Toggling checklist items updates the session progress bar in real-time.
- [ ] Adding and deleting custom tasks to/from a session checklist functions correctly.
- [ ] Sessions can transition from Upcoming -> In Progress -> Completed and back.
- [ ] Recent Activity logs show correct updates.
