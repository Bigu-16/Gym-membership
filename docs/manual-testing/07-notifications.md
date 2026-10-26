# Manual Testing Guide: Notifications & System Tasks

This guide outlines how to verify the background system tasks (Celery routines) and notification delivery logs (email, SMS, push notifications). You will play the role of an administrator audit logging system communications.

---

## 1. Triggering Celery Background Routines

### Test Case 7.1: Seeding Demo Notifications Data
1. Navigate to the **"Notifications"** (or **"Notifications Panel"**) tab in the sidebar.
2. Locate the button card labeled **"Seed Demo Logs"** (under the Control Panel section).
3. Click it.
4. *Expected Result:*
   * A loading indicator spins inside the button.
   * An emerald-green banner appears at the top: `"Demo data seeded successfully!"`.
   * The notification metrics and log table below populate immediately with mock notification records.

### Test Case 7.2: Running the Membership Expiry Checker
1. Locate the button card labeled **"Trigger Expiry Checks"**.
2. Click it.
3. *Expected Result:*
   * A loading spinner appears inside the card.
   * A green success banner displays: `"Task queued successfully! ID: [Task-UUID]"`.
   * New notification entries with status "Pending" appear in the logs table for members whose memberships are close to expiring.

### Test Case 7.3: Running the Class Schedule Reminders
1. Locate the button card labeled **"Queue Reminders"** (Class Scheduler routine).
2. Click it.
3. *Expected Result:*
   * The loading indicator spins.
   * A success banner displays: `"Task queued successfully! ID: [Task-UUID]"`.
   * Fresh notification reminders are created for members registered in today's upcoming classes.

---

## 2. Notification Audit Metrics & Logs

### Test Case 7.4: KPI Metric Card Auditing
* Verify the four summary boxes display the count of:
  * **Total** notifications
  * **Pending** tasks
  * **Processed** (Sent) tasks
  * **Failed** tasks
* These numbers must sync and sum up accurately based on the database logs.

### Test Case 7.5: Searching & Filtering Logs
1. Click the **"Failed"** status filter button.
2. *Expected Result:* Only notifications that failed to send (colored red) display in the table.
3. Click the **"SMS"** type filter button.
4. *Expected Result:* Only SMS notification types display.
5. In the search box, type a recipient name or provider name (e.g. `twilio` or `sendgrid`).
6. *Expected Result:* The logs filter dynamically down to matches.

---

## 3. Notification Job Inspector Drawer

### Test Case 7.6: Viewing Detailed Job Payloads
1. Click on any row in the notifications log table.
2. *Expected Result:* A modal inspector panel opens.
3. Verify the inspector shows:
   * **Recipient info:** Avatar, Name, Phone.
   * **Delivery specifications:** Provider name, notification type, exact timestamp.
   * **Payload details:** The message body and background variables (JSON formatting block).
4. If you clicked a **Failed** log, verify that the inspector displays a highlighted red box showing the precise **Error Message** explaining why the message failed to send.
5. Click **"Close"** or the outside backdrop to close the modal.

---

## 4. Client Sign-Off Checklist

- [ ] Control Panel cards have visual loaders and trigger server-side task queues.
- [ ] Success banners appear with Celery task IDs or confirmation feedback.
- [ ] Notification metric boxes correctly display counts for total, pending, processed, and failed items.
- [ ] Status filters (Pending, Processed, Failed) isolate matching table records.
- [ ] Type filters (SMS, Email, Push) isolate matching table records.
- [ ] Search input matches names, phone numbers, providers, and error texts.
- [ ] Clicking a log item row opens a modal containing the full notification JSON payload.
- [ ] Failed notification inspectors show explicit error text explaining delivery issues.
