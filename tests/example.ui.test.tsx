import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskBadge } from '@/components/common/RiskBadge';

/**
 * Harness proof: jsdom + @testing-library/react + jest-dom are wired up.
 * RiskBadge is a pure presentational component, so no providers are needed.
 */
describe('RiskBadge (jsdom UI harness)', () => {
  it('renders the risk classification label for each category', () => {
    render(<RiskBadge category="low" score={18} />);
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
    expect(screen.getByText('(18/100)')).toBeInTheDocument();
  });

  it('maps severe risk to the severe styling bucket', () => {
    render(<RiskBadge category="severe" score={92} size="lg" />);
    const badge = screen.getByText('Severe Risk').parentElement;
    expect(badge).not.toBeNull();
    expect(badge).toHaveClass('text-sm', 'font-semibold');
    expect(screen.getByText('(92/100)')).toBeInTheDocument();
  });

  it('omits the score chip when no score is supplied', () => {
    render(<RiskBadge category="moderate" />);
    expect(screen.getByText('Moderate Risk')).toBeInTheDocument();
    expect(screen.queryByText(/\d+\/100/)).not.toBeInTheDocument();
  });
});
