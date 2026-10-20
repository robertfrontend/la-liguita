/** Unambiguous alphabet: no 0/O, 1/I/L. 31 symbols, CSPRNG with rejection sampling. */
export const ACCESS_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ACCESS_CODE_LENGTH = 8;

function randomIndex(modulo) {
  const max = 0x100000000;
  const limit = max - (max % modulo);
  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % modulo;
  }
}

/** New codes are `LGT-` plus at least 8 unambiguous characters. */
export function generateAccessCode(length = ACCESS_CODE_LENGTH) {
  const size = Math.max(ACCESS_CODE_LENGTH, length);
  let body = "";
  for (let i = 0; i < size; i += 1) {
    body += ACCESS_CODE_ALPHABET[randomIndex(ACCESS_CODE_ALPHABET.length)];
  }
  return `LGT-${body}`;
}

export function isWeakAccessCode(code) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return true;
  if (/^LGT-\d{4}$/.test(normalized)) return true;
  const alphabet = new Set(ACCESS_CODE_ALPHABET);
  let count = 0;
  for (const char of normalized) {
    if (alphabet.has(char)) count += 1;
  }
  return count < ACCESS_CODE_LENGTH;
}
