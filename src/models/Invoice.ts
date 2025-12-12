import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  vendor: mongoose.Types.ObjectId;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);

