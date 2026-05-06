export class ConflictError extends Error {
  public statusCode: number
  public code?: string

  constructor(message: string = 'Conflict', code?: string) {
    super(message)
    this.name = 'ConflictError'
    this.statusCode = 409
    this.code = code
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}
