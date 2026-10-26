# Gym Management Backend - API & Security Requirements Document

This document lists the backend modifications, missing APIs, and security/sanitization standards needed to support the full gym membership system in production.

---

## 1. Missing API Endpoints

### 🗓️ Class Templates Management
The frontend UI allows managers to edit and delete class templates, but these updates are currently local-only because the backend lacks the corresponding endpoints.

1. **Update Class Template**
   * **Endpoint:** `PATCH /api/v1/schedule/templates/{template_id}`
   * **Role Required:** Admin
   * **Payload Schema:** `ScheduleTemplateUpdate` (allowing edits to class name, times, capacity, and days).
2. **Delete Class Template**
   * **Endpoint:** `DELETE /api/v1/schedule/templates/{template_id}`
   * **Role Required:** Admin
   * **Expected Behavior:** Deletes the template and handles cascading database dependencies.

---

### 📝 Live Session Checklist Persistence
Currently, session checklist tasks (checking off a task, adding custom tasks, or deleting tasks inside a session) are saved in the client's `localStorage` because there is no API endpoint to store general session details.

1. **Update Session Details & Checklist**
   * **Endpoint:** `PATCH /api/v1/schedule/sessions/{session_id}`
   * **Role Required:** Admin / Staff
   * **Payload Schema:** Allows modifying the `checklist_data` JSON column (the checklist array of tasks).
   * **Why it's needed:** Ensures that when trainers check off items or add custom items, those edits are synced across all devices and do not get lost when the browser cache is cleared.

---

## 2. Input Validation & Schema Hardening

To prevent junk data submissions and database clutter, we need strict validation checks implemented in the backend schemas (Pydantic / SQL Models):

1. **Name Field Restrictions:**
   * Apply regex constraints on Member and User creation schemas (e.g. `name: constr(regex="^[a-zA-Z\s\-']+$")` or similar) to allow only alphabet characters, spaces, hyphens, and apostrophes.
2. **Age Bounds:**
   * Enforce age verification on child trainee creation (e.g., minimum age of `4` or `5`, maximum of `18`).
3. **Database Input Sanitization:**
   * Strip HTML tags from text inputs (like name and medical issues) before saving to the database to prevent **Stored XSS (Cross-Site Scripting)** vulnerabilities.

---

## 3. Production Security Hardening

Before deploying the backend application to staging/production, the following configurations must be set:

1. **Deactivate Bootstrap Endpoints:**
   * The `/api/v1/auth/bootstrap-admin` endpoint must be disabled or protected in production to prevent malicious actors from bootstrapping admin accounts.
2. **Deactivate Demo Seeding Routines:**
   * Restrict or disable the `/api/v1/tasks/seed-demo-data` endpoint in non-development environments to prevent database resets.
3. **Rate Limiting:**
   * Implement IP rate-limiting (e.g., using Redis/Celery middleware or FastAPI slowapi) on auth paths, specifically:
     * `POST /api/v1/auth/login` (to block brute-force attempts).
