import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import cloudinary from 'cloudinary'
import bcrypt from 'bcryptjs'

import { redis } from '../utils/redis'
import sendMail from '../utils/sendMail'
import ErrorHandler from '../utils/ErrorHandler'
import { createActiovationToken, sendToken } from '../utils/jwt'
import { APIUserService } from '../services/user.service'
import CatchAsyncError from '../middlewares/catchAsyncError'
import {
  ActivationProps,
  ActivationTokenProps,
  EmailOptionsProps,
  PasswordProps,
  RegistrationProps,
  SocialAuthProps,
  UpdateUserInfoProps,
  UserProps,
} from '../constants/types'

// * Register
export const userRegistration = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body
      const userExists = await APIUserService.findByEmail(email)

      // ? If already user exists
      if (userExists) next(new ErrorHandler('User already exists', 400))

      // ! Hash password before saving password into database
      const hashedPassword = await bcrypt.hash(password, 10)

      const user: RegistrationProps = {
        name,
        email,
        password: hashedPassword,
        avatar: { url: '../images/profile.png', public_id: '' },
      }
      const activationToken: ActivationTokenProps = await createActiovationToken(user)
      const activationCode = activationToken.activationCode
      const data = { user: { name: user.name }, activationCode }
      const token = activationToken.token

      // * Sending activation code mail to the registered user
      try {
        const emailOptions: EmailOptionsProps = {
          email: user.email,
          subject: 'Activate Your Account',
          template: 'account-activation-mail.ejs',
          data,
        }
        await sendMail(emailOptions)

        res.status(201).json({
          sucess: true,
          Message: `Please check your email: ${user.email} to activate your account`,
          data: token,
        })
      } catch (error: any) {
        console.log(error, '[Error_In_Mail_Sending]')
        return next(new ErrorHandler(error.message, 400))
      }
    } catch (error: any) {
      console.log('[Registration_Error]', error)
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// * Account Activation
export const userActivation = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } = req.body as ActivationProps
      const newUser: { user: UserProps; activationCode: string } = jwt.verify(
        activation_token,
        process.env.JWT_ACTIVATION_TOKEN_SECRET as string
      ) as { user: UserProps; activationCode: string }

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler('Invalid activation code', 400))
      }

      const userExists = await APIUserService.findByEmail(newUser.user.email)
      if (userExists) {
        return next(new ErrorHandler('User already exists', 400))
      }

      const user = await APIUserService.createUser(newUser.user)

      res.status(200).json({
        success: true,
        message: 'User created successfully',
        data: user,
      })
    } catch (error: any) {
      console.log(error, '[Error_In_User_Activation]')
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// * Login
export const userLogin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        return next(new ErrorHandler('Please enter email and password', 400))
      }

      const user = await APIUserService.findByEmail(email)
      if (!user) {
        return next(new ErrorHandler('User not found', 404))
      }

      const isPasswordMatched = await bcrypt.compare(password, user?.password as string)
      if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid email or password', 400))
      }

      await sendToken(user, res)

      // * Set User Session to the Redis
      await redis.set(user?.id as string, JSON.stringify(user) as any)

      res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: user,
      })
    } catch (error: any) {
      console.log(error, '[Login_Error]')
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// * Logout
export const userLogout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie('access_token', '', { maxAge: 1 })
      res.cookie('refresh_token', '', { maxAge: 1 })

      redis.del(req.user?.id as string)

      res.status(200).json({
        success: true,
        message: 'User logged out successfully',
      })
    } catch (error: any) {
      console.log(error, '[Logout_Error]')
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// * Update Access Token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = (await req.cookies.refresh_token) as string
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_TOKEN_SECRET as string
      ) as JwtPayload
      const errorMessage = "Couldn't refresh token"

      if (!decoded) {
        return next(new ErrorHandler(errorMessage, 400))
      }

      const session = await redis.get(decoded.id)
      if (!session) {
        return next(new ErrorHandler(errorMessage, 400))
      }

      const user = JSON.parse(session)
      await sendToken(user, res)

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
      })
    } catch (error: any) {
      console.log(error, '[Logout_Error]')
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// * Social Auth
export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as SocialAuthProps
      const user = await APIUserService.findByEmail(email)
      if (!user) {
        const newUser = await APIUserService.createUser(req.body)
        await sendToken(newUser, res)

        res.status(201).json({
          success: true,
          message: 'User created successfully',
          data: newUser,
        })
      } else {
        await sendToken(user, res)
        res.status(200).json({
          success: true,
          message: 'User logged in successfully',
          data: user,
        })
      }
    } catch (error: any) {
      console.log(error, '[Social_Auth_Error]')
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// * Get User Details
export const userDetails = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await APIUserService.getById(req.user?.id as string)

      res.status(200).json({
        success: true,
        message: 'User details retrieved successfully',
        data: user,
      })
    } catch (error: any) {
      console.log(error, '[User_Details_Error]')
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// * Update User Info
export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string
      const { email, name, ...otherData } = req.body as UpdateUserInfoProps

      if (Object.keys(otherData).length > 0) {
        return next(new ErrorHandler('Unexpected request body fields', 400))
      }

      const user = await redis.get(userId)
      if (!user) {
        return next(new ErrorHandler('User not found', 404))
      }

      if (email && user) {
        const emailExists = await APIUserService.findByEmail(email)
        if (emailExists) {
          return next(new ErrorHandler('Email already exists', 400))
        }
      }

      const userInfo: UpdateUserInfoProps = { email, name }
      const updatedUser = await APIUserService.updateInfo(userId, userInfo)

      await redis.set(userId, JSON.stringify(updatedUser))

      res.status(200).json({
        success: true,
        message: 'User info updated successfully',
        data: updatedUser,
      })
    } catch (error: any) {
      console.log(error, '[Update_User_Info_Error]')
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// * Update User Password
export const updateUserPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string
      const { currentPassword, newPassword, ...otherData } = req.body as PasswordProps

      if (Object.keys(otherData).length > 0) {
        return next(new ErrorHandler('Unexpected request body fields', 400))
      }

      const user: UserProps = await APIUserService.getByRedisId(userId)
      if (!user) {
        return next(new ErrorHandler('User not found', 404))
      }

      if (!currentPassword) {
        return next(new ErrorHandler('Please enter current password', 404))
      }
      if (!newPassword) {
        return next(new ErrorHandler('Please enter new password', 404))
      }

      const isPasswordMatched = await bcrypt.compare(currentPassword, user.password as string)
      if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid current password', 404))
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      const updatedUser = await APIUserService.updatePassword(userId, hashedPassword)

      await redis.set(userId, JSON.stringify(updatedUser))

      res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        data: updatedUser,
      })
    } catch (error: any) {
      console.log(error, '[Update_User_Password_Error]')
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// * Update User Avatar
export const updateUserAvatar = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body
      if (!avatar) {
        return next(new ErrorHandler('Please upload an avatar', 400))
      }

      const userId = req.user?.id as string
      const user: UserProps = await APIUserService.getByRedisId(userId)

      if (user.avatar?.public_id) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id)
      }

      const imgCloud = cloudinary.v2.uploader.upload(avatar, {
        folder: 'next-learning-avatars',
        width: 150,
      })

      const newAvatar = {
        public_id: (await imgCloud).public_id,
        url: (await imgCloud).secure_url,
      }

      const updatedUser = await APIUserService.updateAvatar(userId, newAvatar)
      await redis.set(userId, JSON.stringify(updatedUser))

      res.status(200).json({
        success: true,
        message: 'Avatar updated successfully',
        data: updatedUser,
      })
    } catch (error: any) {
      console.log(error, '[Update_User_Avatar_Error]')
      return next(new ErrorHandler(error.message, 400))
    }
  }
)
