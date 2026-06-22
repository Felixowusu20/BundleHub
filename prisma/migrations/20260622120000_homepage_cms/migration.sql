-- AlterTable
ALTER TABLE "Shop" ADD COLUMN "trustScore" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Shop" ADD COLUMN "rating" DECIMAL(3,2) NOT NULL DEFAULT 0;
ALTER TABLE "Shop" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Shop_trustScore_idx" ON "Shop"("trustScore");

-- CreateTable
CREATE TABLE "HomepageSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageFeature" (
    "id" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'mtn',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "brands" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageTestimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageStats" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "ordersProcessed" INTEGER NOT NULL DEFAULT 0,
    "platformRevenueGhs" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomepageSection_key_key" ON "HomepageSection"("key");

-- CreateIndex
CREATE INDEX "HomepageFeature_sortOrder_idx" ON "HomepageFeature"("sortOrder");
CREATE INDEX "HomepageFeature_published_idx" ON "HomepageFeature"("published");

-- CreateIndex
CREATE INDEX "HomepageService_sortOrder_idx" ON "HomepageService"("sortOrder");
CREATE INDEX "HomepageService_published_idx" ON "HomepageService"("published");

-- CreateIndex
CREATE INDEX "HomepageTestimonial_sortOrder_idx" ON "HomepageTestimonial"("sortOrder");
CREATE INDEX "HomepageTestimonial_published_idx" ON "HomepageTestimonial"("published");
