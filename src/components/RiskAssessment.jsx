import React, { useState, useEffect } from 'react';
import { demoBusinesses, riskWeights, businessSectors } from '../data/demoData.js';
import { calculateRiskScore, getMissingDataStrategy } from '../data/riskEngine.js';
import { Badge, Button, Card } from './ui.jsx';
import { DataBadge } from './DataBadge.jsx';

const dimensionLabels = {
  flood: 'Flood Exposure',
  rainfall: 'Heavy Rainfall',
  heat: 'Extreme Heat',
  business: 'Business Vulnerability',
  financial: 'Financial Resilience',
};

const dimensionDescriptions = {
  flood: 'Simulated river discharge and flood-exposure context for this location.',
  rainfall: 'Sample forecast rainfall indicators for heavy precipitation events.',
  heat: 'Sample forecast temperature indicators for extreme heat events.',
  business: 'Industry-specific vulnerability based on operational dependencies and sector exposure.',
  financial: 'Derived from provided revenue and expense ratios. Optional.',
};

function getCategory(score) {
  if (score <= 24) return { label: 'Low', variant: 'low', color: 'var(--color-low)' };
  if (score <= 49) return { label: 'Moderate', variant: 'moderate', color: 'var(--color-moderate)' };
  if (score <= 74) return { label: 'High', variant: 'high', color: 'var(--color-high)' };
  return { label: 'Very High', variant: 'veryHigh', color: 'var(--color-very-high)' };
}

function getScoreColor(score) {
  if (score <= 24) return 'var(--color-low)';
  if (score <= 49) return 'var(--color-moderate)';
  if (score <= 74) return 'var(--color-high)';
  return 'var(--color-very-high)';
}

