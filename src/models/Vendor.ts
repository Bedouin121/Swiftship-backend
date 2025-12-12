import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  products: number;
  registeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    products: { type: Number, default: 0 },
    registeredAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IVendor>('Vendor', VendorSchema);

