const Bill = require('../models/DealerBill');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/dealerbills';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'bill_' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png) and PDF files are allowed!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

exports.createBill = [
  upload.single('billImage'),
  async (req, res) => {
    console.log('Request Body:', req.body);
    console.log('Request File:', req.file);

    if (!req.file) {
      return res.status(400).json({ message: 'Bill image is required' });
    }

    try {
      const { dealer, branch, billNumber, billDate, amount } = req.body;

      if (!dealer || !branch || !billNumber || !billDate || !amount) {
        return res.status(400).json({ message: 'All fields (dealer, branch, bill number, bill date, amount) are required' });
      }

      const parsedBillDate = new Date(billDate);
      if (isNaN(parsedBillDate)) {
        return res.status(400).json({ message: 'Invalid bill date format' });
      }

      if (parsedBillDate > new Date()) {
        return res.status(400).json({ message: 'Bill date cannot be in the future' });
      }

      if (parseFloat(amount) < 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }

      const billImagePath = req.file.path.replace(/\\/g, '/');
      const billAmount = parseFloat(amount);

      const bill = new Bill({
        dealer,
        branch,
        billNumber,
        billDate: parsedBillDate,
        amount: billAmount,
        billImage: billImagePath,
        paid: 0,
        pending: billAmount,
        status: 'Pending',
      });

      const savedBill = await bill.save();
      res.status(201).json({ message: 'Bill entry created successfully', bill: savedBill });
    } catch (error) {
      console.error('Error creating bill entry:', error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Bill number must be unique' });
      } else if (error.message.includes('ENOENT')) {
        return res.status(500).json({ message: 'Server error: Upload directory not accessible' });
      }
      res.status(500).json({ message: 'Server error while creating bill entry', error: error.message });
    }
  },
];

exports.getBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate('dealer', 'dealer_name')
      .populate('branch', 'name');
    res.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Server error while fetching bills', error: error.message });
  }
};

exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('dealer', 'dealer_name')
      .populate('branch', 'name');
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ message: 'Server error while fetching bill', error: error.message });
  }
};

exports.updateBill = [
  upload.single('billImage'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { billNumber, billDate, amount, dealer, branch, paid, removeImage } = req.body;

      if (!billNumber || !billDate || !amount || !dealer || !branch) {
        return res.status(400).json({ message: 'All fields (bill number, bill date, amount, dealer, branch) are required' });
      }

      const parsedBillDate = new Date(billDate);
      if (isNaN(parsedBillDate)) {
        return res.status(400).json({ message: 'Invalid bill date format' });
      }
      if (parsedBillDate > new Date()) {
        return res.status(400).json({ message: 'Bill date cannot be in the future' });
      }

      const bill = await Bill.findById(id);
      if (!bill) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      bill.billNumber = billNumber;
      bill.billDate = parsedBillDate;
      bill.amount = parseFloat(amount);
      bill.dealer = dealer;
      bill.branch = branch;

      if (paid !== undefined) {
        const paidAmount = parseFloat(paid);
        if (paidAmount < 0 || paidAmount > bill.amount) {
          return res.status(400).json({ message: 'Paid amount must be between 0 and the bill amount' });
        }
        bill.paid = paidAmount;
        bill.pending = bill.amount - bill.paid;
        bill.status = bill.pending === 0 ? 'Completed' : 'Pending';
      }

      if (removeImage === 'true') {
        if (bill.billImage && fs.existsSync(bill.billImage)) {
          fs.unlinkSync(bill.billImage);
        }
        bill.billImage = null;
      }

      if (req.file) {
        if (bill.billImage && fs.existsSync(bill.billImage)) {
          fs.unlinkSync(bill.billImage);
        }
        bill.billImage = req.file.path.replace(/\\/g, '/');
      }

      const updatedBill = await bill.save();
      res.json({ message: 'Bill updated successfully', bill: updatedBill });
    } catch (error) {
      console.error('Error updating bill:', error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Bill number must be unique' });
      }
      res.status(500).json({ message: 'Server error while updating bill', error: error.message });
    }
  },
];