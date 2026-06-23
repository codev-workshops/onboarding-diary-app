# Onboarding Diary Application - Implementation Plan

> **Stack Decision**: React (Vite + TypeScript + MUI) front-end, ASP.NET Core (.NET 8) Web API back-end, SQL Server database.
>
> The existing Python/FastAPI + PostgreSQL scaffold (in `backend/` and `frontend/`) is **preserved as-is**. All new implementation goes into separate folders: **`dot-net-backend/`** for the ASP.NET Core API and **`react-frontend/`** for the new React + MUI SPA. The existing `DEVELOPMENT_SPEC.md` remains the canonical source for **user stories**, **API contracts**, **validation rules**, and **UI flows**. This document covers the implementation-specific details: .NET project structure, SQL Server schema, architecture patterns, NuGet/npm dependencies, and phased build plan.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Backend - ASP.NET Core Web API](#2-backend---aspnet-core-web-api)
3. [Database - SQL Server](#3-database---sql-server)
4. [Frontend - React + Vite + MUI](#4-frontend---react--vite--mui)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Report Generation](#6-report-generation)
7. [Docker Compose Setup](#7-docker-compose-setup)
8. [Development Workflow & CI](#8-development-workflow--ci)
9. [Phased Build Plan](#9-phased-build-plan)
10. [Extra Features (Step 3)](#10-extra-features-step-3)

---

## Repository Layout

The new implementation lives alongside the existing scaffold. No existing files are modified or removed.

```
onboarding-diary-app/
├── backend/                  # EXISTING — Python/FastAPI (untouched)
├── frontend/                 # EXISTING — Original React scaffold (untouched)
├── db/                       # EXISTING — PostgreSQL init scripts (untouched)
├── docker-compose.yml        # EXISTING — PostgreSQL + Python + React (untouched)
├── docs/
│   ├── DEVELOPMENT_SPEC.md   # EXISTING — Functional spec (user stories, API, etc.)
│   └── IMPLEMENTATION_PLAN.md # NEW — This document
├── dot-net-backend/          # NEW — ASP.NET Core (.NET 8) Web API
├── react-frontend/           # NEW — React + Vite + TypeScript + MUI SPA
└── docker-compose.new.yml    # NEW — SQL Server + .NET backend + React frontend
```

---

## 1. Architecture Overview

```
┌──────────────────────┐       HTTPS/JSON        ┌──────────────────────────────┐
│                      │ ◄──────────────────────► │                              │
│   React SPA (Vite)   │                          │   ASP.NET Core Web API       │
│   MUI + React Query  │                          │   .NET 8 (C#)               │
│   Port 3000 (dev)    │                          │   Port 5000 (dev)            │
│                      │                          │                              │
└──────────────────────┘                          │  Controllers                 │
                                                  │    ↕                         │
                                                  │  Services (business logic)   │
                                                  │    ↕                         │
                                                  │  EF Core DbContext           │
                                                  │    ↕                         │
                                                  └────────┬─────────────────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │   SQL Server     │
                                                  │   Port 1433      │
                                                  └──────────────────┘
```

**Key architectural decisions:**
- **Layered architecture**: Controllers → Services → EF Core (no separate repository layer — EF Core's `DbSet<T>` already provides this abstraction).
- **DTOs separate from entities**: Request/response models are never the EF entities themselves. Mapping done via explicit mapping methods (no AutoMapper — keeps things transparent and debuggable).
- **No mediator/CQRS**: Overkill for this scope. Direct service injection into controllers.
- **JWT authentication**: Access token only (no refresh token for v1). Token stored in `localStorage` on the client; `Authorization: Bearer <token>` on every API call.
- **Role + ownership authorization**: Custom authorization policies and resource-based checks in services.

---

## 2. Backend - ASP.NET Core Web API

### 2.1 Solution & Project Structure

```
dot-net-backend/
├── OnboardingDiary.sln
├── src/
│   └── OnboardingDiary.Api/
│       ├── OnboardingDiary.Api.csproj
│       ├── Program.cs                          # App startup, DI, middleware pipeline
│       ├── appsettings.json                    # Non-secret config
│       ├── appsettings.Development.json        # Dev overrides (connection string etc.)
│       │
│       ├── Controllers/
│       │   ├── AuthController.cs               # POST register, login, me
│       │   ├── UsersController.cs              # GET/PUT profile, admin user management
│       │   ├── TasksController.cs              # CRUD tasks
│       │   ├── IssuesController.cs             # CRUD issues
│       │   ├── FeedbackController.cs           # CRUD feedback
│       │   ├── NotesController.cs              # CRUD notes
│       │   ├── DashboardController.cs          # GET dashboard, manager dashboard
│       │   └── ReportsController.cs            # POST generate, GET download, GET list
│       │
│       ├── Services/
│       │   ├── IAuthService.cs / AuthService.cs
│       │   ├── IUserService.cs / UserService.cs
│       │   ├── ITaskService.cs / TaskService.cs
│       │   ├── IIssueService.cs / IssueService.cs
│       │   ├── IFeedbackService.cs / FeedbackService.cs
│       │   ├── INoteService.cs / NoteService.cs
│       │   ├── IDashboardService.cs / DashboardService.cs
│       │   └── IReportService.cs / ReportService.cs
│       │
│       ├── Models/                             # EF Core entities
│       │   ├── User.cs
│       │   ├── TaskEntry.cs
│       │   ├── IssueEntry.cs
│       │   ├── FeedbackEntry.cs
│       │   ├── NoteEntry.cs
│       │   ├── NoteTag.cs                      # Join table for note ↔ tag
│       │   ├── Report.cs
│       │   └── Enums/
│       │       ├── UserRole.cs
│       │       ├── TaskStatus.cs
│       │       ├── TaskPriority.cs
│       │       ├── TaskCategory.cs
│       │       ├── IssueSeverity.cs
│       │       ├── IssueStatus.cs
│       │       ├── FeedbackType.cs
│       │       ├── ReportType.cs
│       │       └── ReportFormat.cs
│       │
│       ├── DTOs/                               # Request/Response models
│       │   ├── Auth/
│       │   │   ├── RegisterRequest.cs
│       │   │   ├── LoginRequest.cs
│       │   │   ├── AuthResponse.cs
│       │   │   └── UserDto.cs
│       │   ├── Tasks/
│       │   │   ├── CreateTaskRequest.cs
│       │   │   ├── UpdateTaskRequest.cs
│       │   │   └── TaskDto.cs
│       │   ├── Issues/
│       │   │   ├── CreateIssueRequest.cs
│       │   │   ├── UpdateIssueRequest.cs
│       │   │   └── IssueDto.cs
│       │   ├── Feedback/
│       │   │   ├── CreateFeedbackRequest.cs
│       │   │   ├── UpdateFeedbackRequest.cs
│       │   │   └── FeedbackDto.cs
│       │   ├── Notes/
│       │   │   ├── CreateNoteRequest.cs
│       │   │   ├── UpdateNoteRequest.cs
│       │   │   └── NoteDto.cs
│       │   ├── Dashboard/
│       │   │   ├── DashboardDto.cs
│       │   │   └── ManagerDashboardDto.cs
│       │   ├── Reports/
│       │   │   ├── GenerateReportRequest.cs
│       │   │   └── ReportDto.cs
│       │   └── Common/
│       │       ├── PagedRequest.cs
│       │       └── PagedResponse.cs
│       │
│       ├── Data/
│       │   ├── AppDbContext.cs                  # EF Core DbContext
│       │   └── Migrations/                     # EF Core code-first migrations
│       │
│       ├── Auth/
│       │   ├── JwtTokenGenerator.cs            # JWT creation
│       │   ├── JwtSettings.cs                  # Config POCO
│       │   └── CurrentUserAccessor.cs          # IHttpContextAccessor wrapper
│       │
│       ├── Authorization/
│       │   ├── Policies.cs                     # Policy name constants
│       │   ├── ResourceOwnerHandler.cs         # IAuthorizationHandler for ownership
│       │   └── ManagerScopeHandler.cs          # Manager can only see assigned recruits
│       │
│       ├── Middleware/
│       │   └── ExceptionHandlingMiddleware.cs  # Global error handling → ProblemDetails
│       │
│       └── Validation/
│           ├── RegisterRequestValidator.cs     # FluentValidation validators
│           ├── CreateTaskRequestValidator.cs
│           ├── ... (one per request DTO)
│           └── ValidationFilter.cs             # MVC filter to return 400 on invalid input
│
└── tests/
    └── OnboardingDiary.Api.Tests/
        ├── OnboardingDiary.Api.Tests.csproj
        ├── Services/                            # Unit tests for service layer
        └── Controllers/                         # Integration tests (WebApplicationFactory)
```

> **Note:** The existing `backend/` folder (Python/FastAPI) is left untouched. All .NET code lives exclusively in `dot-net-backend/`.

### 2.2 NuGet Dependencies

| Package | Purpose |
|---------|---------|
| `Microsoft.EntityFrameworkCore.SqlServer` | EF Core SQL Server provider |
| `Microsoft.EntityFrameworkCore.Design` | EF migration tooling |
| `Microsoft.EntityFrameworkCore.Tools` | `dotnet ef` CLI support |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | JWT auth middleware |
| `System.IdentityModel.Tokens.Jwt` | JWT token creation |
| `FluentValidation.AspNetCore` | Request validation |
| `BCrypt.Net-Next` | Password hashing |
| `QuestPDF` | PDF report generation |
| `CsvHelper` | CSV report generation |
| `Swashbuckle.AspNetCore` | Swagger/OpenAPI |

### 2.3 Key Implementation Patterns

**Pagination** — All list endpoints accept `page` (default 1) and `pageSize` (default 20, max 100). Response:
```csharp
public class PagedResponse<T>
{
    public List<T> Items { get; set; }
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(Total / (double)PageSize);
}
```

**Filtering** — Query parameters parsed from `[FromQuery]` into filter objects. EF queries built conditionally:
```csharp
var query = _db.Tasks.Where(t => t.UserId == currentUserId);
if (filter.DateFrom.HasValue) query = query.Where(t => t.Date >= filter.DateFrom);
if (filter.Status.HasValue) query = query.Where(t => t.Status == filter.Status);
// ... etc
```

**Error handling** — `ExceptionHandlingMiddleware` catches unhandled exceptions and returns RFC 7807 `ProblemDetails`. Services throw typed exceptions (`NotFoundException`, `ForbiddenException`, `ConflictException`).

**Timestamps** — `CreatedAt` set on insert, `UpdatedAt` overridden in `SaveChangesAsync`:
```csharp
public override Task<int> SaveChangesAsync(CancellationToken ct = default)
{
    foreach (var entry in ChangeTracker.Entries<BaseEntity>())
    {
        if (entry.State == EntityState.Modified)
            entry.Entity.UpdatedAt = DateTime.UtcNow;
        if (entry.State == EntityState.Added)
            entry.Entity.CreatedAt = entry.Entity.UpdatedAt = DateTime.UtcNow;
    }
    return base.SaveChangesAsync(ct);
}
```

---

## 3. Database - SQL Server

### 3.1 Connection

SQL Server 2022 via Docker. Connection string:
```
Server=localhost,1433;Database=OnboardingDiary;User Id=sa;Password=<from-env>;TrustServerCertificate=True;
```

### 3.2 Schema (SQL Server dialect)

The schema mirrors `DEVELOPMENT_SPEC.md` §3 but uses SQL Server types and syntax:

```sql
-- Users
CREATE TABLE [dbo].[Users] (
    [Id]            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [Email]         NVARCHAR(255)    NOT NULL,
    [PasswordHash]  NVARCHAR(255)    NOT NULL,
    [FullName]      NVARCHAR(150)    NOT NULL,
    [Role]          NVARCHAR(20)     NOT NULL CHECK ([Role] IN ('recruit','manager','admin')),
    [Department]    NVARCHAR(100)    NULL,
    [StartDate]     DATE             NULL,
    [ManagerId]     UNIQUEIDENTIFIER NULL,
    [IsActive]      BIT              NOT NULL DEFAULT 1,
    [CreatedAt]     DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]     DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
    CONSTRAINT [UQ_Users_Email] UNIQUE ([Email]),
    CONSTRAINT [FK_Users_Manager] FOREIGN KEY ([ManagerId]) REFERENCES [dbo].[Users]([Id])
);

CREATE INDEX [IX_Users_ManagerId] ON [dbo].[Users]([ManagerId]);
CREATE INDEX [IX_Users_Role] ON [dbo].[Users]([Role]);

-- Tasks
CREATE TABLE [dbo].[Tasks] (
    [Id]          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [UserId]      UNIQUEIDENTIFIER NOT NULL,
    [Date]        DATE             NOT NULL,
    [Title]       NVARCHAR(200)    NOT NULL,
    [Description] NVARCHAR(MAX)    NULL,
    [Category]    NVARCHAR(30)     NOT NULL CHECK ([Category] IN ('training','documentation','meeting','setup','development','other')),
    [Status]      NVARCHAR(20)     NOT NULL DEFAULT 'not_started' CHECK ([Status] IN ('not_started','in_progress','completed','on_hold')),
    [Priority]    NVARCHAR(10)     NOT NULL DEFAULT 'medium' CHECK ([Priority] IN ('low','medium','high','critical')),
    [CreatedAt]   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Tasks] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Tasks_User] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_Tasks_UserId] ON [dbo].[Tasks]([UserId]);
CREATE INDEX [IX_Tasks_Date] ON [dbo].[Tasks]([Date]);
CREATE INDEX [IX_Tasks_Status] ON [dbo].[Tasks]([Status]);

-- Issues
CREATE TABLE [dbo].[Issues] (
    [Id]              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [UserId]          UNIQUEIDENTIFIER NOT NULL,
    [Date]            DATE             NOT NULL,
    [Title]           NVARCHAR(200)    NOT NULL,
    [Description]     NVARCHAR(MAX)    NOT NULL,
    [Severity]        NVARCHAR(10)     NOT NULL CHECK ([Severity] IN ('low','medium','high','critical')),
    [Status]          NVARCHAR(20)     NOT NULL DEFAULT 'open' CHECK ([Status] IN ('open','in_progress','resolved','closed')),
    [ResolutionNotes] NVARCHAR(MAX)    NULL,
    [CreatedAt]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Issues] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Issues_User] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_Issues_UserId] ON [dbo].[Issues]([UserId]);
CREATE INDEX [IX_Issues_Date] ON [dbo].[Issues]([Date]);
CREATE INDEX [IX_Issues_Status] ON [dbo].[Issues]([Status]);
CREATE INDEX [IX_Issues_Severity] ON [dbo].[Issues]([Severity]);

-- Feedback
CREATE TABLE [dbo].[Feedback] (
    [Id]        UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [UserId]    UNIQUEIDENTIFIER NOT NULL,
    [Date]      DATE             NOT NULL,
    [Subject]   NVARCHAR(200)    NOT NULL,
    [Type]      NVARCHAR(20)     NOT NULL CHECK ([Type] IN ('positive','suggestion','concern')),
    [Details]   NVARCHAR(MAX)    NOT NULL,
    [CreatedAt] DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt] DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Feedback] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Feedback_User] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_Feedback_UserId] ON [dbo].[Feedback]([UserId]);
CREATE INDEX [IX_Feedback_Date] ON [dbo].[Feedback]([Date]);
CREATE INDEX [IX_Feedback_Type] ON [dbo].[Feedback]([Type]);

-- Notes
CREATE TABLE [dbo].[Notes] (
    [Id]        UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [UserId]    UNIQUEIDENTIFIER NOT NULL,
    [Date]      DATE             NOT NULL,
    [Title]     NVARCHAR(200)    NOT NULL,
    [Content]   NVARCHAR(MAX)    NOT NULL,
    [CreatedAt] DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt] DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Notes] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Notes_User] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_Notes_UserId] ON [dbo].[Notes]([UserId]);
CREATE INDEX [IX_Notes_Date] ON [dbo].[Notes]([Date]);

-- NoteTags (join table — SQL Server has no native array type)
CREATE TABLE [dbo].[NoteTags] (
    [Id]     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [NoteId] UNIQUEIDENTIFIER NOT NULL,
    [Tag]    NVARCHAR(30)     NOT NULL,
    CONSTRAINT [PK_NoteTags] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_NoteTags_Note] FOREIGN KEY ([NoteId]) REFERENCES [dbo].[Notes]([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_NoteTags_NoteId] ON [dbo].[NoteTags]([NoteId]);
CREATE INDEX [IX_NoteTags_Tag] ON [dbo].[NoteTags]([Tag]);

-- Reports
CREATE TABLE [dbo].[Reports] (
    [Id]           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [GeneratedBy]  UNIQUEIDENTIFIER NOT NULL,
    [TargetUserId] UNIQUEIDENTIFIER NULL,
    [DateFrom]     DATE             NOT NULL,
    [DateTo]       DATE             NOT NULL,
    [ReportType]   NVARCHAR(20)     NOT NULL CHECK ([ReportType] IN ('tasks','issues','feedback','combined')),
    [Format]       NVARCHAR(5)      NOT NULL CHECK ([Format] IN ('pdf','csv')),
    [FilePath]     NVARCHAR(500)    NOT NULL,
    [CreatedAt]    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Reports] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Reports_GeneratedBy] FOREIGN KEY ([GeneratedBy]) REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [FK_Reports_TargetUser] FOREIGN KEY ([TargetUserId]) REFERENCES [dbo].[Users]([Id])
);

CREATE INDEX [IX_Reports_GeneratedBy] ON [dbo].[Reports]([GeneratedBy]);
CREATE INDEX [IX_Reports_TargetUserId] ON [dbo].[Reports]([TargetUserId]);
```

### 3.3 Key differences from the PostgreSQL schema in DEVELOPMENT_SPEC.md

| Aspect | PostgreSQL (DEVELOPMENT_SPEC.md) | SQL Server (this plan) |
|--------|----------------------------------|------------------------|
| UUID generation | `gen_random_uuid()` / pgcrypto | `NEWSEQUENTIALID()` (clustered-index friendly) |
| String type | `VARCHAR` | `NVARCHAR` (Unicode) |
| Boolean | `BOOLEAN` | `BIT` |
| Timestamp | `TIMESTAMPTZ` | `DATETIME2` (stored as UTC) |
| Array column | `TEXT[]` for tags | Separate `NoteTags` join table |
| Full-text search | `tsvector` + GIN | SQL Server Full-Text Index (for search feature) |
| Now function | `NOW()` | `SYSUTCDATETIME()` |

### 3.4 Seed Data

On first migration, seed a default admin user:
```
Email:    admin@onboardingdiary.local
Password: Admin@123 (bcrypt-hashed)
Role:     admin
```

---

## 4. Frontend - React + Vite + MUI

### 4.1 Project Structure

```
react-frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                        # ReactDOM.createRoot + providers
    ├── App.tsx                         # Router + layout shell
    ├── theme.ts                        # MUI theme customization
    │
    ├── api/
    │   ├── client.ts                   # Axios instance with interceptors (JWT, base URL)
    │   ├── auth.ts                     # login, register, getMe
    │   ├── tasks.ts                    # CRUD + filter
    │   ├── issues.ts
    │   ├── feedback.ts
    │   ├── notes.ts
    │   ├── dashboard.ts
    │   ├── reports.ts
    │   └── users.ts                    # Admin user management
    │
    ├── hooks/
    │   ├── useAuth.ts                  # Auth context consumer
    │   ├── useTasks.ts                 # React Query hooks for tasks
    │   ├── useIssues.ts
    │   ├── useFeedback.ts
    │   ├── useNotes.ts
    │   ├── useDashboard.ts
    │   └── useReports.ts
    │
    ├── context/
    │   └── AuthContext.tsx             # JWT storage, login/logout, current user
    │
    ├── components/
    │   ├── Layout/
    │   │   ├── AppShell.tsx            # Top bar + side nav + content area
    │   │   ├── Sidebar.tsx
    │   │   └── TopBar.tsx
    │   ├── ProtectedRoute.tsx          # Redirect if not authed / wrong role
    │   ├── DataTable.tsx               # Reusable MUI DataGrid wrapper
    │   ├── FilterBar.tsx               # Reusable filter controls
    │   ├── FormDialog.tsx              # Reusable modal form wrapper
    │   ├── ConfirmDialog.tsx           # Delete confirmation
    │   ├── StatusChip.tsx              # Color-coded status/severity chip
    │   ├── SummaryCard.tsx             # Dashboard stat card
    │   └── EmptyState.tsx
    │
    ├── pages/
    │   ├── Login.tsx
    │   ├── Register.tsx
    │   ├── Dashboard.tsx
    │   ├── Tasks/
    │   │   ├── TaskList.tsx
    │   │   └── TaskForm.tsx            # Create + Edit (shared)
    │   ├── Issues/
    │   │   ├── IssueList.tsx
    │   │   └── IssueForm.tsx
    │   ├── Feedback/
    │   │   ├── FeedbackList.tsx
    │   │   └── FeedbackForm.tsx
    │   ├── Notes/
    │   │   ├── NoteList.tsx
    │   │   └── NoteForm.tsx
    │   ├── Reports/
    │   │   ├── ReportGenerator.tsx
    │   │   └── ReportHistory.tsx
    │   ├── Admin/
    │   │   ├── UserList.tsx
    │   │   └── UserForm.tsx
    │   └── Profile.tsx
    │
    ├── types/
    │   ├── auth.ts
    │   ├── task.ts
    │   ├── issue.ts
    │   ├── feedback.ts
    │   ├── note.ts
    │   ├── report.ts
    │   ├── user.ts
    │   └── common.ts                   # PagedResponse<T>, enums
    │
    ├── utils/
    │   ├── validation.ts               # Zod schemas mirroring backend rules
    │   └── formatters.ts               # Date, enum label helpers
    │
    └── routes.tsx                      # Centralized route definitions
```

> **Note:** The existing `frontend/` folder (original React scaffold) is left untouched. All new React/MUI code lives exclusively in `react-frontend/`.

### 4.2 npm Dependencies

| Package | Purpose |
|---------|---------|
| `@mui/material` + `@mui/icons-material` + `@emotion/react` + `@emotion/styled` | UI component library |
| `react-router-dom` (v6) | Client-side routing |
| `@tanstack/react-query` | Server-state management, caching, refetching |
| `axios` | HTTP client with interceptors |
| `react-hook-form` | Form state management |
| `@hookform/resolvers` + `zod` | Schema-based validation |
| `recharts` | Dashboard charts |
| `dayjs` | Lightweight date handling |
| `notistack` | MUI-compatible toast notifications |

### 4.3 Key Frontend Patterns

**Auth flow:**
1. `POST /api/auth/login` → receive `{ token, user }`.
2. Store `token` in `localStorage`, set `user` in `AuthContext`.
3. Axios interceptor attaches `Authorization: Bearer <token>` to every request.
4. On 401 response, clear token and redirect to `/login`.
5. `ProtectedRoute` checks `AuthContext`; redirects unauthenticated users to `/login`.

**Data fetching with React Query:**
```typescript
// hooks/useTasks.ts
export const useTasks = (filters: TaskFilters) =>
  useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskApi.list(filters),
  });

export const useCreateTask = () =>
  useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
```

**Form pattern (react-hook-form + zod):**
```typescript
const schema = z.object({
  title: z.string().min(3).max(200),
  date: z.string().refine(d => dayjs(d).isValid()),
  category: z.enum(['training', 'documentation', ...]),
  // ...
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

**Responsive layout:**
- MUI `Drawer` (permanent on desktop, collapsible on mobile).
- MUI `Grid` / `Container` with breakpoints for card layouts.
- Bottom navigation (`BottomNavigation`) on `xs`/`sm` breakpoints.

---

## 5. Authentication & Authorization

### 5.1 JWT Configuration

```json
// appsettings.json (non-secret; actual key from environment/secrets)
{
  "Jwt": {
    "Issuer": "OnboardingDiary",
    "Audience": "OnboardingDiary",
    "ExpiryMinutes": 60
  }
}
```

`Jwt:Key` loaded from environment variable `JWT_SECRET_KEY` (min 256-bit).

### 5.2 Token Generation

```csharp
// Claims: sub (user ID), email, role, name
var claims = new[]
{
    new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
    new Claim(JwtRegisteredClaimNames.Email, user.Email),
    new Claim(ClaimTypes.Role, user.Role.ToString()),
    new Claim(ClaimTypes.Name, user.FullName),
};
```

### 5.3 Authorization Policies

| Policy | Rule |
|--------|------|
| `RequireRecruit` | `User.IsInRole("recruit")` |
| `RequireManager` | `User.IsInRole("manager")` |
| `RequireAdmin` | `User.IsInRole("admin")` |
| `RequireManagerOrAdmin` | `User.IsInRole("manager") \|\| User.IsInRole("admin")` |

**Resource ownership** — checked in the service layer (not via policy), e.g.:
```csharp
public async Task<TaskDto> GetTask(Guid taskId, Guid currentUserId, string role)
{
    var task = await _db.Tasks.FindAsync(taskId) ?? throw new NotFoundException("Task");
    if (role == "recruit" && task.UserId != currentUserId)
        throw new ForbiddenException();
    if (role == "manager")
        await EnsureManagerOwnsRecruit(currentUserId, task.UserId);
    return task.ToDto();
}
```

---

## 6. Report Generation

### 6.1 PDF (QuestPDF)

- One-page cover with report metadata (date range, type, generated for, generated at).
- Table of entries matching the filter, styled with headers and alternating row colors.
- Summary statistics section at the top.
- For "combined" reports: separate sections per entry type.

### 6.2 CSV (CsvHelper)

- Header row matching the DTO field names.
- One row per entry.
- For "combined" reports: a `Type` column distinguishing task/issue/feedback rows, or separate sheets if multi-sheet CSV is needed (or one CSV per type bundled as a .zip — TBD based on UX preference).

### 6.3 File Storage

Generated reports stored in a `dot-net-backend/reports/` directory on disk (mapped via Docker volume). Each file named `{reportId}.{format}`. Download endpoint streams the file with `Content-Disposition: attachment`.

---

## 7. Docker Compose Setup

A **new** `docker-compose.new.yml` is added at the repo root for the .NET + SQL Server stack. The existing `docker-compose.yml` (PostgreSQL + Python) is **preserved as-is**:

```yaml
services:
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    restart: unless-stopped
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "${SA_PASSWORD:-YourStr0ngP@ssw0rd!}"
    ports:
      - "1433:1433"
    volumes:
      - mssql_data:/var/opt/mssql
    healthcheck:
      test: /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$${SA_PASSWORD:-YourStr0ngP@ssw0rd!}" -C -Q "SELECT 1" || exit 1
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./dot-net-backend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__DefaultConnection: "Server=db,1433;Database=OnboardingDiary;User Id=sa;Password=${SA_PASSWORD:-YourStr0ngP@ssw0rd!};TrustServerCertificate=True;"
      JWT_SECRET_KEY: "${JWT_SECRET_KEY:-super-secret-change-me-in-production}"
    ports:
      - "5000:8080"
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./react-frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mssql_data:
```

**Backend Dockerfile** (`dot-net-backend/Dockerfile`):
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY src/OnboardingDiary.Api/*.csproj ./
RUN dotnet restore
COPY src/OnboardingDiary.Api/ ./
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "OnboardingDiary.Api.dll"]
```

**Frontend Dockerfile** (`react-frontend/Dockerfile` — Vite build → nginx):
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## 8. Development Workflow & CI

### 8.1 Local Development (without Docker)

**Backend:**
```bash
cd dot-net-backend/src/OnboardingDiary.Api
dotnet watch run    # Hot-reload on port 5000
```

**Frontend:**
```bash
cd react-frontend
npm install
npm run dev         # Vite dev server on port 3000
```

**Database:**
```bash
docker compose -f docker-compose.new.yml up db    # Just SQL Server in Docker
dotnet ef database update --project dot-net-backend/src/OnboardingDiary.Api  # Apply migrations
```

### 8.2 CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      mssql:
        image: mcr.microsoft.com/mssql/server:2022-latest
        env:
          ACCEPT_EULA: "Y"
          MSSQL_SA_PASSWORD: "TestP@ssw0rd!"
        ports:
          - 1433:1433
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - run: dotnet restore
        working-directory: dot-net-backend
      - run: dotnet build --no-restore
        working-directory: dot-net-backend
      - run: dotnet test --no-build
        working-directory: dot-net-backend

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
        working-directory: react-frontend
      - run: npm run lint
        working-directory: react-frontend
      - run: npm run build
        working-directory: react-frontend
```

### 8.3 Code Quality

- **Backend**: `dotnet format` for formatting, analyzers via `<AnalysisMode>AllEnabledByDefault</AnalysisMode>`.
- **Frontend**: ESLint (configured in `react-frontend/`), Prettier, TypeScript strict mode.

---

## 9. Phased Build Plan

Each phase is a self-contained PR-sized increment. Later phases depend on earlier ones.

### Phase 1: Project Scaffolding & Infrastructure
**Goal:** Create new `dot-net-backend/` and `react-frontend/` folders with .NET 8 project and React+MUI app; set up SQL Server; verify end-to-end "hello world." Existing `backend/`, `frontend/`, and `db/` folders are **not modified**.

- [ ] Create `dot-net-backend/OnboardingDiary.sln` with `OnboardingDiary.Api` project.
- [ ] Add NuGet packages, `Program.cs` with DI, Swagger, CORS, exception middleware.
- [ ] Create `AppDbContext` with User entity + initial migration.
- [ ] Add `docker-compose.new.yml` for SQL Server + .NET backend + React frontend.
- [ ] Update `.gitignore` to add .NET artifacts (`bin/`, `obj/`, etc.).
- [ ] Scaffold `react-frontend/` with Vite + TypeScript + MUI + React Query + react-hook-form + zod.
- [ ] Verify: `docker compose -f docker-compose.new.yml up` starts all three services; Swagger UI accessible; frontend loads.

### Phase 2: Authentication & User Profile
**Goal:** Register, login (JWT), profile view/edit, seed admin.

- [ ] `User` entity + EF config.
- [ ] `AuthController` — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- [ ] `AuthService` — password hashing (bcrypt), JWT generation, user lookup.
- [ ] `UsersController` — `PUT /api/users/me` (profile update).
- [ ] Seed migration: admin user.
- [ ] Frontend: `AuthContext`, `Login.tsx`, `Register.tsx`, `Profile.tsx`, `ProtectedRoute`.
- [ ] JWT interceptor in Axios.
- [ ] Validation on register/login forms (zod).

### Phase 3: Task Log (CRUD + Filters)
**Goal:** Full task lifecycle with filtering.

- [ ] `TaskEntry` entity + migration.
- [ ] `TasksController` + `TaskService` — CRUD, ownership check, pagination, filters.
- [ ] FluentValidation for `CreateTaskRequest`, `UpdateTaskRequest`.
- [ ] Frontend: `TaskList.tsx`, `TaskForm.tsx`, filter bar, delete confirmation.
- [ ] Manager endpoint: `GET /api/users/{id}/tasks`.

### Phase 4: Issue Log + Feedback + Notes
**Goal:** Three more entry modules following the same pattern as tasks.

- [ ] `IssueEntry`, `FeedbackEntry`, `NoteEntry`, `NoteTag` entities + migration.
- [ ] Controllers + Services for each (CRUD, ownership, filters).
- [ ] Validators for each.
- [ ] Frontend pages for each module.
- [ ] Tags UI: chip input with autocomplete for notes.

### Phase 5: Dashboard
**Goal:** Summary stats, recent entries, task-completion progress.

- [ ] `DashboardController` + `DashboardService` — aggregate queries.
- [ ] `GET /api/dashboard` — counts, completion rate, recent 5 per type.
- [ ] `GET /api/dashboard/manager?recruitId=` — manager view.
- [ ] Frontend: `Dashboard.tsx` with `SummaryCard`, progress bar (MUI `LinearProgress`), recent entries tabs.
- [ ] Recharts donut for task-completion breakdown.

### Phase 6: Reports
**Goal:** Generate + download reports (PDF/CSV).

- [ ] `Report` entity + migration.
- [ ] `ReportsController` + `ReportService` — generate, download, list history.
- [ ] QuestPDF template for PDF reports.
- [ ] CsvHelper writer for CSV reports.
- [ ] Frontend: `ReportGenerator.tsx` (form), `ReportHistory.tsx` (download links).
- [ ] Manager scoping: recruit selector for managers.

### Phase 7: Admin User Management
**Goal:** Admin can list, create, edit, deactivate users and assign managers.

- [ ] `UsersController` admin endpoints — `GET /api/admin/users`, `PUT /api/admin/users/{id}`.
- [ ] Assign manager, deactivate, role change.
- [ ] Frontend: `UserList.tsx`, `UserForm.tsx` with role/manager dropdowns.

### Phase 8: Extra Features (Step 3) — see §10

---

## 10. Extra Features (Step 3)

We will implement **two** additional features after the core is complete:

### 10.1 Manager Dashboard with Charts & Analytics

**What:** An enhanced manager dashboard with visual charts:
- **Tasks over time** — line chart (tasks created/completed per week across recruits).
- **Issue severity distribution** — donut chart per recruit or aggregated.
- **Feedback sentiment breakdown** — bar chart of positive vs. suggestion vs. concern.
- **Per-recruit drill-down** — select a recruit to see their individual charts.

**Backend:** `GET /api/dashboard/analytics?period=weekly|monthly&recruitId=` — returns aggregated time-series data.

**Frontend:** Recharts line/bar/donut charts on the manager dashboard page.

### 10.2 Global Search

**What:** A search bar in the top navigation that searches across all entry types simultaneously.

**Backend:**
- `GET /api/search?q=keyword&type=all|tasks|issues|feedback|notes&page=&pageSize=`
- SQL Server full-text index on `Title`, `Description`/`Details`/`Content` columns.
- Results unioned and ranked by relevance, grouped by type.

**Frontend:**
- Search input in `TopBar` with debounced query.
- Search results page grouped by type (tasks, issues, feedback, notes) with highlighted matches.
- Click a result → navigate to that entry's edit/view page.

---

## Appendix: API Contract Reference

All API endpoints follow the contracts defined in `DEVELOPMENT_SPEC.md` §2, with these notes:
- Base URL is `/api` (not `/api/v1` — we may version later if needed).
- The password-reset endpoints (`POST /auth/password-reset`, `POST /auth/password-reset/confirm`) are deferred to post-v1 since they require email infrastructure. v1 provides admin-initiated password reset.
- Manager endpoints use the pattern `GET /api/users/{userId}/tasks` (etc.) rather than a nested `/manager/recruits/` prefix, for simplicity.
- All timestamps in responses are ISO 8601 UTC strings.
