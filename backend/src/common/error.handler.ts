import {Response} from 'express'

export class ErrorHandler {

    public generalError(res:Response, name:string, message:string, httpResponseCode:number, errorMessage:string) {
        res.status(httpResponseCode).json({name,message, httpResponseCode, errorMessage})
    }
}