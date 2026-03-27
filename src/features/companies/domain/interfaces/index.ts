/**
 * Company Domain Interfaces
 * واجهات نطاق الشركات
 * 
 * Exports all company-related domain interfaces.
 */

// Company
export type { Company, CompanyFilters, ICompanyRepository } from './company.repository.interface';
export { CompanyType, CompanyStatus } from './company.repository.interface';

// Employee & Invitation
export type { 
  Employee, 
  Invitation, 
  IEmployeeRepository, 
  IInvitationRepository 
} from './employee.repository.interface';
export { EmployeeRole, InvitationStatus } from './employee.repository.interface';
