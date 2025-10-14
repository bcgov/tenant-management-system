import { DomainError } from './DomainError'

/**
 * Error indicating that the operation failed due to a server error.
 */
export class ServerError extends DomainError {
  /**
   * Constructs a new ServerError.
   *
   * @param userMessage - Optional user-friendly message to display.
   */
  constructor(userMessage?: string) {
    super('Server error ', userMessage)
  }
}
