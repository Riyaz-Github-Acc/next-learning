import { NextFunction, Request, Response } from 'express'
import ErrorHandler from '../utils/ErrorHandler'

const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid Token, please login again'
    err = new ErrorHandler(message, 400)
  }

  if (err.name === 'JsonWebTokenExpired') {
    const message = 'Token is expired, please login again'
    err = new ErrorHandler(message, 400)
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  })
}

export default ErrorMiddleware
