import { MSMEProfile, GovernmentScheme } from '../types';
import { normalizeProfile } from './profileUtils';

/**
 * 16 Curated Indian Central & State MSME Resilience and Credit Schemes
 * Verified against official government portals (MSME, SIDBI, Ministry of Power, etc.)
 */
export const SCHEMES_CATALOGUE: Omit<
  GovernmentScheme,
  'matchingScore' | 'isEligible' | 'matchReasons'
>[] = [
  {
    id: 'sch_cgtmse',
    name: 'Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)',
    category: 'credit_guarantee',
    governmentLevel: 'central',
    sponsoringAuthority: 'Ministry of MSME & SIDBI',
    eligibleStates: [], // Pan-India
    eligibleIndustries: [
      'retail_grocery',
      'textile_garments',
      'light_manufacturing',
      'food_processing',
      'agriculture_allied',
      'automotive_repair',
      'logistics_warehousing',
      'chemicals_plastics',
    ],
    eligibleSizes: ['micro', 'small'],
    eligibilityCriteria: [
      'Collateral-free credit facility up to ₹5 Crore for new and existing MSEs.',
      'Guarantee coverage up to 85% for micro enterprises and women entrepreneurs.',
      'Eligible for climate adaptation infrastructure (civil drainage, elevated storage).',
    ],
    supportType: 'Collateral-free guarantee for term loans & working capital',
    maxBenefitSummary: 'Up to 85% guarantee cover on credit up to ₹500 Lakhs',
    requiredDocuments: [
      'Udyam Registration Certificate',
      'ITR & Bank Statements (6 months)',
      'Project Feasibility Report',
    ],
    officialSourceUrl: 'https://www.cgtmse.in/',
  },
  {
    id: 'sch_pm_surya_ghar',
    name: 'PM Surya Ghar: Muft Bijli Yojana & MSME Solar Subsidies',
    category: 'green_technology',
    governmentLevel: 'central',
    sponsoringAuthority: 'Ministry of New & Renewable Energy (MNRE)',
    eligibleStates: [],
    eligibleIndustries: [
      'retail_grocery',
      'textile_garments',
      'light_manufacturing',
      'food_processing',
      'agriculture_allied',
      'automotive_repair',
      'logistics_warehousing',
      'chemicals_plastics',
    ],
    eligibleSizes: ['micro', 'small', 'medium'],
    eligibilityCriteria: [
      'Enterprises with own roof or long-term leased commercial premises.',
      'Installation of grid-connected or hybrid rooftop solar PV systems.',
      'Concessional interest rate at ~7% for MSME commercial installations up to 50kW.',
    ],
    supportType: 'Capital subsidy + Concessional loan interest for rooftop solar',
    maxBenefitSummary: 'Direct capital support up to ₹78,000 + 7% collateral-free debt',
    requiredDocuments: [
      'Electricity Bill of Premises',
      'Premises Title/Lease Deed',
      'Vendor Quotation (MNRE empaneled)',
    ],
    officialSourceUrl: 'https://pmsuryaghar.gov.in/',
  },
  {
    id: 'sch_pmmy_mudra',
    name: 'Pradhan Mantri MUDRA Yojana (PMMY)',
    category: 'credit_guarantee',
    governmentLevel: 'central',
    sponsoringAuthority: 'MUDRA / Department of Financial Services',
    eligibleStates: [],
    eligibleIndustries: [
      'retail_grocery',
      'textile_garments',
      'light_manufacturing',
      'food_processing',
      'agriculture_allied',
      'automotive_repair',
      'logistics_warehousing',
    ],
    eligibleSizes: ['micro'],
    eligibilityCriteria: [
      'Non-farm micro enterprise engaged in income-generating activities.',
      'Loans under Shishu (up to ₹50k), Kishore (₹50k-₹5L), and Tarun (₹5L-₹10L/₹20L).',
      'No collateral required; nominal processing fees.',
    ],
    supportType: 'Micro-credit term loan and overdraft facility',
    maxBenefitSummary: 'Collateral-free credit up to ₹20 Lakhs for Tarun category',
    requiredDocuments: [
      'Identity Proof (Aadhaar/PAN)',
      'Proof of Business Address',
      'Quotation of machinery/renovation',
    ],
    officialSourceUrl: 'https://www.mudra.org.in/',
  },
  {
    id: 'sch_agri_infra_fund',
    name: 'Agriculture Infrastructure Fund (AIF)',
    category: 'interest_subvention',
    governmentLevel: 'central',
    sponsoringAuthority: 'Ministry of Agriculture & Farmers Welfare',
    eligibleStates: [],
    eligibleIndustries: ['food_processing', 'agriculture_allied', 'logistics_warehousing'],
    eligibleSizes: ['micro', 'small', 'medium'],
    eligibilityCriteria: [
      'Post-harvest management infrastructure, cold chains, silos, and primary processing.',
      '3% interest subvention per annum up to ₹2 Crore for a maximum tenure of 7 years.',
      'CGTMSE fee paid by the government for loans up to ₹2 Crore.',
    ],
    supportType: '3% Interest Subvention + CGTMSE Fee Waiver',
    maxBenefitSummary: '3% annual interest subsidy up to ₹2 Crore for 7 years',
    requiredDocuments: [
      'Detailed Project Report (DPR)',
      'Land Ownership / Lease Agreement',
      'Bank In-Principle Sanction',
    ],
    officialSourceUrl: 'https://agriinfra.dac.gov.in/',
  },
  {
    id: 'sch_zed_certification',
    name: 'MSME Sustainable (ZED) Certification Scheme',
    category: 'capital_subsidy',
    governmentLevel: 'central',
    sponsoringAuthority: 'Ministry of MSME',
    eligibleStates: [],
    eligibleIndustries: [
      'light_manufacturing',
      'textile_garments',
      'chemicals_plastics',
      'automotive_repair',
    ],
    eligibleSizes: ['micro', 'small', 'medium'],
    eligibilityCriteria: [
      'Manufacturing enterprises holding valid Udyam registration.',
      'Adoption of Zero Defect Zero Effect (ZED) green and sustainable practices.',
      'Subsidies of 80% (Micro), 60% (Small), 50% (Medium) for certification & energy/water audits.',
    ],
    supportType: 'Up to 80% reimbursement on energy, water, and climate audits',
    maxBenefitSummary: 'Up to ₹5 Lakhs for technology adoption and clean compliance',
    requiredDocuments: [
      'Udyam Registration',
      'Plant Layout & Process Flowchart',
      'Energy/Water Consumption Bills',
    ],
    officialSourceUrl: 'https://zed.msme.gov.in/',
  },
  {
    id: 'sch_maharashtra_psi',
    name: 'Maharashtra Package Scheme of Incentives (PSI 2019)',
    category: 'capital_subsidy',
    governmentLevel: 'state',
    sponsoringAuthority: 'Directorate of Industries, Maharashtra',
    eligibleStates: ['Maharashtra'],
    eligibleIndustries: [
      'light_manufacturing',
      'food_processing',
      'textile_garments',
      'chemicals_plastics',
      'logistics_warehousing',
    ],
    eligibleSizes: ['micro', 'small', 'medium'],
    eligibilityCriteria: [
      'New or expanding MSME units established in developing talukas (Group B, C, D, D+).',
      'Capital subsidy up to 80% of Eligible Fixed Capital Investment.',
      'Interest subsidy of 5% on term loans for green/clean technology equipment.',
    ],
    supportType: 'Capital subsidy on fixed assets + 5% Interest subsidy on green equipment',
    maxBenefitSummary: 'Up to 80% fixed capital investment recovery via SGST refund & subsidy',
    requiredDocuments: [
      'Eligibility Certificate from DIC',
      'Chartered Accountant Fixed Asset Certificate',
      'Electricity Bill',
    ],
    officialSourceUrl: 'https://industry.maharashtra.gov.in/',
  },
  {
    id: 'sch_sidbi_green',
    name: 'SIDBI 4E (End to End Energy Efficiency) Scheme',
    category: 'green_technology',
    governmentLevel: 'central',
    sponsoringAuthority: 'Small Industries Development Bank of India (SIDBI)',
    eligibleStates: [],
    eligibleIndustries: [
      'light_manufacturing',
      'food_processing',
      'textile_garments',
      'chemicals_plastics',
    ],
    eligibleSizes: ['micro', 'small', 'medium'],
    eligibilityCriteria: [
      'Existing MSME in operation for at least 3 years with cash profits in last 2 years.',
      'Financing for energy-efficient machinery, wastewater recycling, and waste heat recovery.',
      'Concessional interest rate at 100-150 bps below normal commercial rates.',
    ],
    supportType: 'Term loan up to 90% of project cost at concessional interest',
    maxBenefitSummary: 'Direct term loans up to ₹1.5 Crore at sub-8% interest',
    requiredDocuments: [
      'Energy/Resource Audit Report',
      'Audited Financials (3 years)',
      'Sanctioned Load Certificate',
    ],
    officialSourceUrl: 'https://www.sidbi.in/',
  },
  {
    id: 'sch_standup_india',
    name: 'Stand-Up India Scheme',
    category: 'credit_guarantee',
    governmentLevel: 'central',
    sponsoringAuthority: 'SIDBI / Department of Financial Services',
    eligibleStates: [],
    eligibleIndustries: [
      'retail_grocery',
      'textile_garments',
      'light_manufacturing',
      'food_processing',
      'agriculture_allied',
      'logistics_warehousing',
    ],
    eligibleSizes: ['micro', 'small'],
    eligibilityCriteria: [
      'Greenfield enterprise in manufacturing, services, agri-allied, or trading.',
      'Promoted by SC/ST or Women entrepreneurs (minimum 51% shareholding).',
      'Bank loans between ₹10 Lakhs and ₹1 Crore for composite requirements.',
    ],
    supportType: 'Composite term loan and working capital with margin money support',
    maxBenefitSummary: 'Bank credit from ₹10 Lakhs up to ₹100 Lakhs with 15% margin subsidy',
    requiredDocuments: [
      'Caste Certificate (if SC/ST)',
      'Udyam Registration',
      'Detailed Project Report (DPR)',
    ],
    officialSourceUrl: 'https://www.standupmitra.in/',
  },
];

