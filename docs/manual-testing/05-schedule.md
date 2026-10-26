# Manual Testing Guide: Schedule & Class Management

This guide is written for testing the calendar scheduler, trainer sessions, and class templates. You will play the role of a gym coordinator setting up schedules and tracking live training logs.

---

## 1. Calendar View Controls
1. Go to the **"Training Schedule"** page from the sidebar.
2. Locate the navigation header at the top of the schedule.
3. Click the view selectors: **Day, Week, and Month**.
4. *Expected Result:* The calendar grid layout changes respectively.
5. Click **Chevron Left (<)** and **Chevron Right (>)** arrows.
6. *Expected Result:* The dates shift to the previous/next day, week, or month, and the header title updates.
7. Click the **"Today"** button to snap back to the current date.

---

## 2. Managing Class Templates (Recurring Schedule Slots)

### Test Case 5.1: Accessing Templates
1. Click the **"Templates"** tab view in the schedule controls.
2. *Expected Result:* A list of master class templates displays (e.g. *Kids Taekwondo, Teens Kickboxing, Zumba Fitness*), showing weekly days, time, room, capacity (e.g. 15), and current enrollment count.

### Test Case 5.2: Adding a New Class Template
1. Click the **"+ Add Class Template"** button.
2. A pop-up form appears.
3. Fill in:
   * **Class Name** (select or type a name).
   * **Days** (check boxes for days, e.g. Mon, Wed).
   * **Start / End Time** (e.g., `17:00` to `18:00`).
   * **Capacity** (e.g., `20`).
4. Click **"Create Template"**.
5. *Expected Result:* The template is added to the list and becomes available in the registration slots dropdown.

### Test Case 5.3: Editing & Deleting Class Templates
1. Locate any custom template card in the list.
2. Click the **Edit (pencil icon)** button. Adjust times or capacity and save.
3. Click the **Delete (trash icon)** button.
4. Confirm the prompt.
5. *Expected Result:* The template is immediately removed from the active templates list.

---

## 3. Session Roster & Live Session Logs

### Test Case 5.4: Accessing a Session Drawer
1. Switch to **Week** or **Day** calendar view.
2. Click on any training block (Group class or Personal session).
3. *Expected Result:* A right-hand details drawer or modal opens. It displays the class name, scheduled time, assigned trainer, studio location, status badge, and interactive workout checklist.

### Test Case 5.5: Editing Live Session Checklists
1. Inside the session details panel, verify you can:
   * Check off tasks (e.g., *"Safety warm-up completed"*). The progress percentage bar should fill up.
   * Add a new task (type in the input field and click the **"+"** button).
   * Delete a task by clicking the trash icon next to it and clicking "OK" on the browser confirmation box.

### Test Case 5.6: Class Status Lifecycle Toggles
1. Find an **Upcoming** session on the calendar.
2. Click the **"Start Session"** button.
3. *Expected Result:* The badge status changes to yellow **"In Progress"** and timer indicators display.
4. Click **"Complete Session"**.
5. *Expected Result:* The badge status changes to green **"Completed"**.
6. Click **"Reopen"** if you need to roll back to the in-progress status.

---

## 4. Client Sign-Off Checklist

- [ ] Calendar toggles between Day, Week, and Month layouts smoothly.
- [ ] Arrow navigation loads appropriate dates and displays current ranges.
- [ ] "Class Templates" view lists standard classes, capacities, and active student enrollment figures.
- [ ] Creating a new template displays a modal form, validates inputs, and appends the slot.
- [ ] Editing and deleting templates works correctly with popup confirmation guards.
- [ ] Clicking calendar slots opens details displaying correct trainer name, time, and location.
- [ ] Session checklist items can be checked, added, and deleted.
- [ ] Session status transitions between Upcoming, In Progress, and Completed accurately.
