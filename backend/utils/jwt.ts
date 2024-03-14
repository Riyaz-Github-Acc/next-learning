import jwt, { Secret } from 'jsonwebtoken'
import {
  ActivationTokenProps,
  RegistrationProps,
  TokenOptionsProps,
  UserProps,
} from '../constants/types'
import { Response } from 'express'

require('dotenv').config()

// * Generate token for the account activation
export const createActiovationToken = async (
  user: RegistrationProps
): Promise<ActivationTokenProps> => {
  // * Generate random 6 digit number
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString()
  const token = await jwt.sign(
    { user, activationCode },
    process.env.JWT_ACTIVATION_TOKEN_SECRET as Secret,
    { expiresIn: '30m' }
  )

  return { activationCode, token }
}

// * Generate Access Token
export const generateAccessToken = async (user: UserProps): Promise<string> => {
  const token = await jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET as Secret, {
    expiresIn: '30m',
  })
  return token
}

// * Generate Refresh Token
export const generateRefreshToken = async (user: UserProps): Promise<string> => {
  const token = await jwt.sign(user, process.env.JWT_REFRESH_TOKEN_SECRET as Secret, {
    expiresIn: '3d',
  })
  return token
}

// * Send Tokens to the Cookie
export const sendToken = async (user: UserProps, res: Response) => {
  const accessToken = await generateAccessToken(user)
  const refreshToken = await generateRefreshToken(user)

  const accessTokenExpire = parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRE || '300', 10)
  const refreshTokenExpire = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRE || '1200', 10)

  const accessTokenOptions: TokenOptionsProps = {
    httpOnly: true,
    expires: new Date(Date.now() + accessTokenExpire * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 1000,
    samesite: 'lax',
  }

  const refreshTokenOptions: TokenOptionsProps = {
    httpOnly: true,
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    samesite: 'lax',
  }

  if (process.env.NODE_ENV === 'production') {
    accessTokenOptions.secure = true
    refreshTokenOptions.secure = true
  }

  res.cookie('access_token', accessToken, accessTokenOptions)
  res.cookie('refresh_token', refreshToken, refreshTokenOptions)
}
