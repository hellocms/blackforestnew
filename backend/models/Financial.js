const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    required: true,
    enum: ['Credit - Deposit', 'Debit - Expense'],
  },
  source: {
    type: String,
    required: true,
    enum: ['Bank A', 'Bank B', 'Bank C', 'Cash-in-Hand'],
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  expenseCategory: {
    type: String,
    default: 'N/A',
  },
  remarks: {
    type: String,
    default: 'N/A',
  },
});

const financialSchema = new mongoose.Schema({
  bankABalance: {
    type: Number,
    default: 0,
  },
  bankBBalance: {
    type: Number,
    default: 0,
  },
  bankCBalance: {
    type: Number,
    default: 0,
  },
  cashBalance: {
    type: Number,
    default: 0,
  },
  transactions: [transactionSchema],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Financial', financialSchema);