# CareVisit Planner 🗓️💙
### Collaborative Caregiver Visit Coordination & Schedule Conflict Resolution Platform

**CareVisit Planner** is a full-stack MERN application purpose-built for families and care circles coordinating non-emergency support visits (companionship, grocery help, medication reminders, light household help, and transport to appointments).

---

## 🌟 Differentiating Features

### 1. Overlapping Visit Detection Engine
When a visit is created or edited, the server-side conflict detection engine (`server/services/conflictService.js`) dynamically analyzes existing visits using the temporal intersection condition:
$$\text{newStart} < \text{existingEnd} \land \text{newEnd} > \text{existingStart}$$
- **Back-to-back visits** (e.g., 10:00–11:00 and 11:00–12:00) where $End_A = Start_B$ do **not** trigger a false conflict.
- **Two conflict categories are evaluated**:
  1. *Same Care Recipient*: Two appointments overlapping in time for the care recipient.
  2. *Caregiver Double-Booking*: The assigned caregiver is already booked for another appointment during that window.
- **Workflow & UI Experience**:
  - Real-time pre-save check via `POST /api/visits/check-conflicts` as the user chooses times.
  - Interactive warning banner clearly listing each conflicting visit, times, and caregivers.
  - **Option 1: "Adjust time"** — users can pick from 2–3 conflict-free alternative daytime slots computed by **Google Gemini**.
  - **Option 2: "Save anyway"** — persists the visit flagged with `hasConflict: true` and bidirectional `conflictWith` references.

### 2. Simple Completion Timeline
A vertical, chronological timeline per care recipient:
- Grouped chronological entries displaying caregiver avatar, visit category, and location.
- High-contrast status badges: **Scheduled** 📅, **In Progress** ⏳, **Completed** ✅, **Missed** ⚠️, **Cancelled** ❌ (using icons and labels, never color alone).
- Actionable checklist tasks showing completion checkmarks, exact timestamps (`11:15 AM`), and the caregiver who completed them.
- Post-visit handover notes & caregiver observations.
- Summary progress header: Completed vs total tasks with percentage and progress bar.
- Filters: Date range picker, Caregiver filter, Status filter.

---

## 🤖 Google Gemini AI Features (`@google/genai` SDK)

Powered by Google's `gemini-3.8-flash` model, operating **strictly on the Express backend** in `server/services/aiService.js` with structured Zod schema validation:

1. **Smart Visit Entry (`POST /api/ai/parse-visit`)**:
   - Parses natural language inputs (e.g. *"Priya to take Mom to the orthopedic clinic next Tuesday 3 to 4pm and pick up medicines"*).
   - Extracts structured JSON: title, date, start/end timestamps, caregiver match, category, and actionable checklist tasks.
   - Pre-fills the visit modal for the user to review and edit before saving — never saved automatically.
2. **Conflict Resolution Suggestions (`POST /api/ai/suggest-slots`)**:
   - When a conflict is detected, sends **only** the anonymized busy time intervals and requested duration (strictly zero personal or medical data).
   - Returns 2–3 conflict-free daytime slots. Clicking a slot automatically adjusts the visit form.
3. **Weekly Care Summary (`GET /api/circles/:id/ai/weekly-summary`)**:
   - Generates a warm, plain-language narrative of the past 7 days for family members.
   - Highlights completed routines, missed tasks, and upcoming focus areas.
   - Cached in the database (`AiSummary`) with a 1-click "Regenerate" button.
4. **Caregiver Handover Notes Polisher (`POST /api/ai/handover-note`)**:
   - Formats rough caregiver notes into clean, structured handover notes for the next caregiver.
- **Safety Directive**: Gemini's system prompt strictly prohibits clinical diagnoses, medical advice, and drug dosage alterations.
- **Graceful Degradation**: If `GEMINI_API_KEY` is not provided or offline, all features degrade gracefully with helpful notices without disrupting core calendar and task workflows.

---

## 👥 Roles & Access Control (RBAC)

