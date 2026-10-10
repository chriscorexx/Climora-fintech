import { Request, Response } from 'express';
import { geocodeCity, fetchClimateIndicators } from '../../../src/core/weatherService';
import { BusinessRepository } from '../repositories/businessRepository';

const bizRepo = new BusinessRepository();

export const geocodeLocation = async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    return res
      .status(400)
      .json({ success: false, error: { message: 'Query parameter q is required' } });
  }

  const result = await geocodeCity(query);
  if (!result) {
    return res.status(404).json({ success: false, error: { message: 'Location not found' } });
  }

  res.json({ success: true, data: { location: result } });
};

export const getClimateForBusiness = async (req: Request, res: Response) => {
  const business = bizRepo.getById(req.params.id);
  if (!business) {
    return res.status(404).json({ success: false, error: { message: 'Business not found' } });
  }

  const climate = await fetchClimateIndicators(
    business.location.latitude,
    business.location.longitude,
    business.location.city,
  );

  res.json({ success: true, data: { climate } });
};
