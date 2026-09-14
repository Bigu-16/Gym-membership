# Manual Testing Guide: Enrollment & Registration

This guide outlines steps for verifying the registration workflow of new members, including family enrollments, class bookings, schedule configurations, and automatic price calculations.

---

## 1. Training Setup & Selection
* **Toggle Form Modes:** At the top of the registration page, toggle between **"Group Class"** and **"Personal Training"**.
* **Mode-Specific Layouts:** Verify that selecting *Group Class* displays preset schedule slots, while selecting *Personal Training* shows options for *Individual* vs. *Group* and custom slots.

---

## 2. Parent & Trainee Information Fields

### Test Case 4.1: Contact Details & Phone Validation
1. Input values for the parent/main contact: **Name** and **Email Address**.
2. Locate the **Phone Number** input field.
3. Click the flag icon inside the phone input to open the country dropdown menu.
4. Select a country (e.g., United Arab Emirates or United States).
5. *Expected Result:* The country code updates automatically, and custom character formatting/placeholder adapts to the selected country's format.
6. Enter a valid phone number.

### Test Case 4.2: Managing Multiple Trainees
1. Fill in the details for **Trainee 1** (Name, Age, Gender, Medical Issues, Service/Class, Frequency).
2. Click the **"Add Kid / Trainee"** button.
3. *Expected Result:* A new trainee form block appears underneath, allowing you to enter details for a second trainee (e.g. sibling).
4. Click the **"Remove"** button on the second trainee's block.
5. *Expected Result:* The second trainee form block is deleted. (Note: The remove button should be hidden or disabled if only one trainee remains).

---

## 3. Schedule & Availability Selections

### Test Case 4.3: Preset Class Selection
1. Select **"Group Class"** at the top.
2. In the Schedule Section, select **"Preset Class Slot"**.
3. Click the dropdown list.
4. *Expected Result:* A list of available scheduled templates (e.g., *"Kids Taekwondo: Mon, Wed @ 4:00 PM"*) displays.
5. Choose one slot.

### Test Case 4.4: Custom Training Slots (Personal Sessions)
1. Select **"Personal Training"** at the top.
2. Under Schedule, select **"Custom Calendar Schedule"**.
3. Adjust the duration slider (e.g., set to `1.5` hours).
4. Click **"Add Day/Time Slot"** to add multiple training times.
5. Choose days of the week (e.g. Tuesday, Thursday) and times (e.g. `09:30 AM`).
6. *Expected Result:* The slot selector elements render dynamically and allow easy calendar planning.

---

## 4. Automatic Pricing & Payment Simulation

### Test Case 4.5: Dynamic Price Calculator
1. Set the subscription duration to **1 Month**.
2. Select **Taekwondo** as the service for Trainee 1.
3. Add a second trainee and select **Kickboxing**.
4. Change the duration from **1 Month** to **3 Months**.
5. *Expected Result:* The **"Calculated Package Fee"** text updates automatically in real-time based on the pricing tier, number of kids, and selected duration.

### Test Case 4.6: Completing Payment Details
1. Choose a currency (e.g., `AED`, `USD`, `EUR`).
2. Select a **Payment Method** (Cash, Card, Bank Transfer, Apple Pay).
3. Set the payment status to **"Paid"** or **"Pending"**.

---

## 5. Enrollment Submission & Success Validation

### Test Case 4.7: Submission Success Screen
1. Click the **"Complete Enrollment & Billing"** button.
2. *Expected Result:*
   * A fullscreen animated success page appears.
   * A checkmark animation or glowing banner displays: `"Enrollment Successfully Registered!"`.
   * Previews of the new member profile card(s) and upcoming session calendar cards are displayed.
3. Click the **"Register Another Member"** button.
4. *Expected Result:* The success page disappears, and the form resets back to its default state ready for a new registration.

---

## 6. Client Sign-Off Checklist

- [ ] Form switches layouts seamlessly between Group Class and Personal Training modes.
- [ ] Country phone dropdown changes formatting and correctly prefixes country codes.
- [ ] Multiple trainees can be added or removed from a single family group.
- [ ] Schedule preset dropdown lists current available class templates.
- [ ] Custom calendar schedule slot controls let you add days and times.
- [ ] Subtotal calculations update dynamically when plans, trainee counts, or durations change.
- [ ] Currency and payment method dropdowns allow selecting standard commercial variants.
- [ ] Submitting the form triggers a stylized success banner, previews the new member cards, and provides a clear reset button.
