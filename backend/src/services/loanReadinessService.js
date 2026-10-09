'use strict';

const loanReadinessRepository = require('../repositories/loanReadinessRepository.js');
const improvementRepository = require('../repositories/improvementRepository.js');
const assessmentService = require('./assessmentService.js');
const { createId, nowIso } = require('../middleware/asyncHandler.js');

/**
 * Loan readiness module.
 *
 * Climora-generated actions are clearly separated from lender-confirmed
 * information. The engine never guarantees approval and never rejects a
 * business solely on the basis of the climate-risk score.
 */

const DEFAULT_DOCUMENTS = [
  'Udyam Registration Certificate',
  'PAN of the business and of the proprietor/partners/directors',
  'GST registration certificate',
  'Audited financial statements for the last two years',
  'Bank statements for the last six months',
  'Income Tax Return acknowledgement for the last two years',
  'Proof of business premises (ownership deed or rent agreement)',
  'Project report or quotation for the proposed expenditure',
  'Current loan account statements for existing facilities',
  'Climate-risk assessment summary from Climora',
];

const STATUSES = ['not_applied', 'preparing', 'applied', 'under_review', 'approved', 'rejected', 'disbursed'];
const DOC_STATUSES = ['missing', 'in_progress', 'ready'];

function isLenderProvided(field) {
  return ['applicationStatus', 'lenderName', 'rejectionReason', 'lenderFeedback'].includes(field);
}

/**
 * Derives a readiness score from the document checklist and completeness of the
 * business profile. It is a completeness indicator, not a credit decision.
 */
function computeDocumentCompletion(checklist) {
  if (!checklist || checklist.length === 0) return null;
  const required = checklist.filter((item) => item.required);
  const base = required.length > 0 ? required : checklist;
  const ready = base.filter((item) => item.status === 'ready').length;
  return Math.round((ready / base.length) * 100);
}

function deriveMissingProfileFields(business) {
  const missing = [];
  if (business.annualTurnover === null || business.annualTurnover === undefined) missing.push('Annual turnover');
  if (business.annualExpenses === null || business.annualExpenses === undefined) missing.push('Annual expenses');
  if (!business.state) missing.push('State / Union Territory');
  if (!business.industry) missing.push('Industry / sector');
  if (!business.businessSize) missing.push('Business size classification');
  if (!business.businessStage) missing.push('Business stage');
  if (business.employeeCount === null || business.employeeCount === undefined) missing.push('Employee count');
  if (business.monthlyOperatingCost === null || business.monthlyOperatingCost === undefined) {
    missing.push('Monthly operating cost');
  }
  return missing;
}

/**
 * Builds the loan-readiness view for a business, creating the record and a
 * default checklist the first time it is requested.
 */
