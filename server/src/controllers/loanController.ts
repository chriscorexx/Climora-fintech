import { Response } from 'express';
import { getDatabase } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';

export async function createLoanApplication(req: AuthenticatedRequest, res: Response) {
  try {
    const { businessId, loanAmount, tenureMonths, purpose } = req.body;

    if (!businessId || !loanAmount || !tenureMonths || !purpose) {
      return res.status(400).json({ success: false, error: { message: 'All fields are required' } });
    }

    const db = getDatabase();
    const applicationId = `loan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO loan_applications (id, business_id, applicant_user_id, loan_amount, tenure_months, purpose, status, timeline_json, notes_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?, '[]', ?, ?)`,
    ).run(
      applicationId,
      businessId,
      req.user?.userId || null,
      loanAmount,
      tenureMonths,
      purpose,
      JSON.stringify([{ status: 'submitted', timestamp: now, note: 'Application submitted' }]),
      now,
      now,
    );

    res.status(201).json({
      success: true,
      data: {
        application: {
          id: applicationId,
          businessId,
          loanAmount,
          tenureMonths,
          purpose,
          status: 'submitted',
          createdAt: now,
        },
      },
    });
  } catch (error: any) {
    console.error('Create loan application error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to create loan application' } });
  }
}

export async function listLoanApplications(req: AuthenticatedRequest, res: Response) {
  try {
    const db = getDatabase();
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT la.*, b.name as business_name, b.city, b.state, u.name as applicant_name
      FROM loan_applications la
      LEFT JOIN businesses b ON b.id = la.business_id
      LEFT JOIN users u ON u.id = la.applicant_user_id
    `;
    const params: any[] = [];

    if (req.user?.role === 'msme_owner') {
      query += ' WHERE la.applicant_user_id = ?';
      params.push(req.user.userId);
    }

    query += ' ORDER BY la.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const applications = db.prepare(query).all(...params);

    res.json({ success: true, data: { applications, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    console.error('List loan applications error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to list loan applications' } });
  }
}

export async function getLoanApplication(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const application: any = db
      .prepare(
        `SELECT la.*, b.name as business_name, b.city, b.state, b.industry, u.name as applicant_name
         FROM loan_applications la
         LEFT JOIN businesses b ON b.id = la.business_id
         LEFT JOIN users u ON u.id = la.applicant_user_id
         WHERE la.id = ?`,
      )
      .get(id);

    if (!application) {
      return res.status(404).json({ success: false, error: { message: 'Loan application not found' } });
    }

    if (req.user?.role === 'msme_owner' && application.applicant_user_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: { message: 'Access denied' } });
    }

    const documents = db.prepare('SELECT * FROM loan_application_docs WHERE application_id = ?').all(id);

    res.json({
      success: true,
      data: {
        application: {
          ...application,
          timeline: application.timeline_json ? JSON.parse(application.timeline_json) : [],
          notes: application.notes_json ? JSON.parse(application.notes_json) : [],
          documents,
        },
      },
    });
  } catch (error: any) {
    console.error('Get loan application error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get loan application' } });
  }
}

export async function updateLoanApplicationStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['under_review', 'approved', 'rejected', 'revision_requested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid status' } });
    }

    const db = getDatabase();
    const application: any = db.prepare('SELECT * FROM loan_applications WHERE id = ?').get(id);

    if (!application) {
      return res.status(404).json({ success: false, error: { message: 'Loan application not found' } });
    }

    const now = new Date().toISOString();
    const timeline = application.timeline_json ? JSON.parse(application.timeline_json) : [];
    timeline.push({ status, timestamp: now, note: note || '', updatedBy: req.user?.userId });

    db.prepare('UPDATE loan_applications SET status = ?, assigned_lender_id = COALESCE(assigned_lender_id, ?), timeline_json = ?, updated_at = ? WHERE id = ?').run(
      status,
      req.user?.userId,
      JSON.stringify(timeline),
      now,
      id,
    );

    res.json({ success: true, data: { message: 'Status updated successfully', status } });
  } catch (error: any) {
    console.error('Update loan status error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update status' } });
  }
}

export async function addLoanDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { docType, fileName, fileUrl } = req.body;

    if (!docType || !fileName || !fileUrl) {
      return res.status(400).json({ success: false, error: { message: 'Document details required' } });
    }

    const db = getDatabase();
    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO loan_application_docs (id, application_id, doc_type, file_name, file_url, uploaded_by, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(docId, id, docType, fileName, fileUrl, req.user?.userId || null, now);

    res.status(201).json({ success: true, data: { documentId: docId } });
  } catch (error: any) {
    console.error('Add loan document error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to add document' } });
  }
}
