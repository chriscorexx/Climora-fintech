import React from 'react';
import { demoBusinesses } from '../data/demoData.js';
import { Badge } from './ui.jsx';

const categorySummary = demoBusinesses.reduce((acc, b) => {
  const cat = b.assessment.category || getCategory(b.assessment.overallScore);
  acc[cat] = (acc[cat] || 0) + 1;
  return acc;
}, {});

function getCategory(score) {
  if (score <= 24) return 'Low';
  if (score <= 49) return 'Moderate';
  if (score <= 74) return 'High';
  return 'Very High';
}

function getCategoryBadgeVariant(category) {
  const map = { Low: 'low', Moderate: 'moderate', High: 'high', 'Very High': 'veryHigh' };
  return map[category] || 'default';
}

function ScoreBar({ label, score, max = 100 }) {
  const percentage = Math.min(100, (score / max) * 100);
  const getBarColor = (s) => {
    if (s <= 24) return 'var(--color-low)';
    if (s <= 49) return 'var(--color-moderate)';
    if (s <= 74) return 'var(--color-high)';
    return 'var(--color-very-high)';
  };
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{score}/{max}</span>
      </div>
      <div className="progress-bar" style={{ height: '8px' }}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: getBarColor(score),
          }}
        />
      </div>
    </div>
  );
}

export default function OverviewDashboard({ onSelectBusiness }) {
  const totalPortfolio = demoBusinesses.length;
  const avgScore = Math.round(demoBusinesses.reduce((sum, b) => sum + b.assessment.overallScore, 0) / totalPortfolio);
  const highRiskCount = demoBusinesses.filter((b) => b.assessment.overallScore >= 50).length;

  return (
    <div>
      {/* Summary Cards */}
      <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Portfolio Size</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalPortfolio}</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>MSMEs assessed</p>
        </div>
        <div className="card">
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Average Risk Score</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: avgScore >= 50 ? 'var(--color-high)' : avgScore >= 25 ? 'var(--color-moderate)' : 'var(--color-low)' }}>
            {avgScore}
          </p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Across {totalPortfolio} businesses</p>
        </div>
        <div className="card">
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>High Risk Businesses</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-very-high)' }}>{highRiskCount}</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{Math.round((highRiskCount / totalPortfolio) * 100)}% of portfolio</p>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Risk Distribution</h3>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {Object.entries(categorySummary).map(([category, count]) => {
            const percentage = Math.round((count / totalPortfolio) * 100);
            return (
              <div key={category} style={{ flex: 1, minWidth: '100px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <Badge variant={getCategoryBadgeVariant(category)}>{category}</Badge>
                  <span style={{ fontSize: '0.8rem' }}>{percentage}%</span>
                </div>
                <ScoreBar label="" score={percentage} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Business Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>MSME Portfolio</h3>
          <Badge variant="demo">Sample Data</Badge>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Sector</th>
              <th>Location</th>
              <th>Risk Score</th>
              <th>Category</th>
              <th>Last Assessed</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {demoBusinesses.map((business) => (
              <tr
                key={business.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectBusiness(business)}
              >
                <td style={{ fontWeight: 500, color: 'var(--color-text)' }}>{business.name}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{business.sector}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{business.location}</td>
                <td>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: business.assessment.overallScore <= 24
                      ? 'var(--color-low)'
                      : business.assessment.overallScore <= 49
                        ? 'var(--color-moderate)'
                        : business.assessment.overallScore <= 74
                          ? 'var(--color-high)'
                          : 'var(--color-very-high)',
                  }}>
                    {business.assessment.overallScore}
                  </span>
                </td>
                <td><Badge variant={getCategoryBadgeVariant(getCategory(business.assessment.overallScore))}>{getCategory(business.assessment.overallScore)}</Badge></td>
                <td style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>{business.assessment.lastAssessed}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBusiness(business);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            [!] This dashboard uses simulated demo data. All scores are illustrative, not validated credit ratings.
          </span>
          <Badge variant="simulated">Simulated Demo Data</Badge>
        </div>
      </div>
    </div>
  );
}
