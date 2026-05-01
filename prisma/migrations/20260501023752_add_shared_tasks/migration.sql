-- CreateEnum
CREATE TYPE "SharedTaskStatus" AS ENUM ('OPEN', 'PICKED_UP', 'ARCHIVED');

-- CreateTable
CREATE TABLE "SharedTask" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "status" "SharedTaskStatus" NOT NULL DEFAULT 'OPEN',
    "creatorId" TEXT NOT NULL,
    "pickedUpBy" TEXT,
    "pickedUpAt" TIMESTAMP(3),
    "todoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedTaskShare" (
    "id" TEXT NOT NULL,
    "sharedTaskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedTaskShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedTask_todoId_key" ON "SharedTask"("todoId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedTaskShare_sharedTaskId_userId_key" ON "SharedTaskShare"("sharedTaskId", "userId");

-- AddForeignKey
ALTER TABLE "SharedTask" ADD CONSTRAINT "SharedTask_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedTask" ADD CONSTRAINT "SharedTask_pickedUpBy_fkey" FOREIGN KEY ("pickedUpBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedTaskShare" ADD CONSTRAINT "SharedTaskShare_sharedTaskId_fkey" FOREIGN KEY ("sharedTaskId") REFERENCES "SharedTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedTaskShare" ADD CONSTRAINT "SharedTaskShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
