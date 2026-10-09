import React from 'react';
import { Badge } from './ui.jsx';

export function DataBadge({ type }) {
  const labels = {
    simulated: 'Simulated',
    historical: 'Historical',
    forecast: 'Forecast',
    missing: 'Missing',
  };
  const variants = {
    simulated: 'simulated',
    historical: 'demo',
    forecast: 'demo',
    missing: 'default',
  };
  return (
    <Badge variant={variants[type] || 'default'}>
      {labels[type] || type}
    </Badge>
  );
}
