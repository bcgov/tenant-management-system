import { DomainError } from './DomainError'

/**
 * Error indicating that the operation failed due to a duplicate entity.
 */
export class DuplicateEntityError extends DomainError {
  /**
   * Constructs a new DuplicateEntityError.
   *
   * @param userMessage - Optional user-friendly message to display.
   */
  constructor(userMessage?: string) {
    super('Duplicate entity error', userMessage)
  }
}
