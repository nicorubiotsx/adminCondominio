const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  await prisma.areaComun.createMany({
    data: [
      { nombre: 'Quincho Principal', descripcion: 'Quincho techado con parrilla a gas', capacidad: 20, costoReserva: 15000 },
      { nombre: 'Sala de Eventos', descripcion: 'Sala multiuso piso 1', capacidad: 50, costoReserva: 25000 }
    ],
    skipDuplicates: true
  });
  console.log('Areas creadas');
}

seed().finally(() => prisma.$disconnect());
