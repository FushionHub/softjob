import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'auth_token';

function getSecretKey() {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'base64\'))"');
    }
    return new TextEncoder().encode(JWT_SECRET);
}

export async function signToken(payload, expiresIn = '7d') {
    const secretKey = getSecretKey();
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secretKey);
}

export async function verifyToken(token) {
    try {
        const secretKey = getSecretKey();
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch (e) {
        return null;
    }
}

export async function setSessionCookie(userId) {
    const token = await signToken({ userId });
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
    });
}

export async function getSessionUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
}

export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}
