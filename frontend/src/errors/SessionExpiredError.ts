/**
 * Error indicating that the user's session has expired.
 */
export class SessionExpiredError extends Error {
  /**
   * Constructs a new SessionExpiredError.
   */
  constructor() {
    super('Session Expired')
    this.name = 'SessionExpiredError'
  }
}
