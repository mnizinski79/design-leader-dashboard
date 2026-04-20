-- CreateEnum
CREATE TYPE "TodoStatus" AS ENUM ('TODO', 'INPROGRESS', 'AWAITING', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ProjectPhase" AS ENUM ('DISCOVERY', 'DESIGN', 'DEV_HANDOFF', 'IN_DEVELOPMENT', 'LIVE', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'BLOCKED', 'COMPLETE');

-- CreateEnum
CREATE TYPE "DreyfusStage" AS ENUM ('NOVICE', 'ADVANCED_BEGINNER', 'COMPETENT', 'PROFICIENT', 'EXPERT');

-- CreateEnum
CREATE TYPE "SessionFlag" AS ENUM ('POSITIVE', 'DEVELOPMENT', 'COACHING', 'FOLLOWUP');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'COMPLETE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" "TodoStatus" NOT NULL DEFAULT 'TODO',
    "due_date" DATE,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "note_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_tag_assignments" (
    "note_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "note_tag_assignments_pkey" PRIMARY KEY ("note_id","tag_id")
);

-- CreateTable
CREATE TABLE "ideas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT,
    "person" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phase" "ProjectPhase" NOT NULL DEFAULT 'DISCOVERY',
    "status" "ProjectStatus" NOT NULL DEFAULT 'ON_TRACK',
    "attention" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_decisions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_focus" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "daily_focus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "role_level" TEXT NOT NULL,
    "dreyfus_stage" "DreyfusStage",
    "avatar_class" TEXT NOT NULL DEFAULT 'avatar-a',
    "next_one_on_one" DATE,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designer_skills" (
    "id" TEXT NOT NULL,
    "designer_id" TEXT NOT NULL,
    "skill_name" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "designer_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designer_sessions" (
    "id" TEXT NOT NULL,
    "designer_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT NOT NULL,
    "flag" "SessionFlag",
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designer_goals" (
    "id" TEXT NOT NULL,
    "designer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meets_criteria" TEXT,
    "exceeds_criteria" TEXT,
    "timeline" TEXT NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ON_TRACK',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designer_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designer_feedback" (
    "id" TEXT NOT NULL,
    "designer_id" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "extracted_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designer_topics" (
    "id" TEXT NOT NULL,
    "designer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discussed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designer_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designer_notes" (
    "id" TEXT NOT NULL,
    "designer_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designer_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "note_tags_user_id_name_key" ON "note_tags"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "daily_focus_user_id_date_key" ON "daily_focus"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "designer_skills_designer_id_skill_name_key" ON "designer_skills"("designer_id", "skill_name");

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tag_assignments" ADD CONSTRAINT "note_tag_assignments_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tag_assignments" ADD CONSTRAINT "note_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "note_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_decisions" ADD CONSTRAINT "project_decisions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_focus" ADD CONSTRAINT "daily_focus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designers" ADD CONSTRAINT "designers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designer_skills" ADD CONSTRAINT "designer_skills_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "designers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designer_sessions" ADD CONSTRAINT "designer_sessions_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "designers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designer_goals" ADD CONSTRAINT "designer_goals_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "designers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designer_feedback" ADD CONSTRAINT "designer_feedback_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "designers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designer_topics" ADD CONSTRAINT "designer_topics_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "designers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designer_notes" ADD CONSTRAINT "designer_notes_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "designers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
