import postgres from 'postgres';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/open_garden';

async function seed() {
  const db = postgres(DATABASE_URL);

  const adminEmail = 'admin@opengarden.cz';
  const adminPassword = 'admin123';
  const hash = await bcrypt.hash(adminPassword, 10);

  const existing = await db`SELECT id FROM users WHERE email = ${adminEmail}`;
  if (existing.length > 0) {
    console.log(`Admin uživatel již existuje (${adminEmail}), seed přeskočen.`);
    await db.end();
    return;
  }

  await db`
    INSERT INTO users (name, email, password, role)
    VALUES ('Admin', ${adminEmail}, ${hash}, 'admin')
  `;

  console.log('✓ Admin uživatel vytvořen:');
  console.log(`  E-mail: ${adminEmail}`);
  console.log(`  Heslo:  ${adminPassword}`);
  console.log(`  Role:   admin`);

  await db.end();
}

seed().catch((err) => {
  console.error('Seed selhal:', err.message);
  process.exit(1);
});
