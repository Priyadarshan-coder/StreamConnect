-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "chunkPaths" TEXT[],

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Video_uniqueId_key" ON "Video"("uniqueId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
