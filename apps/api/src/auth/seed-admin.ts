import 'dotenv/config';
import { prisma } from '@repo/database';
import { auth } from './auth.js';

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

  const { user } = await auth.api.createUser({
    body: {
      email,
      password,
      name,
      role: 'admin',
      data: {
        emailVerified: true,
      },
    },
  });

  console.log(`Admin criado com sucesso: ${user.email}`);
}

seedAdmin()
  .catch((error) => {
    console.error('Falha ao criar admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
