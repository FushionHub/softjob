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

function createSafeRedirectUrl(targetPath, req) {
  const url = req.nextUrl.clone()
  url.pathname = targetPath
  url.search = ''

  const fHost = req.headers.get('x-forwarded-host')
  const fProto = req.headers.get('x-forwarded-proto') || 'https'
  if (fHost) {
    const [h, p] = fHost.split(':')
    url.hostname = h
    url.port = p || ''
    url.protocol = fProto.endsWith(':') ? fProto : `${fProto}:`
  } else if (process.env.NEXT_PUBLIC_APP_URL && (url.hostname === '127.0.0.1' || url.hostname === 'localhost')) {
    try {
      const parsed = new URL(process.env.NEXT_PUBLIC_APP_URL)
      url.hostname = parsed.hostname
      url.port = parsed.port || ''
      url.protocol = parsed.protocol
    } catch {}
  }

  return url
}

function createLoginRedirectUrl(targetPath, req) {
  const url = createSafeRedirectUrl('/login', req)
  if (targetPath && targetPath !== '/' && targetPath !== '/dashboard' && !targetPath.includes('login')) {
    url.searchParams.set('redirect', targetPath)
  }
  return url
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
