const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const civicIssueController = require('../controllers/civicIssueController');

const router = express.Router();

// Any authenticated user can create a civic issue
router.post('/', verifyToken, checkRole(), civicIssueController.createCivicIssue);

// List all civic issues (any authenticated user can view)
router.get('/', verifyToken, checkRole(), civicIssueController.listCivicIssues);

// Get single civic issue
router.get('/:id', verifyToken, checkRole(), civicIssueController.getCivicIssueById);

// Update status (admin/coordinator only — enforced in controller)
router.patch('/:id/status', verifyToken, checkRole(), civicIssueController.updateCivicIssueStatus);

// Delete (admin/coordinator only — enforced in controller)
router.delete('/:id', verifyToken, checkRole(), civicIssueController.deleteCivicIssue);

module.exports = router;
