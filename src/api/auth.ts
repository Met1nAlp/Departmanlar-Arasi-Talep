// src/api/auth.ts
import { User } from '../types';
import { mockUsers } from '../mocks/users';
import { delay } from './delay';

// Backend sözleşmesi: POST /auth/login  body: { email, password } → { user, token }
export async function login(role: User['role']): Promise<User> {
  await delay();
  const user = mockUsers.find((u) => u.role === role);
  if (!user) throw new Error('User not found');
  return user;
}