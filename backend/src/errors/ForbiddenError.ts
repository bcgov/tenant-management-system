export class ForbiddenError extends Error {

    public statusCode: number;

    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
        this.statusCode = 403;
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
} 