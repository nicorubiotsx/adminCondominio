# 🏢 Sistema de Gestión de Condominios

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

Una plataforma integral desarrollada en **Next.js (App Router)** diseñada para digitalizar y optimizar la administración de condominios y edificios. Facilita la comunicación, la transparencia financiera y la gestión de accesos entre la administración, los residentes y el personal de conserjería.

---

## ✨ Características Principales

El sistema está dividido en tres portales dedicados, cada uno optimizado para su rol específico mediante un robusto sistema de control de acceso basado en roles (RBAC).

### 👨‍💼 Portal Administrativo
- **Gestión Financiera:** Control de gastos comunes, emisión de deudas mensuales y validación de pagos.
- **Reportes Avanzados:** Gráficos interactivos y exportación de finanzas en PDF y Excel (`jspdf`, `xlsx`, `recharts`).
- **Administración del Recinto:** Gestión de departamentos, residentes, vehículos y áreas comunes.
- **Comunicación:** Publicación de anuncios globales para todos los residentes y envío automático de correos.

### 🏠 Portal de Residentes
- **Pagos en Línea:** Integración nativa con **MercadoPago** para el pago rápido y seguro de gastos comunes.
- **Muro de la Comunidad:** Espacio estilo foro para clasificados, avisos y noticias del edificio.
- **Mantenimiento y Reservas:** Sistema de tickets para reportar problemas y calendario para reservar áreas comunes (quinchos, salas de eventos).
- **Conserjería Virtual:** Revisión del registro histórico de visitas y paquetería recibida.

### 💂‍♂️ Portal de Conserjería
- **Control de Acceso:** Registro digital de entradas y salidas de visitantes.
- **Gestión de Paquetería:** Recepción de encomiendas y notificación automática a los residentes.
- **Dashboard en Tiempo Real:** Interfaz simplificada y rápida para operación continua en la recepción.

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** [Next.js 16](https://nextjs.org/) (React 19) con App Router.
- **Base de Datos:** PostgreSQL operado a través del ORM [Prisma](https://www.prisma.io/).
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) y componentes lucide-react.
- **Autenticación:** Sistema de autenticación JWT customizado (`jose`, `bcryptjs`).
- **Pagos:** API de MercadoPago (`mercadopago`).
- **Notificaciones:** Envío de correos transaccionales con SMTP (`nodemailer`).
- **Validaciones:** Esquemas estrictos de validación de datos con `zod`.

---

## 🚀 Instalación y Configuración Local

### 1. Requisitos Previos
- Node.js (v18.17 o superior)
- PostgreSQL (Instalado y en ejecución)
- Git

### 2. Clonar el Repositorio
```bash
git clone https://github.com/nicorubiotsx/adminCondominio.git
cd adminCondominio
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en el siguiente formato:

```env
# Base de Datos
DATABASE_URL=""

# Seguridad
JWT_SECRET=""
NEXT_PUBLIC_APP_URL=""

# Pasarela de Pagos (MercadoPago)
MP_ACCESS_TOKEN="TEST-tu_access_token_de_prueba"

# Servidor de Correos (SMTP)
SMTP_HOST=""
SMTP_PORT=
SMTP_SECURE=false
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
```

### 5. Configurar la Base de Datos
Ejecuta las migraciones para crear las tablas y opcionalmente puebla la base de datos con información de prueba (Seed):

```bash
# Sincronizar esquema de base de datos
npx prisma migrate dev --name init

# Generar el cliente de Prisma
npx prisma generate

# Poblado inicial (Crea el superadmin por defecto)
npm run seed
```

### 6. Ejecutar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 📂 Estructura del Proyecto

```text
├── prisma/             # Esquemas de BD, migraciones y seeders
├── public/             # Assets estáticos (imágenes, iconos)
├── src/
│   ├── actions/        # Server Actions (Lógica de negocio por módulo)
│   ├── app/            # Rutas de la aplicación (App Router)
│   │   ├── admin/      # Rutas del Portal de Administración
│   │   ├── conserje/   # Rutas del Portal de Conserjería
│   │   ├── residente/  # Rutas del Portal de Residentes
│   │   ├── api/        # Endpoints de API (ej. Webhooks)
│   ├── components/     # Componentes React reutilizables
│   ├── hooks/          # Custom React Hooks
│   └── lib/            # Utilidades core (Prisma, Auth, Email, Utils)
├── middleware.js       # Protección de rutas y verificación JWT
└── package.json        # Dependencias y scripts
```

---

## 🔒 Seguridad
- **RBAC (Role-Based Access Control):** El middleware de Next.js verifica las credenciales JWT en el servidor perimetral antes de renderizar cualquier página privada.
- **Passwords Hashing:** Las contraseñas se almacenan fuertemente encriptadas usando `bcryptjs`.
- **Validaciones en el Servidor:** Todo dato que entra por Server Actions es higienizado y validado usando esquemas de `Zod`.

---

## 📝 Licencia
Este proyecto es de carácter privado y de uso exclusivo. Todos los derechos reservados.