Enforced by `circleAuthMiddleware` on every circle-scoped route:
- **Family Admin**: Full circle ownership, manage care recipient profile, invite/remove caregivers by email, manage all visits and tasks.
- **Caregiver**: View calendar, timeline, and task log; schedule visits; check off completed tasks with timestamps and notes.
- **Viewer**: Read-only access to view calendar and timeline (cannot modify visits or toggle tasks).

---

## 🔑 Demo Accounts (Pre-Seeded)

The application automatically seeds a demo care circle (**"Eleanor Vance Care Circle"**) spanning 3 weeks of visits with deliberate conflicts:

| Name | Role | Email | Password |
|---|---|---|---|
| **Sarah Jenkins** | Family Admin | `sarah@carevisit.demo` | `Password123!` |
| **David Miller** | Caregiver (Brother) | `david@carevisit.demo` | `Password123!` |
| **Priya Sharma** | Caregiver (PT Specialist) | `priya@carevisit.demo` | `Password123!` |
| **Robert Vance** | Viewer (Grandson) | `robert@carevisit.demo` | `Password123!` |

*(The login screen also provides 1-click quick-login buttons for each demo user.)*

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, FullCalendar (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`, `@fullcalendar/list`), Axios, Lucide React icons, date-fns, react-hot-toast.
- **Backend**: Node.js v20+, Express 4.x, Mongoose 8.x.
- **Database**: MongoDB (via `MONGODB_URI` from `.env`, with automatic fallback to `mongodb-memory-server` if local MongoDB daemon is not running).
- **Authentication**: JSON Web Tokens (JWT), bcryptjs for password hashing.
- **Validation**: Zod schema validation on both server and client.
- **AI**: Google Gemini API via official `@google/genai` SDK (`gemini-3.8-flash`).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ and npm installed.

### 1. Configure Environment Variables
Inside `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/carevisit_planner
JWT_SECRET=carevisit-super-secret-jwt-token-2026-key
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

### 2. Launch With Batch Scripts (Windows)
Run `start.bat` in the root folder, or start each process manually:

**Backend:**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Frontend:**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

---

## 🧪 Unit Tests

Run the dedicated test suite for the conflict overlap engine:
```bash
cd server
npm test
```
Verifies:
1. Back-to-back visits do not conflict ($End_A = Start_B$).
2. Partial overlap detection.
3. Full containment overlap detection.
4. Identical slot collision.
5. Disjoint intervals with time gap.
6. Overnight interval calculations.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new account & optional circle |
| `POST` | `/api/auth/login` | Login and receive JWT token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & circles |
| `POST` | `/api/circles` | Create a new Care Circle |
| `GET` | `/api/circles` | List user's active circles |
| `GET` | `/api/circles/:id` | Get circle details and members |
| `PUT` | `/api/circles/:id` | Update care recipient profile (Admin only) |
| `POST` | `/api/circles/:id/members` | Invite/add caregiver by email |
| `DELETE` | `/api/circles/:id/members/:userId` | Remove member from circle |
| `GET` | `/api/circles/:id/visits` | Get all circle visits with task stats |
| `POST` | `/api/circles/:id/visits` | Schedule new visit (with conflict check) |
| `POST` | `/api/visits/check-conflicts` | Preview schedule conflicts for proposed times |
| `GET` | `/api/visits/:id` | Get single visit details with checklist |
| `PUT` | `/api/visits/:id` | Update visit times, notes, or status |
| `DELETE` | `/api/visits/:id` | Delete visit and associated tasks |
| `POST` | `/api/visits/:id/tasks` | Add checklist task to a visit |
| `PATCH` | `/api/tasks/:id/complete` | Toggle task completion with timestamp & user |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `GET` | `/api/circles/:id/timeline` | Simple completion timeline with filters & stats |
| `GET` | `/api/circles/:id/dashboard` | Dashboard metrics, conflicts, and activity feed |
| `POST` | `/api/ai/parse-visit` | Gemini natural language visit parser |
| `POST` | `/api/ai/suggest-slots` | Gemini conflict-free slot suggestions |
| `GET` | `/api/circles/:id/ai/weekly-summary` | Fetch or regenerate Gemini weekly summary |
| `POST` | `/api/ai/handover-note` | Polish caregiver rough notes into handover |
