const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  tab: {
    type: String,
    required: true,
  },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      sendingQty: { type: Number, default: 0 },
      price: { type: Number, required: true },
      unit: { type: String, required: true },
      gstRate: { 
        type: mongoose.Schema.Types.Mixed, // Allows Number (e.g., 5, 12) or String ("non-gst")
        required: true,
        validate: {
          validator: function(v) {
            return (typeof v === 'number' && v >= 0) || v === 'non-gst';
          },
          message: 'gstRate must be a non-negative number or "non-gst"',
        },
      },
      productTotal: { type: Number, required: true },
      productGST: { 
        type: Number, 
        required: true,
        default: function() {
          return this.gstRate === 'non-gst' ? 0 : null; // 0 for Non-GST, calculated otherwise
        },
      },
      bminstock: { type: Number, default: 0 },
      confirmed: { type: Boolean, default: false },
    },
  ],
  paymentMethod: {
    type: String,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  totalGST: {
    type: Number,
    required: true,
  },
  totalWithGST: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'neworder', 'pending', 'delivered', 'received'],
    default: 'draft',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  orderId: {
    type: String,
    unique: true,
    default: () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  },
  billNo: {
    type: String,
    unique: true,
  },
  waiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null,
  },
  deliveryDateTime: {
    type: Date,
    required: false,
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    default: null,
  },
});

module.exports = mongoose.model('Order', orderSchema);