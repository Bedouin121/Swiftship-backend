import mongoose, { Schema, Document } from 'mongoose';

export interface IMicrohub extends Document {
  name: string;
  location: string;
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
    capacity: { type: Number, required: true, min: 0 },
    utilized: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model<IMicrohub>('Microhub', MicrohubSchema);

