import React, { useState } from 'react';
import { demoBusinesses, businessSectors } from '../data/demoData.js';
import { Badge, Input } from './ui.jsx';

export default function PortfolioPage({ onSelectBusiness }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const getCategory = (score) => {
    if (score <= 24) return 'Low';
    if (score <= 49) return 'Moderate';
    if (score <= 74) return 'High';
    return 'Very High';
  };

  const getCategoryBadgeVariant = (category) => {
    const map = { Low: 'low', Moderate: 'moderate', High: 'high', 'Very High': 'veryHigh' };
    return map[category] || 'default';
  };

  const filtered = demoBusinesses.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = sectorFilter === 'all' || b.sector === sectorFilter;
    const matchesRisk =
      riskFilter === 'all' || getCategory(b.assessment.overallScore) === riskFilter;
    return matchesSearch && matchesSector && matchesRisk;
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Input
          placeholder="Search by business name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{ width: '280px' }}
        />
        <select
          className="input"
          style={{ width: '160px' }}
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
        >
          <option value="all">All Sectors</option>
          {Object.entries(businessSectors).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <select
          className="input"
          style={{ width: '160px' }}
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="all">All Risk Levels</option>
          <option value="Low">Low</option>
          <option value="Moderate">Moderate</option>
          <option value="High">High</option>
          <option value="Very High">Very High</option>
        </select>
        <Badge variant="demo">Showing {filtered.length} of {demoBusinesses.length} businesses</Badge>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>No businesses match your current filters.</p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setSectorFilter('all');
              setRiskFilter('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Sector</th>
                <th>Location</th>
                <th>Employees</th>
                <th>Revenue</th>
                <th>Risk Score</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((business) => (
                <tr
                  key={business.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectBusiness(business)}
                >
                  <td style={{ fontWeight: 500, color: 'var(--color-text)' }}>{business.name}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{businessSectors[business.sector]?.label || business.sector}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{business.location}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{business.employeeCount}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>${business.revenue?.toLocaleString()}</td>
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
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBusiness(business);
                      }}
                    >
                      View Assessment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
        <Badge variant="simulated">Note: Displayed data is simulated demo data, not live climate observations.</Badge>
      </div>
    </div>
  );
}
