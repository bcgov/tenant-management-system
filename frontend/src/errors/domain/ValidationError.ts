import { DomainError } from './DomainError'

/**
 * Error indicating that the operation failed due to validation by the API. This
 * error only occurs if the frontend validation is incorrect, so it's important
 * that is displayed - and the frontend validation corrected.
 */
export class ValidationError extends DomainError {
  /**
   * Constructs a new ValidationError.
   *
   * @param userMessage - Optional user-friendly message to display.
   */
  constructor(userMessages: string[]) {
    super(
      'Validation error',
      'Unexpected server response: ' + userMessages.join('; '),
    )
  }
}
