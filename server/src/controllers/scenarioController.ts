import { Request, Response } from 'express';
import { BusinessRepository } from '../repositories/businessRepository';
import { ScenarioRepository } from '../repositories/scenarioRepository';
import { simulateCashflowStress } from '../../../src/core/scenarioSimulator';

const bizRepo = new BusinessRepository();
const scenRepo = new ScenarioRepository();

export const runScenario = (req: Request, res: Response) => {
  const businessId = req.params.id;
  const business = bizRepo.getById(businessId);
  if (!business) {
    return res.status(404).json({ success: false, error: { message: 'Business not found' } });
  }

  const { hazardType, durationDays, intensityPct, facilityInundation, powerGridOutageDays } = req.body;

  const result = simulateCashflowStress(business, {
    hazardType: hazardType || 'flash_flood',
    durationDays: Number(durationDays || 7),
    intensityPct: Number(intensityPct || 65),
    facilityInundation: Boolean(facilityInundation),
    powerGridOutageDays: Number(powerGridOutageDays || 0),
  });

  scenRepo.create(businessId, result);

  res.json({ success: true, data: { scenario: result } });
};

export const listScenarios = (req: Request, res: Response) => {
  const scenarios = scenRepo.getByBusinessId(req.params.id);
  res.json({ success: true, data: { scenarios } });
};
