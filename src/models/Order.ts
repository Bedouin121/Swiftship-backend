import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  customerName: string;
  phoneNumber: string;
  productsCount: number;
  total: number;
  status: 'Waiting' | 'Pickup' | 'Delivering' | 'Completed';
  eta: string;
  placedAt?: Date;
  vendorId: mongoose.Types.ObjectId;
  sourceMicrohubId: mongoose.Types.ObjectId;
  destinationMicrohubId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  deliveryType: 'standard' | 'express';
  specifiedAddress: string;
  deliveryLocation: {
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
    addressDetails?: {
      address?: string;
      thana?: string;
      district?: string;
    };
  };
  assignedDriverId?: mongoose.Types.ObjectId;
  pickupOtp?: string;
  deliveryOtp?: string;
  distance?: number; // in kilometers
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    customerName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    productsCount: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Waiting', 'Pickup', 'Delivering', 'Completed'], default: 'Waiting' },
    eta: { type: String, required: true },
    placedAt: { type: Date },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    sourceMicrohubId: { type: Schema.Types.ObjectId, ref: 'Microhub', required: true },
    destinationMicrohubId: { type: Schema.Types.ObjectId, ref: 'Microhub', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    deliveryType: { type: String, enum: ['standard', 'express'], required: true },
    specifiedAddress: { type: String, required: true },
    assignedDriverId: { type: Schema.Types.ObjectId, ref: 'Driver' },
    pickupOtp: { type: String },
    deliveryOtp: { type: String },
    distance: { type: Number }, // in kilometers
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
      address: { type: String, required: true },
      addressDetails: {
        address: { type: String, required: false },
        thana: { type: String, required: false },
        district: { type: String, required: false }
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);

