import React from 'react';
import { MSMEProfile, RiskAssessment } from '../../types';
import { normalizeProfile } from '../../core/profileUtils';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';
import climoraLogo from '../../assets/Climora-logo.jpg';

interface CreditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MSMEProfile;
  assessment: RiskAssessment;
}

export const CreditReportModal: React.FC<CreditReportModalProps> = ({
  isOpen,
  onClose,
  profile,
  assessment,
}) => {
  if (!isOpen) return null;

  const safeProfile = normalizeProfile(profile);

  const handlePrint = () => {
    window.print();
  };

  const dscr =
    (safeProfile.financials.monthlyRevenue - safeProfile.financials.monthlyOperatingExpenses) /
    (safeProfile.financials.existingMonthlyDebtObligations || 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm print-scrim animate-fade-in">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-fin-card border border-fin-border shadow-2xl p-8 print-surface print:p-6 print:max-h-none print:w-full animate-scale-in">
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print flex items-center justify-between pb-6 border-b border-fin-border mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-fin-text text-sm">
              Institutional Credit Underwriting Memo
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-fin-muted hover:text-fin-text hover:bg-fin-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Formal Printable Document Content */}
        <div className="space-y-6 text-xs text-fin-secondary print-strong-text leading-relaxed">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-fin-border pb-5 print-muted-text">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-fin-sunken border border-fin-border overflow-hidden flex-shrink-0 shadow-sm">
                <img src={climoraLogo} alt="Climora Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-xl font-extrabold tracking-tight text-fin-text print-strong-text font-sans">
                  CLIMORA CREDIT & CLIMATE UNDERWRITING MEMO
                </div>
                <div className="text-[11px] font-mono text-fin-muted print-muted-text mt-1">
                  FUSION 2026 Hackathon (IFC FIN-05 Framework) • Commercial SME Lending
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[11px] text-fin-muted print-muted-text">
                Memo Ref: CLM-{safeProfile.id.toUpperCase()}-2026
              </div>
              <div className="font-mono text-[11px] text-fin-muted print-muted-text">
                Date: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Section 1: Enterprise Profile Summary */}
          <div>
            <h3 className="font-bold uppercase tracking-wider text-fin-muted print-muted-text text-[11px] mb-2 font-mono">
              1. Enterprise Borrower Identification
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-fin-inset/60 print-muted-surface border border-fin-border">
              <div>
                <span className="text-[10px] text-fin-muted print-muted-text block uppercase">
                  Borrower Name
                </span>
                <span className="font-bold text-fin-text print-strong-text">
                  {safeProfile.name}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-fin-muted print-muted-text block uppercase">
                  Industry Sector
                </span>
                <span className="capitalize">{safeProfile.industry.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-[10px] text-fin-muted print-muted-text block uppercase">
                  Registration / Udyam
                </span>
                <span className="font-mono">
                  {safeProfile.udyamNumber || safeProfile.registrationNumber || 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-fin-muted print-muted-text block uppercase">
                  Location & District
                </span>
                <span>
                  {safeProfile.location.city}, {safeProfile.location.state}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Financial Underwriting Metrics */}
          <div className="print-page">
            <h3 className="font-bold uppercase tracking-wider text-fin-muted print-muted-text text-[11px] mb-2 font-mono">
              2. Baseline Financial Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-fin-inset/60 print-muted-surface border border-fin-border font-mono tabular-nums">
              <div>
                <span className="text-[10px] text-fin-muted print-muted-text block uppercase">
                  Monthly Revenue
                </span>
                <span className="font-bold text-fin-text print-strong-text">
                  ₹{(safeProfile.financials.monthlyRevenue / 100000).toFixed(2)} Lakhs
                </span>
              </div>
              <div>
                <span className="text-[10px] text-fin-muted print-muted-text block uppercase">
                  Operating Expenses
                </span>
                <span>
                  ₹{(safeProfile.financials.monthlyOperatingExpenses / 100000).toFixed(2)} Lakhs
                </span>
              </div>
              <div>
                <span className="text-[10px] text-fin-muted print-muted-text block uppercase">
                  Baseline DSCR
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 print-strong-text">
                  {dscr.toFixed(2)}x
                </span>
              </div>
              <div>
                <span className="text-[10px] text-fin-muted print-muted-text block uppercase">
                  Requested Facility
                </span>
                <span className="font-bold text-fin-text print-strong-text">
                  ₹{((safeProfile.financials.requestedLoanAmount || 2500000) / 100000).toFixed(2)}{' '}
                  Lakhs
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: 5-Dimension Climate Risk Breakdown */}
          <div className="print-page">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold uppercase tracking-wider text-fin-muted print-muted-text text-[11px] font-mono">
                3. Physical Climate Risk Assessment (Open-Meteo & World Bank Baseline)
              </h3>
              <RiskBadge
                category={assessment.riskCategory}
                score={assessment.overallScore}
                size="sm"
              />
            </div>

            <table className="w-full text-left border border-fin-border print-surface rounded-lg overflow-hidden">
              <thead className="bg-fin-inset print-muted-surface text-[10px] font-mono uppercase text-fin-muted print-muted-text">
                <tr>
                  <th className="p-2.5">Dimension</th>
                  <th className="p-2.5 text-center">Score (0-100)</th>
                  <th className="p-2.5 text-center">Weight</th>
                  <th className="p-2.5">Primary Driver & Data Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fin-border print-divider text-xs">
                <tr>
                  <td className="p-2.5 font-semibold">Flood Exposure</td>
                  <td className="p-2.5 text-center font-mono font-bold">
                    {assessment.dimensionScores.floodExposure.score}
                  </td>
                  <td className="p-2.5 text-center font-mono">
                    {(assessment.dimensionScores.floodExposure.effectiveWeight * 100).toFixed(0)}%
                  </td>
                  <td className="p-2.5 text-fin-muted print-muted-text">
                    {assessment.dimensionScores.floodExposure.contributingFactors[0]}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Heavy Rainfall</td>
                  <td className="p-2.5 text-center font-mono font-bold">
                    {assessment.dimensionScores.heavyRainfall.score}
                  </td>
                  <td className="p-2.5 text-center font-mono">
                    {(assessment.dimensionScores.heavyRainfall.effectiveWeight * 100).toFixed(0)}%
                  </td>
                  <td className="p-2.5 text-fin-muted print-muted-text">
                    {assessment.dimensionScores.heavyRainfall.contributingFactors[0]}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Extreme Heat</td>
                  <td className="p-2.5 text-center font-mono font-bold">
                    {assessment.dimensionScores.extremeHeat.score}
                  </td>
                  <td className="p-2.5 text-center font-mono">
                    {(assessment.dimensionScores.extremeHeat.effectiveWeight * 100).toFixed(0)}%
                  </td>
                  <td className="p-2.5 text-fin-muted print-muted-text">
                    {assessment.dimensionScores.extremeHeat.contributingFactors[0]}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Business Vulnerability</td>
                  <td className="p-2.5 text-center font-mono font-bold">
                    {assessment.dimensionScores.businessVulnerability.score}
                  </td>
                  <td className="p-2.5 text-center font-mono">
                    {(
                      assessment.dimensionScores.businessVulnerability.effectiveWeight * 100
                    ).toFixed(0)}
                    %
                  </td>
                  <td className="p-2.5 text-fin-muted print-muted-text">
                    {assessment.dimensionScores.businessVulnerability.contributingFactors[0]}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Financial Resilience</td>
                  <td className="p-2.5 text-center font-mono font-bold">
                    {assessment.dimensionScores.financialResilience.score}
                  </td>
                  <td className="p-2.5 text-center font-mono">
                    {(assessment.dimensionScores.financialResilience.effectiveWeight * 100).toFixed(
                      0,
                    )}
                    %
                  </td>
                  <td className="p-2.5 text-fin-muted print-muted-text">
                    {assessment.dimensionScores.financialResilience.contributingFactors[0]}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 4: Underwriting Decision & Covenants */}
          <div className="print-page">
            <h3 className="font-bold uppercase tracking-wider text-fin-muted print-muted-text text-[11px] mb-2 font-mono">
              4. Credit Committee Recommendation & Covenants
            </h3>
            <div className="p-4 rounded-xl bg-fin-inset/60 print-muted-surface border border-fin-border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-fin-secondary print-strong-text">
                  Underwriting Recommendation:
                </span>
                <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400 print-strong-text">
                  {assessment.loanDecisionSupport.recommendedAction.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-fin-secondary print-strong-text">
                  Suggested Interest Adjustment:
                </span>
                <span className="font-mono font-bold">
                  {assessment.loanDecisionSupport.suggestedInterestAdjustmentBps > 0
                    ? `+${assessment.loanDecisionSupport.suggestedInterestAdjustmentBps} bps Climate Risk Premium`
                    : `${assessment.loanDecisionSupport.suggestedInterestAdjustmentBps} bps Green Concession`}
                </span>
              </div>
              <div className="pt-2">
                <span className="font-semibold text-fin-secondary print-strong-text block mb-1">
                  Binding Climate Covenants:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-fin-muted print-muted-text">
                  {assessment.loanDecisionSupport.suggestedClimateCovenants.map((cov, i) => (
                    <li key={i}>{cov}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 5: Signatures for Underwriting Committee */}
          <div className="pt-8 border-t border-fin-border grid grid-cols-2 gap-8 text-[11px]">
            <div>
              <div className="h-10 border-b border-dashed border-fin-border"></div>
              <span className="text-fin-muted print-muted-text block mt-1 font-mono">
                Senior Credit Risk Underwriter
              </span>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-fin-border"></div>
              <span className="text-fin-muted print-muted-text block mt-1 font-mono">
                Branch Head / Approving Authority
              </span>
            </div>
          </div>

          {/* Regulatory Disclaimer */}
          <div className="text-[10px] text-fin-muted print-muted-text border-t border-fin-border pt-3">
            Disclaimer: This document is an illustrative decision-support assessment produced by the
            Climora platform for IFC FIN-05. Scores represent heuristic indicators derived from
            Open-Meteo forecasts and baseline flood exposures and do not replace statutory
            due-diligence.
          </div>
        </div>
      </div>
    </div>
  );
};
