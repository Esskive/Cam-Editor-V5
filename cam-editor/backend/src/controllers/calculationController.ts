import { Request, Response } from 'express';
import { calculateCamProfile, calculateCamProfileRange } from '../utils/camCalculations';
import { camProfiles } from './camProfileController';

// Calculate cam profile values for a given range
export const calculateCamValues = async (req: Request, res: Response) => {
  try {
    const { id, start, end, step } = req.params;
    
    const camProfile = camProfiles.find((profile: any) => profile._id === id);
    if (!camProfile) {
      return res.status(404).json({ message: 'Cam profile not found' });
    }
    
    const startValue = parseFloat(start);
    const endValue = parseFloat(end);
    const stepValue = parseFloat(step);
    
    if (isNaN(startValue) || isNaN(endValue) || isNaN(stepValue)) {
      return res.status(400).json({ message: 'Invalid parameters' });
    }
    
    const result = calculateCamProfileRange(
      startValue,
      endValue,
      stepValue,
      camProfile.segments
    );
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error calculating cam values', error });
  }
};

// Calculate cam profile values at a specific point
export const calculateCamValueAtPoint = async (req: Request, res: Response) => {
  try {
    const { id, point } = req.params;
    
    const camProfile = camProfiles.find((profile: any) => profile._id === id);
    if (!camProfile) {
      return res.status(404).json({ message: 'Cam profile not found' });
    }
    
    const pointValue = parseFloat(point);
    
    if (isNaN(pointValue)) {
      return res.status(400).json({ message: 'Invalid point parameter' });
    }
    
    // Find the segment that contains the point
    const segment = camProfile.segments.find(
      (seg: any) => pointValue >= seg.x1 && pointValue <= seg.x2
    );
    
    if (!segment) {
      return res.status(404).json({ message: 'No segment found for the given point' });
    }
    
    const result = calculateCamProfile(pointValue, segment);
    
    if (!result) {
      return res.status(404).json({ message: 'Could not calculate values for the given point' });
    }
    
    res.status(200).json({
      x: pointValue,
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating cam value at point', error });
  }
};

// Calculate cam profile curves
export const calculateCurves = async (req: Request, res: Response) => {
  try {
    const { segments, resolution = 100 } = req.body;
    
    console.log('Received request for curve calculation:', { segments, resolution });
    
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      console.error('Invalid segments data:', segments);
      return res.status(400).json({ message: 'Valid segments array is required' });
    }
    
    // Vérifier que chaque segment a toutes les propriétés requises
    const validSegments = segments.map((seg: any) => ({
      x1: Number(seg.x1),
      y1: Number(seg.y1),
      v1: Number(seg.v1),
      a1: Number(seg.a1),
      x2: Number(seg.x2),
      y2: Number(seg.y2),
      v2: Number(seg.v2),
      a2: Number(seg.a2),
      curveType: seg.curveType || 'Linear'
    }));
    
    console.log('Validated segments:', validSegments);
    
    // Find the overall range
    const minX = Math.min(...validSegments.map((seg: any) => seg.x1));
    const maxX = Math.max(...validSegments.map((seg: any) => seg.x2));
    const step = (maxX - minX) / resolution;
    
    console.log('Calculation parameters:', { minX, maxX, step });
    
    const result = calculateCamProfileRange(minX, maxX, step, validSegments);
    console.log('Calculation result:', result);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error calculating curves:', error);
    res.status(500).json({ message: 'Error calculating curves', error });
  }
};
