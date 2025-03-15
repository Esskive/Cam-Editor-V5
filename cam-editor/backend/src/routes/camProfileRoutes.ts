import express from 'express';
import {
  getAllCamProfiles,
  getCamProfileById,
  createCamProfile,
  updateCamProfile,
  deleteCamProfile,
  addSegment,
  updateSegment,
  deleteSegment,
  updateSpreadsheetData
} from '../controllers/camProfileController';

const router = express.Router();

// Cam profile routes
router.get('/', getAllCamProfiles);
router.get('/:id', getCamProfileById);
router.post('/', createCamProfile);
router.put('/:id', updateCamProfile);
router.delete('/:id', deleteCamProfile);

// Segment routes
router.post('/:id/segments', addSegment);
router.put('/:id/segments/:segmentId', updateSegment);
router.delete('/:id/segments/:segmentId', deleteSegment);

// Spreadsheet data route
router.put('/:id/spreadsheet', updateSpreadsheetData);

export default router;
