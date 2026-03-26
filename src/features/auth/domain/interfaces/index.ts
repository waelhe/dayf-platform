/**
 * Auth Domain Interfaces
 * واجهات نطاق المصادقة
 * 
 * Exports all repository interfaces for the auth domain layer.
 * These interfaces define the contracts for data access operations.
 */

// User Repository Interface
export type { 
  UserRole, 
  UserStatus, 
  MembershipLevel, 
  User, 
  IUserRepository 
} from './user.repository.interface';

// Session Repository Interface
export type { 
  Session, 
  ISessionRepository 
} from './session.repository.interface';

// OTP Repository Interface
export type { 
  OTPType, 
  OTPCode, 
  IOTPRepository 
} from './otp.repository.interface';
