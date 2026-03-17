type MinimalIdentity = { provider: string };

/**
 * Returns an error message if the user should be blocked from disconnecting,
 * or null if the operation is allowed.
 */
export function lastProviderGuard(identities: MinimalIdentity[]): string | null {
  if (identities.length <= 1) {
    const hasEmailProvider = identities.some((i) => i.provider === "email");
    if (!hasEmailProvider) {
      return "Cannot disconnect your only login method. Set a password first.";
    }
  }
  return null;
}
