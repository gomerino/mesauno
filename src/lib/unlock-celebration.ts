/** localStorage: una sola celebración por id de pago (Mercado Pago). */
export const JURNEX_JUST_UNLOCKED_KEY = "jurnex_just_unlocked";

export function unlockCelebrationStorageKey(paymentId: string | null): string {
  return paymentId ? `jurnex_phase_unlock_celebr_${paymentId}` : "jurnex_phase_unlock_celebr_generic";
}
