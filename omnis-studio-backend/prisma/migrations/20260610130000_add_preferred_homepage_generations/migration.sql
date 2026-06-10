-- CreateTable
CREATE TABLE "preferred_homepage_generations" (
    "slot" INTEGER NOT NULL,
    "generation_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preferred_homepage_generations_pkey" PRIMARY KEY ("slot")
);

-- CreateIndex
CREATE UNIQUE INDEX "preferred_homepage_generations_generation_id_key" ON "preferred_homepage_generations"("generation_id");

-- AddCheck
ALTER TABLE "preferred_homepage_generations" ADD CONSTRAINT "preferred_homepage_generations_slot_check" CHECK ("slot" BETWEEN 1 AND 6);

-- AddForeignKey
ALTER TABLE "preferred_homepage_generations" ADD CONSTRAINT "preferred_homepage_generations_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
