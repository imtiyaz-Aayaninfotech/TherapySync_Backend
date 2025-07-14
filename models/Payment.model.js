const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  cardHolderName: { type: String, required: true },
  cardNumber: { type: String, required: true },
  expiryMonth: { type: String, required: true }, // MM
  expiryYear: { type: String, required: true },  // YYYY
  cvv: { type: String, required: true }
}, { _id: false });

const PaymentSchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sessionPlan: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  region: {
    type: String,
    enum: ["Berlin", "Thessaloniki"],
    required: true
  },
  method: {
    type: String,
    enum: ["Credit Card", "Debit Card", "GPay", "Paypal", "Apple Pay"],
    required: true
  },
  cardDetails: {
    type: CardSchema,
    required: function () {
      return this.method === "Credit Card" || this.method === "Debit Card";
    }
  },
  transactionId: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Payment", PaymentSchema);
