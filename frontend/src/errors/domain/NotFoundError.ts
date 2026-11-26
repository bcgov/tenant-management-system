import { DomainError } from '@/errors/domain/DomainError'

/**
 * Error indicating that the desired entity does not exist.
 */
export class NotFoundError extends DomainError {
  /**
   * A generic message meant to be displayed to the user. Type-narrowed to make
   * it easier to work with.
   */
  declare readonly userMessage: string

  /**
   * Constructs a new NotFoundError.
   *
   * @param message - Detailed message to log for diagnostics.
   * @param userMessage - Friendly message to display to the user.
   */
  constructor(message: string, userMessage: string) {
    super(message, userMessage)
  }
}
