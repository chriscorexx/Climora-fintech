import { Request, Response } from 'express';
import { BusinessRepository } from '../repositories/businessRepository';
import { AssessmentRepository } from '../repositories/assessmentRepository';
import { fetchClimateIndicators } from '../../../src/core/weatherService';
import { assessMSMEClimateRisk } from '../../../src/core/riskEngine';

const bizRepo = new BusinessRepository();
const asmtRepo = new AssessmentRepository();

export const runAssessmentForBusiness = async (req: Request, res: Response) => {
  const businessId = req.params.id;
  const business = bizRepo.getById(businessId);

  if (!business) {
    return res.status(404).json({ success: false, error: { message: 'Business not found' } });
  }

  try {
    const climate = await fetchClimateIndicators(
      business.location.latitude,
      business.location.longitude,
      business.location.city,
    );

    const assessment = assessMSMEClimateRisk(business, climate);
    asmtRepo.create(assessment);

    res.json({
      success: true,
      data: {
        business,
        assessment,
        climate: {
          isLive: climate.provenance.isLive,
          provider: climate.provenance.provider,
          retrievedAt: climate.provenance.retrievedAt,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to compute assessment', details: error?.message },
    });
  }
};

export const listAssessmentsForBusiness = (req: Request, res: Response) => {
  const assessments = asmtRepo.getByBusinessId(req.params.id);
  res.json({ success: true, data: { assessments } });
};

export const getAssessmentById = (req: Request, res: Response) => {
  const assessment = asmtRepo.getById(req.params.id);
  if (!assessment) {
    return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
  }
  res.json({ success: true, data: { assessment } });
};
