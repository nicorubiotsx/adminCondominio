import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';
import pg from 'pg';
const { Pool } = pg;
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed...');

  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@condominio.com' },
    update: {},
    create: { 
      email: 'admin@condominio.com', 
      password: hashedPassword, 
      nombre: 'Carlos', 
      apellido: 'Administrador', 
      rol: 'SUPER_ADMIN' 
    },
  });
  console.log('✅ Admin creado:', admin.email);

  console.log('\n🎉 Seed completado! Base de datos reiniciada solo con el administrador.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => await prisma.$disconnect());
