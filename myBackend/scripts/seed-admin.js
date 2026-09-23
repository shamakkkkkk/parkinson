#!/usr/bin/env node
/**
 * Creates a first admin user directly in users.json, without needing the
 * server running. Run once after `npm install`:
 *
 *   npm run seed:admin
 *
 * Override defaults with env vars, e.g.:
 *   SEED_USERNAME=jane SEED_PASSWORD=something-strong npm run seed:admin
 */
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const username = process.env.SEED_USERNAME || 'admin';
const password = process.env.SEED_PASSWORD || 'ChangeMe123!';
const fullName = process.env.SEED_FULLNAME || 'Admin User';
const emailAddress = process.env.SEED_EMAIL || 'admin@example.com';

const filePath = path.resolve(__dirname, '..', 'users.json');

async function main() {
  const users = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    : [];

  if (users.some((user) => user.username === username)) {
    console.log(`User "${username}" already exists in users.json - skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  users.push({
    id: `${Date.now()}-seed`,
    username,
    passwordHash,
    roles: ['admin'],
    isBlocked: false,
    fullName,
    emailAddress,
    createdAt: new Date().toISOString(),
  });

  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
  console.log(`Created user "${username}" / password "${password}".`);
  console.log('Log in with these, then change the password (there is no change-password endpoint yet - edit users.json or re-run this script with a new SEED_PASSWORD and delete the old entry).');
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exitCode = 1;
});
