-- CreateEnum
CREATE TYPE "Role" AS ENUM ('recruit', 'manager', 'admin');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('not_started', 'in_progress', 'completed', 'on_hold');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('training', 'documentation', 'meeting', 'setup', 'development', 'other');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('positive', 'suggestion', 'concern');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('tasks', 'issues', 'feedback', 'combined');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('pdf', 'csv');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'recruit',
    "department" VARCHAR(100),
    "start_date" DATE,
    "manager_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" "TaskCategory" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'not_started',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'open',
    "resolution_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "details" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_template_items" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "label" VARCHAR(300) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruit_checklists" (
    "id" UUID NOT NULL,
    "recruit_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "assigned_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruit_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruit_checklist_items" (
    "id" UUID NOT NULL,
    "recruit_checklist_id" UUID NOT NULL,
    "template_item_id" UUID NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "recruit_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "generated_by" UUID NOT NULL,
    "target_user_id" UUID,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_manager_id" ON "users"("manager_id");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_tasks_user_id" ON "tasks"("user_id");

-- CreateIndex
CREATE INDEX "idx_tasks_date" ON "tasks"("date");

-- CreateIndex
CREATE INDEX "idx_tasks_status" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "idx_tasks_category" ON "tasks"("category");

-- CreateIndex
CREATE INDEX "idx_issues_user_id" ON "issues"("user_id");

-- CreateIndex
CREATE INDEX "idx_issues_date" ON "issues"("date");

-- CreateIndex
CREATE INDEX "idx_issues_status" ON "issues"("status");

-- CreateIndex
CREATE INDEX "idx_issues_severity" ON "issues"("severity");

-- CreateIndex
CREATE INDEX "idx_feedback_user_id" ON "feedback"("user_id");

-- CreateIndex
CREATE INDEX "idx_feedback_date" ON "feedback"("date");

-- CreateIndex
CREATE INDEX "idx_feedback_type" ON "feedback"("type");

-- CreateIndex
CREATE INDEX "idx_notes_user_id" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "idx_notes_date" ON "notes"("date");

-- CreateIndex
CREATE INDEX "idx_checklist_templates_created_by" ON "checklist_templates"("created_by");

-- CreateIndex
CREATE INDEX "idx_checklist_template_items_template_id" ON "checklist_template_items"("template_id");

-- CreateIndex
CREATE INDEX "idx_recruit_checklists_recruit_id" ON "recruit_checklists"("recruit_id");

-- CreateIndex
CREATE INDEX "idx_recruit_checklists_template_id" ON "recruit_checklists"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "recruit_checklists_recruit_id_template_id_key" ON "recruit_checklists"("recruit_id", "template_id");

-- CreateIndex
CREATE INDEX "idx_recruit_checklist_items_checklist_id" ON "recruit_checklist_items"("recruit_checklist_id");

-- CreateIndex
CREATE UNIQUE INDEX "recruit_checklist_items_recruit_checklist_id_template_item__key" ON "recruit_checklist_items"("recruit_checklist_id", "template_item_id");

-- CreateIndex
CREATE INDEX "idx_reports_generated_by" ON "reports"("generated_by");

-- CreateIndex
CREATE INDEX "idx_reports_target_user_id" ON "reports"("target_user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruit_checklists" ADD CONSTRAINT "recruit_checklists_recruit_id_fkey" FOREIGN KEY ("recruit_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruit_checklists" ADD CONSTRAINT "recruit_checklists_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruit_checklists" ADD CONSTRAINT "recruit_checklists_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruit_checklist_items" ADD CONSTRAINT "recruit_checklist_items_recruit_checklist_id_fkey" FOREIGN KEY ("recruit_checklist_id") REFERENCES "recruit_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruit_checklist_items" ADD CONSTRAINT "recruit_checklist_items_template_item_id_fkey" FOREIGN KEY ("template_item_id") REFERENCES "checklist_template_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