function RiskMeter({ label, score, weight, description, dataAvailability, isMissing }) {
  if (isMissing) {
    return (
      <div className="card" style={{ marginBottom: '1rem', opacity: '0.6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h4 style={{ margin: 0, color: 'var(--color-text-tertiary)' }}>{label}</h4>
          <Badge variant="default">Missing</Badge>
        </div>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
          Data not available for this dimension.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div>
          <h4 style={{ margin: 0 }}>{label}</h4>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Weight: {Math.round(weight * 100)}%
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: getScoreColor(score) }}>
            {score}/100
          </span>
          <br />
          <DataBadge type={dataAvailability} />
        </div>
      </div>

      <div className="progress-bar" style={{ height: '8px', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
        <div
          className="progress-bar-fill"
          style={{
            width: score + '%',
            backgroundColor: getScoreColor(score),
          }}
        />
      </div>

      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
        {description}
      </p>
    </div>
  );
}

function RecommendationItem({ title, description, priority }) {
  return (
    <div style={{ padding: '0.75rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <h5 style={{ margin: 0 }}>{title}</h5>
        <Badge variant={priority === 'High' ? 'veryHigh' : priority === 'Medium' ? 'moderate' : 'low'}>{priority}</Badge>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>{description}</p>
    </div>
  );
}

export default function RiskAssessment({ businessId, onBack }) {
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [recalculatedScore, setRecalculatedScore] = useState(null);

  useEffect(() => {
    const business = demoBusinesses.find((b) => b.id === businessId);
    setSelectedBusiness(business || demoBusinesses[0]);
  }, [businessId]);

  const handleRecalculate = () => {
    if (!selectedBusiness) return;
    const score = calculateRiskScore(selectedBusiness.assessment.dimensions);
    setRecalculatedScore(score);
  };

  if (!selectedBusiness) {
    return <div>Loading...</div>;
  }

  const b = selectedBusiness;
  const cat = getCategory(b.assessment.overallScore);
  const dimensions = b.assessment.dimensions;
  const dataAvailability = b.assessment.dataAvailability;
  const missingDims = b.assessment.missingDimensions || [];

  const recommendations = [];
  if (dimensions.flood > 60) {
    recommendations.push({ title: 'Flood Preparedness Plan', description: 'Document flood-response procedures, identify evacuation routes, and secure critical equipment. Review insurance coverage for flood damage.', priority: 'High' });
  }
  if (dimensions.rainfall > 50) {
    recommendations.push({ title: 'Rainfall Impact Assessment', description: 'Evaluate drainage around premises, protect inventory from water ingress, and identify backup suppliers for delivery-dependent operations.', priority: 'High' });
  }
  if (dimensions.heat > 50) {
    recommendations.push({ title: 'Heat Stress Management', description: 'Provide cooling measures for workers, check HVAC capacity, and schedule heat-sensitive operations during cooler hours.', priority: 'Medium' });
  }
  if (dimensions.business > 15) {
    recommendations.push({ title: 'Sector-Specific Resilience', description: 'Review industry-specific climate vulnerabilities and contingency plans for your sector: ' + (businessSectors[b.sector]?.label || b.sector) + '.', priority: 'Medium' });
  }
  if (dimensions.financial > 30) {
    recommendations.push({ title: 'Financial Resilience', description: 'Build an emergency fund covering 3-6 months of operating expenses. Review debt obligations and consider refinancing options.', priority: 'High' });
  }
  recommendations.push({ title: 'Business Continuity Plan', description: 'Create a plan covering temporary closure, supply chain disruption, and remote operations where feasible.', priority: 'Low' });

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={onBack} style={{ marginBottom: '1rem' }}>
        Back to Overview
      </Button>

      {/* Business Profile Card */}
      <Card style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0' }}>{b.name}</h3>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.85rem' }}>
            {businessSectors[b.sector]?.label || b.sector} | {b.location}
          </p>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {b.employeeCount} employees | ${b.revenue?.toLocaleString()} annual revenue
          </p>
        </div>
        <Badge variant="demo">Demo Assessment</Badge>
      </Card>

      {/* Score Summary */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', justifyContent: 'space-around', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              className="score-circle"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `conic-gradient(
                  from 0deg,
                  ${getScoreColor(b.assessment.overallScore)} 0deg,
                  ${getScoreColor(b.assessment.overallScore)} ${(b.assessment.overallScore / 100) * 360}deg,
                  var(--color-bg-tertiary) ${(b.assessment.overallScore / 100) * 360}deg,
                  var(--color-bg-tertiary) 360deg
                )`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: '0',
              }}
            >
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: 'var(--color-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                border: '2px solid var(--color-border)',
              }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: getScoreColor(b.assessment.overallScore) }}>
                  {b.assessment.overallScore}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                  Overall Risk
                </span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Badge variant={cat.variant} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              {cat.label} Risk
            </Badge>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Last assessed: {b.assessment.lastAssessed}
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-primary" style={{ marginBottom: '0.5rem' }} onClick={handleRecalculate}>
              Recalculate with Risk Engine
            </button>
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
              Verifies documented weights (30/25/20/15/10)
            </p>
          </div>
        </div>

        {recalculatedScore && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Risk engine result: {recalculatedScore.overallScore}/100 - {recalculatedScore.category}
              {recalculatedScore.isIncomplete && (
                <span style={{ color: 'var(--color-warning)', marginLeft: '0.5rem' }}>
                  [Incomplete: missing {recalculatedScore.missingDimensions.join(', ')}]
                </span>
              )}
            </p>
          </div>
        )}
      </Card>

      {/* Factor Breakdown */}
      <h3 style={{ margin: '0 0 1rem 0' }}>Risk Factor Breakdown</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <RiskMeter
          label="Flood Exposure"
          score={dimensions.flood}
          weight={riskWeights.flood}
          description={dimensionDescriptions.flood}
          dataAvailability={dataAvailability.flood || 'simulated'}
          isMissing={missingDims.includes('flood')}
        />
        <RiskMeter
          label="Heavy Rainfall"
          score={dimensions.rainfall}
          weight={riskWeights.rainfall}
          description={dimensionDescriptions.rainfall}
          dataAvailability={dataAvailability.rainfall || 'simulated'}
          isMissing={missingDims.includes('rainfall')}
        />
        <RiskMeter
          label="Extreme Heat"
          score={dimensions.heat}
          weight={riskWeights.heat}
          description={dimensionDescriptions.heat}
          dataAvailability={dataAvailability.heat || 'simulated'}
          isMissing={missingDims.includes('heat')}
        />
        <RiskMeter
          label="Business Vulnerability"
          score={dimensions.business}
          weight={riskWeights.business}
          description={dimensionDescriptions.business}
          dataAvailability="simulated"
          isMissing={missingDims.includes('business')}
        />
        <RiskMeter
          label="Financial Resilience"
          score={dimensions.financial}
          weight={riskWeights.financial}
          description={dimensionDescriptions.financial}
          dataAvailability="simulated"
          isMissing={missingDims.includes('financial')}
        />
      </div>

      {/* Weight Distribution */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.75rem 0' }}>Weight Distribution</h4>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {Object.entries(riskWeights).map(([dimension, weight]) => (
            <div key={dimension} style={{ flex: 1, minWidth: '140px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{dimensionLabels[dimension]}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{Math.round(weight * 100)}%</span>
              </div>
              <div className="progress-bar" style={{ height: '6px' }}>
                <div className="progress-bar-fill" style={{
                  width: Math.round(weight * 100) + '%',
                  backgroundColor: 'var(--color-primary)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <h3 style={{ margin: '0 0 1rem 0' }}>Recommended Actions</h3>
      <div style={{ marginBottom: '1.5rem' }}>
        {recommendations.map((rec, i) => (
          <RecommendationItem
            key={i}
            title={rec.title}
            description={rec.description}
            priority={rec.priority}
          />
        ))}
      </div>

      {/* Data Sources & Limitations */}
      <Card>
        <h4 style={{ margin: '0 0 0.75rem 0' }}>Sources, Methodology, and Limitations</h4>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <Badge variant="simulated">Simulated Demo Data</Badge>
          <Badge variant="demo">Not Live Climate Observations</Badge>
          <Badge variant="demo">Illstrative Risk Score Only</Badge>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          {b.assessment.dataNote}
        </p>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', lineHeight: 1.5 }}>
          Risk calculation uses proportional reweighting: dimensions without data are excluded
          and remaining dimensions are rescaled proportionally. Missing data is never silently
          treated as zero risk. Risk categories: Low (0-24), Moderate (25-49), High (50-74),
          Very High (75-100). Weights: Flood 30%, Rainfall 25%, Heat 20%, Business 15%, Financial 10%.
        </p>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', marginTop: '0.75rem', fontStyle: 'italic' }}>
          Disclaimer: This score is an illustrative prototype heuristic, not a validated credit rating,
          calibrated probability of default, or production-grade financial recommendation. It must not
          be used as the sole basis for lending decisions.
        </p>
      </Card>
    </div>
  );
}
