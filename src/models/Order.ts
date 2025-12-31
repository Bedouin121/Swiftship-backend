import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  customerName: string;
  productsCount: number;
  total: number;
  status: 'Pending' | 'Processing' | 'In Transit' | 'Delivered';
  eta: string;
  placedAt?: Date;
  vendorId: mongoose.Types.ObjectId;
  microhubId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  deliveryType: 'standard' | 'express';
  deliveryLocation: {
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
  };
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
    microhubId: { type: Schema.Types.ObjectId, ref: 'Microhub', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    deliveryType: { type: String, enum: ['standard', 'express'], required: true },
    deliveryLocation: {
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function(v: number[]) {
            return v.length === 2;
          },
          message: 'Coordinates must be an array of [longitude, latitude]'
        }
      },
      address: { type: String, required: true }
    }
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);

