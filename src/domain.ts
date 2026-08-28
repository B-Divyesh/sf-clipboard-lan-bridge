export const MAX_TEXT_BYTES = 32_768;
export const FREE_DEVICE_LIMIT = 2;

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function validateTransfer(value: string): string | null {
  if (!value.trim()) return "Enter or paste something to send.";
  if (byteLength(value) > MAX_TEXT_BYTES) return "Text must be 32 KB or less.";
  return null;
}

export function remainingLabel(expiresAt: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  if (seconds < 60) return `${seconds}s left`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes}m left`;
}

export function summarize(value: string, limit = 96): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 1)}…`;
}
