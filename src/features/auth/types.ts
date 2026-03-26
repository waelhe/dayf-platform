// Auth Types

import { 
  Role, 
  UserStatus, 
  MembershipLevel, 
  Gender, 
  OAuthProvider, 
  OTPType, 
  VerificationType, 
  VerificationStatus 
} from '@/core/types/enums';

// Re-export enums for convenience
export { 
  Role, 
  UserStatus, 
  MembershipLevel, 
  Gender, 
  OAuthProvider, 
  OTPType, 
  VerificationType, 
  VerificationStatus 
};

// ============================================
// User Types
// ============================================

export interface UserResponse {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  avatar: string | null;
  role: Role;
  status: UserStatus;
  membershipLevel: MembershipLevel;
  loyaltyPoints: number;
  language: string;
  emailVerified: Date | null;
  phoneVerified: Date | null;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
  refreshToken?: string;
  isNewUser?: boolean;
}

// ============================================
// Registration Types
// ============================================

export interface RegisterWithEmailInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RegisterWithPhoneInput {
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
}

// ============================================
// Login Types
// ============================================

export interface LoginWithEmailInput {
  email: string;
  password: string;
}

export interface LoginWithPhoneInput {
  phone: string;
  otp: string;
}

export interface LoginWithOAuthInput {
  provider: OAuthProvider;
  code: string;
  state?: string;
}

// ============================================
// OTP Types
// ============================================

export interface SendOTPInput {
  phone: string;
  type: OTPType;
}

export interface VerifyOTPInput {
  phone: string;
  code: string;
  type: OTPType;
}

export interface OTPResponse {
  success: boolean;
  expiresIn: number; // seconds
  message?: string;
}

// ============================================
// Password Reset Types
// ============================================

export interface ResetPasswordRequestInput {
  email?: string;
  phone?: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

// ============================================
// Session Types
// ============================================

export interface SessionData {
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

// ============================================
// OAuth Types
// ============================================

export interface OAuthUserInfo {
  providerId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
}

export interface OAuthCallbackResponse {
  user: UserResponse;
  token: string;
  isNewUser: boolean;
}

// ============================================
// Verification Types
// ============================================

export interface VerificationRequestInput {
  type: VerificationType;
  documentType: string;
  documentUrl: string;
  documentNumber?: string;
}

export interface VerificationResponse {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  createdAt: Date;
}

// ============================================
// Error Types
// ============================================

export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  INVALID_OTP = 'INVALID_OTP',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_TOO_MANY_ATTEMPTS = 'OTP_TOO_MANY_ATTEMPTS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNVERIFIED_EMAIL = 'UNVERIFIED_EMAIL',
  UNVERIFIED_PHONE = 'UNVERIFIED_PHONE',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  OAUTH_ERROR = 'OAUTH_ERROR',
}

export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
