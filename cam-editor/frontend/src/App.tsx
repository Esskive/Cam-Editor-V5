import React, { useState, useEffect } from 'react';
import { Box, Container, ThemeProvider } from '@mui/material';
import { CssBaseline } from '@mui/material';
import Layout from './components/layout/Layout';
import CombinedView from './components/combined/CombinedView';
import { CamProfile, CamValuePoint } from './types';
import { camProfileAPI } from './services/api';
import { theme } from './theme';

const App: React.FC = () => {
  const [currentProfile, setCurrentProfile] = useState<CamProfile | null>(null);
  const [cursorPosition, setCursorPosition] = useState<CamValuePoint | null>(null);
  const [showPosition, setShowPosition] = useState<boolean>(true);
  const [showVelocity, setShowVelocity] = useState<boolean>(true);
  const [showAcceleration, setShowAcceleration] = useState<boolean>(true);

  // Toggle visibility of curves
  const handleTogglePosition = () => setShowPosition(!showPosition);
  const handleToggleVelocity = () => setShowVelocity(!showVelocity);
  const handleToggleAcceleration = () => setShowAcceleration(!showAcceleration);

  // Load initial profile or create a new one
  useEffect(() => {
    const loadInitialProfile = async () => {
      try {
        // Try to load profiles
        const profiles = await camProfileAPI.getAllProfiles();
        
        if (profiles && profiles.length > 0) {
          // Use the first profile
          setCurrentProfile(profiles[0]);
        } else {
          // Create a new profile
          createNewProfile();
        }
      } catch (error) {
        console.error('Error loading profiles:', error);
        // Create a new profile if loading fails
        createNewProfile();
      }
    };

    loadInitialProfile();
  }, []);

  const createNewProfile = async () => {
    try {
      const newProfile: Omit<CamProfile, '_id'> = {
        name: 'Nouveau profil',
        description: 'Description du nouveau profil',
        masterUnit: 'degrees',
        slaveUnit: 'mm',
        segments: [],
        spreadsheetData: Array(10).fill(null).map(() => Array(10).fill(null)),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const createdProfile = await camProfileAPI.createProfile(newProfile);
      setCurrentProfile(createdProfile);
    } catch (error) {
      console.error('Error creating new profile:', error);
      // If API fails, create a local profile
      setCurrentProfile({
        name: 'New Cam Profile (Local)',
        description: 'Created locally',
        masterUnit: 'degrees',
        slaveUnit: 'mm',
        segments: [
          {
            x1: 0,
            y1: 0,
            v1: 0,
            a1: 0,
            x2: 90,
            y2: 10,
            v2: 0,
            a2: 0,
            curveType: 'Polynomial5',
          },
        ],
        spreadsheetData: Array(10).fill(null).map(() => Array(10).fill(null)),
        createdAt: new Date(),
        updatedAt: new Date()
      } as CamProfile);
    }
  };

  const handleProfileUpdate = (updatedProfile: CamProfile) => {
    setCurrentProfile(updatedProfile);
  };

  const handleCursorPositionChange = (position: CamValuePoint | null) => {
    setCursorPosition(position);
  };

  const handleNewProfile = () => {
    createNewProfile();
  };

  const handleSaveProfile = async () => {
    if (!currentProfile) return;

    try {
      if (currentProfile._id) {
        // Update existing profile
        const updatedProfile = await camProfileAPI.updateProfile(
          currentProfile._id,
          currentProfile
        );
        setCurrentProfile(updatedProfile);
      } else {
        // Create new profile
        const createdProfile = await camProfileAPI.createProfile(currentProfile);
        setCurrentProfile(createdProfile);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      // Handle error (show notification, etc.)
    }
  };

  const handleOpenProfile = async () => {
    try {
      const profiles = await camProfileAPI.getAllProfiles();
      
      if (profiles && profiles.length > 0) {
        // For now, just load the first profile
        // In a real app, you would show a dialog to select a profile
        setCurrentProfile(profiles[0]);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      // Handle error (show notification, etc.)
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        bgcolor: 'background.default',
        minHeight: '100vh',
        color: 'text.primary'
      }}>
        <Container maxWidth="xl">
          <Layout
            onNewProfile={handleNewProfile}
            onSaveProfile={handleSaveProfile}
            onOpenProfile={handleOpenProfile}
          >
            <CombinedView
              camProfile={currentProfile}
              showPosition={showPosition}
              showVelocity={showVelocity}
              showAcceleration={showAcceleration}
              onCursorPositionChange={handleCursorPositionChange}
              onProfileUpdate={handleProfileUpdate}
              onTogglePosition={handleTogglePosition}
              onToggleVelocity={handleToggleVelocity}
              onToggleAcceleration={handleToggleAcceleration}
            />
          </Layout>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App; 