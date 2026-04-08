# Onboarding Diary App — Development Specification

A web application for new recruits to document their onboarding journey. Users log daily tasks, record issues, provide feedback, and capture notes. Managers can view entries and generate downloadable reports.

**Tech Stack:** React (Vite) frontend, FastAPI backend, PostgreSQL, Docker Compose

---

## Table of Contents

1. [User Stories](#1-user-stories)
2. [API Endpoints](#2-api-endpoints)
3. [Database Schema](#3-database-schema)
4. [UI Flow](#4-ui-flow)
5. [Validation Rules](#5-validation-rules)
6. [Suggested Additional Features](#6-suggested-additional-features)

---

## 1. User Stories

### 1.1 Authentication & Profile

| ID | Role | Story |
|----|------|-------|
| US-AUTH-01 | New Recruit | As a new recruit, I want to sign up with my email and password, so that I can create an account and start documenting my onboarding. |
| US-AUTH-02 | New Recruit | As a new recruit, I want to log in with my email and password, so that I can access my diary entries. |
| US-AUTH-03 | New Recruit | As a new recruit, I want to update my profile (name, department, start date), so that my information stays current. |
| US-AUTH-04 | Manager | As a manager, I want to log in with my credentials, so that I can view and manage recruit entries. |
| US-AUTH-05 | Admin | As an admin, I want to log in with my credentials, so that I can manage users and oversee all data. |
| US-AUTH-06 | Any User | As a user, I want to log out, so that my session is securely ended. |
| US-AUTH-07 | Any User | As a user, I want to reset my password via email, so that I can regain access if I forget it. |

### 1.2 Task Log

| ID | Role | Story |
|----|------|-------|
| US-TASK-01 | New Recruit | As a new recruit, I want to create a task entry with date, title, description, category, status, and priority, so that I can document what I worked on each day. |
| US-TASK-02 | New Recruit | As a new recruit, I want to edit an existing task entry, so that I can correct or update details. |
| US-TASK-03 | New Recruit | As a new recruit, I want to delete a task entry, so that I can remove entries that are no longer relevant. |
| US-TASK-04 | New Recruit | As a new recruit, I want to filter my tasks by date, category, or status, so that I can quickly find specific entries. |
| US-TASK-05 | Manager | As a manager, I want to view task entries for recruits I oversee, so that I can track their onboarding progress. |

### 1.3 Issue Log

| ID | Role | Story |
|----|------|-------|
| US-ISSUE-01 | New Recruit | As a new recruit, I want to log an issue or blocker with date, title, description, severity, status, and resolution notes, so that I can track problems I encounter. |
| US-ISSUE-02 | New Recruit | As a new recruit, I want to edit an existing issue entry, so that I can update its status or add resolution notes. |
| US-ISSUE-03 | New Recruit | As a new recruit, I want to delete an issue entry, so that I can remove resolved or irrelevant issues. |
| US-ISSUE-04 | New Recruit | As a new recruit, I want to filter issues by status or severity, so that I can focus on open or critical blockers. |
| US-ISSUE-05 | Manager | As a manager, I want to view issues logged by recruits I oversee, so that I can help resolve blockers. |

### 1.4 Feedback Notes

| ID | Role | Story |
|----|------|-------|
| US-FB-01 | New Recruit | As a new recruit, I want to submit feedback about the onboarding process with a date, subject, type, and details, so that I can share what's working and what can improve. |
| US-FB-02 | New Recruit | As a new recruit, I want to edit my feedback, so that I can refine my comments. |
| US-FB-03 | New Recruit | As a new recruit, I want to delete a feedback entry, so that I can remove outdated feedback. |
| US-FB-04 | Manager | As a manager, I want to view feedback submitted by recruits I oversee, so that I can improve the onboarding experience. |

### 1.5 Additional Notes

| ID | Role | Story |
|----|------|-------|
| US-NOTE-01 | New Recruit | As a new recruit, I want to create free-form notes with date, title, content, and tags, so that I can capture miscellaneous thoughts and learnings. |
| US-NOTE-02 | New Recruit | As a new recruit, I want to edit or delete my notes, so that I can keep them organized. |
| US-NOTE-03 | New Recruit | As a new recruit, I want to search or filter notes by tags, so that I can quickly find related entries. |

### 1.6 Dashboard

| ID | Role | Story |
|----|------|-------|
| US-DASH-01 | New Recruit | As a new recruit, I want to see a dashboard with summary counts of my tasks, issues, feedback, and notes, so that I have an overview of my onboarding progress. |
| US-DASH-02 | New Recruit | As a new recruit, I want to see my recent entries across all categories on the dashboard, so that I can quickly resume where I left off. |
| US-DASH-03 | New Recruit | As a new recruit, I want to see my task completion progress and open issues at a glance, so that I know what needs attention. |
| US-DASH-04 | Manager | As a manager, I want a dashboard showing aggregate statistics for all recruits I oversee, so that I can monitor overall onboarding progress. |

### 1.7 Reports

| ID | Role | Story |
|----|------|-------|
| US-RPT-01 | New Recruit | As a new recruit, I want to generate a report of my entries by date range (tasks, issues, feedback, or combined), so that I can review my onboarding journey. |
| US-RPT-02 | New Recruit | As a new recruit, I want to download my report as PDF or CSV, so that I can share it offline. |
| US-RPT-03 | Manager | As a manager, I want to generate reports for recruits I oversee by date range, so that I can assess their onboarding progress. |
| US-RPT-04 | Manager | As a manager, I want to download reports as PDF or CSV, so that I can archive or distribute them. |

### 1.8 Admin

| ID | Role | Story |
|----|------|-------|
| US-ADM-01 | Admin | As an admin, I want to view a list of all users, so that I can manage the system. |
| US-ADM-02 | Admin | As an admin, I want to create, edit, or deactivate user accounts, so that I can control access. |
| US-ADM-03 | Admin | As an admin, I want to assign roles (recruit, manager, admin) to users, so that permissions are correctly applied. |
| US-ADM-04 | Admin | As an admin, I want to assign recruits to managers, so that the manager-recruit relationship is established. |
| US-ADM-05 | Admin | As an admin, I want to view all data across all users, so that I can audit and troubleshoot. |

---

## 2. API Endpoints

Base URL: `/api/v1`

All authenticated endpoints require a `Bearer` token in the `Authorization` header.

### 2.1 Authentication

| Method | Path | Description | Auth | Request Body | Response |
|--------|------|-------------|------|--------------|----------|
| POST | `/auth/register` | Register a new user | No | `{ "email": str, "password": str, "full_name": str, "role": enum, "department": str, "start_date": date }` | `201 { "id": uuid, "email": str, "full_name": str, "role": str }` |
| POST | `/auth/login` | Log in and receive JWT | No | `{ "email": str, "password": str }` | `200 { "access_token": str, "token_type": "bearer", "user": {...} }` |
| POST | `/auth/logout` | Invalidate current token | Yes | — | `200 { "message": "Logged out" }` |
| POST | `/auth/password-reset` | Request password reset email | No | `{ "email": str }` | `200 { "message": "Reset email sent" }` |
| POST | `/auth/password-reset/confirm` | Reset password with token | No | `{ "token": str, "new_password": str }` | `200 { "message": "Password updated" }` |

### 2.2 User Profile

| Method | Path | Description | Auth | Request Body | Response |
|--------|------|-------------|------|--------------|----------|
| GET | `/users/me` | Get current user profile | Yes | — | `200 { "id": uuid, "email": str, "full_name": str, "role": str, "department": str, "start_date": date, "is_active": bool }` |
| PUT | `/users/me` | Update current user profile | Yes | `{ "full_name"?: str, "department"?: str, "start_date"?: date }` | `200 { ...updated user }` |
| GET | `/users` | List all users (Admin only) | Yes (Admin) | Query: `?role=`, `?is_active=`, `?page=`, `?per_page=` | `200 { "items": [...], "total": int, "page": int, "per_page": int }` |
| GET | `/users/{user_id}` | Get user by ID (Admin only) | Yes (Admin) | — | `200 { ...user }` |
| PUT | `/users/{user_id}` | Update user (Admin only) | Yes (Admin) | `{ "role"?: str, "is_active"?: bool, "manager_id"?: uuid }` | `200 { ...updated user }` |

### 2.3 Task Log

| Method | Path | Description | Auth | Request Body | Response |
|--------|------|-------------|------|--------------|----------|
| POST | `/tasks` | Create a new task | Yes (Recruit) | `{ "date": date, "title": str, "description": str, "category": str, "status": enum, "priority": enum }` | `201 { ...task }` |
| GET | `/tasks` | List current user's tasks | Yes | Query: `?date_from=`, `?date_to=`, `?category=`, `?status=`, `?page=`, `?per_page=` | `200 { "items": [...], "total": int, "page": int, "per_page": int }` |
| GET | `/tasks/{task_id}` | Get a single task | Yes | — | `200 { ...task }` |
| PUT | `/tasks/{task_id}` | Update a task | Yes (Owner) | `{ "title"?: str, "description"?: str, ... }` | `200 { ...updated task }` |
| DELETE | `/tasks/{task_id}` | Delete a task | Yes (Owner) | — | `204 No Content` |
| GET | `/users/{user_id}/tasks` | List tasks for a specific user | Yes (Manager/Admin) | Query: same filters as above | `200 { "items": [...], ... }` |

### 2.4 Issue Log

| Method | Path | Description | Auth | Request Body | Response |
|--------|------|-------------|------|--------------|----------|
| POST | `/issues` | Create a new issue | Yes (Recruit) | `{ "date": date, "title": str, "description": str, "severity": enum, "status": enum, "resolution_notes"?: str }` | `201 { ...issue }` |
| GET | `/issues` | List current user's issues | Yes | Query: `?status=`, `?severity=`, `?date_from=`, `?date_to=`, `?page=`, `?per_page=` | `200 { "items": [...], "total": int, "page": int, "per_page": int }` |
| GET | `/issues/{issue_id}` | Get a single issue | Yes | — | `200 { ...issue }` |
| PUT | `/issues/{issue_id}` | Update an issue | Yes (Owner) | `{ "title"?: str, "status"?: str, "resolution_notes"?: str, ... }` | `200 { ...updated issue }` |
| DELETE | `/issues/{issue_id}` | Delete an issue | Yes (Owner) | — | `204 No Content` |
| GET | `/users/{user_id}/issues` | List issues for a specific user | Yes (Manager/Admin) | Query: same filters | `200 { "items": [...], ... }` |

### 2.5 Feedback Notes

| Method | Path | Description | Auth | Request Body | Response |
|--------|------|-------------|------|--------------|----------|
| POST | `/feedback` | Submit feedback | Yes (Recruit) | `{ "date": date, "subject": str, "type": enum, "details": str }` | `201 { ...feedback }` |
| GET | `/feedback` | List current user's feedback | Yes | Query: `?type=`, `?date_from=`, `?date_to=`, `?page=`, `?per_page=` | `200 { "items": [...], ... }` |
| GET | `/feedback/{feedback_id}` | Get a single feedback entry | Yes | — | `200 { ...feedback }` |
| PUT | `/feedback/{feedback_id}` | Update feedback | Yes (Owner) | `{ "subject"?: str, "type"?: str, "details"?: str }` | `200 { ...updated feedback }` |
| DELETE | `/feedback/{feedback_id}` | Delete feedback | Yes (Owner) | — | `204 No Content` |
| GET | `/users/{user_id}/feedback` | List feedback for a specific user | Yes (Manager/Admin) | Query: same filters | `200 { "items": [...], ... }` |

### 2.6 Additional Notes

| Method | Path | Description | Auth | Request Body | Response |
|--------|------|-------------|------|--------------|----------|
| POST | `/notes` | Create a note | Yes (Recruit) | `{ "date": date, "title": str, "content": str, "tags": [str] }` | `201 { ...note }` |
| GET | `/notes` | List current user's notes | Yes | Query: `?tags=`, `?date_from=`, `?date_to=`, `?page=`, `?per_page=` | `200 { "items": [...], ... }` |
| GET | `/notes/{note_id}` | Get a single note | Yes | — | `200 { ...note }` |
| PUT | `/notes/{note_id}` | Update a note | Yes (Owner) | `{ "title"?: str, "content"?: str, "tags"?: [str] }` | `200 { ...updated note }` |
| DELETE | `/notes/{note_id}` | Delete a note | Yes (Owner) | — | `204 No Content` |

### 2.7 Dashboard

| Method | Path | Description | Auth | Request Body | Response |
|--------|------|-------------|------|--------------|----------|
| GET | `/dashboard` | Get dashboard data for current user | Yes | — | `200 { "summary": { "total_tasks": int, "completed_tasks": int, "open_issues": int, "total_feedback": int, "total_notes": int }, "recent_tasks": [...], "recent_issues": [...], "recent_feedback": [...], "recent_notes": [...], "task_completion_rate": float }` |
| GET | `/dashboard/manager` | Get aggregate dashboard for manager | Yes (Manager) | Query: `?recruit_id=` | `200 { "recruits": [...], "aggregate_summary": {...} }` |

### 2.8 Reports

| Method | Path | Description | Auth | Request Body | Response |
|--------|------|-------------|------|--------------|----------|
| POST | `/reports/generate` | Generate a report | Yes | `{ "date_from": date, "date_to": date, "type": enum, "format": enum, "user_id"?: uuid }` | `200 { "report_id": uuid, "download_url": str }` |
| GET | `/reports/{report_id}/download` | Download a generated report | Yes | — | `200 (file: PDF or CSV)` |
| GET | `/reports` | List previously generated reports | Yes | Query: `?page=`, `?per_page=` | `200 { "items": [...], ... }` |

**Enums used across endpoints:**

| Enum | Values |
|------|--------|
| `Role` | `recruit`, `manager`, `admin` |
| `TaskStatus` | `not_started`, `in_progress`, `completed`, `on_hold` |
| `TaskPriority` | `low`, `medium`, `high`, `critical` |
| `TaskCategory` | `training`, `documentation`, `meeting`, `setup`, `development`, `other` |
| `IssueSeverity` | `low`, `medium`, `high`, `critical` |
| `IssueStatus` | `open`, `in_progress`, `resolved`, `closed` |
| `FeedbackType` | `positive`, `suggestion`, `concern` |
| `ReportType` | `tasks`, `issues`, `feedback`, `combined` |
| `ReportFormat` | `pdf`, `csv` |

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram (textual)

```
users 1───┐
           ├──< tasks
           ├──< issues
           ├──< feedback
           ├──< notes
           ├──< reports
           └──1 users (manager_id → users.id)
```

### 3.2 Table Definitions

#### `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Primary key |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Login email |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Bcrypt-hashed password |
| `full_name` | `VARCHAR(150)` | NOT NULL | Display name |
| `role` | `VARCHAR(20)` | NOT NULL, CHECK IN ('recruit','manager','admin') | User role |
| `department` | `VARCHAR(100)` | NULL | Department name |
| `start_date` | `DATE` | NULL | Onboarding start date |
| `manager_id` | `UUID` | FK → users.id, NULL | Assigned manager (for recruits) |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Account active flag |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:** `idx_users_email` (UNIQUE), `idx_users_manager_id`, `idx_users_role`

---

#### `tasks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Primary key |
| `user_id` | `UUID` | FK → users.id, NOT NULL, ON DELETE CASCADE | Owner |
| `date` | `DATE` | NOT NULL | Task date |
| `title` | `VARCHAR(200)` | NOT NULL | Task title |
| `description` | `TEXT` | NULL | Task description |
| `category` | `VARCHAR(30)` | NOT NULL, CHECK IN ('training','documentation','meeting','setup','development','other') | Task category |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT 'not_started', CHECK IN ('not_started','in_progress','completed','on_hold') | Task status |
| `priority` | `VARCHAR(10)` | NOT NULL, DEFAULT 'medium', CHECK IN ('low','medium','high','critical') | Task priority |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:** `idx_tasks_user_id`, `idx_tasks_date`, `idx_tasks_status`, `idx_tasks_category`

---

#### `issues`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Primary key |
| `user_id` | `UUID` | FK → users.id, NOT NULL, ON DELETE CASCADE | Owner |
| `date` | `DATE` | NOT NULL | Issue date |
| `title` | `VARCHAR(200)` | NOT NULL | Issue title |
| `description` | `TEXT` | NOT NULL | Issue description |
| `severity` | `VARCHAR(10)` | NOT NULL, CHECK IN ('low','medium','high','critical') | Severity level |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT 'open', CHECK IN ('open','in_progress','resolved','closed') | Issue status |
| `resolution_notes` | `TEXT` | NULL | How the issue was resolved |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:** `idx_issues_user_id`, `idx_issues_date`, `idx_issues_status`, `idx_issues_severity`

---

#### `feedback`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Primary key |
| `user_id` | `UUID` | FK → users.id, NOT NULL, ON DELETE CASCADE | Owner |
| `date` | `DATE` | NOT NULL | Feedback date |
| `subject` | `VARCHAR(200)` | NOT NULL | Feedback subject |
| `type` | `VARCHAR(20)` | NOT NULL, CHECK IN ('positive','suggestion','concern') | Feedback type |
| `details` | `TEXT` | NOT NULL | Feedback details |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:** `idx_feedback_user_id`, `idx_feedback_date`, `idx_feedback_type`

---

#### `notes`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Primary key |
| `user_id` | `UUID` | FK → users.id, NOT NULL, ON DELETE CASCADE | Owner |
| `date` | `DATE` | NOT NULL | Note date |
| `title` | `VARCHAR(200)` | NOT NULL | Note title |
| `content` | `TEXT` | NOT NULL | Note content |
| `tags` | `TEXT[]` | NOT NULL, DEFAULT '{}' | Array of tag strings |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:** `idx_notes_user_id`, `idx_notes_date`, `idx_notes_tags` (GIN index on `tags`)

---

#### `reports`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Primary key |
| `generated_by` | `UUID` | FK → users.id, NOT NULL | User who generated the report |
| `target_user_id` | `UUID` | FK → users.id, NULL | The recruit the report is about (NULL = self) |
| `date_from` | `DATE` | NOT NULL | Report start date |
| `date_to` | `DATE` | NOT NULL | Report end date |
| `report_type` | `VARCHAR(20)` | NOT NULL, CHECK IN ('tasks','issues','feedback','combined') | Report category |
| `format` | `VARCHAR(5)` | NOT NULL, CHECK IN ('pdf','csv') | Download format |
| `file_path` | `VARCHAR(500)` | NOT NULL | Path to generated file on server |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Generation timestamp |

**Indexes:** `idx_reports_generated_by`, `idx_reports_target_user_id`

---

### 3.3 SQL Migration (initial)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('recruit', 'manager', 'admin')),
    department VARCHAR(100),
    start_date DATE,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL CHECK (category IN ('training','documentation','meeting','setup','development','other')),
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed','on_hold')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    subject VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('positive','suggestion','concern')),
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_by UUID NOT NULL REFERENCES users(id),
    target_user_id UUID REFERENCES users(id),
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('tasks','issues','feedback','combined')),
    format VARCHAR(5) NOT NULL CHECK (format IN ('pdf','csv')),
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_manager_id ON users(manager_id);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_date ON tasks(date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_category ON tasks(category);

CREATE INDEX idx_issues_user_id ON issues(user_id);
CREATE INDEX idx_issues_date ON issues(date);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_severity ON issues(severity);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_date ON feedback(date);
CREATE INDEX idx_feedback_type ON feedback(type);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_date ON notes(date);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);

CREATE INDEX idx_reports_generated_by ON reports(generated_by);
CREATE INDEX idx_reports_target_user_id ON reports(target_user_id);
```

---

## 4. UI Flow

### 4.1 Page Map

```
/login ──────────────────────────────────────────────────┐
/register ───────────────────────────────────────────────┤
                                                         ▼
                                                   /dashboard
                                                    (Home)
                                                   ┌──┴──┐
                          ┌────────────────────────┐│     │┌──────────────────────┐
                          ▼                        ▼▼     ▼▼                      ▼
                       /tasks                  /issues   /feedback             /notes
                       /tasks/new              /issues/new                     /notes/new
                       /tasks/:id/edit         /issues/:id/edit               /notes/:id/edit
                                                                               │
                                                                               ▼
                                                                          /reports
                                                                          /reports/generate
                                                                               │
                                                                               ▼
                                                                      /admin/users (Admin)
                                                                      /admin/users/:id
                                                                               │
                                                                               ▼
                                                                        /profile
```

### 4.2 Screen-by-Screen Flow

#### Login Page (`/login`)

- Email and password fields
- "Sign Up" link → `/register`
- "Forgot Password?" link → triggers password reset flow
- On success → redirect to `/dashboard`

#### Registration Page (`/register`)

- Fields: Full Name, Email, Password, Confirm Password, Department, Start Date
- Role defaults to `recruit` (admin assigns roles later)
- On success → redirect to `/login` with success message

#### Dashboard (`/dashboard`)

- **Top bar:** App logo, user name, role badge, logout button, profile link
- **Side navigation:** Dashboard, Tasks, Issues, Feedback, Notes, Reports, Admin (if admin)
- **Summary cards:** Total Tasks, Completed Tasks, Open Issues, Total Feedback, Total Notes
- **Task completion progress bar:** visual percentage of completed vs. total tasks
- **Recent entries section:** Last 5 entries from each category in tabbed or accordion layout
- **Manager view (if role=manager):** Dropdown to select a recruit → shows their summary

#### Task Log (`/tasks`)

- **List view:** Table/cards with columns: Date, Title, Category, Status, Priority, Actions (Edit/Delete)
- **Filters bar:** Date range picker, category dropdown, status dropdown
- **"+ New Task" button** → opens `/tasks/new` (form with all fields)
- **Edit page** (`/tasks/:id/edit`) — pre-filled form
- **Delete** — confirmation dialog before removal

#### Issue Log (`/issues`)

- **List view:** Table with columns: Date, Title, Severity, Status, Actions
- **Filters bar:** Status dropdown, severity dropdown, date range
- **"+ New Issue" button** → opens `/issues/new`
- **Edit page** (`/issues/:id/edit`) — includes resolution notes field
- Severity badges color-coded: Low (green), Medium (yellow), High (orange), Critical (red)

#### Feedback (`/feedback`)

- **List view:** Cards grouped by type (Positive / Suggestion / Concern) or flat list with type badges
- **Filters:** Type dropdown, date range
- **"+ New Feedback" button** → opens inline form or modal
- **Edit/Delete** actions on each entry

#### Notes (`/notes`)

- **List view:** Cards showing title, date, tags (as chips), truncated content preview
- **Filter/Search:** Tag filter (multi-select), date range, text search
- **"+ New Note" button** → form with title, content (rich text or markdown), tags input
- **Edit page** (`/notes/:id/edit`)

#### Reports (`/reports`)

- **Generate Report form:**
  - Date range (from / to) pickers
  - Report type selector: Tasks, Issues, Feedback, Combined
  - Format selector: PDF, CSV
  - For managers: recruit selector dropdown
- **Report history list:** Previously generated reports with download links
- **Download button** triggers file download

#### Admin — User Management (`/admin/users`)

- **User list table:** Name, Email, Role, Department, Status (Active/Inactive), Manager, Actions
- **Edit user** (`/admin/users/:id`): change role, assign/unassign manager, activate/deactivate
- **Create user** button for admin to add users directly

#### Profile (`/profile`)

- View and edit: Full Name, Department, Start Date
- Change Password section
- View role (read-only)

### 4.3 Responsive Behavior

- **Desktop (≥1024px):** Side navigation always visible, content fills remaining width
- **Tablet (768–1023px):** Collapsible side navigation (hamburger menu), full-width content
- **Mobile (<768px):** Bottom navigation bar with icons, single-column layout, stacked cards

---

## 5. Validation Rules

### 5.1 Authentication

| Field | Rules |
|-------|-------|
| `email` | Required, valid email format, max 255 chars, must be unique (on registration) |
| `password` | Required, min 8 chars, max 128 chars, must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character |
| `confirm_password` | Required (registration only), must match `password` |
| `full_name` | Required, min 2 chars, max 150 chars, alphabetic characters and spaces only |

### 5.2 User Profile

| Field | Rules |
|-------|-------|
| `full_name` | Required, min 2 chars, max 150 chars |
| `department` | Optional, max 100 chars |
| `start_date` | Optional, must be a valid date, cannot be in the future (more than 1 year from now) |
| `role` | Required (admin-only field), must be one of: `recruit`, `manager`, `admin` |
| `manager_id` | Optional, must reference an existing user with role `manager` |

### 5.3 Task Entry

| Field | Rules |
|-------|-------|
| `date` | Required, valid date, cannot be more than 7 days in the future |
| `title` | Required, min 3 chars, max 200 chars |
| `description` | Optional, max 5000 chars |
| `category` | Required, must be one of: `training`, `documentation`, `meeting`, `setup`, `development`, `other` |
| `status` | Required, must be one of: `not_started`, `in_progress`, `completed`, `on_hold` |
| `priority` | Required, must be one of: `low`, `medium`, `high`, `critical` |

### 5.4 Issue Entry

| Field | Rules |
|-------|-------|
| `date` | Required, valid date, cannot be more than 7 days in the future |
| `title` | Required, min 3 chars, max 200 chars |
| `description` | Required, min 10 chars, max 5000 chars |
| `severity` | Required, must be one of: `low`, `medium`, `high`, `critical` |
| `status` | Required, must be one of: `open`, `in_progress`, `resolved`, `closed` |
| `resolution_notes` | Optional (required when status is `resolved` or `closed`), max 5000 chars |

### 5.5 Feedback Entry

| Field | Rules |
|-------|-------|
| `date` | Required, valid date, cannot be more than 7 days in the future |
| `subject` | Required, min 3 chars, max 200 chars |
| `type` | Required, must be one of: `positive`, `suggestion`, `concern` |
| `details` | Required, min 10 chars, max 5000 chars |

### 5.6 Note Entry

| Field | Rules |
|-------|-------|
| `date` | Required, valid date, cannot be more than 7 days in the future |
| `title` | Required, min 3 chars, max 200 chars |
| `content` | Required, min 1 char, max 10000 chars |
| `tags` | Optional, array of strings, max 10 tags, each tag max 30 chars, alphanumeric and hyphens only |

### 5.7 Report Generation

| Field | Rules |
|-------|-------|
| `date_from` | Required, valid date |
| `date_to` | Required, valid date, must be ≥ `date_from`, date range max 365 days |
| `type` | Required, must be one of: `tasks`, `issues`, `feedback`, `combined` |
| `format` | Required, must be one of: `pdf`, `csv` |
| `user_id` | Optional (Manager/Admin only), must reference an existing recruit the requester has access to |

### 5.8 General API Validation

| Rule | Details |
|------|---------|
| Pagination | `page` ≥ 1 (default: 1), `per_page` 1–100 (default: 20) |
| UUID params | Must be valid UUID v4 format |
| Authorization | Recruits can only access their own data; Managers can access their assigned recruits' data; Admins can access all data |
| Rate limiting | Max 100 requests per minute per authenticated user; max 10 login attempts per 15 minutes per IP |

---

## 6. Suggested Additional Features

### 6.1 Onboarding Checklist

**Description:** A predefined checklist of onboarding tasks that managers can create and assign to recruits. Each item has a title, description, due date, and completion status. Recruits check off items as they complete them, and managers see real-time progress.

**Value:** Provides structure to the onboarding process and ensures critical steps are not missed. Allows managers to standardize onboarding across recruits.

**Suggested schema addition:**
```
checklists: id, title, created_by (manager), created_at
checklist_items: id, checklist_id, title, description, due_date, sort_order
checklist_assignments: id, checklist_id, user_id (recruit), assigned_at
checklist_completions: id, checklist_item_id, user_id, completed_at
```

**Endpoints:** `POST /checklists`, `GET /checklists`, `POST /checklists/{id}/assign`, `PUT /checklist-items/{id}/complete`

---

### 6.2 Global Search

**Description:** A search bar in the top navigation that searches across all entry types (tasks, issues, feedback, notes) simultaneously. Results are grouped by category with highlighted match text. Supports full-text search on titles, descriptions, and content.

**Value:** Saves time when a recruit needs to find a specific entry but doesn't remember which category it belongs to. Especially useful as the volume of entries grows.

**Implementation:** PostgreSQL full-text search with `tsvector` columns and a `GIN` index, or a search view unioning all entry types. Endpoint: `GET /search?q=keyword&type=all|tasks|issues|feedback|notes`

---

### 6.3 Dashboard Charts & Analytics

**Description:** Visual charts on the dashboard:
- **Tasks over time:** Line chart showing tasks created/completed per week
- **Issue severity distribution:** Pie/donut chart of issues by severity
- **Feedback sentiment breakdown:** Bar chart of positive vs. suggestion vs. concern
- **Onboarding progress timeline:** Gantt-like view of the recruit's first 30/60/90 days

**Value:** Provides visual insight into onboarding progress for both recruits and managers, making it easy to spot trends and bottlenecks at a glance.

**Implementation:** Use a React charting library (e.g., Recharts or Chart.js via react-chartjs-2). Backend provides aggregated data via `GET /dashboard/analytics?period=weekly|monthly`.

---

### 6.4 In-App Notifications & Activity Feed

**Description:** A notification system that alerts users about relevant events:
- **Recruits** receive notifications when a manager views their entries or when a checklist is assigned
- **Managers** receive notifications when recruits log new issues (especially high-severity) or complete checklist items
- **Activity feed** on the dashboard shows a chronological list of recent actions

**Value:** Keeps managers informed without requiring them to manually check each recruit's entries. Encourages recruits by acknowledging their progress.

**Suggested schema addition:**
```
notifications: id, user_id, type, title, message, is_read, reference_type, reference_id, created_at
```

**Endpoints:** `GET /notifications`, `PUT /notifications/{id}/read`, `PUT /notifications/read-all`

---

## Appendix: Project Structure (Suggested)

```
onboarding-diary-app/
├── docker-compose.yml
├── .env.example
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/              # API client & hooks
│   │   ├── components/       # Shared UI components
│   │   ├── pages/            # Page components (Login, Dashboard, Tasks, etc.)
│   │   ├── context/          # Auth & app context providers
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils/            # Helpers & validators
│   └── public/
├── backend/
│   ├── requirements.txt
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── main.py           # FastAPI app entrypoint
│   │   ├── config.py         # Settings & env vars
│   │   ├── database.py       # DB session & engine
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── routers/          # API route handlers
│   │   ├── services/         # Business logic
│   │   ├── auth/             # JWT & auth utilities
│   │   └── utils/            # Report generation, helpers
│   └── tests/
└── docs/
    └── DEVELOPMENT_SPEC.md   # This document
```
