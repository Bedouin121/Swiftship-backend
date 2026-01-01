import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  city: string;
  companyName: string;
  businessType: string;
  registrationNumber: string;
  taxId: string;
  website?: string;
  businessDescription: string;
  nidNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  products: number;
  registeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    companyName: { type: String, required: true },
    businessType: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    taxId: { type: String, required: true },
    website: { type: String, required: false },
    businessDescription: { type: String, required: true },
    nidNumber: { type: String, required: true, validate: { validator: (v: string) => /^\d{10}$/.test(v), message: 'NID Number must be exactly 10 digits' } },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    products: { type: Number, default: 0 },
    registeredAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IVendor>('Vendor', VendorSchema);

