// Company Types for Dayf Platform

// ============================================
// Enums (replacing Prisma enums - must match Prisma schema)
// ============================================

export type CompanyType = 'HOTEL' | 'TOUR_OPERATOR' | 'TRANSPORT' | 'RESTAURANT' | 'SHOP' | 'TRAVEL_AGENCY' | 'CAR_RENTAL' | 'EVENT_ORGANIZER' | 'OTHER';
export type CompanyStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

// EmployeeRole as const object for both type and value usage
export const EmployeeRole = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  VIEWER: 'VIEWER',
} as const;

export type EmployeeRoleType = typeof EmployeeRole[keyof typeof EmployeeRole];

// ============================================
// Company Types
// ============================================

export interface CreateCompanyInput {
  name: string;
  type: CompanyType;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  country?: string;
  city?: string;
  address?: string;
  commercialReg?: string;
  taxNumber?: string;
  documents?: string[];
}

export interface UpdateCompanyInput {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  country?: string;
  city?: string;
  address?: string;
  logo?: string;
  coverImage?: string;
  commercialReg?: string;
  taxNumber?: string;
  documents?: string[];
}

export interface CompanyResponse {
  id: string;
  name: string;
  slug: string;
  type: CompanyType;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  logo: string | null;
  coverImage: string | null;
  status: CompanyStatus;
  verifiedAt: Date | null;
  rating: number;
  reviewCount: number;
  totalServices: number;
  totalProducts: number;
  totalBookings: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    displayName: string;
    avatar: string | null;
  };
  isVerified: boolean;
}

export interface CompanyListFilters {
  type?: CompanyType;
  status?: CompanyStatus;
  city?: string;
  verified?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================
// Employee Types
// ============================================

export interface InviteEmployeeInput {
  email: string;
  role: EmployeeRoleType;
  permissions?: string[];
}

export interface AcceptInvitationInput {
  token: string;
}

export interface EmployeeResponse {
  id: string;
  companyId: string;
  userId: string;
  role: EmployeeRoleType;
  permissions: string[] | null;
  joinedAt: Date;
  user: {
    id: string;
    displayName: string;
    email: string | null;
    avatar: string | null;
  };
}

export interface InvitationResponse {
  id: string;
  companyId: string;
  email: string;
  role: EmployeeRoleType;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  company?: {
    id: string;
    name: string;
    type: CompanyType;
  };
}

// ============================================
// Permission Types
// ============================================

export const COMPANY_PERMISSIONS = {
  // Company Management
  MANAGE_COMPANY: 'manage_company',
  UPDATE_COMPANY: 'update_company',
  DELETE_COMPANY: 'delete_company',
  
  // Services
  CREATE_SERVICE: 'create_service',
  UPDATE_SERVICE: 'update_service',
  DELETE_SERVICE: 'delete_service',
  
  // Products
  CREATE_PRODUCT: 'create_product',
  UPDATE_PRODUCT: 'update_product',
  DELETE_PRODUCT: 'delete_product',
  
  // Bookings
  VIEW_BOOKINGS: 'view_bookings',
  MANAGE_BOOKINGS: 'manage_bookings',
  
  // Employees
  INVITE_EMPLOYEE: 'invite_employee',
  REMOVE_EMPLOYEE: 'remove_employee',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
} as const;

export type CompanyPermission = typeof COMPANY_PERMISSIONS[keyof typeof COMPANY_PERMISSIONS];

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<EmployeeRoleType, CompanyPermission[]> = {
  OWNER: Object.values(COMPANY_PERMISSIONS), // All permissions
  MANAGER: [
    COMPANY_PERMISSIONS.UPDATE_COMPANY,
    COMPANY_PERMISSIONS.CREATE_SERVICE,
    COMPANY_PERMISSIONS.UPDATE_SERVICE,
    COMPANY_PERMISSIONS.DELETE_SERVICE,
    COMPANY_PERMISSIONS.CREATE_PRODUCT,
    COMPANY_PERMISSIONS.UPDATE_PRODUCT,
    COMPANY_PERMISSIONS.DELETE_PRODUCT,
    COMPANY_PERMISSIONS.VIEW_BOOKINGS,
    COMPANY_PERMISSIONS.MANAGE_BOOKINGS,
    COMPANY_PERMISSIONS.INVITE_EMPLOYEE,
    COMPANY_PERMISSIONS.VIEW_ANALYTICS,
  ],
  STAFF: [
    COMPANY_PERMISSIONS.VIEW_BOOKINGS,
    COMPANY_PERMISSIONS.MANAGE_BOOKINGS,
    COMPANY_PERMISSIONS.VIEW_ANALYTICS,
  ],
  VIEWER: [
    COMPANY_PERMISSIONS.VIEW_BOOKINGS,
    COMPANY_PERMISSIONS.VIEW_ANALYTICS,
  ],
};

// ============================================
// Error Types
// ============================================

export enum CompanyError {
  NOT_FOUND = 'COMPANY_NOT_FOUND',
  ALREADY_EXISTS = 'COMPANY_ALREADY_EXISTS',
  UNAUTHORIZED = 'COMPANY_UNAUTHORIZED',
  PERMISSION_DENIED = 'COMPANY_PERMISSION_DENIED',
  INVALID_STATUS = 'COMPANY_INVALID_STATUS',
  INVITATION_EXPIRED = 'INVITATION_EXPIRED',
  INVITATION_NOT_FOUND = 'INVITATION_NOT_FOUND',
  EMPLOYEE_EXISTS = 'EMPLOYEE_EXISTS',
}
