import express from 'express';
import {
  calculateCamValues,
  calculateCamValueAtPoint,
  calculateCurves
} from '../controllers/calculationController';

const router = express.Router();

// Calculate cam profile values for a given range
router.get('/:id/range/:start/:end/:step', calculateCamValues);

// Calculate cam profile values at a specific point
router.get('/:id/point/:point', calculateCamValueAtPoint);

// Calculate cam profile curves
router.post('/curves', calculateCurves);

export default router;
