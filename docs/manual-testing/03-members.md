# Manual Testing Guide: Member Directory & Profiles

This guide describes how to verify member profiles, directory search filters, membership cards, check-in history logs, and subscription operations (freezing or editing accounts).

---

## 1. Member Directory & Filters

### Test Case 3.1: Searching Members
1. Click the **"Member Directory"** tab in the sidebar.
2. In the **"Search name or phone..."** bar, type a specific member's name.
3. *Expected Result:* The grid filters down to matching member cards only.
4. Clear the search and type a phone number (e.g. `+971`).
5. *Expected Result:* The grid filters to show members associated with that phone number.

### Test Case 3.2: Expiry Filters
1. Click the **"Expiring"** filter button.
2. *Expected Result:* Only members whose membership expires in less than 7 days are displayed.
3. Click the **"All"** button to restore the full list.

---

## 2. Profile Details & Actions

### Test Case 3.3: Accessing Details
1. Find any member card in the grid and click **"Manage"** (or click the card itself).
2. *Expected Result:* The directory disappears, and the detail dashboard for that specific member opens, showing their details, check-in history, plan level, and digital membership card.
3. Click the back arrow at the top-left to return to the grid.

### Test Case 3.4: Freezing & Unfreezing Membership
1. On a member's detail page, locate the **"Freeze Membership"** button.
2. Click it. A pop-up modal should appear asking for a duration (in months).
3. Select `2` months and click **"Confirm Freeze"**.
4. *Expected Result:*
   * The status badge changes to **"FROZEN"** (represented in blue/indigo styling).
   * The expiry date is extended by 2 months.
   * The button label changes to **"Unfreeze Membership"**.
5. Click **"Unfreeze Membership"**.
6. *Expected Result:* The status updates back to active (green/emerald badge) and the frozen indicator disappears.

### Test Case 3.5: Editing Member Information
1. On the member details screen, scroll down to the edit section.
2. Modify the **Name**, **Phone**, **Medical Issues**, or toggle the **Messaging Opt-In** preference.
3. Click **"Save Changes"**.
4. *Expected Result:*
   * The saved values update immediately in the profile summary.
   * A success state or sync is triggered.

### Test Case 3.6: Delete Member Profile
1. Locate the **"Delete Profile"** button at the bottom of the member's profile.
2. Click the button.
3. *Expected Result:* A confirmation warning box asks if you are sure you want to delete the member.
4. Click "OK" / Confirm.
5. *Expected Result:* The member is removed, and you are automatically redirected back to the Member Directory grid. The deleted member should no longer appear in search results.

---

## 3. Membership Card & QR Codes
* **Visual Card Rendering:** On the right-hand panel, check that a digital membership card is visible.
* **Tier Aesthetics:** If the member's subscription plan is *Elite Performance* or *Diamond Access*, the card should render with a premium luxury design (gold or dark gradients). For *Wellness Pro*, it should display standard corporate wellness styling.
* **QR Code:** Verify that a scannable QR Code containing the member ID is rendered inside the card graphic.

---

## 4. Family Group Details (If Applicable)
1. Select a card representing a **Family Group** (marked as *Family Group (X Kids)*).
2. *Expected Result:*
   * The details screen displays a parent contact section.
   * Below the parent card, each child/trainee is listed individually.
   * You can edit individual kid details or click **"Freeze Group"** to freeze the entire family's membership status collectively.

---

## 5. Client Sign-Off Checklist

- [ ] Searching by name and phone filters the member cards in real-time.
- [ ] "Expiring" filter displays only members with less than 7 days left.
- [ ] Detail page renders the member's basic info, check-in history, and assigned schedule.
- [ ] Freezing membership displays a modal, extends the expiry date, and updates status to "FROZEN".
- [ ] Unfreezing membership correctly restores the active status.
- [ ] Editing member profile details saves changes and syncs with the database.
- [ ] Deleting a member removes them from the system and returns the user to the Directory.
- [ ] Membership Card visualizes correct plan colors (gold/purple/indigo gradients) and displays a QR code.
- [ ] Family group pages show individual child trainee sub-cards with correct configurations.
