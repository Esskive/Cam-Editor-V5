import axios from 'axios';
import { CamProfile, Segment } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cam Profile API
export const camProfileAPI = {
  // Get all cam profiles
  getAllProfiles: async (): Promise<CamProfile[]> => {
    try {
      const response = await api.get('/cam-profiles');
      return response.data;
    } catch (error) {
      console.error('Error fetching cam profiles:', error);
      throw error;
    }
  },

  // Get a single cam profile by ID
  getProfileById: async (id: string): Promise<CamProfile> => {
    try {
      const response = await api.get(`/cam-profiles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching cam profile with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new cam profile
  createProfile: async (profileData: Omit<CamProfile, '_id'>): Promise<CamProfile> => {
    try {
      const response = await api.post('/cam-profiles', profileData);
      return response.data;
    } catch (error) {
      console.error('Error creating cam profile:', error);
      throw error;
    }
  },

  // Update a cam profile
  updateProfile: async (id: string, profileData: Partial<CamProfile>): Promise<CamProfile> => {
    try {
      const response = await api.put(`/cam-profiles/${id}`, profileData);
      return response.data;
    } catch (error) {
      console.error(`Error updating cam profile with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a cam profile
  deleteProfile: async (id: string): Promise<void> => {
    try {
      await api.delete(`/cam-profiles/${id}`);
    } catch (error) {
      console.error(`Error deleting cam profile with ID ${id}:`, error);
      throw error;
    }
  },

  // Add a segment to a cam profile
  addSegment: async (profileId: string, segmentData: Omit<Segment, '_id'>): Promise<CamProfile> => {
    try {
      const response = await api.post(`/cam-profiles/${profileId}/segments`, segmentData);
      return response.data;
    } catch (error) {
      console.error(`Error adding segment to cam profile with ID ${profileId}:`, error);
      throw error;
    }
  },

  // Update a segment in a cam profile
  updateSegment: async (profileId: string, segmentId: string, segmentData: Partial<Segment>): Promise<CamProfile> => {
    try {
      const response = await api.put(`/cam-profiles/${profileId}/segments/${segmentId}`, segmentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating segment ${segmentId} in cam profile ${profileId}:`, error);
      throw error;
    }
  },

  // Delete a segment from a cam profile
  deleteSegment: async (profileId: string, segmentId: string): Promise<CamProfile> => {
    try {
      const response = await api.delete(`/cam-profiles/${profileId}/segments/${segmentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting segment ${segmentId} from cam profile ${profileId}:`, error);
      throw error;
    }
  },

  // Update spreadsheet data
  updateSpreadsheetData: async (profileId: string, spreadsheetData: any) => {
    try {
      const response = await api.put(`/cam-profiles/${profileId}/spreadsheet`, { spreadsheetData });
      return response.data;
    } catch (error) {
      console.error(`Error updating spreadsheet data for cam profile ${profileId}:`, error);
      throw error;
    }
  },
};

// Calculation API
export const calculationAPI = {
  // Calculate cam profile values for a given range
  calculateRange: async (profileId: string, start: number, end: number, step: number) => {
    try {
      const response = await api.get(`/calculations/${profileId}/range/${start}/${end}/${step}`);
      return response.data;
    } catch (error) {
      console.error(`Error calculating cam values for profile ${profileId}:`, error);
      throw error;
    }
  },

  // Calculate cam profile values at a specific point
  calculatePoint: async (profileId: string, point: number) => {
    try {
      const response = await api.get(`/calculations/${profileId}/point/${point}`);
      return response.data;
    } catch (error) {
      console.error(`Error calculating cam value at point ${point} for profile ${profileId}:`, error);
      throw error;
    }
  },
  
  // Calculate cam profile curves
  calculateCurves: async (segments: any[], resolution: number = 100) => {
    try {
      const response = await api.post('/calculations/curves', { segments, resolution });
      return response.data;
    } catch (error) {
      console.error('Error calculating cam curves:', error);
      throw error;
    }
  },
};

export default api;
