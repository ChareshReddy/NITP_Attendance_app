-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttendanceStatus" ADD VALUE 'HOLIDAY';
ALTER TYPE "AttendanceStatus" ADD VALUE 'WEEK_OFF';
ALTER TYPE "AttendanceStatus" ADD VALUE 'LATE_COMING';
ALTER TYPE "AttendanceStatus" ADD VALUE 'EARLY_LEAVING';
ALTER TYPE "AttendanceStatus" ADD VALUE 'OVERTIME';
ALTER TYPE "AttendanceStatus" ADD VALUE 'MISSING_PUNCH';

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "loss_of_pay" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "employee_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "marital_status" TEXT,
    "nationality" TEXT,
    "personal_email" TEXT,
    "mobile_number" TEXT,
    "emergency_contact" TEXT,
    "permanent_address" TEXT,
    "current_address" TEXT,
    "date_of_joining" TIMESTAMP(3),
    "employee_type" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "grade" TEXT,
    "location" TEXT,
    "business_unit" TEXT,
    "hr_business_partner" TEXT,
    "employment_status" TEXT DEFAULT 'Active',
    "probation_period_months" INTEGER,
    "confirmation_date" TIMESTAMP(3),
    "work_shift" TEXT,
    "bank_name" TEXT,
    "account_number" TEXT,
    "ifsc" TEXT,
    "pan" TEXT,
    "panEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "uan" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "basic_salary" DOUBLE PRECISION NOT NULL,
    "hra" DOUBLE PRECISION NOT NULL,
    "conveyance" DOUBLE PRECISION NOT NULL,
    "special_allowance" DOUBLE PRECISION NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "basic_salary" DOUBLE PRECISION NOT NULL,
    "hra" DOUBLE PRECISION NOT NULL,
    "conveyance" DOUBLE PRECISION NOT NULL,
    "special_allowance" DOUBLE PRECISION NOT NULL,
    "bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incentives" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gross_earnings" DOUBLE PRECISION NOT NULL,
    "pf" DOUBLE PRECISION NOT NULL,
    "esi" DOUBLE PRECISION NOT NULL,
    "professional_tax" DOUBLE PRECISION NOT NULL,
    "tds" DOUBLE PRECISION NOT NULL,
    "loan_deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lop_deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_deductions" DOUBLE PRECISION NOT NULL,
    "net_salary" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "goal_title" TEXT NOT NULL,
    "kpi" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "target" TEXT NOT NULL,
    "achievement" TEXT,
    "rating" DOUBLE PRECISION,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainings" (
    "id" TEXT NOT NULL,
    "training_name" TEXT NOT NULL,
    "trainer" TEXT NOT NULL,
    "planned_date" TIMESTAMP(3) NOT NULL,
    "actual_date" TIMESTAMP(3),
    "duration_hours" DOUBLE PRECISION NOT NULL,
    "department" TEXT,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_attendance" (
    "id" TEXT NOT NULL,
    "training_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "assessment_score" DOUBLE PRECISION,
    "certified" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,

    CONSTRAINT "training_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_user_id_key" ON "employee_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "salary_structures_user_id_key" ON "salary_structures"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_user_id_period_start_period_end_key" ON "payroll_runs"("user_id", "period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "training_attendance_training_id_user_id_key" ON "training_attendance"("training_id", "user_id");

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_goals" ADD CONSTRAINT "performance_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_goals" ADD CONSTRAINT "performance_goals_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_attendance" ADD CONSTRAINT "training_attendance_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_attendance" ADD CONSTRAINT "training_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
