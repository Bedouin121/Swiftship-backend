import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  customerName: string;
  productsCount: number;
  total: number;
  status: 'Pending' | 'Processing' | 'In Transit' | 'Delivered';
  eta: string;
  placedAt?: Date;
  vendorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    customerName: { type: String, required: true },
    productsCount: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Pending', 'Processing', 'In Transit', 'Delivered'], default: 'Pending' },
    eta: { type: String, required: true },
    placedAt: { type: Date },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);

