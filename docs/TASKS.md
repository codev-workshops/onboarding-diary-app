# Onboarding Diary App - Task Breakdown

This document organizes all development work into the **3 main exercise steps** from the project requirements, with refined subtasks under each.

---

## Step 1 - Elaborate the Requirements

> Expand the original requirements into detailed specifications: user stories, API endpoints, UI flows, validation rules, and suggested additional features.

### Status: Complete

The elaborated requirements are documented in [`DEVELOPMENT_SPEC.md`](./DEVELOPMENT_SPEC.md).

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 1.1 | Define User Stories | Write user stories for all roles (Recruit, Manager, Admin) covering authentication, task log, issue log, feedback, notes, dashboard, reports, and admin features. | Done |
| 1.2 | Design API Endpoints | Specify all REST API endpoints with methods, paths, auth requirements, request/response schemas, and enum definitions. | Done |
| 1.3 | Design Database Schema | Define all tables (users, tasks, issues, feedback, notes, reports), columns, types, constraints, indexes, and write the initial SQL migration. | Done |
| 1.4 | Map UI Flows | Document every page (login, register, dashboard, task log, issue log, feedback, notes, reports, admin, profile), its layout, components, and navigation. | Done |
| 1.5 | Define Validation Rules | Specify field-level validation for all forms (auth, profile, tasks, issues, feedback, notes, reports) and general API rules (pagination, rate limiting, authorization). | Done |
| 1.6 | Suggest Additional Features | Propose additional features: Onboarding Checklist, Global Search, Dashboard Charts & Analytics, In-App Notifications & Activity Feed. | Done |
| 1.7 | Define Project Structure | Document the recommended folder structure for frontend (React/Vite) and backend (FastAPI) with Docker Compose orchestration. | Done |

---

## Step 2 - Build the Application

> Build the application incrementally using the elaborated requirements.

### Phase 2A - Project Scaffolding & Infrastructure

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 2A.1 | Initialize Frontend Project | Set up Vite + React + TypeScript project with Tailwind CSS, shadcn/ui components, and ESLint configuration. | Done |
| 2A.2 | Initialize Backend Project | Set up FastAPI project with folder structure (models, schemas, routers, services, auth, utils), `requirements.txt`, and Alembic for migrations. | Done |
| 2A.3 | Configure Docker Compose | Create `docker-compose.yml` with services for PostgreSQL, backend (FastAPI), and frontend (Vite dev / Nginx prod). | Done |
| 2A.4 | Set Up Database Initialization | Create `db/init/01-init.sql` with the full schema migration (tables, indexes, constraints). | Done |
| 2A.5 | Configure Environment Variables | Create `.env.example` with all required env vars (DB credentials, JWT secret, CORS origins, etc.). | Done |

