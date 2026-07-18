import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { prisma } from '@repo/database';

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'Admin';

  if (!email || !password) {
    console.error(
      'Defina ADMIN_EMAIL e ADMIN_PASSWORD no ambiente antes de rodar o seed.',
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('ADMIN_PASSWORD deve ter pelo menos 8 caracteres.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'admin') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'admin' },
      });
      console.log(`Usuário existente atualizado para role admin: ${email}`);
    } else {
      console.log(`Admin já existe: ${email}`);
    }
    return;
  }

  const userId = randomUUID();
  const now = new Date();
  const hashed = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        emailVerified: true,
        role: 'admin',
        createdAt: now,
        updatedAt: now,
      },
    }),
    prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: userId,
        providerId: 'credential',
        userId,
        password: hashed,
        createdAt: now,
        updatedAt: now,
      },
    }),
  ]);

  console.log(`Admin criado com sucesso: ${email}`);
}

seedAdmin()
  .catch((error) => {
    console.error('Falha ao criar admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
