const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Borrando base de datos...');
  
  // Borrar en orden para respetar llaves foraneas
  await prisma.auditLog.deleteMany();
  await prisma.vehiculo.deleteMany();
  await prisma.publicacion.deleteMany();
  await prisma.encomienda.deleteMany();
  await prisma.visita.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.areaComun.deleteMany();
  await prisma.notificacion.deleteMany();
  await prisma.mantenimiento.deleteMany();
  await prisma.anuncio.deleteMany();
  await prisma.gastoComun.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.deudaMensual.deleteMany();
  await prisma.residente.deleteMany();
  await prisma.departamento.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('Base de datos vaciada exitosamente.');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@condominio.com',
      password: hashedPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      rol: 'SUPER_ADMIN',
      rut: '11.111.111-1',
    },
  });

  console.log('\n=============================================');
  console.log('¡SISTEMA REINICIADO!');
  console.log('Usuario administrador creado:');
  console.log(`Email: ${admin.email}`);
  console.log(`RUT: ${admin.rut}`);
  console.log(`Password: admin123`);
  console.log('=============================================\n');
}

main()
  .catch((e) => {
    console.error('Error al resetear la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
