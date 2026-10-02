// Injection token for the shared Azure credential.
// TokenCredential is a TypeScript interface (it doesn't exist at runtime),
// so Nest needs a runtime value to know what to inject.
export const AZURE_CREDENTIAL = Symbol('AZURE_CREDENTIAL');
