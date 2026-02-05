export class ForbiddenError extends Error {
  public statusCode: number

  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
    this.statusCode = 403
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}
