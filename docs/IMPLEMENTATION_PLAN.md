# Onboarding Diary Application - Implementation Plan

> **Stack Decision**: React (Vite + TypeScript + MUI) front-end, ASP.NET Core (.NET 8) Web API back-end, SQL Server database.
>
> The existing Python/FastAPI + PostgreSQL scaffold (in `backend/` and `frontend/`) is **preserved as-is**. All new implementation goes into separate folders: **`dot-net-backend/`** for the ASP.NET Core API and **`react-frontend/`** for the new React + MUI SPA. The existing `DEVELOPMENT_SPEC.md` remains the canonical source for **user stories**, **API contracts**, **validation rules**, and **UI flows**. This document covers the implementation-specific details: .NET project structure, SQL Server schema, architecture patterns, NuGet/npm dependencies, and phased build plan.

---

## Table of Contents

1. [SOLID Principles](#1-solid-principles)
2. [TDD Strategy & Testing](#2-tdd-strategy--testing)
3. [Architecture Overview](#3-architecture-overview)
4. [Backend - ASP.NET Core Web API](#4-backend---aspnet-core-web-api)
5. [Database - SQL Server](#5-database---sql-server)
6. [Frontend - React + Vite + MUI](#6-frontend---react--vite--mui)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Report Generation](#8-report-generation)
9. [Docker Compose Setup](#9-docker-compose-setup)
10. [Development Workflow & CI](#10-development-workflow--ci)
11. [Phased Build Plan](#11-phased-build-plan)
12. [Extra Features (Step 3)](#12-extra-features-step-3)

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

## 1. SOLID Principles

Every class, service, and component in this project adheres to SOLID. Below is how each principle maps to our design.

### 1.1 Single Responsibility Principle (SRP)

Each class has **one reason to change**:

| Layer | SRP application |
|-------|----------------|
| **Controllers** | Only HTTP concern — parse request, call service, return response. No business logic, no DB queries. |
| **Services** | One service per domain module (`TaskService`, `IssueService`, …). Each encapsulates business rules + authorization scoping for that module only. |
| **Validators** | One `FluentValidation` validator per request DTO. Validation logic is not in controllers or services. |
| **DTOs** | Separate request and response models — never reused across concerns. |
| **Middleware** | `ExceptionHandlingMiddleware` handles only error mapping. CORS, auth, and logging are separate middleware. |
| **Report generators** | `PdfReportGenerator` and `CsvReportGenerator` are separate classes — not a single class with format branching. |
| **React components** | Presentational components (e.g. `DataTable`, `StatusChip`) are pure display. Container/page components own data fetching via hooks. Hooks own the API call + cache logic. |

### 1.2 Open/Closed Principle (OCP)

Classes are **open for extension, closed for modification**:

- **Report generation**: `IReportFormatter` interface with `PdfReportFormatter` and `CsvReportFormatter` implementations. Adding a new format (e.g. Excel) means adding a new class — no changes to `ReportService`.
- **Authorization handlers**: Each handler (`ResourceOwnerHandler`, `ManagerScopeHandler`) is a separate `IAuthorizationHandler`. New authorization rules = new handler class.
- **Validation**: Adding a new field to a DTO means adding a rule to its validator — the validation pipeline itself is untouched.
- **Frontend**: New entry types follow the same hook/page/api pattern — no changes to `AppShell`, routing infrastructure, or shared components.

### 1.3 Liskov Substitution Principle (LSP)

- All service interfaces (`ITaskService`, `IIssueService`, etc.) define contracts that any implementation must honor. Tests verify behavior against the interface, not the concrete class.
- `BaseEntity` (with `Id`, `CreatedAt`, `UpdatedAt`) is extended by all entities without overriding base behavior.
- Frontend: all form components accept a common `onSubmit` prop signature — `TaskForm` and `IssueForm` are interchangeable from the layout's perspective.

### 1.4 Interface Segregation Principle (ISP)

- Service interfaces are **module-scoped**: `ITaskService` has only task methods; `IAuthService` has only auth methods. No "god" `IAppService`.
- `ICurrentUserAccessor` exposes only `UserId` and `Role` — not the full `HttpContext`.
- `IReportFormatter` has a single method `GenerateAsync(ReportData, Stream)` — it doesn't know about HTTP or storage.
- React hooks are granular: `useTasks()`, `useCreateTask()`, `useDeleteTask()` — not a single `useTaskOperations()` mega-hook.

### 1.5 Dependency Inversion Principle (DIP)

- Controllers depend on `ITaskService`, not `TaskService`. Concrete registrations are in `Program.cs` DI container.
- Services depend on `AppDbContext` (abstraction over DB) and `ICurrentUserAccessor` (abstraction over HTTP context) — never on `HttpContext` directly.
- `ReportService` depends on `IReportFormatter` — resolved from DI at runtime based on requested format.
- Frontend: API layer (`api/tasks.ts`) depends on the Axios client abstraction (`api/client.ts`). Components depend on hooks, hooks depend on API functions — never on Axios directly.
- All dependencies are injected via constructor injection (backend) or React context/props (frontend).

---

## 2. TDD Strategy & Testing

We follow a strict **Red → Green → Refactor** cycle. For every feature, tests are written **before** implementation code.

### 2.1 TDD Workflow (per feature)

```
1. RED    — Write a failing test that defines the expected behavior.
2. GREEN  — Write the minimum code to make the test pass.
3. REFACTOR — Clean up the code while keeping tests green.
4. REPEAT — Next test case for the same feature or move to next feature.
```

Every PR must include tests that were written **before or alongside** the production code. Tests are not an afterthought.

### 2.2 Backend Test Architecture

```
dot-net-backend/
└── tests/
    ├── OnboardingDiary.UnitTests/              # Fast, isolated, no DB
    │   ├── OnboardingDiary.UnitTests.csproj
    │   ├── Services/
    │   │   ├── AuthServiceTests.cs
    │   │   ├── TaskServiceTests.cs
    │   │   ├── IssueServiceTests.cs
    │   │   ├── FeedbackServiceTests.cs
    │   │   ├── NoteServiceTests.cs
    │   │   ├── DashboardServiceTests.cs
    │   │   └── ReportServiceTests.cs
    │   ├── Validators/
    │   │   ├── RegisterRequestValidatorTests.cs
    │   │   ├── CreateTaskRequestValidatorTests.cs
    │   │   └── ... (one per validator)
    │   ├── Auth/
    │   │   └── JwtTokenGeneratorTests.cs
    │   └── Helpers/
    │       └── TestFixtures.cs                  # Shared builders/fakes
    │
    └── OnboardingDiary.IntegrationTests/        # Real DB, full HTTP pipeline
        ├── OnboardingDiary.IntegrationTests.csproj
        ├── CustomWebApplicationFactory.cs       # Test server with in-memory/test DB
        ├── Auth/
        │   ├── RegisterTests.cs
        │   └── LoginTests.cs
        ├── Tasks/
        │   ├── CreateTaskTests.cs
        │   ├── GetTasksTests.cs
        │   ├── UpdateTaskTests.cs
        │   └── DeleteTaskTests.cs
        ├── Issues/
        │   └── ... (same CRUD pattern)
        ├── Feedback/
        │   └── ...
        ├── Notes/
        │   └── ...
        ├── Dashboard/
        │   └── DashboardTests.cs
        ├── Reports/
        │   └── ReportGenerationTests.cs
        └── Admin/
            └── UserManagementTests.cs
```

**Test types and when to use:**

| Type | Scope | Speed | DB? | What it tests |
|------|-------|-------|-----|---------------|
| **Unit test** | Single class/method | <1ms | No (mocked) | Service business logic, validators, token generation, DTOs |
| **Integration test** | Full HTTP pipeline | ~100ms | Yes (test DB) | Controller → Service → EF Core → SQL Server round-trip, auth middleware, error responses |

### 2.3 Backend Test NuGet Packages

| Package | Purpose |
|---------|---------|
| `xunit` | Test framework |
| `xunit.runner.visualstudio` | VS/CLI test runner |
| `Moq` | Mocking interfaces (unit tests) |
| `FluentAssertions` | Readable assertion syntax |
| `Microsoft.AspNetCore.Mvc.Testing` | `WebApplicationFactory` for integration tests |
| `Microsoft.EntityFrameworkCore.InMemory` | In-memory DB provider for unit tests |
| `Bogus` | Fake data generation for test fixtures |

### 2.4 Backend Test Patterns

**Unit test (service with mocked DbContext):**
```csharp
public class TaskServiceTests
{
    private readonly AppDbContext _db;          // In-memory EF provider
    private readonly Mock<ICurrentUserAccessor> _currentUser;
    private readonly TaskService _sut;          // System Under Test

    public TaskServiceTests()
    {
        _db = CreateInMemoryDb();
        _currentUser = new Mock<ICurrentUserAccessor>();
        _sut = new TaskService(_db, _currentUser.Object);
    }

    [Fact]
    public async Task CreateTask_ValidInput_ReturnsTaskDto()
    {
        // Arrange
        _currentUser.Setup(x => x.UserId).Returns(Guid.NewGuid());
        var request = new CreateTaskRequest { Title = "Setup laptop", ... };

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Setup laptop");
        _db.Tasks.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetTask_WrongOwner_ThrowsForbidden()
    {
        // Arrange — task owned by user A, current user is B
        // Act & Assert
        await _sut.Invoking(s => s.GetAsync(taskId))
            .Should().ThrowAsync<ForbiddenException>();
    }
}
```

**Integration test (full HTTP round-trip):**
```csharp
public class CreateTaskTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public CreateTaskTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task POST_Tasks_Returns201_WhenValid()
    {
        // Arrange — register + login to get JWT
        await AuthHelper.RegisterAndLogin(_client, "recruit@test.com");

        // Act
        var response = await _client.PostAsJsonAsync("/api/tasks", new { ... });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var task = await response.Content.ReadFromJsonAsync<TaskDto>();
        task!.Title.Should().Be("Setup laptop");
    }

    [Fact]
    public async Task POST_Tasks_Returns401_WhenNoToken()
    {
        var response = await _client.PostAsJsonAsync("/api/tasks", new { ... });
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
```

**Validator test:**
```csharp
public class CreateTaskRequestValidatorTests
{
    private readonly CreateTaskRequestValidator _validator = new();

    [Theory]
    [InlineData("")]         // empty
    [InlineData("ab")]       // too short
    public void Title_Invalid_FailsValidation(string title)
    {
        var result = _validator.Validate(new CreateTaskRequest { Title = title });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Title");
    }
}
```

### 2.5 Frontend Test Architecture

```
react-frontend/
└── src/
    └── __tests__/
        ├── components/
        │   ├── ProtectedRoute.test.tsx
        │   ├── DataTable.test.tsx
        │   ├── StatusChip.test.tsx
        │   └── ConfirmDialog.test.tsx
        ├── hooks/
        │   ├── useTasks.test.tsx
        │   └── useAuth.test.tsx
        ├── pages/
        │   ├── Login.test.tsx
        │   ├── Register.test.tsx
        │   ├── TaskList.test.tsx
        │   ├── TaskForm.test.tsx
        │   └── Dashboard.test.tsx
        ├── utils/
        │   ├── validation.test.ts
        │   └── formatters.test.ts
        └── setup.ts                             # MSW handlers, test providers
```

### 2.6 Frontend Test npm Packages

| Package | Purpose |
|---------|---------|
| `vitest` | Test runner (Vite-native, fast) |
| `@testing-library/react` | Component rendering + queries |
| `@testing-library/jest-dom` | DOM matchers (`toBeInTheDocument`, etc.) |
| `@testing-library/user-event` | Simulating user interactions |
| `msw` (Mock Service Worker) | API mocking at network level |
| `@faker-js/faker` | Fake data generation |

### 2.7 Frontend Test Patterns

**Component test (React Testing Library):**
```typescript
describe('StatusChip', () => {
  it('renders completed status with green color', () => {
    render(<StatusChip status="completed" />);
    const chip = screen.getByText('Completed');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('MuiChip-colorSuccess');
  });
});
```

**Hook test with MSW:**
```typescript
describe('useTasks', () => {
  it('fetches tasks and returns data', async () => {
    server.use(
      http.get('/api/tasks', () =>
        HttpResponse.json({ items: [mockTask], total: 1, page: 1, pageSize: 20 })
      )
    );

    const { result } = renderHook(() => useTasks({}), { wrapper: TestProviders });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.items).toHaveLength(1);
  });
});
```

**Form validation test:**
```typescript
describe('TaskForm', () => {
  it('shows validation error when title is empty', async () => {
    render(<TaskForm onSubmit={vi.fn()} />, { wrapper: TestProviders });
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
  });
});
```

### 2.8 Coverage Targets

| Layer | Target | Rationale |
|-------|--------|-----------|
| Backend services | >90% line coverage | Core business logic — highest risk |
| Backend validators | 100% | Every rule must be tested |
| Backend controllers (integration) | >80% | All happy paths + key error paths |
| Frontend hooks | >80% | Data fetching + cache invalidation logic |
| Frontend components | >70% | Key interactive behaviors; skip trivial wrappers |
| Frontend utils | 100% | Pure functions — easy and essential to test |

Coverage is measured in CI via `dotnet test --collect:"XPlat Code Coverage"` (backend) and `vitest --coverage` (frontend).

---

## 3. Architecture Overview

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
- **SOLID throughout**: All inter-layer communication via interfaces; single-responsibility classes; extension via new implementations (see §1).
- **TDD workflow**: Tests written before production code in every phase (see §2).
- **DTOs separate from entities**: Request/response models are never the EF entities themselves. Mapping done via explicit mapping methods (no AutoMapper — keeps things transparent and debuggable).
- **No mediator/CQRS**: Overkill for this scope. Direct service injection into controllers.
- **JWT authentication**: Access token only (no refresh token for v1). Token stored in `localStorage` on the client; `Authorization: Bearer <token>` on every API call.
- **Role + ownership authorization**: Custom authorization policies and resource-based checks in services.

---

## 4. Backend - ASP.NET Core Web API

### 4.1 Solution & Project Structure

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
│       ├── Validation/
│       │   ├── RegisterRequestValidator.cs     # FluentValidation validators
│       │   ├── CreateTaskRequestValidator.cs
│       │   ├── ... (one per request DTO)
│       │   └── ValidationFilter.cs             # MVC filter to return 400 on invalid input
│       │
│       └── Interfaces/                          # ISP: granular service interfaces
│           ├── IReportFormatter.cs              # OCP: one impl per format
│           └── ICurrentUserAccessor.cs          # ISP: only UserId + Role
│
└── tests/                                       # See §2.2 for full test structure
    ├── OnboardingDiary.UnitTests/
    │   └── ...                                  # Mocked DB, fast, isolated
    └── OnboardingDiary.IntegrationTests/
        └── ...                                  # Real HTTP pipeline + test DB
```

> **Note:** The existing `backend/` folder (Python/FastAPI) is left untouched. All .NET code lives exclusively in `dot-net-backend/`.

### 4.2 NuGet Dependencies

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

**Test packages** (see §2.3 for details): `xunit`, `Moq`, `FluentAssertions`, `Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.EntityFrameworkCore.InMemory`, `Bogus`.

### 4.3 Key Implementation Patterns

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

## 5. Database - SQL Server

### 5.1 Connection

SQL Server 2022 via Docker. Connection string:
```
Server=localhost,1433;Database=OnboardingDiary;User Id=sa;Password=<from-env>;TrustServerCertificate=True;
```

### 5.2 Schema (SQL Server dialect)

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

### 5.3 Key differences from the PostgreSQL schema in DEVELOPMENT_SPEC.md

| Aspect | PostgreSQL (DEVELOPMENT_SPEC.md) | SQL Server (this plan) |
|--------|----------------------------------|------------------------|
| UUID generation | `gen_random_uuid()` / pgcrypto | `NEWSEQUENTIALID()` (clustered-index friendly) |
| String type | `VARCHAR` | `NVARCHAR` (Unicode) |
| Boolean | `BOOLEAN` | `BIT` |
| Timestamp | `TIMESTAMPTZ` | `DATETIME2` (stored as UTC) |
| Array column | `TEXT[]` for tags | Separate `NoteTags` join table |
| Full-text search | `tsvector` + GIN | SQL Server Full-Text Index (for search feature) |
| Now function | `NOW()` | `SYSUTCDATETIME()` |

### 5.4 Seed Data

On first migration, seed a default admin user:
```
Email:    admin@onboardingdiary.local
Password: Admin@123 (bcrypt-hashed)
Role:     admin
```

---

## 6. Frontend - React + Vite + MUI

### 6.1 Project Structure

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

### 6.2 npm Dependencies

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

**Test packages** (see §2.6 for details): `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`, `@faker-js/faker`.

### 6.3 Key Frontend Patterns

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

## 7. Authentication & Authorization

### 7.1 JWT Configuration

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

### 7.2 Token Generation

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

### 7.3 Authorization Policies

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

## 8. Report Generation

### 8.1 PDF (QuestPDF)

- One-page cover with report metadata (date range, type, generated for, generated at).
- Table of entries matching the filter, styled with headers and alternating row colors.
- Summary statistics section at the top.
- For "combined" reports: separate sections per entry type.

### 8.2 CSV (CsvHelper)

- Header row matching the DTO field names.
- One row per entry.
- For "combined" reports: a `Type` column distinguishing task/issue/feedback rows, or separate sheets if multi-sheet CSV is needed (or one CSV per type bundled as a .zip — TBD based on UX preference).

### 8.3 File Storage

Generated reports stored in a `dot-net-backend/reports/` directory on disk (mapped via Docker volume). Each file named `{reportId}.{format}`. Download endpoint streams the file with `Content-Disposition: attachment`.

---

## 9. Docker Compose Setup

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

## 10. Development Workflow & CI

### 10.1 Local Development (without Docker)

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

### 10.2 CI Pipeline (GitHub Actions)

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
      - run: dotnet test --no-build --collect:"XPlat Code Coverage"
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
      - run: npm run test -- --run
        working-directory: react-frontend
      - run: npm run build
        working-directory: react-frontend
```

### 10.3 Code Quality

- **Backend**: `dotnet format` for formatting, analyzers via `<AnalysisMode>AllEnabledByDefault</AnalysisMode>`.
- **Frontend**: ESLint (configured in `react-frontend/`), Prettier, TypeScript strict mode.

---

## 11. Phased Build Plan

Each phase is a self-contained PR-sized increment. Later phases depend on earlier ones.

**TDD is applied in every phase.** Each phase follows this cycle:
1. Write failing tests (unit + integration) that define expected behavior.
2. Implement the minimum code to make tests pass.
3. Refactor while keeping tests green.
4. Ensure all existing tests still pass before merging.

### Phase 1: Project Scaffolding & Infrastructure
**Goal:** Create new `dot-net-backend/` and `react-frontend/` folders with .NET 8 project and React+MUI app; set up SQL Server; set up test projects; verify end-to-end "hello world." Existing `backend/`, `frontend/`, and `db/` folders are **not modified**.

- [ ] Create `dot-net-backend/OnboardingDiary.sln` with `OnboardingDiary.Api` project.
- [ ] Create `OnboardingDiary.UnitTests` and `OnboardingDiary.IntegrationTests` test projects.
- [ ] Add NuGet packages (production + test: xunit, Moq, FluentAssertions, Bogus, etc.).
- [ ] Add `Program.cs` with DI, Swagger, CORS, exception middleware.
- [ ] Create `AppDbContext` with `BaseEntity` + initial migration.
- [ ] **TDD**: Write a smoke integration test (`GET /health` returns 200) → implement health endpoint.
- [ ] Add `docker-compose.new.yml` for SQL Server + .NET backend + React frontend.
- [ ] Update `.gitignore` to add .NET artifacts (`bin/`, `obj/`, etc.).
- [ ] Scaffold `react-frontend/` with Vite + TypeScript + MUI + React Query + react-hook-form + zod + vitest + testing-library + msw.
- [ ] **TDD**: Write a frontend smoke test (App renders without crashing) → verify.
- [ ] Verify: `docker compose -f docker-compose.new.yml up` starts all three services; Swagger UI accessible; frontend loads; `dotnet test` and `npm test` pass.

### Phase 2: Authentication & User Profile
**Goal:** Register, login (JWT), profile view/edit, seed admin. **Tests first.**

- [ ] **TDD (unit)**: `JwtTokenGeneratorTests` — token contains correct claims, expires at configured time.
- [ ] **TDD (unit)**: `AuthServiceTests` — register hashes password, login rejects wrong password, login returns token.
- [ ] **TDD (unit)**: `RegisterRequestValidatorTests` — email format, password strength, required fields.
- [ ] **TDD (integration)**: `POST /api/auth/register` returns 201; duplicate email returns 409; `POST /api/auth/login` returns token; `GET /api/auth/me` returns user; 401 without token.
- [ ] Implement: `User` entity + EF config + seed migration (admin user).
- [ ] Implement: `AuthController`, `AuthService`, `JwtTokenGenerator`.
- [ ] Implement: `UsersController` — `PUT /api/users/me` (profile update).
- [ ] **TDD (frontend)**: `Login.test.tsx` — shows validation errors, calls API on valid submit, redirects on success.
- [ ] **TDD (frontend)**: `Register.test.tsx` — validates password match, calls API.
- [ ] **TDD (frontend)**: `ProtectedRoute.test.tsx` — redirects unauthenticated users.
- [ ] Implement: `AuthContext`, `Login.tsx`, `Register.tsx`, `Profile.tsx`, `ProtectedRoute`, JWT interceptor.

### Phase 3: Task Log (CRUD + Filters)
**Goal:** Full task lifecycle with filtering. **Tests first.**

- [ ] **TDD (unit)**: `TaskServiceTests` — create returns DTO, get by wrong owner throws `ForbiddenException`, update non-existent throws `NotFoundException`, filters apply correctly, pagination works.
- [ ] **TDD (unit)**: `CreateTaskRequestValidatorTests` — title min/max, date not future, valid enum values.
- [ ] **TDD (integration)**: `POST /api/tasks` 201, `GET /api/tasks` with filters, `PUT /api/tasks/{id}` 200, `DELETE /api/tasks/{id}` 204, ownership 403, manager access via `GET /api/users/{id}/tasks`.
- [ ] Implement: `TaskEntry` entity + migration.
- [ ] Implement: `TasksController` + `TaskService` — CRUD, ownership check, pagination, filters.
- [ ] Implement: FluentValidation for `CreateTaskRequest`, `UpdateTaskRequest`.
- [ ] **TDD (frontend)**: `TaskList.test.tsx` — renders tasks from API, filters update query, delete shows confirmation.
- [ ] **TDD (frontend)**: `TaskForm.test.tsx` — validates required fields, submits correctly, edit pre-fills values.
- [ ] Implement: `TaskList.tsx`, `TaskForm.tsx`, filter bar, delete confirmation.

### Phase 4: Issue Log + Feedback + Notes
**Goal:** Three more entry modules following the same TDD pattern as Phase 3.

- [ ] **TDD (unit)**: `IssueServiceTests` — CRUD, resolution_notes required when status=resolved/closed, severity filter.
- [ ] **TDD (unit)**: `FeedbackServiceTests` — CRUD, type filter.
- [ ] **TDD (unit)**: `NoteServiceTests` — CRUD, tag management (add/remove), tag filter.
- [ ] **TDD (unit)**: Validators for each request DTO.
- [ ] **TDD (integration)**: Full CRUD + filter + ownership tests for issues, feedback, notes.
- [ ] Implement: `IssueEntry`, `FeedbackEntry`, `NoteEntry`, `NoteTag` entities + migration.
- [ ] Implement: Controllers + Services for each (CRUD, ownership, filters).
- [ ] Implement: Validators for each.
- [ ] **TDD (frontend)**: List + Form tests for each module (same pattern as Phase 3).
- [ ] Implement: Frontend pages for each module.
- [ ] Implement: Tags UI — chip input with autocomplete for notes.

### Phase 5: Dashboard
**Goal:** Summary stats, recent entries, task-completion progress. **Tests first.**

- [ ] **TDD (unit)**: `DashboardServiceTests` — correct counts, completion rate calculation, recent entries ordered by date, manager view only includes assigned recruits.
- [ ] **TDD (integration)**: `GET /api/dashboard` returns correct aggregates; `GET /api/dashboard/manager` returns 403 for non-manager.
- [ ] Implement: `DashboardController` + `DashboardService` — aggregate queries.
- [ ] **TDD (frontend)**: `Dashboard.test.tsx` — renders summary cards with correct counts, shows progress bar, renders chart.
- [ ] Implement: `Dashboard.tsx` with `SummaryCard`, progress bar (MUI `LinearProgress`), recent entries tabs, Recharts donut.

### Phase 6: Reports
**Goal:** Generate + download reports (PDF/CSV). **Tests first. OCP via `IReportFormatter`.**

- [ ] **TDD (unit)**: `PdfReportFormatterTests` — generates valid PDF stream for given data.
- [ ] **TDD (unit)**: `CsvReportFormatterTests` — generates valid CSV with correct headers and rows.
- [ ] **TDD (unit)**: `ReportServiceTests` — delegates to correct `IReportFormatter` based on format, stores file, returns download URL.
- [ ] **TDD (integration)**: `POST /api/reports/generate` returns report ID; `GET /api/reports/{id}/download` streams file; manager can generate for own recruits; recruit cannot generate for others.
- [ ] Implement: `IReportFormatter` interface + `PdfReportFormatter` (QuestPDF) + `CsvReportFormatter` (CsvHelper).
- [ ] Implement: `Report` entity + migration.
- [ ] Implement: `ReportsController` + `ReportService`.
- [ ] **TDD (frontend)**: `ReportGenerator.test.tsx` — validates date range, shows recruit selector for managers.
- [ ] Implement: `ReportGenerator.tsx` (form), `ReportHistory.tsx` (download links).

### Phase 7: Admin User Management
**Goal:** Admin can list, create, edit, deactivate users and assign managers. **Tests first.**

- [ ] **TDD (unit)**: `UserServiceTests` — only admin can list/edit users, assign manager validates target is a manager, deactivate sets flag.
- [ ] **TDD (integration)**: `GET /api/admin/users` returns 403 for non-admin; `PUT /api/admin/users/{id}` changes role; manager assignment works.
- [ ] Implement: `UsersController` admin endpoints — `GET /api/admin/users`, `PUT /api/admin/users/{id}`.
- [ ] Implement: Assign manager, deactivate, role change.
- [ ] **TDD (frontend)**: `UserList.test.tsx` — renders user table, filters by role; `UserForm.test.tsx` — role dropdown, manager selector.
- [ ] Implement: `UserList.tsx`, `UserForm.tsx` with role/manager dropdowns.

### Phase 8: Extra Features (Step 3) — see §12

- [ ] **TDD**: Analytics aggregation tests (correct weekly/monthly grouping, per-recruit scoping).
- [ ] **TDD**: Search tests (matches across entry types, ranking, type filtering).
- [ ] **TDD (frontend)**: Chart rendering tests, search results grouping tests.
- [ ] Implement: Manager dashboard charts + global search.

---

## 12. Extra Features (Step 3)

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
