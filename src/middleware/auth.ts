import { Request, Response, NextFunction } from 'express';

export type Role = 'admin' | 'vendor';

export interface AuthRequest extends Request {
  role?: Role;
  vendorId?: string;
}

export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.headers['x-role'] as Role;
    
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ 
        message: 'Access denied. Invalid or missing role.' 
      });
    }

    req.role = role;

    if (role === 'vendor') {
      const vendorId = req.headers['x-vendor-id'] as string;
      if (!vendorId) {
        return res.status(400).json({ 
          message: 'Vendor ID is required for vendor requests.' 
        });
      }
      req.vendorId = vendorId;
    }

    next();
  };
};

