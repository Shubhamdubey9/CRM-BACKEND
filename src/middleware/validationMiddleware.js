import { body, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

const validateLogin = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const validateOpportunity = [
  body('customerName').trim().notEmpty().withMessage('Customer/company name is required'),
  body('requirement').trim().notEmpty().withMessage('Requirement summary is required'),
  body('estimatedValue').optional().isFloat({ min: 0 }).withMessage('Deal value must be non-negative'),
  body('stage')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'])
    .withMessage('Invalid stage value'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Invalid priority value'),
  body('contactEmail').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid contact email'),
  body('nextFollowUpDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date format'),
  handleValidationErrors,
];

export { validateRegister, validateLogin, validateOpportunity };
