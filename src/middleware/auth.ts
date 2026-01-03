import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type Role = 'admin' | 'vendor' | 'driver';

export interface AuthRequest extends Request {
  role?: Role;
  vendorId?: string;
  driverId?: string;
}

interface JWTPayload {
  vendorId?: string;
  driverId?: string;
  adminId?: string;
  email: string;
  role: Role;
}

export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          message: 'Access denied. No token provided.' 
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JWTPayload;

      if (!decoded.role || !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ 
          message: 'Access denied. Invalid role.' 
        });
      }

      req.role = decoded.role;

      if (decoded.role === 'vendor' && decoded.vendorId) {
        req.vendorId = decoded.vendorId;
      }

      if (decoded.role === 'driver' && decoded.driverId) {
        req.driverId = decoded.driverId;
      }

      next();
    } catch (error) {
      return res.status(401).json({ 
        message: 'Access denied. Invalid token.' 
      });
    }
  };
};;

