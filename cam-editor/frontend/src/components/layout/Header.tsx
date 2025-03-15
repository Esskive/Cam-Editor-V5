import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';

interface HeaderProps {
  title: string;
  onNewProfile: () => void;
  onSaveProfile: () => void;
  onOpenProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  onNewProfile,
  onSaveProfile,
  onOpenProfile,
}) => {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={onNewProfile}
          >
            Nouveau
          </Button>
          <Button
            color="inherit"
            startIcon={<FolderOpenIcon />}
            onClick={onOpenProfile}
          >
            Ouvrir
          </Button>
          <Button
            color="inherit"
            startIcon={<SaveIcon />}
            onClick={onSaveProfile}
          >
            Enregistrer
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
