/**
 * Decorative background with gradient blur circles.
 * Used on centered auth pages (login, verify email, 2FA code entry).
 */
export function AuthDecorativeBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute -left-[5%] -top-[10%] h-[40%] w-[40%] rounded-full bg-brand-primary-lighter opacity-30 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-[10%] -right-[5%] h-[40%] w-[40%] rounded-full bg-brand-secondary-light opacity-30 blur-[120px]"
        aria-hidden="true"
      />
    </>
  );
}
