import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL environment variable.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

const ROLE_KEYS = ["super_admin", "admin", "member", "viewer"] as const;

const parseCsv = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const seed = async () => {
  for (const key of ROLE_KEYS) {
    await prisma.role.upsert({
      where: { key },
      update: {},
      create: {
        key,
        description: `Seeded ${key} role`,
      },
    });
  }

  const bootstrapEmails = parseCsv(process.env.BOOTSTRAP_SUPER_ADMIN_EMAILS);
  for (const email of bootstrapEmails) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        isActive: true,
      },
      create: {
        email,
        isActive: true,
      },
    });

    const role = await prisma.role.findUnique({ where: { key: "super_admin" } });
    if (!role) {
      throw new Error("Missing super_admin role after role seed.");
    }

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
        assignedBy: "seed",
      },
    });
  }
};

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
