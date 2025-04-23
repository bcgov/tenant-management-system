export class ConflictError extends Error {
  
    public statusCode: number;
  
    constructor(message: string = "Conflict") {
      super(message);
      this.name = "ConflictError";
      this.statusCode = 409;
      Object.setPrototypeOf(this, ConflictError.prototype);
    
    }
  }