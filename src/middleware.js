import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'condominio-secret-key-change-in-production-2026'
);

const protectedRoutes = ['/admin', '/residente', '/conserje'];
const publicRoutes = ['/login', '/'];

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some(route => path.startsWith(route));
  const isPublic = publicRoutes.includes(path);

  const token = request.cookies.get('condominio-session')?.value;
  let session = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      session = payload;
    } catch {
      session = null;
    }
  }

  // Redirigir a login si intenta ir a zona protegida sin sesión
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Lógica de separación de roles
  if (session) {
    // RESIDENTE intentando entrar a admin o conserje
    if ((path.startsWith('/admin') || path.startsWith('/conserje')) && session.rol === 'RESIDENTE') {
      return NextResponse.redirect(new URL('/residente', request.url));
    }

    // CONSERJE intentando entrar a admin o residente
    if (path.startsWith('/admin') && session.rol === 'CONSERJE') {
      return NextResponse.redirect(new URL('/conserje', request.url));
    }
    if (path.startsWith('/residente') && session.rol === 'CONSERJE') {
      return NextResponse.redirect(new URL('/conserje', request.url));
    }

    // ADMIN intentando entrar a /residente o /conserje
    if (path.startsWith('/residente') && session.rol !== 'RESIDENTE') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (path.startsWith('/conserje') && session.rol !== 'CONSERJE') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  if (path === '/login' && session) {
    if (session.rol === 'RESIDENTE') return NextResponse.redirect(new URL('/residente', request.url));
    if (session.rol === 'CONSERJE') return NextResponse.redirect(new URL('/conserje', request.url));
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/residente/:path*', '/conserje/:path*', '/login'],
};
