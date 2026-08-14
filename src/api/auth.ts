// src/api/auth.ts
//
// MOCK backend — gerçek uçlar henüz yok. Sözleşme Plan Bölüm 11.1 ve 14.2'yi
// birebir izler: POST /auth/login (yetkili), POST /auth/session/start (PIN),
// POST /auth/session/end, POST /auth/refresh, GET /users/team. Backend hazır
// olduğunda bu dosyadaki `delay()` + mock veri aramaları gerçek `fetch`
// çağrılarıyla değişir; dönen tipler (LoginResult, PinSessionResult) AYNI
// KALACAK şekilde tasarlandı — authStore ve ekranlar bu değişimi hissetmez.

import { User } from '../types';
import { mockSupervisors, mockStaffMembers } from '../mocks/users';
import { delay } from './delay';
import {
  issueMockToken,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '../infrastructure/security/tokenService';

export class AuthError extends Error {
  constructor(public code: 'INVALID_CREDENTIALS' | 'INVALID_PIN' | 'UNKNOWN_USER', message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number; // epoch ms
  supervisorUser: User;
}

/** Backend sözleşmesi: POST /auth/login body: { username, password } → { accessToken, refreshToken, user } */
export async function loginWithCredentials(username: string, password: string): Promise<LoginResult> {
  await delay();
  const credential = mockSupervisors.find(
    (c) => c.username.toLowerCase() === username.trim().toLowerCase(),
  );
  if (!credential || credential.password !== password) {
    throw new AuthError('INVALID_CREDENTIALS', 'Kullanıcı adı veya şifre hatalı.');
  }
  const accessToken = issueMockToken(
    { sub: credential.supervisorUser.id, role: credential.supervisorUser.role },
    ACCESS_TOKEN_TTL_SECONDS,
  );
  const refreshToken = issueMockToken(
    { sub: credential.supervisorUser.id, role: credential.supervisorUser.role },
    REFRESH_TOKEN_TTL_SECONDS,
  );
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000,
    supervisorUser: credential.supervisorUser,
  };
}

/** Backend sözleşmesi: POST /auth/refresh — refresh token ile yeni access token alır. */
export async function refreshAccessToken(
  refreshToken: string,
  userId: string,
  role: User['role'],
): Promise<{ accessToken: string; accessTokenExpiresAt: number }> {
  await delay(150);
  // MOCK: gerçek backend refreshToken'ı doğrulayıp geçersizse 401 döner.
  // Burada yalnızca yeni bir access token üretiyoruz.
  const accessToken = issueMockToken({ sub: userId, role }, ACCESS_TOKEN_TTL_SECONDS);
  return { accessToken, accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000 };
}

/** Backend sözleşmesi: GET /users/team — amirin altındaki personel listesi (Plan Bölüm 11.1). */
export async function getTeamMembers(supervisorUserId: string): Promise<User[]> {
  await delay(200);
  return mockStaffMembers
    .filter((m) => m.supervisorUserId === supervisorUserId)
    .map((m) => m.user);
}

export interface PinSessionResult {
  sessionId: string;
  memberUser: User;
}

/** Backend sözleşmesi: POST /auth/session/start body: { memberUserId, pin } → { sessionId, memberUser } */
export async function startPinSession(memberUserId: string, pin: string): Promise<PinSessionResult> {
  await delay(300);
  const member = mockStaffMembers.find((m) => m.user.id === memberUserId);
  if (!member) {
    throw new AuthError('UNKNOWN_USER', 'Personel bulunamadı.');
  }
  if (member.pin !== pin) {
    throw new AuthError('INVALID_PIN', 'PIN hatalı.');
  }
  // MOCK: gerçek backend sessionId'yi kendi üretir. Burada basit, yalnızca
  // görüntüleme/loglama amaçlı benzersiz bir kimlik üretiyoruz.
  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { sessionId, memberUser: member.user };
}

export type SessionEndReason = 'MANUAL' | 'TIMEOUT' | 'REVOKED' | 'SHIFT_END';

/** Backend sözleşmesi: POST /auth/session/end body: { reason } */
export async function endSession(_sessionId: string, _reason: SessionEndReason): Promise<void> {
  await delay(150);
  // MOCK: backend'de sessionId sonlandırılır ve DEVICE_SESSION.endedAt yazılır.
}
