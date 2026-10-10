import { Request, Response } from 'express';
import { SchemeRepository } from '../repositories/schemeRepository';
import { BusinessRepository } from '../repositories/businessRepository';
import { matchSchemesForProfile } from '../../../src/core/schemeMatcher';

const schemeRepo = new SchemeRepository();
const bizRepo = new BusinessRepository();

export const listSchemes = (req: Request, res: Response) => {
  const schemes = schemeRepo.getAll();
  res.json({ success: true, data: { schemes } });
};

export const getSchemeById = (req: Request, res: Response) => {
  const scheme = schemeRepo.getById(req.params.id);
  if (!scheme) {
    return res.status(404).json({ success: false, error: { message: 'Scheme not found' } });
  }
  res.json({ success: true, data: { scheme } });
};

export const matchSchemesForBusiness = (req: Request, res: Response) => {
  const business = bizRepo.getById(req.params.id);
  if (!business) {
    return res.status(404).json({ success: false, error: { message: 'Business not found' } });
  }

  const floodScore = Number(req.query.floodScore || 50);
  const heatScore = Number(req.query.heatScore || 50);

  const matched = matchSchemesForProfile(business, floodScore, heatScore);
  res.json({ success: true, data: { schemes: matched } });
};

export const saveSchemeForBusiness = (req: Request, res: Response) => {
  const { schemeId, businessId, notes } = req.body;
  if (!schemeId || !businessId) {
    return res
      .status(400)
      .json({ success: false, error: { message: 'schemeId and businessId are required' } });
  }

  schemeRepo.saveForBusiness(schemeId, businessId, notes);
  res.json({ success: true, data: { saved: true } });
};

export const listSavedSchemes = (req: Request, res: Response) => {
  const saved = schemeRepo.getSavedByBusiness(req.params.businessId);
  res.json({ success: true, data: { savedSchemes: saved } });
};
