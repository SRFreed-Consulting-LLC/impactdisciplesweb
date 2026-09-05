/**
 * A random lowercase-hex string of `length` characters.
 *
 * The same helper as the admin repo's src/app/common/utils/random-hex-id.ts
 * (ported 2026-09-05 so LoggerService reads identically in both apps). It
 * replaces the UUID-v4 idiom - `'xxxxxxxx'.replace(/[xy]/g, ...)` with a
 * `(r & 0x3) | 0x8` branch for `y` - whose template never contained a `y`,
 * so that branch was dead; this produces the same output.
 *
 * NOT cryptographically random and not collision-proof - Math.random is
 * fine for an error code a person is about to read off a toast, which is
 * all any caller uses it for. Do not use it for a token or anything a
 * person could guess their way into.
 */
export function randomHexId(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ((Math.random() * 16) | 0).toString(16);
  }
  return out;
}
