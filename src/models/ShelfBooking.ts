import mongoose, { Schema, Document } from 'mongoose';

export interface IShelfBooking extends Document {
  vendorId: mongoose.Types.ObjectId;
  microhubId: mongoose.Types.ObjectId;
  shelfSize: 'small' | 'medium' | 'large';
  utilizationPercentage: number; // 10%, 25%, or 50%
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const ShelfBookingSchema = new Schema<IShelfBooking>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    microhubId: { type: Schema.Types.ObjectId, ref: 'Microhub', required: true },
    shelfSize: { 
      type: String, 
      enum: ['small', 'medium', 'large'], 
      required: true 
    },
    utilizationPercentage: { 
      type: Number, 
      required: true,
      validate: {
        validator: (v: number) => [10, 25, 50].includes(v),
        message: 'Utilization percentage must be 10, 25, or 50'
      }
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['active', 'expired', 'cancelled'], 
      default: 'active' 
    },
  },
  { timestamps: true }
);

// Index for efficient queries
ShelfBookingSchema.index({ vendorId: 1, status: 1 });
ShelfBookingSchema.index({ microhubId: 1, status: 1 });

export default mongoose.model<IShelfBooking>('ShelfBooking', ShelfBookingSchema);