export class UnauthorizedRedirectError extends Error {
  constructor() {
    super("Unauthorized - redirect")
  }
}
