import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
  vendorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    description: { type: String },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);

