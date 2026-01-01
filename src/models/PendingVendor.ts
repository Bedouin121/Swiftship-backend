import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingVendor extends Document {
  firstName: string;
  lastName: string;
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
  registeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PendingVendorSchema = new Schema<IPendingVendor>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
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
    registeredAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IPendingVendor>('PendingVendor', PendingVendorSchema);

