import { Router } from 'express';
import { authenticateToken, requireRole, auditLog } from '../middleware/auth';
import {
  createLoanApplication,
  listLoanApplications,
  getLoanApplication,
  updateLoanApplicationStatus,
  addLoanDocument,
} from '../controllers/loanController';

export const loanRouter = Router();

loanRouter.post('/', authenticateToken, createLoanApplication);
loanRouter.get('/', authenticateToken, listLoanApplications);
loanRouter.get('/:id', authenticateToken, getLoanApplication);
loanRouter.patch('/:id/status', authenticateToken, requireRole('lender', 'admin'), auditLog('loan_status_update', 'loan_application'), updateLoanApplicationStatus);
loanRouter.post('/:id/documents', authenticateToken, addLoanDocument);
