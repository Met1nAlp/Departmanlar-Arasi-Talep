import { describe, expect, it } from '@jest/globals';
import { issueMockToken, decodeToken, isExpired, msUntilExpiry, ACCESS_TOKEN_TTL_SECONDS } from '../tokenService';

describe('tokenService', () => {
  it('issues a token that decodes back to the same payload', () => {
    const token = issueMockToken({ sub: 'user-1', role: 'SUPERVISOR' }, ACCESS_TOKEN_TTL_SECONDS);
    const payload = decodeToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('user-1');
    expect(payload?.role).toBe('SUPERVISOR');
  });

  it('is not expired right after issuance', () => {
    const token = issueMockToken({ sub: 'user-1', role: 'SUPERVISOR' }, ACCESS_TOKEN_TTL_SECONDS);
    expect(isExpired(token)).toBe(false);
  });

  it('is expired once ttl passes', () => {
    const token = issueMockToken({ sub: 'user-1', role: 'SUPERVISOR' }, 60);
    const future = Date.now() + 61_000;
    expect(isExpired(token, future)).toBe(true);
  });

  it('msUntilExpiry returns a positive number before expiry and negative after', () => {
    const token = issueMockToken({ sub: 'user-1', role: 'SUPERVISOR' }, 60);
    expect(msUntilExpiry(token)).toBeGreaterThan(0);
    expect(msUntilExpiry(token, Date.now() + 61_000)).toBeLessThan(0);
  });

  it('decodeToken returns null for malformed tokens', () => {
    expect(decodeToken('not-a-token')).toBeNull();
    expect(decodeToken('a.b')).toBeNull();
  });
});
