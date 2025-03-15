import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// In-memory data store
export let camProfiles: any[] = [];

// Get all cam profiles
export const getAllCamProfiles = async (req: Request, res: Response) => {
  try {
    res.status(200).json(camProfiles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cam profiles', error });
  }
};

// Get a single cam profile by ID
export const getCamProfileById = async (req: Request, res: Response) => {
  try {
    const camProfile = camProfiles.find(profile => profile._id === req.params.id);
    if (!camProfile) {
      return res.status(404).json({ message: 'Cam profile not found' });
    }
    res.status(200).json(camProfile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cam profile', error });
  }
};

// Create a new cam profile
export const createCamProfile = async (req: Request, res: Response) => {
  try {
    const newCamProfile = {
      _id: uuidv4(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Ensure segments have IDs
    if (newCamProfile.segments) {
      newCamProfile.segments = newCamProfile.segments.map((segment: any) => ({
        _id: uuidv4(),
        ...segment
      }));
    }
    
    camProfiles.push(newCamProfile);
    res.status(201).json(newCamProfile);
  } catch (error) {
    res.status(400).json({ message: 'Error creating cam profile', error });
  }
};

// Update a cam profile
export const updateCamProfile = async (req: Request, res: Response) => {
  try {
    const index = camProfiles.findIndex(profile => profile._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Cam profile not found' });
    }
    
    const updatedCamProfile = {
      ...camProfiles[index],
      ...req.body,
      updatedAt: new Date()
    };
    
    camProfiles[index] = updatedCamProfile;
    res.status(200).json(updatedCamProfile);
  } catch (error) {
    res.status(400).json({ message: 'Error updating cam profile', error });
  }
};

// Delete a cam profile
export const deleteCamProfile = async (req: Request, res: Response) => {
  try {
    const index = camProfiles.findIndex(profile => profile._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Cam profile not found' });
    }
    
    camProfiles.splice(index, 1);
    res.status(200).json({ message: 'Cam profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting cam profile', error });
  }
};

// Add a segment to a cam profile
export const addSegment = async (req: Request, res: Response) => {
  try {
    const camProfile = camProfiles.find(profile => profile._id === req.params.id);
    if (!camProfile) {
      return res.status(404).json({ message: 'Cam profile not found' });
    }
    
    const newSegment = {
      _id: uuidv4(),
      ...req.body
    };
    
    camProfile.segments.push(newSegment);
    camProfile.updatedAt = new Date();
    
    res.status(200).json(camProfile);
  } catch (error) {
    res.status(400).json({ message: 'Error adding segment', error });
  }
};

// Update a segment in a cam profile
export const updateSegment = async (req: Request, res: Response) => {
  try {
    const { id, segmentId } = req.params;
    
    const camProfile = camProfiles.find(profile => profile._id === id);
    if (!camProfile) {
      return res.status(404).json({ message: 'Cam profile not found' });
    }
    
    const segmentIndex = camProfile.segments.findIndex(
      (segment: any) => segment._id === segmentId
    );
    
    if (segmentIndex === -1) {
      return res.status(404).json({ message: 'Segment not found' });
    }
    
    camProfile.segments[segmentIndex] = {
      ...camProfile.segments[segmentIndex],
      ...req.body
    };
    
    camProfile.updatedAt = new Date();
    
    res.status(200).json(camProfile);
  } catch (error) {
    res.status(400).json({ message: 'Error updating segment', error });
  }
};

// Delete a segment from a cam profile
export const deleteSegment = async (req: Request, res: Response) => {
  try {
    const { id, segmentId } = req.params;
    
    const camProfile = camProfiles.find(profile => profile._id === id);
    if (!camProfile) {
      return res.status(404).json({ message: 'Cam profile not found' });
    }
    
    camProfile.segments = camProfile.segments.filter(
      (segment: any) => segment._id !== segmentId
    );
    
    camProfile.updatedAt = new Date();
    
    res.status(200).json(camProfile);
  } catch (error) {
    res.status(400).json({ message: 'Error deleting segment', error });
  }
};

// Update spreadsheet data
export const updateSpreadsheetData = async (req: Request, res: Response) => {
  try {
    const camProfile = camProfiles.find(profile => profile._id === req.params.id);
    if (!camProfile) {
      return res.status(404).json({ message: 'Cam profile not found' });
    }
    
    camProfile.spreadsheetData = req.body.spreadsheetData;
    camProfile.updatedAt = new Date();
    
    res.status(200).json(camProfile);
  } catch (error) {
    res.status(400).json({ message: 'Error updating spreadsheet data', error });
  }
};

// Create a default profile if none exists
export const createDefaultProfile = () => {
  if (camProfiles.length === 0) {
    const defaultProfile = {
      _id: uuidv4(),
      name: 'Default Cam Profile',
      description: 'Created automatically',
      masterUnit: 'degrees',
      slaveUnit: 'mm',
      segments: [
        {
          _id: uuidv4(),
          x1: 0,
          y1: 0,
          v1: 0,
          a1: 0,
          x2: 90,
          y2: 10,
          v2: 0,
          a2: 0,
          curveType: 'Polynomial5'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    camProfiles.push(defaultProfile);
    console.log('Created default cam profile');
  }
};
