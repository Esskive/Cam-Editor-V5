import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3F04BF', // Violet vif
      light: '#5F24CF',
      dark: '#0B1437', // Violet très foncé
      contrastText: '#F8F8F8',
    },
    secondary: {
      main: '#2E038C', // Violet moyen
      light: '#3F04BF',
      dark: '#0B1437', // Violet très foncé
      contrastText: '#F8F8F8',
    },
    background: {
      default: '#0B1437', // Violet très foncé
      paper: '#2F2E35', // Gris foncé
    },
    text: {
      primary: '#F8F8F8', // Blanc
      secondary: '#F8F8F8', // Blanc
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(145deg, #111C44 0%, #0B1437 100%)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(45deg, #3F04BF 0%, #5F24CF 100%)',
          boxShadow: '0 2px 10px rgba(63, 4, 191, 0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundImage: 'linear-gradient(45deg, #2E038C 0%, #3F04BF 100%)',
            boxShadow: '0 4px 15px rgba(63, 4, 191, 0.4)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-thumb': {
            backgroundColor: '#F8F8F8',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          },
          '& .MuiSwitch-track': {
            backgroundColor: '#2F2E35',
          },
          '& .Mui-checked': {
            '& .MuiSwitch-thumb': {
              backgroundColor: '#3F04BF',
            },
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: '#3F04BF',
          '& .MuiSlider-thumb': {
            backgroundColor: '#F8F8F8',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            },
          },
          '& .MuiSlider-track': {
            background: 'linear-gradient(90deg, #3F04BF 0%, #5F24CF 100%)',
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          '& .MuiTypography-root': {
            color: '#F8F8F8',
            fontWeight: 500,
          },
        },
      },
    },
  },
}); 