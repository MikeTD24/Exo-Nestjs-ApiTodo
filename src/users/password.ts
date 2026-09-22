import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  // N'accepte que le format produit par hashPassword, avec un coût borné.
  const parts = stored.split('$');
  if (parts.length !== 6) return false;
  const [algorithm, n, r, p, salt, hash] = parts;
  if (
    algorithm !== 'scrypt' ||
    n !== '131072' ||
    r !== '8' ||
    p !== '1' ||
    !/^[a-f0-9]{32}$/.test(salt) ||
    !/^[a-f0-9]{128}$/.test(hash)
  )
    return false;
  const candidate = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
  // Compare les empreintes sans s'arrêter au premier octet différent.
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

export async function hashPassword(password: string): Promise<string> {
  // Un sel différent pour chaque compte évite des empreintes identiques.
  const salt = randomBytes(16).toString('hex');
  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
  // Le format conserve les paramètres nécessaires à la future connexion.
  return `scrypt$131072$8$1$${salt}$${hash.toString('hex')}`;
}
