import express from 'express'

import { isAuthenticated } from '../middlewares/auth'
import {
  socialAuth,
  updateAccessToken,
  updateUserInfo,
  userActivation,
  userDetails,
  userLogin,
  userLogout,
  userRegistration,
  updateUserPassword,
  updateUserAvatar,
} from '../controllers/user-controller'

const userRoute = express()

userRoute.post('/register', userRegistration)
userRoute.post('/activate-user', userActivation)
userRoute.post('/login', userLogin)
userRoute.post('/social-auth', socialAuth)

userRoute.get('/me', isAuthenticated, userDetails)
userRoute.get('/refresh-token', updateAccessToken)
userRoute.get('/logout', isAuthenticated, userLogout)

userRoute.patch('/update-user-info', isAuthenticated, updateUserInfo)
userRoute.patch('/update-user-password', isAuthenticated, updateUserPassword)
userRoute.patch('/update-user-avatar', isAuthenticated, updateUserAvatar)

export default userRoute
