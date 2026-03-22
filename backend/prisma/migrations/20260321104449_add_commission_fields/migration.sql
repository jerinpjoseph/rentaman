-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "net_amount" DECIMAL(10,2),
ADD COLUMN     "platform_fee" DECIMAL(10,2),
ADD COLUMN     "platform_fee_percent" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "platform_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_configs_key_key" ON "platform_configs"("key");
