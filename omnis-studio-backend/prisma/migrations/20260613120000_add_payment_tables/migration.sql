-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "paddle_transaction_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "credits_purchased" INTEGER NOT NULL,
    "credits_before" DOUBLE PRECISION NOT NULL,
    "credits_after" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paddle_webhook_events" (
    "evt_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paddle_webhook_events_pkey" PRIMARY KEY ("evt_id")
);

-- AlterTable
ALTER TABLE "plans" ADD COLUMN "paddle_price_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_paddle_transaction_id_key" ON "transactions"("paddle_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_paddle_price_id_key" ON "plans"("paddle_price_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
