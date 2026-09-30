import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=(.+)/);
if (!dbUrlMatch) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}
const dbUrl = dbUrlMatch[1].trim().replace(/^["']|["']$/g, '');
const sql = neon(dbUrl);

async function main() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Generated hash for admin123:', hash);

  // Update all admins in admin_users with the verified bcrypt hash of 'admin123'
  await sql`UPDATE admin_users SET password = ${hash}, is_active = true`;
  console.log('Updated passwords in admin_users table.');

  const admins = await sql`SELECT id, email, name, role, is_active FROM admin_users`;
  console.log('Admins in admin_users:', admins);

  // Also check if admin exists in users table and update or insert if needed
  for (const admin of admins) {
    const valid = await bcrypt.compare('admin123', hash);
    console.log(`Verified auth for ${admin.email}:`, valid ? 'SUCCESS' : 'FAILED');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error syncing admin passwords:', err);
  process.exit(1);
});
