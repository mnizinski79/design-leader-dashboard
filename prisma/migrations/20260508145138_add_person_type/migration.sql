-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('DIRECT', 'LEADERSHIP', 'PEER');

-- AlterTable
ALTER TABLE "designers" ADD COLUMN     "person_type" "PersonType" NOT NULL DEFAULT 'DIRECT',
ALTER COLUMN "role_level" SET DEFAULT '';
