# Azyab Wellness Gym Management - Manual Testing Guides

Welcome to the Azyab Wellness Gym Management Manual Testing Suite. These testing guides are written explicitly from the perspective of a **customer/client** or **gym operator** receiving this application. 

You do not need developer setup, terminal access, database visibility, or code readers. You only need to open the running application in your web browser and execute the tests described in each document.

---

## Guide Index & Sections

Please review and test each section of the application using the corresponding markdown guide. Each guide features step-by-step test cases, expected visual indicators, and a sign-off checklist at the end.

| Section | Guide File | Description |
| :--- | :--- | :--- |
| **01** | [01-login.md](file:///Users/user/Desktop/Gym-membership/docs/manual-testing/01-login.md) | Authentication form controls, demo login autofills, and API address configuration. |
| **02** | [02-dashboard.md](file:///Users/user/Desktop/Gym-membership/docs/manual-testing/02-dashboard.md) | Navigation sidebar, member check-in flows, active session checklist managers, and recent activity logs. |
| **03** | [03-members.md](file:///Users/user/Desktop/Gym-membership/docs/manual-testing/03-members.md) | Member stream search, expiring filters, freeze/unfreeze operations, profile editing, and VIP membership card generation. |
| **04** | [04-enrollment.md](file:///Users/user/Desktop/Gym-membership/docs/manual-testing/04-enrollment.md) | Group & Personal training forms, parent-child sibling family units, phone flags validation, dynamic package fee calculator, and booking checkout. |
| **05** | [05-schedule.md](file:///Users/user/Desktop/Gym-membership/docs/manual-testing/05-schedule.md) | Calendar day/week/month displays, class templates roster creation, live session drawers, and session progress/status controls. |
| **06** | [06-analytics.md](file:///Users/user/Desktop/Gym-membership/docs/manual-testing/06-analytics.md) | Live business dashboards, subscription donut charts (interactive tooltips), financial trend lines, and hour-by-hour zone heatmaps. |
| **07** | [07-notifications.md](file:///Users/user/Desktop/Gym-membership/docs/manual-testing/07-notifications.md) | Celery background task managers (reminders & checkers), delivery status grids, and json message inspect tools. |

---

## How to Conduct Manual Testing

1. **Access the Interface:** Log in to the application using the instructions in [01-login.md](file:///Users/user/Desktop/Gym-membership/docs/manual-testing/01-login.md).
2. **Execute Test Cases:** Follow the numbered steps under each test case.
3. **Verify Expected Results:** Ensure that visual feedback (banners, colors, modal screens, animated transitions) matches the *"Expected Result"* description.
4. **Mark Off Checkboxes:** Once you confirm a feature behaves as described, mark off the corresponding checkbox in the document's sign-off checklist.
5. **Report Issues:** If an expected result does not occur, note the step and screen configuration where the mismatch happened.

---

## Global System Client Sign-Off Matrix

- [ ] **Authentication Module:** Users can configure backend settings, use demo logins, and sign in.
- [ ] **Control Dashboard:** Quick check-in workflows, live tracking of active gym-goers, and session logs work.
- [ ] **Member Directory:** Staff can look up client records, freeze billing plans, and view digital ID cards.
- [ ] **Enrollment Form:** Multi-person family units can register with custom training schedules and automated billing calculations.
- [ ] **Class Schedule:** Class calendars load appropriately, recurring templates can be adjusted, and trainers can track warm-up/stretch progress.
- [ ] **Reports & Charts:** Financial charts and room occupancy heatmaps render interactive data visualizations.
- [ ] **Notification Logs:** Automated Celery jobs scan expiration details and queue outgoing messages with details visibility.
