/**
 * Idempotent schema sync for Neon when migrate history is out of date.
 * Run: npm run db:fix
 */
import { config } from "dotenv";
import { execSync } from "node:child_process";
import pg from "pg";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set (check .env.local)");
  process.exit(1);
}

const SCHEMA_SQL = `
-- User.emailVerifiedAt (email verification migration)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;

-- Shop homepage fields
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "trustScore" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "rating" DECIMAL(3,2) NOT NULL DEFAULT 0;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "Shop_trustScore_idx" ON "Shop"("trustScore");

-- Password reset tokens
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
DO $$ BEGIN
  ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Email verification tokens
CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");
DO $$ BEGIN
  ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Homepage CMS
CREATE TABLE IF NOT EXISTS "HomepageSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HomepageSection_key_key" ON "HomepageSection"("key");

CREATE TABLE IF NOT EXISTS "HomepageFeature" (
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
CREATE INDEX IF NOT EXISTS "HomepageFeature_sortOrder_idx" ON "HomepageFeature"("sortOrder");
CREATE INDEX IF NOT EXISTS "HomepageFeature_published_idx" ON "HomepageFeature"("published");

CREATE TABLE IF NOT EXISTS "HomepageService" (
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
CREATE INDEX IF NOT EXISTS "HomepageService_sortOrder_idx" ON "HomepageService"("sortOrder");
CREATE INDEX IF NOT EXISTS "HomepageService_published_idx" ON "HomepageService"("published");

CREATE TABLE IF NOT EXISTS "HomepageTestimonial" (
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
CREATE INDEX IF NOT EXISTS "HomepageTestimonial_sortOrder_idx" ON "HomepageTestimonial"("sortOrder");
CREATE INDEX IF NOT EXISTS "HomepageTestimonial_published_idx" ON "HomepageTestimonial"("published");

CREATE TABLE IF NOT EXISTS "HomepageStats" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "ordersProcessed" INTEGER NOT NULL DEFAULT 0,
    "platformRevenueGhs" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HomepageStats_pkey" PRIMARY KEY ("id")
);
`;

const MIGRATIONS = [
  "20260619173651_init_auth_users",
  "20260620120000_password_reset_tokens",
  "20260621100000_email_verification",
  "20260622120000_homepage_cms"
] as const;

async function applySchema() {
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(SCHEMA_SQL);
    await client.query("COMMIT");
    console.log("✓ Database schema synced (Shop.trustScore + homepage CMS tables)");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

function resolveMigrations() {
  for (const name of MIGRATIONS) {
    try {
      execSync(`npx prisma migrate resolve --applied ${name}`, {
        stdio: "pipe",
        env: process.env
      });
      console.log(`✓ Marked migration applied: ${name}`);
    } catch {
      // Already applied or rolled back — try rolled-back for failed, then applied
      try {
        execSync(`npx prisma migrate resolve --rolled-back ${name}`, {
          stdio: "pipe",
          env: process.env
        });
        execSync(`npx prisma migrate resolve --applied ${name}`, {
          stdio: "pipe",
          env: process.env
        });
        console.log(`✓ Recovered migration: ${name}`);
      } catch {
        console.log(`· Migration already recorded: ${name}`);
      }
    }
  }
}

async function main() {
  console.log("Syncing BundleHub database schema…\n");
  await applySchema();
  console.log("Pushing Prisma schema (marketplace tables)…\n");
  execSync("npx prisma db push", { stdio: "inherit", env: process.env });
  resolveMigrations();
  console.log("\nDone. Restart the dev server: npm run clean && npm run dev");
}

main().catch((err) => {
  console.error("\nDatabase fix failed:", err);
  process.exit(1);
});
