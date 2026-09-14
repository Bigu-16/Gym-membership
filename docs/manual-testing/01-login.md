# Manual Testing Guide: Login & Authentication

This guide is designed for testing the application from the perspective of an end-user (gym owner/staff) receiving the system. No developer tools or code inspections are required.

---

## 1. Visual Verification & Aesthetics
* **Theme & Atmosphere:** The page should display a premium dark-themed aesthetic (`#0a0d14` background) with subtle glowing blue/indigo and green background spheres.
* **Logo & Branding:** A high-resolution Azyab logo should be centered in a glassmorphic card container.
* **Typography & Contrast:** Text labels ("Email Address", "Password") must be highly readable and uppercase with tracked spacing.

---

## 2. Interactive Features & Input Validation

### Test Case 1.1: Empty Input Validations
1. Open the login page.
2. Leave both the **Email Address** and **Password** fields blank.
3. Click the **Sign In** button.
4. *Expected Result:* The browser should block submission and prompt you to fill out the fields (HTML5 standard form validation).

### Test Case 1.2: Incorrect Credentials Feedback
1. Enter `wrong-email@example.com` in the Email field.
2. Enter `wrongpassword` in the Password field.
3. Click **Sign In**.
4. *Expected Result:* 
   * A loading spinner should briefly spin inside the button.
   * An error card with a shake animation must appear, stating `"Invalid email or password"` or another relevant server-side failure message.

### Test Case 1.3: Demo Admin Auto-fill
1. Locate the green button labeled **"Use Demo Admin Credentials"** at the bottom.
2. Click the button.
3. *Expected Result:* The Email field should immediately populate with `admin@example.com` and the Password field with `ChangeMe123!`.

### Test Case 1.4: API Configuration Settings
1. Click the underlined **"Configure"** link next to the current API address.
2. An input field should appear displaying the current backend URL.
3. Change the address or click **"Cancel"** to hide it.
4. Change the value and click **"Save"**.
5. *Expected Result:* The system should refresh and apply the new API configuration to all connection requests.

### Test Case 1.5: Successful Login
1. Ensure the demo credentials are populated (or type them manually).
2. Click **Sign In**.
3. *Expected Result:* The spinner appears, the form successfully submits, the login screen fades out, and you are redirected to the main Club Dashboard.

---

## 3. Client Sign-Off Checklist

- [ ] Page loads with custom glowing animations and displays the Azyab Wellness Gym Management branding correctly.
- [ ] Forms block sign-in attempts if fields are empty.
- [ ] Invalid email/password combination triggers a red alert banner with a shake animation.
- [ ] "Use Demo Admin Credentials" button fills input fields accurately.
- [ ] "Configure" button displays the API URL settings and allows modification.
- [ ] Submitting valid credentials redirects the user to the main Club Overview screen.
