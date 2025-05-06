const Financial = require('../models/Financial');

// Initialize the financial document if it doesn't exist
const initializeFinancial = async () => {
  const existingFinancial = await Financial.findOne();
  if (!existingFinancial) {
    console.log('Creating new Financial document');
    await Financial.create({
      bankABalance: 0,
      bankBBalance: 0,
      bankCBalance: 0,
      cashBalance: 0,
      transactions: [],
    });
    console.log('Successfully created Financial document');
  }
};

// Get all balances
const getBalances = async (req, res) => {
  try {
    await initializeFinancial();
    const financial = await Financial.findOne();
    if (!financial) {
      return res.status(404).json({ message: 'Financial data not found' });
    }
    // Format the response to match the frontend's expected structure
    const balances = [
      { source: 'Bank A', balance: financial.bankABalance },
      { source: 'Bank B', balance: financial.bankBBalance },
      { source: 'Bank C', balance: financial.bankCBalance },
      { source: 'Cash-in-Hand', balance: financial.cashBalance },
    ];
    res.status(200).json(balances);
  } catch (err) {
    console.error('Error fetching balances:', err);
    res.status(500).json({ message: 'Server error while fetching balances' });
  }
};

// Get all transactions
const getTransactions = async (req, res) => {
  try {
    await initializeFinancial();
    const financial = await Financial.findOne().populate('transactions.branch', 'name');
    if (!financial) {
      return res.status(404).json({ message: 'Financial data not found' });
    }
    res.status(200).json(financial.transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
};

// Record a deposit
const recordDeposit = async (req, res) => {
  const { source, amount, branch, remarks } = req.body;

  console.log('Deposit request body:', { source, amount, branch, remarks });

  // Explicitly check for undefined or null, allow amount to be 0
  if (source === undefined || source === null ||
      amount === undefined || amount === null ||
      branch === undefined || branch === null) {
    return res.status(400).json({ message: 'Source, amount, and branch are required' });
  }

  // Optional: Add a minimum amount check
  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than 0' });
  }

  try {
    // Ensure the financial document exists
    await initializeFinancial();

    // Find the financial document
    const financial = await Financial.findOne();
    if (!financial) {
      return res.status(404).json({ message: 'Financial data not found' });
    }

    // Update the balance based on the source
    let updatedBalance;
    switch (source) {
      case 'Bank A':
        financial.bankABalance += amount;
        updatedBalance = financial.bankABalance;
        break;
      case 'Bank B':
        financial.bankBBalance += amount;
        updatedBalance = financial.bankBBalance;
        break;
      case 'Bank C':
        financial.bankCBalance += amount;
        updatedBalance = financial.bankCBalance;
        break;
      case 'Cash-in-Hand':
        financial.cashBalance += amount;
        updatedBalance = financial.cashBalance;
        break;
      default:
        return res.status(400).json({ message: 'Invalid source' });
    }

    // Create a new transaction
    const transaction = {
      type: 'Credit - Deposit',
      source,
      branch,
      amount,
      expenseCategory: 'N/A',
      remarks: remarks || 'N/A',
    };

    // Add the transaction to the transactions array
    financial.transactions.push(transaction);
    financial.lastUpdated = Date.now();
    await financial.save();

    // Populate the branch details for the newly added transaction
    const populatedFinancial = await Financial.findOne()
      .populate('transactions.branch', 'name')
      .select('transactions');
    const populatedTransaction = populatedFinancial.transactions[populatedFinancial.transactions.length - 1];

    // Format the balance response to match the frontend's expected structure
    const balanceResponse = { source, balance: updatedBalance };

    res.status(201).json({ balance: balanceResponse, transaction: populatedTransaction });
  } catch (err) {
    console.error('Error recording deposit:', err);
    res.status(500).json({ message: 'Server error while recording deposit' });
  }
};

// Record an expense
const recordExpense = async (req, res) => {
  const { source, category, amount, branch, remarks } = req.body;

  console.log('Expense request body:', { source, category, amount, branch, remarks });

  // Explicitly check for undefined or null, allow amount to be 0
  if (source === undefined || source === null ||
      category === undefined || category === null ||
      amount === undefined || amount === null ||
      branch === undefined || branch === null) {
    return res.status(400).json({ message: 'Source, category, amount, and branch are required' });
  }

  // Optional: Add a minimum amount check
  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than 0' });
  }

  try {
    // Ensure the financial document exists
    await initializeFinancial();

    // Find the financial document
    const financial = await Financial.findOne();
    if (!financial) {
      return res.status(404).json({ message: 'Financial data not found' });
    }

    // Check and update the balance based on the source
    let updatedBalance;
    switch (source) {
      case 'Bank A':
        if (amount > financial.bankABalance) {
          return res.status(400).json({ message: 'Insufficient balance in Bank A' });
        }
        financial.bankABalance -= amount;
        updatedBalance = financial.bankABalance;
        break;
      case 'Bank B':
        if (amount > financial.bankBBalance) {
          return res.status(400).json({ message: 'Insufficient balance in Bank B' });
        }
        financial.bankBBalance -= amount;
        updatedBalance = financial.bankBBalance;
        break;
      case 'Bank C':
        if (amount > financial.bankCBalance) {
          return res.status(400).json({ message: 'Insufficient balance in Bank C' });
        }
        financial.bankCBalance -= amount;
        updatedBalance = financial.bankCBalance;
        break;
      case 'Cash-in-Hand':
        if (amount > financial.cashBalance) {
          return res.status(400).json({ message: 'Insufficient balance in Cash-in-Hand' });
        }
        financial.cashBalance -= amount;
        updatedBalance = financial.cashBalance;
        break;
      default:
        return res.status(400).json({ message: 'Invalid source' });
    }

    // Create a new transaction
    const transaction = {
      type: 'Debit - Expense',
      source,
      branch,
      amount,
      expenseCategory: category,
      remarks: remarks || 'N/A',
    };

    // Add the transaction to the transactions array
    financial.transactions.push(transaction);
    financial.lastUpdated = Date.now();
    await financial.save();

    // Populate the branch details for the newly added transaction
    const populatedFinancial = await Financial.findOne()
      .populate('transactions.branch', 'name')
      .select('transactions');
    const populatedTransaction = populatedFinancial.transactions[populatedFinancial.transactions.length - 1];

    // Format the balance response to match the frontend's expected structure
    const balanceResponse = { source, balance: updatedBalance };

    res.status(201).json({ balance: balanceResponse, transaction: populatedTransaction });
  } catch (err) {
    console.error('Error recording expense:', err);
    res.status(500).json({ message: 'Server error while recording expense' });
  }
};

module.exports = {
  getBalances,
  getTransactions,
  recordDeposit,
  recordExpense,
};