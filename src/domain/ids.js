// Small stable-ish id generator. Not cryptographically unique, fine for an
// Alpha running entirely on one device with no server to collide against.
let counter = 0;

export function createId(prefix) {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}
