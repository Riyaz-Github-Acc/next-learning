import { UpdateUserInfoProps, UserProps } from '../constants/types'
import { prisma } from '../utils/db'
import { redis } from '../utils/redis'

const findByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  })
  return user
}

const createUser = async (userDetails: UserProps) => {
  const user = await prisma.user.create({
    data: userDetails,
  })
  return user
}

const getById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      enrollment: true,
    },
  })
  return user
}

const getByRedisId = async (userId: string) => {
  const userJson = await redis.get(userId)
  const user = JSON.parse(userJson as string)
  return user
}

const updateInfo = async (userId: string, userInfo: UpdateUserInfoProps) => {
  const user = await prisma.user.update({
    where: {
      id: userId,
    }, 
    data: {
      email: userInfo.email,
      name: userInfo.name
    }
  })
  return user
}

const updatePassword = async (userId: string, newPassword: string) => {
  const user = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      password: newPassword
    }
  })
  return user
} 

const updateAvatar = async (userId: string, newAvatar: object) => {
  const user = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      avatar: newAvatar
    }
  })
  return user
}

export const APIUserService = {
  findByEmail,
  createUser,
  getById,
  getByRedisId,
  updateInfo,
  updatePassword,
  updateAvatar,
}
