import { scryptSync, timingSafeEqual } from 'node:crypto';
import { hashPassword } from './password.js';

describe('hashPassword', () => {
  it('utilise un sel unique et permet de vérifier le mot de passe', async () => {
    const password = 'Test-password-123!';
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).not.toBe(second);
    const [algorithm, n, r, p, salt, hash] = first.split('$');
    expect(algorithm).toBe('scrypt');
    const options = {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 256 * 1024 * 1024,
    };
    const stored = Buffer.from(hash, 'hex');
    expect(
      timingSafeEqual(stored, scryptSync(password, salt, 64, options)),
    ).toBe(true);
    expect(
      timingSafeEqual(stored, scryptSync('incorrect', salt, 64, options)),
    ).toBe(false);
  });
});
