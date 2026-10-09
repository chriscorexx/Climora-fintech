import { Request, Response } from 'express';
import { BusinessRepository } from '../repositories/businessRepository';
import { MSMEProfile } from '../../../src/types';

const repo = new BusinessRepository();

export const listBusinesses = (req: Request, res: Response) => {
  const search = req.query.search as string;
  const businesses = repo.getAll(search);
  res.json({ success: true, data: { businesses } });
};

export const getBusinessById = (req: Request, res: Response) => {
  const business = repo.getById(req.params.id);
  if (!business) {
    return res.status(404).json({ success: false, error: { message: 'Business not found' } });
  }
  res.json({ success: true, data: { business } });
};

export const createBusiness = (req: Request, res: Response) => {
  const body = req.body;
  if (!body.name || !body.industry || !body.city) {
    return res.status(400).json({ success: false, error: { message: 'name, industry, and city are required' } });
  }

  const newProfile: MSMEProfile = {
    id: `biz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: body.name,
    udyamNumber: body.udyamNumber || body.udyam_number,
    industry: body.industry,
    businessSize: body.businessSize || 'small',
    businessStage: body.businessStage || 'growth',
    employeeCount: body.employeeCount || 10,
    location: {
      city: body.city,
      state: body.state || 'Maharashtra',
      country: 'India',
      latitude: body.latitude || 18.5204,
      longitude: body.longitude || 73.8567,
      address: body.address || `${body.city}, ${body.state || 'Maharashtra'}`,
    },
    financials: {
      monthlyRevenue: Number(body.monthlyRevenue || 1500000),
      monthlyOperatingExpenses: Number(body.monthlyOperatingExpenses || 1100000),
      existingMonthlyDebtObligations: Number(body.existingMonthlyDebtObligations || 100000),
      availableCashReserves: Number(body.availableCashReserves || 750000),
      requestedLoanAmount: Number(body.requestedLoanAmount || 2500000),
      loanTenureMonths: Number(body.loanTenureMonths || 36),
    },
    operations: body.operations || {
      electricityGridDependent: true,
      hasBackupGenerator: false,
      waterIntensive: false,
      hasWaterStorageRainwater: false,
      perishableInventory: false,
      hasColdStorage: false,
      transportSupplyChainSensitive: true,
      plinthHeightMeters: 0.3,
      hasFloodBarriers: false,
      hasClimateInsurance: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = repo.create(newProfile);
  res.status(201).json({ success: true, data: { business: created } });
};

export const updateBusiness = (req: Request, res: Response) => {
  const updated = repo.update(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: { message: 'Business not found' } });
  }
  res.json({ success: true, data: { business: updated } });
};

export const deleteBusiness = (req: Request, res: Response) => {
  const ok = repo.delete(req.params.id);
  if (!ok) {
    return res.status(404).json({ success: false, error: { message: 'Business not found' } });
  }
  res.json({ success: true, data: { deleted: true } });
};
