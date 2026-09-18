/** Calculate age from a date-only birthday without local-timezone date shifts. */
export function calculateAge(dateOfBirth: string, today = new Date()): number {
  const birth = new Date(dateOfBirth);
  if (!Number.isFinite(birth.getTime())) return 0;
  let age = today.getFullYear() - birth.getUTCFullYear();
  const month = today.getMonth() - birth.getUTCMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getUTCDate())) age -= 1;
  return Math.max(0, age);
}

export function heightLabel(heightCm: number | null): string | null {
  if (!heightCm || !Number.isFinite(heightCm) || heightCm < 0) return null;
  const inches = Math.round(heightCm / 2.54);
  return `${Math.floor(inches / 12)}' ${inches % 12}" (${heightCm} cm)`;
}
