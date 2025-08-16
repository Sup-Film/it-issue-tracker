#!/usr/bin/env sh
set -euo pipefail

# Show basic context
echo "[entrypoint] Node: $(node -v) | PWD: $(pwd)"

# Ensure Prisma schema exists
echo "[entrypoint] Running migrations..."
./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma

# Seed users (Admin + Supports + User) via inline Node script
echo "[entrypoint] Seeding users (admin/support/user) via shell script..."
node - <<'NODE_SEED'
const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

(async () => {
	try {
		const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
		const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Admin User';
		const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Password123!';

		const SUPPORTS = (
			process.env.SEED_SUPPORTS || 'support01@example.com,support02@example.com'
		)
			.split(',')
			.map((e) => e.trim())
			.filter(Boolean);

		console.log('🌱 Seeding Admin...');
		const adminHashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
		await prisma.user.upsert({
			where: { email: ADMIN_EMAIL },
			update: {},
			create: {
				email: ADMIN_EMAIL,
				name: ADMIN_NAME,
				password: adminHashed,
				role: Role.ADMIN,
			},
		});
		console.log(`✅ Ensured admin exists: ${ADMIN_EMAIL}`);

		for (const [i, email] of SUPPORTS.entries()) {
			const name = `Support ${i + 1}`;
			const pwd = process.env.SEED_SUPPORT_PASSWORD || 'Password123!';
			const hashed = await bcrypt.hash(pwd, 12);
			await prisma.user.upsert({
				where: { email },
				update: {},
				create: { email, name, password: hashed, role: Role.SUPPORT },
			});
			console.log(`✅ Ensured support exists: ${email}`);
		}

			// Regular user
			const USER_EMAIL = process.env.SEED_USER_EMAIL || 'user@example.com';
			const USER_NAME = process.env.SEED_USER_NAME || 'Regular User';
			const USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'Password123!';
			const userHashed = await bcrypt.hash(USER_PASSWORD, 12);
			await prisma.user.upsert({
				where: { email: USER_EMAIL },
				update: {},
				create: {
					email: USER_EMAIL,
					name: USER_NAME,
					password: userHashed,
					role: Role.USER,
				},
			});
			console.log(`✅ Ensured user exists: ${USER_EMAIL}`);

		console.log('🌱 Seeding done.');
	} catch (err) {
		console.error('Seed via shell failed:', err);
	} finally {
		await prisma.$disconnect();
	}
})();
NODE_SEED

# Start server
echo "[entrypoint] Starting server..."
exec node dist/src/index.js
