# Manual Testing Guide: Business Analytics & Reports

This guide describes how to verify the gym performance metrics, financial growth trajectory charts, subscription distribution donut charts, and the interactive gym attendance heatmap.

---

## 1. Key Performance Metric Cards
1. Open the **"Business Analytics"** tab from the sidebar.
2. Locate the top row of metrics: **Monthly Revenue**, **Average Trainer Rating**, **Active Retention Rate**, and **Avg Check-ins/Day**.
3. *Expected Result:*
   * **Monthly Revenue** should update dynamically depending on active members and their subscription tiers (Elite Performance = $250, Wellness Pro = $150, Diamond Access = $400).
   * **Avg Check-ins/Day** should scale relative to total member count.

---

## 2. Membership Distribution (Donut Chart)
* **Hover Interaction:** Move your mouse over the colored sections of the circular **Membership Distribution** SVG donut chart.
* **Segment Tooltips:** Verify that hovering highlights the segment and displays:
  * Plan Name (e.g. *Elite Performance*)
  * Precise member count (e.g. *12 members*)
  * Percent share of total membership (e.g. *40%*)
* **Legend Alignment:** Verify the colored legend markers match the donut colors and reflect correct member metrics.

---

## 3. Financial Trajectory & Enrollment Line Graph
* **Bezier Curve Chart:** A smooth line chart displaying monthly enrollment numbers and revenue (November through May).
* **Hover Nodes:** Move the cursor over individual monthly coordinate nodes (dots) along the line curve.
* **Interactive Tooltip:** Verify that a custom popover displays:
  * Selected Month (e.g. *March*)
  * Revenue (e.g. *$2,450*)
  * Registered Members count (e.g. *18*)

---

## 4. Club Attendance Heatmap (Occupancy Analysis)

### Test Case 6.1: Heatmap Zone Toggling
1. Scroll down to the **"Hourly Zone Occupancy Heatmap"** section.
2. Click the zone buttons: **All, Martial Arts Zone, Strength & Conditioning, Cardio Lounge, Recovery Lounge**.
3. *Expected Result:* The grid cell colors shift, displaying hourly load data tailored to the selected gym zone.

### Test Case 6.2: Grid Cell Hovering
1. Hover over any cell in the hour-by-hour grid (columns represent hours from *6:00 AM* to *10:00 PM*).
2. *Expected Result:*
   * The cell expands or glows.
   * A details popup appears showing: Hour, occupancy rate (e.g., *78% Peak* or *12% Low*), and estimated head count (e.g. *14 Active Members*).

---

## 5. Class Popularity & Booking Logs
* **Popularity Progress Bars:** Verify that class names (e.g., *Kids Taekwondo, Yoga Calm, Cardio Burn*) display with horizontal progress bars representing enrollment levels.
* **Utilization Percentages:** Confirm that progress bars show capacity occupancy (e.g., *85% Capacity filled*) and booking counts.

---

## 6. Client Sign-Off Checklist

- [ ] Top row of KPIs reflects calculated totals rather than placeholder text.
- [ ] SVG Donut chart segments change size when hovered and display exact plans, counts, and percentages.
- [ ] Hovering line chart dots displays monthly statistics tooltips.
- [ ] Heatmap hourly cells show correct colors depending on load severity (green = low, yellow = medium, red = peak).
- [ ] Zone filters under the heatmap display distinct occupancy values when selected.
- [ ] Hovering over hourly cell squares displays hour, occupancy classification, and active count.
- [ ] Class popularity rankings show correct progress bars and capacity percentages.