function getReadiness(business) {
  let record = loanReadinessRepository.findByBusinessId(business.id);

  if (!record) {
    const id = createId('loan');
    loanReadinessRepository.upsert({
      id,
      businessId: business.id,
      ownerId: business.ownerId,
      applicationStatus: 'not_applied',
      requestedAmount: business.fundingRequired || null,
      lenderName: null,
      rejectionReason: null,
      lenderFeedback: null,
      lenderConfirmed: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    record = loanReadinessRepository.findByBusinessId(business.id);
  }

  if (!record.documentChecklist || record.documentChecklist.length === 0) {
    loanReadinessRepository.replaceChecklist(
      record.id,
      DEFAULT_DOCUMENTS.map((documentName) => ({
        documentName,
        required: true,
        status: documentName === 'Climate-risk assessment summary from Climora' ? 'in_progress' : 'missing',
      }))
    );
    record = loanReadinessRepository.findByBusinessId(business.id);
  }

  const latestAssessment = assessmentService.latestForBusiness(business.id);
  const actions = improvementRepository.listByBusiness(business.id);
  const openActions = actions.filter((a) => a.status === 'open');

  const documentCompletion = computeDocumentCompletion(record.documentChecklist);
  const missingProfileFields = deriveMissingProfileFields(business);

  const climoraSuggestions = [];
  if (missingProfileFields.length > 0) {
    climoraSuggestions.push({
      title: 'Complete the business profile',
      description: `Missing profile information: ${missingProfileFields.join(', ')}. Lenders commonly require these fields in the loan application.`,
      priority: 'High',
    });
  }
  if (business.hasBackupSupplier === false) {
    climoraSuggestions.push({
      title: 'Document a backup supplier arrangement',
      description:
        'Climora-generated suggestion (not lender-confirmed): evidencing an alternate supplier strengthens a business-continuity narrative.',
      priority: 'Medium',
    });
  }
  if (business.hasEmergencyReserve === false) {
    climoraSuggestions.push({
      title: 'Open and fund an emergency reserve',
      description:
        'Climora-generated suggestion (not lender-confirmed): even a small operating reserve demonstrates an ability to absorb disruptions.',
      priority: 'High',
    });
  }
  if (!latestAssessment) {
    climoraSuggestions.push({
      title: 'Run a climate-risk assessment',
      description:
        'Climora-generated suggestion: an assessment summary can be attached to support a climate-resilience narrative with the lender.',
      priority: 'Medium',
    });
  }
  if (latestAssessment && latestAssessment.isIncomplete) {
    climoraSuggestions.push({
      title: 'Complete the missing assessment inputs',
      description: `Climora-generated suggestion: the latest assessment is incomplete (missing ${latestAssessment.missingDimensions.join(', ')}). A complete assessment is more usable in a lender discussion.`,
      priority: 'Medium',
    });
  }
  if (record.rejectionReason) {
    climoraSuggestions.push({
      title: 'Address the recorded rejection reason',
      description: `Lender-provided rejection reason recorded: "${record.rejectionReason}". Confirm with the lender what evidence would address it.`,
      priority: 'High',
    });
  }

  const resilienceGaps = openActions.map((action) => ({
    title: action.title,
    description: action.description,
    priority: action.priority,
    source: action.source,
    status: action.status,
  }));

  return {
    businessId: business.id,
    applicationStatus: record.applicationStatus,
    requestedAmount: record.requestedAmount,
    lenderName: record.lenderName,
    rejectionReason: record.rejectionReason,
    lenderFeedback: record.lenderFeedback,
    lenderConfirmed: Boolean(record.lenderConfirmed),
    documentChecklist: record.documentChecklist,
    documentCompletionPct: documentCompletion,
    missingProfileFields,
    latestAssessment: latestAssessment
      ? {
          id: latestAssessment.id,
          overallScore: latestAssessment.overallScore,
          category: latestAssessment.category,
          createdAt: latestAssessment.createdAt,
          isIncomplete: latestAssessment.isIncomplete,
        }
      : null,
    openImprovementActions: resilienceGaps,
    climoraSuggestions,
    disclaimer:
      'Document completion and profile completeness indicators are produced by Climora from user-entered data. ' +
      'They are not a credit decision. Climora does not guarantee loan approval and does not reject a business on the ' +
      'basis of the climate-risk score. Anything shown as lender-confirmed was entered by the user or supplied by the lender.',
  };
}

function updateReadiness(business, payload, ownerId) {
  const allowed = ['applicationStatus', 'requestedAmount', 'lenderName', 'rejectionReason', 'lenderFeedback'];
  const patch = {};
  for (const key of allowed) {
    if (payload[key] !== undefined) patch[key] = payload[key];
  }

  let record = loanReadinessRepository.findByBusinessId(business.id);
  if (!record) {
    // Ensure the record (and its default checklist) exists before patching.
    getReadiness(business);
    record = loanReadinessRepository.findByBusinessId(business.id);
  }

  if (patch.applicationStatus !== undefined && !STATUSES.includes(patch.applicationStatus)) {
    const error = new Error(`applicationStatus must be one of: ${STATUSES.join(', ')}`);
    error.status = 400;
    error.details = [error.message];
    throw error;
  }

  loanReadinessRepository.upsert({
    id: record.id,
    businessId: business.id,
    ownerId,
    applicationStatus: patch.applicationStatus !== undefined ? patch.applicationStatus : record.applicationStatus,
    requestedAmount: patch.requestedAmount !== undefined ? patch.requestedAmount : record.requestedAmount,
    lenderName: patch.lenderName !== undefined ? patch.lenderName : record.lenderName,
    rejectionReason: patch.rejectionReason !== undefined ? patch.rejectionReason : record.rejectionReason,
    lenderFeedback: patch.lenderFeedback !== undefined ? patch.lenderFeedback : record.lenderFeedback,
    // Fields describing lender outcomes are treated as lender-provided.
    lenderConfirmed:
      patch.rejectionReason !== undefined || patch.lenderFeedback !== undefined || patch.lenderName !== undefined
        ? 1
        : record.lenderConfirmed,
    createdAt: record.createdAt,
    updatedAt: nowIso(),
  });

  return getReadiness(business);
}

function updateChecklistItem(business, documentName, status) {
  if (!DOC_STATUSES.includes(status)) {
    const error = new Error(`status must be one of: ${DOC_STATUSES.join(', ')}`);
    error.status = 400;
    error.details = [error.message];
    throw error;
  }
  let record = loanReadinessRepository.findByBusinessId(business.id);
  if (!record) {
    getReadiness(business);
    record = loanReadinessRepository.findByBusinessId(business.id);
  }
  const existing = record.documentChecklist.find((i) => i.documentName === documentName);
  if (!existing) {
    const error = new Error(`Document "${documentName}" is not in the checklist for this business.`);
    error.status = 404;
    throw error;
  }
  const updated = record.documentChecklist.map((item) =>
    item.documentName === documentName ? { documentName, required: item.required, status } : item
  );
  loanReadinessRepository.replaceChecklist(record.id, updated);
  return getReadiness(business);
}

module.exports = {
  getReadiness,
  updateReadiness,
  updateChecklistItem,
  DEFAULT_DOCUMENTS,
  STATUSES,
  DOC_STATUSES,
  isLenderProvided,
};
