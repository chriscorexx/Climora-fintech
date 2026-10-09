import { Request, Response } from 'express';
import { BusinessRepository } from '../repositories/businessRepository';
import { config } from '../config';

const bizRepo = new BusinessRepository();

export const getHealth = (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'climora-fintech-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      scoring: config.scoring,
    },
  });
};

export const getDashboardSummary = (_req: Request, res: Response) => {
  const businesses = bizRepo.getAll();
  const totalVolume = businesses.reduce((acc, b) => acc + (b.financials.requestedLoanAmount || 2500000), 0);
  
  res.json({
    success: true,
    data: {
      metrics: {
        totalBusinesses: businesses.length,
        totalLoanExposureInr: totalVolume,
        averageLoanSizeInr: businesses.length > 0 ? Math.round(totalVolume / businesses.length) : 0,
      },
      businesses: businesses.map((b) => ({
        id: b.id,
        name: b.name,
        city: b.location.city,
        industry: b.industry,
        requestedLoanAmount: b.financials.requestedLoanAmount,
      })),
    },
  });
};
