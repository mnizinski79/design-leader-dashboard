/*
  Warnings:

  - You are about to drop the `SharedTask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SharedTaskShare` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SharedTask" DROP CONSTRAINT "SharedTask_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "SharedTask" DROP CONSTRAINT "SharedTask_pickedUpBy_fkey";

-- DropForeignKey
ALTER TABLE "SharedTaskShare" DROP CONSTRAINT "SharedTaskShare_sharedTaskId_fkey";

-- DropForeignKey
ALTER TABLE "SharedTaskShare" DROP CONSTRAINT "SharedTaskShare_userId_fkey";

-- DropTable
DROP TABLE "SharedTask";

-- DropTable
DROP TABLE "SharedTaskShare";

-- CreateTable
CREATE TABLE "shared_tasks" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "status" "SharedTaskStatus" NOT NULL DEFAULT 'OPEN',
    "creator_id" TEXT NOT NULL,
    "picked_up_by" TEXT,
    "picked_up_at" TIMESTAMP(3),
    "todo_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_task_shares" (
    "id" TEXT NOT NULL,
    "shared_task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_task_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shared_tasks_todo_id_key" ON "shared_tasks"("todo_id");

-- CreateIndex
CREATE INDEX "shared_tasks_creator_id_idx" ON "shared_tasks"("creator_id");

-- CreateIndex
CREATE INDEX "shared_task_shares_user_id_idx" ON "shared_task_shares"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shared_task_shares_shared_task_id_user_id_key" ON "shared_task_shares"("shared_task_id", "user_id");

-- AddForeignKey
ALTER TABLE "shared_tasks" ADD CONSTRAINT "shared_tasks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_tasks" ADD CONSTRAINT "shared_tasks_picked_up_by_fkey" FOREIGN KEY ("picked_up_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_task_shares" ADD CONSTRAINT "shared_task_shares_shared_task_id_fkey" FOREIGN KEY ("shared_task_id") REFERENCES "shared_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_task_shares" ADD CONSTRAINT "shared_task_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
