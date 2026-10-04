import { Router, Request, Response, NextFunction } from 'express';
import { authenticateJwt, requireOrg } from '../middleware/auth.js';
import { seedOrgDemoData, simulateBadDeployment } from '../services/demoSeed.js';

export const demoRouter = Router();

demoRouter.use(authenticateJwt);
demoRouter.use(requireOrg);

// POST /api/demo/seed
demoRouter.post('/seed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await seedOrgDemoData(req.organizationId!);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/demo/simulate-deployment
demoRouter.post('/simulate-deployment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await simulateBadDeployment(req.organizationId!);
    res.json({
      success: true,
      message: 'Faulty deployment injected successfully. New incident and telemetry anomaly generated live.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});
