'use strict';

const schemeRepository = require('../repositories/schemeRepository.js');
const { CATALOGUE_DISCLAIMER } = require('../data/schemeCatalogue.js');

/**
 * Scheme matching engine.
 *
 * Climora performs NO live eligibility verification against any government
 * portal. The matcher only evaluates the structural rules that Climora itself
 * stores in the catalogue (state, industry, business stage, business size)
 * against the business profile, and explicitly reports everything it cannot
 * evaluate.
 */

const CHECK_LABELS = {
  state: 'Eligible state / UT',
  industry: 'Eligible industry',
  businessStage: 'Eligible business stage',
  businessSize: 'Eligible business size',
};

const PROFILE_FIELDS = {
  state: 'State / Union Territory of the business',
  industry: 'Industry / sector of the business',
  businessStage: 'Business stage',
  businessSize: 'Business size classification',
};

function profileValue(business, field) {
  const value = business[field];
  if (value === null || value === undefined || value === '') return null;
  return value;
}

/**
 * Evaluates one catalogue list against one profile value.
 * @returns {{status: 'pass'|'fail'|'unknown', reason: string}}
 */
function evaluateList(schemeList, profileField, profileValueForField) {
  if (!Array.isArray(schemeList) || schemeList.length === 0) {
    return {
      status: 'unknown',
      reason:
        CHECK_LABELS[profileField] +
        ' is not restricted in the Climora catalogue for this scheme, so no restriction could be applied.',
    };
  }
  if (profileValueForField === null) {
    return {
      status: 'unknown',
      reason: `${PROFILE_FIELDS[profileField]} was not provided, so ${CHECK_LABELS[profileField].toLowerCase()} could not be checked.`,
    };
  }
  if (schemeList.includes(profileValueForField)) {
    return { status: 'pass', reason: `${PROFILE_FIELDS[profileField]} (${profileValueForField}) is within the scheme's list.` };
  }
  return {
    status: 'fail',
    reason: `${PROFILE_FIELDS[profileField]} (${profileValueForField}) is not in the scheme's list (${schemeList.join(', ')}).`,
  };
}

function matchScheme(scheme, business) {
  const checks = [
    { field: 'state', result: evaluateList(scheme.eligibleStates, 'state', profileValue(business, 'state')) },
    { field: 'industry', result: evaluateList(scheme.industries, 'industry', profileValue(business, 'industry')) },
    {
      field: 'businessStage',
      result: evaluateList(scheme.businessStages, 'businessStage', profileValue(business, 'businessStage')),
    },
    {
      field: 'businessSize',
      result: evaluateList(scheme.businessSizes, 'businessSize', profileValue(business, 'businessSize')),
    },
  ];

  const failed = checks.filter((c) => c.result.status === 'fail');
  const passed = checks.filter((c) => c.result.status === 'pass');
  const unknown = checks.filter((c) => c.result.status === 'unknown');

  const evaluatedCount = passed.length + failed.length;

  let matchStatus;
  let summary;

  if (failed.length > 0) {
    matchStatus = 'ineligible';
    summary = `Climora's structural rules indicate this scheme is not available to this business: ${failed
      .map((c) => c.result.reason)
      .join(' ')}`;
  } else if (evaluatedCount === 0) {
    matchStatus = 'insufficient_information';
    summary =
      'Not enough business information was available to evaluate any of the stored eligibility rules for this scheme.';
  } else {
    matchStatus = 'potentially_eligible';
    summary = `${evaluatedCount} of Climora's stored eligibility rule(s) match this business profile. ` +
      'This is a structural match only — the scheme authority has not verified eligibility.';
  }

  const missingInformation = [];
  if (profileValue(business, 'state') === null) {
    missingInformation.push(PROFILE_FIELDS.state + ' is not recorded on the business profile.');
  }
  if (profileValue(business, 'industry') === null) {
    missingInformation.push(PROFILE_FIELDS.industry + ' is not recorded on the business profile.');
  }
  if (profileValue(business, 'businessStage') === null) {
    missingInformation.push(PROFILE_FIELDS.businessStage + ' is not recorded on the business profile.');
  }
  if (profileValue(business, 'businessSize') === null) {
    missingInformation.push(PROFILE_FIELDS.businessSize + ' is not recorded on the business profile.');
  }
  missingInformation.push(
    'No live eligibility verification exists: final eligibility, subsidy amounts, ceilings, deadlines and the application route must be confirmed on the official source.'
  );

  return {
    scheme,
    matchStatus,
    summary,
    checks: checks.map((c) => ({
      rule: CHECK_LABELS[c.field],
      status: c.result.status,
      reason: c.result.reason,
    })),
    matchedCriteria: passed.map((c) => c.result.reason),
    unverifiedCriteria: [
      ...unknown.map((c) => c.result.reason),
      ...scheme.eligibilityCriteria.map(
        (criterion) =>
          `Not verifiable by Climora: ${criterion}. This must be confirmed with the scheme authority or the lending institution.`
      ),
    ],
    missingInformation,
    documentsToPrepare: scheme.requiredDocuments,
    verificationStatus: scheme.verificationStatus,
    lastVerifiedDate: scheme.lastVerifiedDate,
  };
}

function matchBusiness(business, filters = {}) {
  const { rows } = schemeRepository.list({
    category: filters.category,
    governmentLevel: filters.governmentLevel,
    supportType: filters.supportType,
    verificationStatus: filters.verificationStatus,
    limit: 500,
    offset: 0,
  });

  const results = rows.map((scheme) => matchScheme(scheme, business));

  const order = { potentially_eligible: 0, insufficient_information: 1, ineligible: 2 };
  results.sort((a, b) => order[a.matchStatus] - order[b.matchStatus]);

  const saved = new Set(
    schemeRepository
      .listSavedForOwner(business.ownerId || 'local')
      .map((s) => s.id)
  );
  for (const result of results) result.saved = saved.has(result.scheme.id);

  return {
    results,
    counts: {
      total: results.length,
      potentiallyEligible: results.filter((r) => r.matchStatus === 'potentially_eligible').length,
      insufficientInformation: results.filter((r) => r.matchStatus === 'insufficient_information').length,
      ineligible: results.filter((r) => r.matchStatus === 'ineligible').length,
    },
    disclaimer: CATALOGUE_DISCLAIMER,
  };
}

module.exports = { matchScheme, matchBusiness, CATALOGUE_DISCLAIMER };
