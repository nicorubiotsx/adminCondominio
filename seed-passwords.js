const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const residentes = await prisma.residente.findMany();
  console.log(`Hasheando contraseñas para ${residentes.length} residentes...`);
  
  for (const residente of residentes) {
    const hashedPassword = await bcrypt.hash(residente.cedula, 12);
    await prisma.residente.update({
      where: { id: residente.id },
      data: { password: hashedPassword }
    });
    console.log(`✓ Residente ${residente.nombre} actualizado.`);
  }

  const sample = await prisma.residente.findFirst({
    include: { departamento: true }
  });
  
  console.log('\n--- DATOS PARA PRUEBA ---');
  if (sample) {
    console.log(`Cédula: ${sample.cedula}`);
    console.log(`Departamento: ${sample.departamento?.numero || 'Sin depto'}`);
    console.log(`Contraseña: ${sample.cedula}`);
  } else {
    console.log('No se encontraron residentes.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
