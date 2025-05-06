const express = require('express');
const router = express.Router();
const closingEntryController = require('../controllers/closingEntryController');

// Create a new closing entry
router.post('/', closingEntryController.createClosingEntry);

// Update an existing closing entry
router.put('/:id', closingEntryController.updateClosingEntry);

// Get all closing entries
router.get('/', closingEntryController.getClosingEntries);

module.exports = router;