import { UserRole } from './index';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
    userRole?: UserRole;
    permissionContext?: any;
  }
}
