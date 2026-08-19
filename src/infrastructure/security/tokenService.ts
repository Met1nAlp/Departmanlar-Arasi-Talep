// src/infrastructure/security/tokenService.ts
//
// MOCK token servisi — backend `/auth/login` henüz yok (bkz. Plan Bölüm 11.1).
// Gerçek backend geldiğinde sunucu RS256 ile imzalanmış gerçek JWT dönecek;
// bu dosyanın DIŞARIYA verdiği arayüz (decodeToken, isExpired, msUntilExpiry)
// aynı kalacak şekilde tasarlandı — yalnızca `issueMockToken` kaldırılıp
// sunucudan gelen token string'i doğrudan decode edilecek. Yani bu dosyayı
// kullanan authStore/api katmanı backend entegrasyonunda DEĞİŞMEZ.
//
// Format bilinçli olarak gerçek JWT'ye benzer tutuldu: "header.payload.signature"
// (base64url). Signature kısmı burada sahte bir değerdir, doğrulanmaz — çünkü
// mock modda zaten güvenlik sınırı yok, amaç yalnızca payload/exp mekaniğini
// gerçekçi test etmek.

export interface TokenPayload {
  sub: string; // userId
  role: string;
  exp: number; // epoch seconds
  iat: number; // epoch seconds
}

// Hermes (RN 0.72+) ve Node.js (test ortamı) her ikisi de global btoa/atob sağlar.
// Bu yüzden Buffer'a (yalnızca Node) bağımlı kalmıyoruz — kod hem testte hem cihazda
// aynı yolu izler.
declare const btoa: (input: string) => string;
declare const atob: (input: string) => string;

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(input.length + ((4 - (input.length % 4)) % 4), '=');
  return atob(padded);
}

/** `ttlSeconds` sonra sona erecek sahte bir token üretir. */
export function issueMockToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, ttlSeconds: number): string {
  const iat = Math.floor(Date.now() / 1000);
  const fullPayload: TokenPayload = { ...payload, iat, exp: iat + ttlSeconds };
  const header = base64UrlEncode(JSON.stringify({ alg: 'mock', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const fakeSignature = base64UrlEncode('mock-signature');
  return `${header}.${body}.${fakeSignature}`;
}

export function decodeToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as TokenPayload;
    if (typeof payload.exp !== 'number' || typeof payload.sub !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
}

export function isExpired(token: string, nowMs: number = Date.now()): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  return payload.exp * 1000 <= nowMs;
}

/** Negatif değer dönerse token zaten süresi geçmiş demektir. */
export function msUntilExpiry(token: string, nowMs: number = Date.now()): number {
  const payload = decodeToken(token);
  if (!payload) return -1;
  return payload.exp * 1000 - nowMs;
}

// Plan Bölüm 14.3: access token 15 dk, refresh token 12 saat (vardiya süresi).
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 12 * 60 * 60;
