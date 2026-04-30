const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deptos = await prisma.departamento.findMany({
    select: {
      numero: true,
      alicuota: true
    },
    orderBy: { numero: 'asc' }
  });

  console.log("=== Listado de Alícuotas ===");
  let total = 0;
  deptos.forEach(d => {
    console.log(`Depto ${d.numero}: ${d.alicuota}%`);
    total += d.alicuota;
  });
  console.log("----------------------------");
  console.log(`Suma Total: ${total.toFixed(2)}%`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
