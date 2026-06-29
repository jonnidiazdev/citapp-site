export function isRegistrationAllowed(): boolean {
  return import.meta.env.VITE_ALLOW_REGISTRATION === 'true';
}
