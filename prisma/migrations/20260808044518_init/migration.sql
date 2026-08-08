-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'TL', 'HR_ADMIN');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'LEAVE');

-- CreateEnum
CREATE TYPE "TrackSheetStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "team_id" TEXT,
    "manager_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "team_leader_id" TEXT,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "check_in_time" TIMESTAMP(3) NOT NULL,
    "check_out_time" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL,
    "ip" TEXT NOT NULL,
    "tz" TEXT NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_sheets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "task_description" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "status" "TrackSheetStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "track_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "team_id" TEXT,
    "assigned_by" TEXT NOT NULL,
    "assigned_to" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "submitted_to_user_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "days_allowed" INTEGER NOT NULL,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_user_id_date_key" ON "attendance"("user_id", "date");

-- CreateIndex
CREATE INDEX "track_sheets_user_id_date_idx" ON "track_sheets"("user_id", "date");

-- CreateIndex
CREATE INDEX "track_sheets_project_idx" ON "track_sheets"("project");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_status_idx" ON "tasks"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "tasks_team_id_idx" ON "tasks"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_name_key" ON "leave_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_date_key" ON "holidays"("date");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_team_leader_id_fkey" FOREIGN KEY ("team_leader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_sheets" ADD CONSTRAINT "track_sheets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_submitted_to_user_id_fkey" FOREIGN KEY ("submitted_to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
