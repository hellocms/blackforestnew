const ClosingEntry = require('../models/ClosingEntry');

// Create a new closing entry
exports.createClosingEntry = async (req, res) => {
  try {
    const {
      branchId,
      date,
      systemSales,
      manualSales,
      onlineSales,
      expenses,
      expenseDetails,
      creditCardPayment,
      upiPayment,
      cashPayment,
      denom2000,
      denom500,
      denom200,
      denom100,
      denom50,
      denom20,
      denom10,
    } = req.body;

    // Validate required fields
    if (
      !branchId ||
      !date ||
      systemSales === undefined ||
      manualSales === undefined ||
      onlineSales === undefined ||
      expenses === undefined ||
      creditCardPayment === undefined ||
      upiPayment === undefined ||
      cashPayment === undefined ||
      denom2000 === undefined ||
      denom500 === undefined ||
      denom200 === undefined ||
      denom100 === undefined ||
      denom50 === undefined ||
      denom20 === undefined ||
      denom10 === undefined
    ) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Validate expenseDetails
    if (!expenseDetails || !Array.isArray(expenseDetails) || expenseDetails.length === 0) {
      return res.status(400).json({ success: false, message: 'Expense details are required' });
    }

    for (const detail of expenseDetails) {
      if (
        detail.serialNo === undefined ||
        !detail.purpose ||
        detail.amount === undefined
      ) {
        return res.status(400).json({ success: false, message: 'All expense details fields (serialNo, purpose, amount) are required' });
      }
      if (detail.amount < 0) {
        return res.status(400).json({ success: false, message: 'Expense amounts must be non-negative' });
      }
    }

    // Validate that the sum of expenseDetails amounts matches the expenses total
    const totalExpenseDetails = expenseDetails.reduce((sum, detail) => sum + detail.amount, 0);
    if (totalExpenseDetails !== expenses) {
      return res.status(400).json({
        success: false,
        message: `Total expenses from details (₹${totalExpenseDetails}) must match the expenses total (₹${expenses})`,
      });
    }

    // Validate non-negative values
    if (
      systemSales < 0 ||
      manualSales < 0 ||
      onlineSales < 0 ||
      expenses < 0 ||
      creditCardPayment < 0 ||
      upiPayment < 0 ||
      cashPayment < 0 ||
      denom2000 < 0 ||
      denom500 < 0 ||
      denom200 < 0 ||
      denom100 < 0 ||
      denom50 < 0 ||
      denom20 < 0 ||
      denom10 < 0
    ) {
      return res.status(400).json({ success: false, message: 'All values must be non-negative' });
    }

    // Calculate total sales
    const totalSales = systemSales + manualSales + onlineSales;

    // Calculate total cash from denominations
    const totalCashFromDenom =
      denom2000 * 2000 +
      denom500 * 500 +
      denom200 * 200 +
      denom100 * 100 +
      denom50 * 50 +
      denom20 * 20 +
      denom10 * 10;

    if (totalCashFromDenom !== cashPayment) {
      return res.status(400).json({
        success: false,
        message: `Total cash from denominations (₹${totalCashFromDenom}) must equal cash payment (₹${cashPayment})`,
      });
    }

    // Calculate net result
    const netResult = totalSales - expenses;

    // Create new closing entry
    const closingEntry = new ClosingEntry({
      branchId,
      date,
      systemSales,
      manualSales,
      onlineSales,
      expenses,
      expenseDetails, // Include the detailed expense breakdown
      netResult,
      creditCardPayment,
      upiPayment,
      cashPayment,
      denom2000,
      denom500,
      denom200,
      denom100,
      denom50,
      denom20,
      denom10,
    });

    // Save to database
    await closingEntry.save();

    res.status(201).json({ success: true, message: 'Closing entry created successfully', closingEntry });
  } catch (error) {
    console.error('Error creating closing entry:', error);
    res.status(500).json({ success: false, message: 'Server error while creating closing entry' });
  }
};

