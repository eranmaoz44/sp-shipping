-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "auth0_sub" DROP NOT NULL;
