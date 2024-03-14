export interface UserProps {
  id: string
  name: string
  email: string
  password: string | null
  avatar: any
  role: string
  isVerified: boolean
}

export interface RegistrationProps {
  name: string
  email: string
  password: string
  avatar: any
}

export interface ActivationTokenProps {
  token: string
  activationCode: string
}

export interface EmailOptionsProps {
  email: string
  subject: string
  template: string
  data: { [key: string]: any }
}

export interface ActivationProps {
  activation_token: string
  activation_code: string
}

export interface CookieTokensProps {
  access_token: string
  refresh_token: string
}

export interface TokenOptionsProps {
  httpOnly: boolean
  expires: Date
  maxAge: number
  samesite: 'strict' | 'lax' | 'none' | undefined
  secure?: boolean
}

export interface SocialAuthProps {
  email: string
  name: string
  avatar: string
}

export interface UpdateUserInfoProps {
  email?: string
  name?: string
}

export interface PasswordProps {
  currentPassword: string
  newPassword: string
}
