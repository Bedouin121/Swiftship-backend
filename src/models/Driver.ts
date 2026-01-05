import mongoose, { Schema, Document } from 'mongoose';

export interface IDriver extends Document {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone: string;
  address?: string;
  city?: string;
  licenseExpiry?: Date;
  vehicleType?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehiclePlateNumber?: string;
  nidImageUrl?: string;
  drivingLicenseImageUrl?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  deliveries: number;
  rating: number;
  status: 'active' | 'pending' | 'inactive';
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    name: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    phone: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    licenseExpiry: { type: Date },
    vehicleType: { type: String },
    vehicleModel: { type: String },
    vehicleYear: { type: String },
    vehiclePlateNumber: { type: String },
    nidImageUrl: { type: String },
    drivingLicenseImageUrl: { type: String },
    emergencyContact: { type: String },
    emergencyPhone: { type: String },
    deliveries: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    status: { type: String, enum: ['active', 'pending', 'inactive'], default: 'pending' },
    joinedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IDriver>('Driver', DriverSchema);

