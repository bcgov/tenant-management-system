/**
 * Base class for all domain-level (business logic) errors.
 *
 * These errors are thrown by the service layer when a known, expected error
 * occurs (e.g., a duplicate, validation failure, etc.)
 */
export class DomainError extends Error {
  /**
   * A message safe to display to the user.
   */
  userMessage?: string

  /**
   * Constructs a new DomainError.
   *
   * @param message - Developer-facing message for logs/debugging.
   * @param userMessage - Optional user-facing message for notification.
   */
  constructor(message: string, userMessage?: string) {
    super(message)
    this.userMessage = userMessage

    // Ensure that `instanceof` checks work correctly even when extending
    // built-in classes like `Error`. Without this, `instanceof DomainError`
    // might fail because JavaScript doesn't set the prototype chain properly
    // when subclassing `Error` in some environments.
    Object.setPrototypeOf(this, new.target.prototype)

    // Set the error's name to the actual subclass, like 'DuplicateEntityError'
    // instead of the default 'Error'.
    this.name = new.target.name
  }
}
