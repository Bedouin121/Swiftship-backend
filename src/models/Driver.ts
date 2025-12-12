import mongoose, { Schema, Document } from 'mongoose';

export interface IDriver extends Document {
  name: string;
  phone: string;
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
    phone: { type: String, required: true },
    deliveries: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    status: { type: String, enum: ['active', 'pending', 'inactive'], default: 'pending' },
    joinedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IDriver>('Driver', DriverSchema);