### Phase 2B - Authentication & User Management

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 2B.1 | Implement User Model | Create SQLAlchemy model for `users` table with all fields, relationships, and password hashing (bcrypt). | To Do |
| 2B.2 | Implement Auth Schemas | Create Pydantic schemas for registration, login, token response, password reset request/confirm. | To Do |
| 2B.3 | Implement JWT Utilities | Build JWT token creation, verification, and refresh logic. Implement token blocklist for logout. | To Do |
| 2B.4 | Implement Auth Router | Build API endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/password-reset`, `POST /auth/password-reset/confirm`. | To Do |
| 2B.5 | Implement User Profile Router | Build `GET /users/me`, `PUT /users/me`, `GET /users` (admin), `GET /users/{id}` (admin), `PUT /users/{id}` (admin). | To Do |
| 2B.6 | Implement Auth Middleware | Create dependency injection for current user extraction, role-based access control (recruit, manager, admin). | To Do |
| 2B.7 | Build Login Page (Frontend) | Create `/login` page with email/password fields, validation, error handling, "Sign Up" and "Forgot Password" links. | To Do |
| 2B.8 | Build Registration Page (Frontend) | Create `/register` page with all fields (name, email, password, confirm password, department, start date), validation. | To Do |
| 2B.9 | Build Auth Context (Frontend) | Create React context for auth state management: login, logout, token storage, auto-redirect on expiry. | To Do |
| 2B.10 | Build Protected Route Wrapper | Create a `ProtectedRoute` component that redirects unauthenticated users to `/login` and enforces role-based access. | To Do |
| 2B.11 | Build Profile Page (Frontend) | Create `/profile` page to view/edit name, department, start date, and change password. | To Do |

### Phase 2C - Core CRUD - Task Log

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 2C.1 | Implement Task Model | Create SQLAlchemy model for `tasks` table with all fields and user relationship. | To Do |
| 2C.2 | Implement Task Schemas | Create Pydantic schemas for task creation, update, response, and list response with pagination. | To Do |
| 2C.3 | Implement Task Service | Build business logic layer: create, read (with filters: date, category, status), update, delete tasks. Enforce ownership. | To Do |
| 2C.4 | Implement Task Router | Build API endpoints: `POST /tasks`, `GET /tasks` (with filters & pagination), `GET /tasks/{id}`, `PUT /tasks/{id}`, `DELETE /tasks/{id}`, `GET /users/{id}/tasks` (manager/admin). | To Do |
| 2C.5 | Build Task List Page (Frontend) | Create `/tasks` page with table/card view, filter bar (date range, category dropdown, status dropdown), and "+ New Task" button. | To Do |
| 2C.6 | Build Task Create/Edit Form (Frontend) | Create `/tasks/new` and `/tasks/:id/edit` pages with form fields (date, title, description, category, status, priority) and validation. | To Do |
| 2C.7 | Build Task Delete Confirmation | Add delete confirmation dialog with cancel/confirm actions. | To Do |
| 2C.8 | Build API Client for Tasks (Frontend) | Create API hooks/functions for all task CRUD operations with error handling and loading states. | To Do |

### Phase 2D - Core CRUD - Issue Log

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 2D.1 | Implement Issue Model | Create SQLAlchemy model for `issues` table with all fields and user relationship. | To Do |
| 2D.2 | Implement Issue Schemas | Create Pydantic schemas for issue creation, update, response, and list response. | To Do |
| 2D.3 | Implement Issue Service | Build business logic: create, read (with filters: status, severity, date), update, delete issues. Enforce ownership. Require resolution_notes when status is resolved/closed. | To Do |
| 2D.4 | Implement Issue Router | Build API endpoints: `POST /issues`, `GET /issues`, `GET /issues/{id}`, `PUT /issues/{id}`, `DELETE /issues/{id}`, `GET /users/{id}/issues`. | To Do |
| 2D.5 | Build Issue List Page (Frontend) | Create `/issues` page with table view, severity badges (color-coded: green/yellow/orange/red), filters (status, severity, date range). | To Do |
| 2D.6 | Build Issue Create/Edit Form (Frontend) | Create `/issues/new` and `/issues/:id/edit` with all fields including resolution notes. | To Do |
| 2D.7 | Build API Client for Issues (Frontend) | Create API hooks/functions for all issue CRUD operations. | To Do |

### Phase 2E - Core CRUD - Feedback Notes

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 2E.1 | Implement Feedback Model | Create SQLAlchemy model for `feedback` table. | To Do |
| 2E.2 | Implement Feedback Schemas | Create Pydantic schemas for feedback creation, update, response. | To Do |
| 2E.3 | Implement Feedback Service | Build business logic: create, read (with filters: type, date), update, delete feedback. Enforce ownership. | To Do |
| 2E.4 | Implement Feedback Router | Build API endpoints: `POST /feedback`, `GET /feedback`, `GET /feedback/{id}`, `PUT /feedback/{id}`, `DELETE /feedback/{id}`, `GET /users/{id}/feedback`. | To Do |
| 2E.5 | Build Feedback List Page (Frontend) | Create `/feedback` page with cards grouped by type (Positive/Suggestion/Concern) or flat list with type badges. | To Do |
| 2E.6 | Build Feedback Create/Edit Form (Frontend) | Create inline form or modal for new feedback with subject, type selector, details textarea, and date picker. | To Do |
| 2E.7 | Build API Client for Feedback (Frontend) | Create API hooks/functions for all feedback CRUD operations. | To Do |

### Phase 2F - Core CRUD - Additional Notes

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 2F.1 | Implement Note Model | Create SQLAlchemy model for `notes` table with TEXT[] tags column. | To Do |
| 2F.2 | Implement Note Schemas | Create Pydantic schemas for note creation, update, response. | To Do |
| 2F.3 | Implement Note Service | Build business logic: create, read (with filters: tags, date, text search), update, delete notes. | To Do |
| 2F.4 | Implement Note Router | Build API endpoints: `POST /notes`, `GET /notes`, `GET /notes/{id}`, `PUT /notes/{id}`, `DELETE /notes/{id}`. | To Do |
| 2F.5 | Build Notes List Page (Frontend) | Create `/notes` page with card view showing title, date, tag chips, truncated content preview. Tag filter (multi-select) and date range filter. | To Do |
| 2F.6 | Build Note Create/Edit Form (Frontend) | Create `/notes/new` and `/notes/:id/edit` with title, content (rich text or markdown), and tags input (chip-style). | To Do |
| 2F.7 | Build API Client for Notes (Frontend) | Create API hooks/functions for all note CRUD operations. | To Do |

### Phase 2G - Dashboard

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 2G.1 | Implement Dashboard Endpoint (Backend) | Build `GET /dashboard` endpoint that aggregates summary counts (total tasks, completed tasks, open issues, total feedback, total notes), recent entries (last 5 per category), and task completion rate. | To Do |
| 2G.2 | Implement Manager Dashboard Endpoint | Build `GET /dashboard/manager` endpoint that returns aggregate stats for all assigned recruits, with optional `?recruit_id=` filter. | To Do |
| 2G.3 | Build Dashboard Page (Frontend) | Create `/dashboard` page with summary cards, task completion progress bar, and recent entries section (tabbed or accordion layout). | To Do |
| 2G.4 | Build App Shell Layout | Create the main app layout: top bar (logo, user name, role badge, logout), side navigation (Dashboard, Tasks, Issues, Feedback, Notes, Reports, Admin), and responsive behavior. | To Do |
| 2G.5 | Build Manager Dashboard View | Add recruit selector dropdown for managers to view individual recruit summaries from the dashboard. | To Do |

### Phase 2H - Reports

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 2H.1 | Implement Report Generation Service | Build report generation logic for tasks, issues, feedback, or combined data within a date range. Output as PDF (using a library like ReportLab or WeasyPrint) or CSV. | To Do |
| 2H.2 | Implement Report Model | Create SQLAlchemy model for `reports` table to track generated reports. | To Do |
| 2H.3 | Implement Report Router | Build endpoints: `POST /reports/generate`, `GET /reports/{id}/download`, `GET /reports` (history list). | To Do |
| 2H.4 | Build Report Generation Page (Frontend) | Create `/reports/generate` page with date range pickers, report type selector, format selector, and recruit selector (for managers). | To Do |
| 2H.5 | Build Report History Page (Frontend) | Create `/reports` page listing previously generated reports with download links and metadata. | To Do |
| 2H.6 | Build API Client for Reports (Frontend) | Create API hooks/functions for report generation, download, and history listing. | To Do |

### Phase 2I - Admin Panel

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 2I.1 | Implement Admin Authorization | Create admin-only middleware/dependency that restricts access to admin endpoints. | To Do |
| 2I.2 | Build Admin User List Page (Frontend) | Create `/admin/users` page with user table (name, email, role, department, status, manager) and actions column. | To Do |
| 2I.3 | Build Admin User Edit Page (Frontend) | Create `/admin/users/:id` page to change role, assign/unassign manager, activate/deactivate accounts. | To Do |
| 2I.4 | Build Admin Create User (Frontend) | Add "Create User" button and form for admin to manually add users with role assignment. | To Do |

### Phase 2J - Responsive Design & Polish

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 2J.1 | Implement Responsive Navigation | Desktop: persistent side nav. Tablet: collapsible hamburger menu. Mobile: bottom navigation bar with icons. | To Do |
| 2J.2 | Implement Responsive Layouts | Ensure all pages work with single-column layout on mobile, stacked cards, and full-width forms. | To Do |
| 2J.3 | Add Loading States & Skeletons | Add loading spinners/skeletons for all data-fetching pages and form submissions. | To Do |
| 2J.4 | Add Error Handling & Toast Notifications | Implement global error boundary, API error display, and success/error toast notifications for all CRUD operations. | To Do |
| 2J.5 | Add Empty States | Design and implement empty state illustrations/messages for pages with no data yet. | To Do |

### Phase 2K - Testing & Quality

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 2K.1 | Write Backend Unit Tests | Test all service functions, validation logic, and auth utilities with pytest. | To Do |
| 2K.2 | Write Backend Integration Tests | Test API endpoints with test database, covering auth flow, CRUD operations, and authorization checks. | To Do |
| 2K.3 | Write Frontend Component Tests | Test key components (forms, tables, dashboard) with React Testing Library. | To Do |
| 2K.4 | Run Linting & Type Checks | Ensure ESLint (frontend) and any Python linters (backend) pass with no errors. | To Do |
| 2K.5 | Manual End-to-End Testing | Test the full user journey: register, login, create entries in all categories, view dashboard, generate report, admin operations. | To Do |

---

## Step 3 - Extend the Application

> Add at least two new features to the core application.

### Extension A - Global Search

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 3A.1 | Add Full-Text Search Columns (Backend) | Add `tsvector` columns to tasks, issues, feedback, and notes tables. Create GIN indexes. Write Alembic migration. | To Do |
| 3A.2 | Implement Search Service | Build a service that queries across all entry types using PostgreSQL full-text search, with result ranking and type filtering. | To Do |
| 3A.3 | Implement Search Router | Build `GET /search?q=keyword&type=all|tasks|issues|feedback|notes` endpoint with pagination and highlighted match text. | To Do |
| 3A.4 | Build Search UI (Frontend) | Add a search bar to the top navigation. Show results in a dropdown or dedicated `/search` page, grouped by category with highlighted match text. | To Do |
| 3A.5 | Add Keyboard Shortcut | Implement `Ctrl+K` / `Cmd+K` keyboard shortcut to focus the search bar. | To Do |

### Extension B - Dashboard Charts & Analytics

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 3B.1 | Implement Analytics Endpoint (Backend) | Build `GET /dashboard/analytics?period=weekly|monthly` that returns aggregated data: tasks created/completed over time, issue severity distribution, feedback type breakdown. | To Do |
| 3B.2 | Build Tasks Over Time Chart | Create a line chart (Recharts) showing tasks created vs. completed per week/month on the dashboard. | To Do |
| 3B.3 | Build Issue Severity Distribution Chart | Create a pie/donut chart showing the breakdown of issues by severity level (low/medium/high/critical). | To Do |
| 3B.4 | Build Feedback Sentiment Chart | Create a bar chart showing the count of Positive vs. Suggestion vs. Concern feedback entries. | To Do |
| 3B.5 | Build Onboarding Progress Timeline | Create a visual timeline or progress indicator showing the recruit's 30/60/90-day milestones and completion. | To Do |
| 3B.6 | Add Chart Interactivity | Add tooltips, click-to-filter, and time period selectors (weekly/monthly) to all charts. | To Do |

### Extension C - Onboarding Checklist (Optional 3rd Extension)

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 3C.1 | Implement Checklist Models (Backend) | Create SQLAlchemy models for `checklists`, `checklist_items`, `checklist_assignments`, `checklist_completions`. Write Alembic migration. | To Do |
| 3C.2 | Implement Checklist Service | Build business logic: managers create checklists with items, assign to recruits; recruits mark items complete. | To Do |
| 3C.3 | Implement Checklist Router | Build endpoints: `POST /checklists`, `GET /checklists`, `POST /checklists/{id}/assign`, `PUT /checklist-items/{id}/complete`, `GET /checklists/{id}/progress`. | To Do |
| 3C.4 | Build Checklist Management Page (Frontend) | Create a page for managers to create/edit checklists, add/reorder items, and assign to recruits. | To Do |
| 3C.5 | Build Recruit Checklist View (Frontend) | Create a page for recruits to view their assigned checklists, check off items, and see completion progress. | To Do |
| 3C.6 | Add Checklist Progress to Dashboard | Show checklist completion percentage and next due items on the recruit and manager dashboards. | To Do |

### Extension D - In-App Notifications (Optional 4th Extension)

| # | Subtask | Description | Status |
|---|---------|-------------|--------|
| 3D.1 | Implement Notifications Model (Backend) | Create SQLAlchemy model for `notifications` table. Write Alembic migration. | To Do |
| 3D.2 | Implement Notification Service | Build notification creation logic triggered by events (new issue logged, checklist assigned, manager view). | To Do |
| 3D.3 | Implement Notification Router | Build endpoints: `GET /notifications`, `PUT /notifications/{id}/read`, `PUT /notifications/read-all`. | To Do |
| 3D.4 | Build Notification Bell UI (Frontend) | Add a notification bell icon in the top bar with unread count badge. Clicking opens a dropdown with recent notifications. | To Do |
| 3D.5 | Build Notifications Page (Frontend) | Create a full page listing all notifications with read/unread status, timestamps, and links to referenced entries. | To Do |

---

## Summary

| Step | Description | Subtask Count | Status |
|------|-------------|---------------|--------|
| **Step 1** | Elaborate the Requirements | 7 subtasks | Complete |
| **Step 2** | Build the Application | 55 subtasks across 11 phases (2A-2K) | In Progress (Phase 2A done) |
| **Step 3** | Extend the Application | 22 subtasks across 4 extensions (A-D, pick at least 2) | To Do |
| **Total** | | **84 subtasks** | |
