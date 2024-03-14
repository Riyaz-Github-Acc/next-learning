import express, { NextFunction, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import cors from 'cors'

import ErrorMiddleware from '../middlewares/error'
import userRoute from '../routes/user.routes'

require('dotenv').config()

export const app = express()

// * Safety
app.use(helmet())

// * Body Parser
app.use(express.json({ limit: '50mb' }))

// * Cookie Parser
app.use(cookieParser())

// * Cors
app.use(cors({ origin: process.env.ORIGIN }))

// * Test API
app.use('/test', (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: 'Test API successful',
  })
})

// * Routes
app.use('/api/v1/users', userRoute)

// * Unknown Routes
app.use('*', (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Requested route ${req.originalUrl} was not found`) as any
  err.statusCode = 404
  next(err)
})

// * Global Error Handler
app.use(ErrorMiddleware)
