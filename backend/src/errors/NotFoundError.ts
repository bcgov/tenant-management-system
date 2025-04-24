export class NotFoundError extends Error {
  
  public statusCode: number;

  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  
  }
}