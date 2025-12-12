import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryLog extends Document {
  type: 'Inbound' | 'Outbound';
  product: string;
  quantity: number;
  vendor: string;
  processedAt: Date;
  processedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryLogSchema = new Schema<IInventoryLog>(
  {
    type: { type: String, enum: ['Inbound', 'Outbound'], required: true },
    product: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    vendor: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
    processedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IInventoryLog>('InventoryLog', InventoryLogSchema);