// Update an existing closing entry
exports.updateClosingEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      branchId,
      date,
      systemSales,
      manualSales,
      onlineSales,
      expenses,
      expenseDetails,
      creditCardPayment,
      upiPayment,
      cashPayment,
      denom2000,
      denom500,
      denom200,
      denom100,
      denom50,
      denom20,
      denom10,
    } = req.body;

    // Validate required fields
    if (
      !branchId ||
      !date ||
      systemSales === undefined ||
      manualSales === undefined ||
      onlineSales === undefined ||
      expenses === undefined ||
      creditCardPayment === undefined ||
      upiPayment === undefined ||
      cashPayment === undefined ||
      denom2000 === undefined ||
      denom500 === undefined ||
      denom200 === undefined ||
      denom100 === undefined ||
      denom50 === undefined ||
      denom20 === undefined ||
      denom10 === undefined
    ) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Validate expenseDetails
    if (!expenseDetails || !Array.isArray(expenseDetails) || expenseDetails.length === 0) {
      return res.status(400).json({ success: false, message: 'Expense details are required' });
    }

    for (const detail of expenseDetails) {
      if (
        detail.serialNo === undefined ||
        !detail.purpose ||
        detail.amount === undefined
      ) {
        return res.status(400).json({ success: false, message: 'All expense details fields (serialNo, purpose, amount) are required' });
      }
      if (detail.amount < 0) {
        return res.status(400).json({ success: false, message: 'Expense amounts must be non-negative' });
      }
    }

    // Validate that the sum of expenseDetails amounts matches the expenses total
    const totalExpenseDetails = expenseDetails.reduce((sum, detail) => sum + detail.amount, 0);
    if (totalExpenseDetails !== expenses) {
      return res.status(400).json({
        success: false,
        message: `Total expenses from details (₹${totalExpenseDetails}) must match the expenses total (₹${expenses})`,
      });
    }

    // Validate non-negative values
    if (
      systemSales < 0 ||
      manualSales < 0 ||
      onlineSales < 0 ||
      expenses < 0 ||
      creditCardPayment < 0 ||
      upiPayment < 0 ||
      cashPayment < 0 ||
      denom2000 < 0 ||
      denom500 < 0 ||
      denom200 < 0 ||
      denom100 < 0 ||
      denom50 < 0 ||
      denom20 < 0 ||
      denom10 < 0
    ) {
      return res.status(400).json({ success: false, message: 'All values must be non-negative' });
    }

    // Calculate total sales
    const totalSales = systemSales + manualSales + onlineSales;

    // Calculate total cash from denominations
    const totalCashFromDenom =
      denom2000 * 2000 +
      denom500 * 500 +
      denom200 * 200 +
      denom100 * 100 +
      denom50 * 50 +
      denom20 * 20 +
      denom10 * 10;

    if (totalCashFromDenom !== cashPayment) {
      return res.status(400).json({
        success: false,
        message: `Total cash from denominations (₹${totalCashFromDenom}) must equal cash payment (₹${cashPayment})`,
      });
    }

    // Calculate net result
    const netResult = totalSales - expenses;

    // Find and update the closing entry
    const updatedClosingEntry = await ClosingEntry.findByIdAndUpdate(
      id,
      {
        branchId,
        date,
        systemSales,
        manualSales,
        onlineSales,
        expenses,
        expenseDetails,
        netResult,
        creditCardPayment,
        upiPayment,
        cashPayment,
        denom2000,
        denom500,
        denom200,
        denom100,
        denom50,
        denom20,
        denom10,
      },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedClosingEntry) {
      return res.status(404).json({ success: false, message: 'Closing entry not found' });
    }

    res.status(200).json({ success: true, message: 'Closing entry updated successfully', closingEntry: updatedClosingEntry });
  } catch (error) {
    console.error('Error updating closing entry:', error);
    res.status(500).json({ success: false, message: 'Server error while updating closing entry' });
  }
};

// Get all closing entries
exports.getClosingEntries = async (req, res) => {
  try {
    const closingEntries = await ClosingEntry.find()
      .populate('branchId', 'name') // Populate branch name
      .sort({ date: -1 }); // Sort by date, newest first

    res.status(200).json(closingEntries);
  } catch (error) {
    console.error('Error fetching closing entries:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching closing entries' });
  }
};