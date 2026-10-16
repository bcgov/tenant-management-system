export class ForbiddenError extends Error {
  public statusCode: number
  public code?: string
  public details?: Record<string, unknown>

  constructor(
    message: string,
    code?: string,
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ForbiddenError'
    this.statusCode = 403
    this.code = code
    this.details = details
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}
