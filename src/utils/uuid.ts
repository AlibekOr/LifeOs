// Hermes has no crypto.randomUUID. These ids only need to be unique (they are
// idempotency keys for offline inserts), not unguessable — RLS enforces access.
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = Math.floor(Math.random() * 16);
    // RFC 4122 variant: the 'y' nibble must be 8, 9, a or b.
    const value = char === 'x' ? random : 8 + (random % 4);
    return value.toString(16);
  });
}
