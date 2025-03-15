import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import Header from './Header';
import darkTheme from '../../theme/darkTheme';

interface LayoutProps {
  children: React.ReactNode;
  onNewProfile: () => void;
  onSaveProfile: () => void;
  onOpenProfile: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onNewProfile, 
  onSaveProfile, 
  onOpenProfile 
}) => {
  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        overflow: 'auto'
      }}>
        <CssBaseline />
        <Header
          title="Cam Editor"
          onNewProfile={onNewProfile}
          onSaveProfile={onSaveProfile}
          onOpenProfile={onOpenProfile}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: '100%',
            mt: '64px', // Hauteur de la barre de navigation
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
