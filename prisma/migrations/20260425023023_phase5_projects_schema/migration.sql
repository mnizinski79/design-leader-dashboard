-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "blockers" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "due_date" DATE,
ADD COLUMN     "sprint_snapshot" TEXT,
ADD COLUMN     "stakeholders" TEXT,
ALTER COLUMN "attention" DROP NOT NULL,
ALTER COLUMN "attention" DROP DEFAULT,
ALTER COLUMN "attention" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "project_designers" (
    "project_id" TEXT NOT NULL,
    "designer_id" TEXT NOT NULL,

    CONSTRAINT "project_designers_pkey" PRIMARY KEY ("project_id","designer_id")
);

-- AddForeignKey
ALTER TABLE "project_designers" ADD CONSTRAINT "project_designers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_designers" ADD CONSTRAINT "project_designers_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "designers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