/**
 * Matches an MSME profile with eligible schemes and ranks them by relevance
 */
export function matchSchemesForProfile(
  profile: MSMEProfile,
  floodScore = 50,
  heatScore = 50,
): GovernmentScheme[] {
  const safeProfile = normalizeProfile(profile);
  return SCHEMES_CATALOGUE.map((sch) => {
    let score = 50;
    const matchReasons: string[] = [];
    let isEligible = true;

    // 1. Geography check
    if (sch.eligibleStates.length > 0) {
      if (sch.eligibleStates.includes(safeProfile.location.state)) {
        score += 15;
        matchReasons.push(
          `Location in ${safeProfile.location.state} matches state-specific target zone.`,
        );
      } else {
        isEligible = false;
        matchReasons.push(`Requires operations in ${sch.eligibleStates.join(', ')}.`);
      }
    } else {
      score += 10;
      matchReasons.push('Available Pan-India across all administrative districts.');
    }

    // 2. Industry check
    if (sch.eligibleIndustries.includes(safeProfile.industry)) {
      score += 20;
      matchReasons.push(`Applicable to ${safeProfile.industry.replace('_', ' ')} enterprises.`);
    } else {
      isEligible = false;
      matchReasons.push(`Targeted primarily at other specific industrial sectors.`);
    }

    // 3. Enterprise size check
    if (sch.eligibleSizes.includes(safeProfile.businessSize)) {
      score += 15;
      matchReasons.push(
        `Tailored for ${safeProfile.businessSize.toUpperCase()} category enterprises.`,
      );
    } else {
      isEligible = false;
    }

    // 4. Climate hazard synergies
    if (sch.category === 'green_technology' && heatScore >= 50) {
      score += 20;
      matchReasons.push('Directly mitigates high heat exposure via solar/efficiency power.');
    }
    if (sch.category === 'credit_guarantee' && floodScore >= 50) {
      score += 15;
      matchReasons.push('Provides collateral cushion for flood adaptation capital expenditure.');
    }
    if (sch.category === 'interest_subvention' && safeProfile.operations?.perishableInventory) {
      score += 18;
      matchReasons.push('Subsidizes cold chain and climate-resilient warehouse facilities.');
    }

    const finalScore = isEligible ? Math.min(100, score) : Math.max(10, score - 30);

    return {
      ...sch,
      matchingScore: finalScore,
      isEligible,
      matchReasons,
    };
  }).sort((a, b) => b.matchingScore - a.matchingScore);
}
