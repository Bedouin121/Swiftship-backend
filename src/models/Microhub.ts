import mongoose, { Schema, Document } from 'mongoose';

export interface IMicrohub extends Document {
  name: string;
  location: string;
  address?: string;
  thana?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  utilized: number;
  status: 'active' | 'maintenance' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const MicrohubSchema = new Schema<IMicrohub>(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, required: false },
    thana: { type: String, required: false },
    district: { type: String, required: false },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    capacity: { type: Number, required: true, min: 0 },
    utilized: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model<IMicrohub>('Microhub', MicrohubSchema);

