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

// Assign coordinator (admin only)
router.patch('/:id/assign', verifyToken, checkRole(), civicIssueController.assignCoordinator);

// Coordinator marks issue complete with proof
router.patch('/:id/complete', verifyToken, checkRole(), civicIssueController.completeIssue);

// Admin approves resolution
router.patch('/:id/approve', verifyToken, checkRole(), civicIssueController.approveIssue);

// User submits feedback/rating
router.patch('/:id/feedback', verifyToken, checkRole(), civicIssueController.submitFeedback);

// Delete (admin/coordinator only — enforced in controller)
router.delete('/:id', verifyToken, checkRole(), civicIssueController.deleteCivicIssue);

module.exports = router;
