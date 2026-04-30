const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clear() {
  try {
    console.log("Borrando Notificaciones...");
    await prisma.notificacion.deleteMany();
    
    console.log("Borrando Gastos Comunes...");
    await prisma.gastoComun.deleteMany();
    
    console.log("Borrando Pagos...");
    await prisma.pago.deleteMany();
    
    console.log("Borrando Deudas Mensuales...");
    await prisma.deudaMensual.deleteMany();
    
    console.log("Borrando Anuncios...");
    await prisma.anuncio.deleteMany();
    
    console.log("Borrando Mantenimientos...");
    await prisma.mantenimiento.deleteMany();
    
    console.log("Borrando Reservas...");
    await prisma.reserva.deleteMany();
    
    console.log("Borrando Áreas Comunes...");
    await prisma.areaComun.deleteMany();
    
    console.log("Borrando Visitas...");
    await prisma.visita.deleteMany();
    
    console.log("Borrando Encomiendas...");
    await prisma.encomienda.deleteMany();
    
    console.log("Borrando Publicaciones...");
    await prisma.publicacion.deleteMany();
    
    console.log("Borrando Vehículos...");
    await prisma.vehiculo.deleteMany();

    console.log("Borrando Residentes...");
    await prisma.residente.deleteMany();
    
    console.log("Borrando Departamentos...");
    await prisma.departamento.deleteMany();

    console.log("Borrando Usuarios (excepto ADMINs)...");
    await prisma.user.deleteMany({
      where: {
        NOT: {
          OR: [
            { rol: 'SUPER_ADMIN' },
            { rol: 'ADMIN' },
            { email: 'admin@condominio.com' } // Solo por si acaso
          ]
        }
      }
    });

    console.log("¡Limpieza de base de datos completada!");
  } catch (error) {
    console.error("Error al limpiar DB:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clear();
