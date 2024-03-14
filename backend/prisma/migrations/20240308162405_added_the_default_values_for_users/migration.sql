/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Course` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "avatar" SET DEFAULT '../images/profile.png',
ALTER COLUMN "isVerified" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Course_title_key" ON "Course"("title");
