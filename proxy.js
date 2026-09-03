import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const protectedRoutes = [
  '/dashboard',
  '/deposit',
  '/packages',
  '/trading',
  '/wallet-connect',
  '/wallet',
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
          return NextResponse.redirect(new URL('/admin', req.url))
        }
      }
      return NextResponse.next()
    }

    // All other /admin routes require admin auth
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    const decoded = await verifyTokenEdge(adminToken, adminSecret)
    if (!decoded?.isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
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
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const decoded = await verifyTokenEdge(token, userSecret)
    if (!decoded) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if ((pathname === '/login' || pathname === '/register') && token) {
    const decoded = await verifyTokenEdge(token, userSecret)
    if (decoded) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|_next).*)',
  ],
}
