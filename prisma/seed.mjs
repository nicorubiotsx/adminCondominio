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
    create: { email: 'admin@condominio.com', password: hashedPassword, nombre: 'Carlos', apellido: 'Administrador', rol: 'SUPER_ADMIN' },
  });
  console.log('✅ Admin creado:', admin.email);

  const deptos = [];
  for (let piso = 1; piso <= 5; piso++) {
    for (let num = 1; num <= 4; num++) {
      const numero = `${piso}0${num}`;
      const depto = await prisma.departamento.upsert({
        where: { numero },
        update: {},
        create: { numero, piso, torre: num <= 2 ? 'A' : 'B', tipo: piso === 5 ? 'PENTHOUSE' : 'APARTAMENTO', metrosCuadrados: piso === 5 ? 120 : 80, habitaciones: piso === 5 ? 4 : 3, banos: piso === 5 ? 3 : 2, estacionamiento: piso >= 3, alicuota: 5, estado: 'OCUPADO' },
      });
      deptos.push(depto);
    }
  }
  console.log(`✅ ${deptos.length} departamentos creados`);

  const nombres = [
    { nombre: 'María', apellido: 'González', cedula: 'V-12345678' },
    { nombre: 'Juan', apellido: 'Rodríguez', cedula: 'V-23456789' },
    { nombre: 'Ana', apellido: 'Martínez', cedula: 'V-34567890' },
    { nombre: 'Pedro', apellido: 'López', cedula: 'V-45678901' },
    { nombre: 'Laura', apellido: 'García', cedula: 'V-56789012' },
    { nombre: 'Carlos', apellido: 'Hernández', cedula: 'V-67890123' },
    { nombre: 'Rosa', apellido: 'Pérez', cedula: 'V-78901234' },
    { nombre: 'Miguel', apellido: 'Sánchez', cedula: 'V-89012345' },
    { nombre: 'Carmen', apellido: 'Ramírez', cedula: 'V-90123456' },
    { nombre: 'Roberto', apellido: 'Torres', cedula: 'V-01234567' },
  ];

  const residentesList = [];
  for (let i = 0; i < nombres.length; i++) {
    const r = await prisma.residente.upsert({
      where: { cedula: nombres[i].cedula },
      update: {},
      create: { ...nombres[i], email: `${nombres[i].nombre.toLowerCase()}@email.com`, telefono: `0414-${String(1000000 + i).slice(0, 7)}`, tipo: i % 3 === 0 ? 'INQUILINO' : 'PROPIETARIO', departamentoId: deptos[i]?.id },
    });
    residentesList.push(r);
  }
  console.log(`✅ ${residentesList.length} residentes creados`);

  const meses = ['2026-01', '2026-02', '2026-03', '2026-04'];
  const metodos = ['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'DEPOSITO'];
  let pagoCount = 0;
  for (const res of residentesList.slice(0, 8)) {
    for (const mes of meses) {
      await prisma.pago.create({
        data: { monto: 150 + Math.floor(Math.random() * 50), mesPago: mes, metodoPago: metodos[Math.floor(Math.random() * metodos.length)], referencia: `REF-${Date.now()}-${pagoCount}`, estado: Math.random() > 0.3 ? 'VERIFICADO' : 'PENDIENTE', residenteId: res.id, departamentoId: deptos[residentesList.indexOf(res)]?.id || deptos[0].id },
      });
      pagoCount++;
    }
  }
  console.log(`✅ ${pagoCount} pagos creados`);

  const gastosData = [
    { concepto: 'Electricidad áreas comunes', categoria: 'SERVICIOS', monto: 450, proveedor: 'CORPOELEC' },
    { concepto: 'Agua potable', categoria: 'SERVICIOS', monto: 320, proveedor: 'Hidrocapital' },
    { concepto: 'Vigilancia nocturna', categoria: 'PERSONAL', monto: 800, proveedor: 'Seguridad Total C.A.' },
    { concepto: 'Mantenimiento ascensor', categoria: 'MANTENIMIENTO', monto: 600, proveedor: 'Ascensores Express' },
    { concepto: 'Jardinería', categoria: 'MANTENIMIENTO', monto: 200, proveedor: 'JardínPro' },
    { concepto: 'Seguro del edificio', categoria: 'SEGUROS', monto: 1200, proveedor: 'Seguros Mercantil' },
    { concepto: 'Limpieza general', categoria: 'PERSONAL', monto: 500, proveedor: 'LimpiaHogar' },
    { concepto: 'Internet áreas comunes', categoria: 'SERVICIOS', monto: 150, proveedor: 'CANTV' },
  ];
  for (const g of gastosData) await prisma.gastoComun.create({ data: { ...g, fecha: new Date() } });
  console.log(`✅ ${gastosData.length} gastos creados`);

  const anunciosData = [
    { titulo: 'Mantenimiento del ascensor', contenido: 'Se realizará mantenimiento preventivo del ascensor el próximo sábado de 8am a 2pm.', prioridad: 'ALTA' },
    { titulo: 'Reunión de condominio', contenido: 'Se convoca a todos los propietarios a la reunión ordinaria de condominio el día viernes a las 7pm.', prioridad: 'NORMAL' },
    { titulo: 'Nuevo horario de vigilancia', contenido: 'A partir del próximo mes, la vigilancia nocturna será de 6pm a 6am.', prioridad: 'NORMAL' },
  ];
  for (const a of anunciosData) await prisma.anuncio.create({ data: { ...a, autorId: admin.id } });
  console.log(`✅ ${anunciosData.length} anuncios creados`);

  const mantData = [
    { titulo: 'Fuga en tubería piso 3', descripcion: 'Fuga de agua en la tubería principal del piso 3.', categoria: 'PLOMERIA', prioridad: 'URGENTE', estado: 'EN_PROGRESO' },
    { titulo: 'Bombillo fundido pasillo piso 2', descripcion: 'El bombillo del pasillo se fundió.', categoria: 'ELECTRICIDAD', prioridad: 'BAJA', estado: 'PENDIENTE' },
    { titulo: 'Pintura fachada principal', descripcion: 'La fachada necesita pintura.', categoria: 'PINTURA', prioridad: 'NORMAL', estado: 'PENDIENTE', costoEstimado: 3500 },
  ];
  for (let i = 0; i < mantData.length; i++) {
    await prisma.mantenimiento.create({ data: { ...mantData[i], departamentoId: deptos[i]?.id, residenteId: residentesList[i]?.id } });
  }
  console.log(`✅ ${mantData.length} solicitudes creadas`);
  console.log('\n🎉 Seed completado!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => await prisma.$disconnect());
