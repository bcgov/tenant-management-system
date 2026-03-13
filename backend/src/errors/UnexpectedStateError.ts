export class UnexpectedStateError extends Error {
  public statusCode: number

  constructor(message: string = 'Unexpected internal state') {
    super(message)
    this.name = 'UnexpectedStateError'
    this.statusCode = 500
    Object.setPrototypeOf(this, UnexpectedStateError.prototype)
  }
}
