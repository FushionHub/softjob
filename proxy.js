import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const protectedRoutes = [
  '/dashboard',
  '/deposit',
  '/packages',
  '/trading',
  '/wallet-connect',
  '/profile',
  '/settings',
  '/withdraw',
  '/swap',
  '/transactions',
  '/referrals',
  '/investment-history',
  '/profit-history',
  '/notifications',
  '/support',
  '/onboarding',
]

const adminProtectedRoutes = [
  '/admin/users',
  '/admin/deposits',
  '/admin/withdrawals',
  '/admin/trades',
  '/admin/swaps',
  '/admin/investments',
  '/admin/plans',
  '/admin/kyc',
  '/admin/wallets',
  '/admin/settings',
  '/admin/logs',
  '/admin/support',
  '/admin/email',
]

async function verifyTokenEdge(token, secret) {
  try {
    if (!secret) return null
    const key = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, key)
    return payload
  } catch {
    return null
  }
}

function getPublicHost(req) {
  const fHost = req.headers.get('x-forwarded-host');
  if (fHost && !fHost.includes('localhost') && !fHost.includes('127.0.0.1')) {
    return fHost.split(',')[0].trim();
  }
  const host = req.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return host;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const parsed = new URL(process.env.NEXT_PUBLIC_APP_URL);
      if (parsed.hostname && !parsed.hostname.includes('localhost') && !parsed.hostname.includes('127.0.0.1')) {
        return parsed.host;
      }
    } catch {}
  }
  return (fHost || host || req.nextUrl.host || 'localhost:3000').split(',')[0].trim();
}

function getPublicProto(req) {
  const fProto = req.headers.get('x-forwarded-proto');
  if (fProto) return fProto.split(',')[0].trim();
  if (process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')) return 'https';
  const proto = req.nextUrl.protocol ? req.nextUrl.protocol.replace(':', '') : 'https';
  return proto;
}

function createSafeRedirectUrl(targetPath, req) {
  let cleanPath = String(targetPath || '/dashboard').trim();
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
  if (
    cleanPath.startsWith('//') ||
    cleanPath.includes('localhost') ||
    cleanPath.includes('127.0.0.1') ||
    cleanPath.startsWith('/login') ||
    cleanPath.includes('n/dashboard') ||
    cleanPath.includes('?=') ||
    cleanPath.includes('?error=')
  ) {
    cleanPath = '/dashboard';
  }

  const host = getPublicHost(req);
  const proto = getPublicProto(req);
  return new URL(cleanPath, `${proto}://${host}`);
}

function createLoginRedirectUrl(targetPath, req) {
  let cleanTarget = '';
  if (targetPath && typeof targetPath === 'string') {
    const t = targetPath.trim();
    if (
      t.startsWith('/') &&
      !t.startsWith('//') &&
      t !== '/' &&
      t !== '/dashboard' &&
      !t.startsWith('/login') &&
      !t.includes('n/dashboard') &&
      !t.includes('?=') &&
      !t.includes('?error=')
    ) {
      cleanTarget = t;
    }
  }

  const url = createSafeRedirectUrl('/login', req);
  if (cleanTarget) {
    url.searchParams.set('redirect', cleanTarget);
  }
  return url;
}

export default async function proxy(req) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('auth_token')?.value
  const adminToken = req.cookies.get('admin_token')?.value
  const userSecret = process.env.JWT_SECRET
  const adminSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // Allow /admin/login without auth
    if (pathname === '/admin/login') {
      // If already logged in as admin, redirect to /admin
      if (adminToken) {
        const decoded = await verifyTokenEdge(adminToken, adminSecret)
        if (decoded?.isAdmin) {
          return NextResponse.redirect(createSafeRedirectUrl('/admin', req))
        }
      }
      return NextResponse.next()
    }

    // All other /admin routes require admin auth
    if (!adminToken) {
      return NextResponse.redirect(createSafeRedirectUrl('/admin/login', req))
    }
    const decoded = await verifyTokenEdge(adminToken, adminSecret)
    if (!decoded?.isAdmin) {
      return NextResponse.redirect(createSafeRedirectUrl('/admin/login', req))
    }

    const res = NextResponse.next()
    // Guarantee cookie is scoped to root path so /api/admin/* receives it immediately
    res.cookies.set('admin_token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })
    return res
  }

  // User route protection
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(createLoginRedirectUrl(pathname, req))
    }

    const decoded = await verifyTokenEdge(token, userSecret)
    if (!decoded) {
      return NextResponse.redirect(createLoginRedirectUrl(pathname, req))
    }
  }

  if ((pathname === '/login' || pathname === '/register') && token) {
    const decoded = await verifyTokenEdge(token, userSecret)
    if (decoded) {
      return NextResponse.redirect(createSafeRedirectUrl('/dashboard', req))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|_next).*)',
  ],
}
