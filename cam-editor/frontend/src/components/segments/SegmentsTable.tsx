import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Tooltip,
  FormGroup,
  FormControl,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import { CamProfile, Segment, CurveType, curveTypeOptions } from '../../types';
import { camProfileAPI } from '../../services/api';

interface LinkedParameter {
  segmentIndex: number;
  parameter: string;
  cellReference?: string; // Add cell reference information
}

interface SegmentsTableProps {
  camProfile: CamProfile | null;
  onProfileUpdate: (updatedProfile: CamProfile) => void;
  onLinkParameter?: (segmentIndex: number, parameter: string) => void;
  linkedParameters?: LinkedParameter[];
}

interface LinkInfo {
  segmentIndex: number;
  parameter: string;
  active: boolean;
}

const SegmentsTable: React.FC<SegmentsTableProps> = ({
  camProfile,
  onProfileUpdate,
  onLinkParameter,
  linkedParameters = [],
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [isNewSegment, setIsNewSegment] = useState(false);
  const isUpdatingRef = React.useRef(false);
  
  // State for linking parameters to spreadsheet cells
  const [linkInfo, setLinkInfo] = useState<LinkInfo>({
    segmentIndex: -1,
    parameter: '',
    active: false,
  });
  
  // State for the cell reference dialog
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [cellReference, setCellReference] = useState('');
  const [linkingSegmentIndex, setLinkingSegmentIndex] = useState(-1);
  const [linkingParameter, setLinkingParameter] = useState('');
  
  // Function to parse a cell reference (e.g., "B2") into row and column indices
  const parseCellReference = (cellRef: string): { row: number; col: number } | null => {
    // Regular expression to match a cell reference like "A1", "B2", etc.
    const cellRefRegex = /^([A-Z]+)(\d+)$/;
    const match = cellRef.match(cellRefRegex);
    
    if (!match) {
      return null;
    }
    
    const colStr = match[1];
    const rowStr = match[2];
    
    // Convert column letter to index (A=0, B=1, C=2, etc.)
    let colIndex = 0;
    for (let i = 0; i < colStr.length; i++) {
      colIndex = colIndex * 26 + (colStr.charCodeAt(i) - 'A'.charCodeAt(0));
    }
    
    // Convert row string to index (1-based to 0-based)
    const rowIndex = parseInt(rowStr, 10) - 1;
    
    // Check if the indices are valid (assuming a 10x10 spreadsheet)
    if (rowIndex < 0 || rowIndex >= 10 || colIndex < 0 || colIndex >= 10) {
      return null;
    }
    
    return { row: rowIndex, col: colIndex };
  };
  
  // Function to handle the cell reference dialog submission
  const handleLinkCellReference = () => {
    const cellIndices = parseCellReference(cellReference);
    
    if (!cellIndices) {
      alert('Référence de cellule invalide. Veuillez utiliser un format comme "A1", "B2", etc.');
      return;
    }
    
    // Create a direct link between the parameter and the cell
    if (camProfile && onLinkParameter) {
      // First, notify the parent component about the linking
      onLinkParameter(linkingSegmentIndex, linkingParameter);
      
      // Then, create a custom event to link the cell
      const event = new CustomEvent('linkCell', {
        detail: {
          row: cellIndices.row,
          col: cellIndices.col,
          segmentIndex: linkingSegmentIndex,
          parameter: linkingParameter
        }
      });
      document.dispatchEvent(event);
    }
    
    // Close the dialog and reset the state
    setOpenLinkDialog(false);
    setCellReference('');
    setLinkingSegmentIndex(-1);
    setLinkingParameter('');
  };
  
  // Function to start linking a parameter to a spreadsheet cell
  const handleStartLinking = (segmentIndex: number, parameter: string) => {
    setLinkingSegmentIndex(segmentIndex);
    setLinkingParameter(parameter);
    setOpenLinkDialog(true);
  };
  
  // Function to unlink a parameter from a spreadsheet cell
  const handleUnlinkParameter = (segmentIndex: number, parameter: string) => {
    // Find the linked parameter
    const linkedParam = linkedParameters.find(
      lp => lp.segmentIndex === segmentIndex && lp.parameter === parameter
    );
    
    if (!linkedParam || !onLinkParameter) return;
    
    // Create a custom event to unlink the cell
    const event = new CustomEvent('unlinkCell', {
      detail: {
        segmentIndex,
        parameter
      }
    });
    document.dispatchEvent(event);
    
    // Notify the parent component
    onLinkParameter(segmentIndex, parameter);
  };

  const initialSegmentState: Segment = {
    x1: 0,
    y1: 0,
    v1: 0,
    a1: 0,
    x2: 0,
    y2: 0,
    v2: 0,
    a2: 0,
    curveType: 'Linear' as CurveType
  };

  const handleAddSegment = () => {
    if (!camProfile) {
      console.error('No camProfile available');
      return;
    }
    
    console.log('Adding new segment to profile:', camProfile);
    const segments = camProfile.segments || [];
    console.log('Current segments:', segments);

    // Si c'est le premier segment
    if (segments.length === 0) {
      console.log('Creating first segment');
      setEditingSegment({
        ...initialSegmentState,
        x2: 30, // Default to 30 degrees or units
        curveType: 'Linear' as CurveType
      });
    } else {
      // Utiliser le dernier segment comme référence
      const lastSegment = segments[segments.length - 1];
      console.log('Using last segment as reference:', lastSegment);
      setEditingSegment({
        ...initialSegmentState,
        x1: lastSegment.x2,
        y1: lastSegment.y2,
        v1: lastSegment.v2,
        a1: lastSegment.a2,
        x2: lastSegment.x2 + 30, // Default to 30 degrees or units more
        y2: lastSegment.y2,
        curveType: 'Linear' as CurveType
      });
    }
    
    setIsNewSegment(true);
    setOpenDialog(true);
  };

  const handleEditSegment = (segment: Segment) => {
    setEditingSegment({ ...segment });
    setIsNewSegment(false);
    setOpenDialog(true);
  };

  const handleDeleteSegment = async (segmentId: string | undefined) => {
    if (!camProfile || !segmentId) return;

    try {
      // Désactiver temporairement la synchronisation
      isUpdatingRef.current = true;
      
      const updatedProfile = await camProfileAPI.deleteSegment(
        camProfile._id || '',
        segmentId
      );
      
      // Mettre à jour le profil sans déclencher la synchronisation
      onProfileUpdate(updatedProfile);
    } catch (error) {
      console.error('Error deleting segment:', error);
    } finally {
      // Réactiver la synchronisation après un court délai
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSegment(null);
  };

  const handleSaveSegment = async () => {
    if (!camProfile || !editingSegment) {
      console.error('Cannot save segment: missing data', { camProfile, editingSegment });
      return;
    }

    try {
      console.log('Saving segment:', editingSegment);
      let updatedProfile;

      // S'assurer que le segment a toutes les propriétés requises
      const segmentToSave: Segment = {
        ...editingSegment,
        curveType: editingSegment.curveType || 'Linear'
      };

      if (isNewSegment) {
        console.log('Adding new segment to profile');
        // Si le profil n'a pas d'ID, on met à jour localement
        if (!camProfile._id) {
          updatedProfile = {
            ...camProfile,
            segments: [...camProfile.segments, segmentToSave]
          };
        } else {
          updatedProfile = await camProfileAPI.addSegment(
            camProfile._id,
            segmentToSave
          );
        }
      } else {
        console.log('Updating existing segment:', editingSegment._id);
        // Si le profil n'a pas d'ID, on met à jour localement
        if (!camProfile._id) {
          updatedProfile = {
            ...camProfile,
            segments: camProfile.segments.map(seg => 
              seg._id === editingSegment._id ? segmentToSave : seg
            )
          };
        } else {
          updatedProfile = await camProfileAPI.updateSegment(
            camProfile._id,
            editingSegment._id || '',
            segmentToSave
          );
        }
      }

      console.log('Profile updated successfully:', updatedProfile);
      onProfileUpdate(updatedProfile);
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving segment:', error);
      // Handle error (show notification, etc.)
    }
  };

  const handleSegmentChange = (field: keyof Segment, value: any) => {
    if (!editingSegment) return;

    // Si c'est un segment de type Linear et qu'on modifie y1, y2, x1 ou x2, calculer v2 automatiquement
    if (editingSegment.curveType === 'Linear' && ['y1', 'y2', 'x1', 'x2'].includes(field)) {
      // Créer une copie du segment avec la nouvelle valeur
      const updatedSegment = {
        ...editingSegment,
        [field]: field === 'curveType' ? value : parseFloat(value)
      };

      // Calculer V2 avec les nouvelles valeurs
      const deltaX = Number(updatedSegment.x2) - Number(updatedSegment.x1);
      if (deltaX !== 0) {
        const v2 = (Number(updatedSegment.y2) - Number(updatedSegment.y1)) / deltaX;
        setEditingSegment({
          ...updatedSegment,
          v2: v2
        });
      } else {
        setEditingSegment(updatedSegment);
      }
      return;
    }

    setEditingSegment({
      ...editingSegment,
      [field]: field === 'curveType' ? value : parseFloat(value),
    });
  };

  const updateSegmentParameter = async (segmentIndex: number, parameter: string, value: number | string) => {
    if (!camProfile || !camProfile.segments[segmentIndex] || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    try {
      // Vérifier si le paramètre est lié à une cellule
      const isLinked = linkedParameters.some(lp => 
        lp.segmentIndex === segmentIndex && 
        lp.parameter === parameter
      );

      // Si le paramètre est lié, on ne permet pas sa modification
      if (isLinked) return;
      
      // Create a copy of the segments array
      const updatedSegments = [...camProfile.segments];
      const currentSegment = updatedSegments[segmentIndex];
      
      // Si c'est un segment de type Linear et qu'on modifie y1, y2, x1 ou x2, calculer v2 automatiquement
      if (currentSegment.curveType === 'Linear' && ['y1', 'y2', 'x1', 'x2'].includes(parameter)) {
        // Créer une copie du segment avec la nouvelle valeur
        const updatedSegment = {
          ...currentSegment,
          [parameter]: value
        };

        // Calculer V2 avec les nouvelles valeurs
        const deltaX = Number(updatedSegment.x2) - Number(updatedSegment.x1);
        if (deltaX !== 0) {
          const v2 = (Number(updatedSegment.y2) - Number(updatedSegment.y1)) / deltaX;
          updatedSegments[segmentIndex] = {
            ...updatedSegment,
            v2: v2
          };
        } else {
          updatedSegments[segmentIndex] = updatedSegment;
        }
      } else {
        // Update the specific parameter
        updatedSegments[segmentIndex] = {
          ...currentSegment,
          [parameter]: value
        };
      }

      // Si c'est un paramètre de fin (x2, y2, v2, a2) et qu'il y a un segment suivant
      if (['x2', 'y2', 'v2', 'a2'].includes(parameter) && segmentIndex < updatedSegments.length - 1) {
        // Mettre à jour le paramètre correspondant du segment suivant
        const nextSegmentIndex = segmentIndex + 1;
        const nextParameter = parameter.replace('2', '1'); // Convertir x2 en x1, y2 en y1, etc.
        
        // Vérifier si le paramètre du segment suivant est lié à une cellule
        const isNextLinked = linkedParameters.some(lp => 
          lp.segmentIndex === nextSegmentIndex && 
          lp.parameter === nextParameter
        );

        // Si le paramètre du segment suivant n'est pas lié, le mettre à jour
        if (!isNextLinked) {
          updatedSegments[nextSegmentIndex] = {
            ...updatedSegments[nextSegmentIndex],
            [nextParameter]: value
          };
        }
      }
      
      // Create an updated profile
      const updatedProfile = {
        ...camProfile,
        segments: updatedSegments
      };
      
      // Notify parent component
      onProfileUpdate(updatedProfile);
      
      // If we have an API, update the segments on the server
      if (camProfile._id) {
        try {
          // Mettre à jour le segment actuel
          if (updatedSegments[segmentIndex]._id) {
            await camProfileAPI.updateSegment(
              camProfile._id,
              updatedSegments[segmentIndex]._id || '',
              updatedSegments[segmentIndex]
            );
          }
          
          // Mettre à jour le segment suivant si nécessaire
          if (['x2', 'y2', 'v2', 'a2'].includes(parameter) && segmentIndex < updatedSegments.length - 1) {
            const nextSegmentIndex = segmentIndex + 1;
            if (updatedSegments[nextSegmentIndex]._id) {
              await camProfileAPI.updateSegment(
                camProfile._id,
                updatedSegments[nextSegmentIndex]._id || '',
                updatedSegments[nextSegmentIndex]
              );
            }
          }
        } catch (error) {
          console.error('Error updating segment parameter:', error);
        }
      }
    } finally {
      isUpdatingRef.current = false;
    }
  };

  // Effet de synchronisation des paramètres
  useEffect(() => {
    if (!camProfile || isUpdatingRef.current) return;

    isUpdatingRef.current = true;
    
    try {
      const updatedSegments = [...camProfile.segments];
      let hasChanges = false;

      // Pour chaque segment (sauf le premier)
      for (let i = 1; i < updatedSegments.length; i++) {
        const prevSegment = updatedSegments[i - 1];
        const currentSegment = updatedSegments[i];

        // Pour chaque paramètre de fin (x2, y2, v2, a2)
        ['x2', 'y2', 'v2', 'a2'].forEach(endParam => {
          const startParam = endParam.replace('2', '1'); // Convertir x2 en x1, y2 en y1, etc.
          
          // Si le paramètre de fin du segment précédent est lié à une cellule
          const isLinked = linkedParameters.some(lp => 
            lp.segmentIndex === i - 1 && 
            lp.parameter === endParam
          );

          // Si le paramètre de début du segment actuel n'est pas lié à une cellule
          const isStartLinked = linkedParameters.some(lp => 
            lp.segmentIndex === i && 
            lp.parameter === startParam
          );

          // Si le paramètre de fin est lié ou si le paramètre de début n'est pas lié
          if (isLinked || !isStartLinked) {
            // Mettre à jour le paramètre de début avec la valeur du paramètre de fin du segment précédent
            if (currentSegment[startParam as keyof Segment] !== prevSegment[endParam as keyof Segment]) {
              updatedSegments[i] = {
                ...currentSegment,
                [startParam]: prevSegment[endParam as keyof Segment]
              };
              hasChanges = true;
            }
          }
        });
      }

      // Si des changements ont été effectués, mettre à jour le profil
      if (hasChanges) {
        const updatedProfile = {
          ...camProfile,
          segments: updatedSegments
        };
        onProfileUpdate(updatedProfile);

        // Mettre à jour l'API si nécessaire
        if (camProfile._id) {
          try {
            // Mettre à jour tous les segments modifiés
            updatedSegments.forEach((segment, index) => {
              if (segment._id && index > 0 && camProfile._id) {
                camProfileAPI.updateSegment(
                  camProfile._id,
                  segment._id,
                  segment
                );
              }
            });
          } catch (error) {
            console.error('Error updating segments:', error);
          }
        }
      }
    } finally {
      // Réactiver la synchronisation après un court délai
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [camProfile, linkedParameters]);

  // Check if there are segments to display
  const hasSegments = camProfile && camProfile.segments && camProfile.segments.length > 0;
  
  // Check if the segment editing should be disabled
  const disableSegmentEditing = !isNewSegment && camProfile?.segments && camProfile.segments.length > 1;

  // Ajouter un effet pour écouter les changements de valeur des cellules liées
  useEffect(() => {
    const handleCellValueChange = (event: CustomEvent) => {
      const { row, col, value } = event.detail;
      
      // Trouver tous les paramètres liés à cette cellule
      const linkedParams = linkedParameters.filter(lp => {
        const cellRef = lp.cellReference;
        if (!cellRef) return false;
        
        const cellIndices = parseCellReference(cellRef);
        return cellIndices && cellIndices.row === row && cellIndices.col === col;
      });

      // Pour chaque paramètre lié, mettre à jour sa valeur
      linkedParams.forEach(lp => {
        if (!camProfile || !camProfile.segments[lp.segmentIndex]) return;

        // Mettre à jour le paramètre actuel
        const updatedSegments = [...camProfile.segments];
        updatedSegments[lp.segmentIndex] = {
          ...updatedSegments[lp.segmentIndex],
          [lp.parameter]: value
        };

        // Si c'est un paramètre de fin (x2, y2, v2, a2) et qu'il y a un segment suivant
        if (['x2', 'y2', 'v2', 'a2'].includes(lp.parameter) && lp.segmentIndex < updatedSegments.length - 1) {
          const nextSegmentIndex = lp.segmentIndex + 1;
          const nextParameter = lp.parameter.replace('2', '1'); // Convertir x2 en x1, y2 en y1, etc.
          
          // Forcer la mise à jour du paramètre du segment suivant avec la valeur du segment actuel
          updatedSegments[nextSegmentIndex] = {
            ...updatedSegments[nextSegmentIndex],
            [nextParameter]: value
          };

          // Si le paramètre du segment suivant est lié à une cellule, mettre à jour cette cellule
          const nextLinkedParam = linkedParameters.find(
            nextLp => nextLp.segmentIndex === nextSegmentIndex && nextLp.parameter === nextParameter
          );

          if (nextLinkedParam && nextLinkedParam.cellReference) {
            const event = new CustomEvent('updateLinkedCell', {
              detail: {
                cellReference: nextLinkedParam.cellReference,
                value: value
              }
            });
            document.dispatchEvent(event);
          }
        }

        // Créer un profil mis à jour
        const updatedProfile = {
          ...camProfile,
          segments: updatedSegments
        };

        // Notifier le composant parent
        onProfileUpdate(updatedProfile);

        // Mettre à jour l'API si nécessaire
        if (camProfile._id) {
          try {
            // Mettre à jour le segment actuel
            if (updatedSegments[lp.segmentIndex]._id) {
              camProfileAPI.updateSegment(
                camProfile._id,
                updatedSegments[lp.segmentIndex]._id || '',
                updatedSegments[lp.segmentIndex]
              );
            }
            
            // Mettre à jour le segment suivant si nécessaire
            if (['x2', 'y2', 'v2', 'a2'].includes(lp.parameter) && lp.segmentIndex < updatedSegments.length - 1) {
              const nextSegmentIndex = lp.segmentIndex + 1;
              if (updatedSegments[nextSegmentIndex]._id) {
                camProfileAPI.updateSegment(
                  camProfile._id,
                  updatedSegments[nextSegmentIndex]._id || '',
                  updatedSegments[nextSegmentIndex]
                );
              }
            }
          } catch (error) {
            console.error('Error updating segment parameter:', error);
          }
        }
      });
    };

    // Ajouter l'écouteur d'événement
    document.addEventListener('cellValueChange', handleCellValueChange as EventListener);

    // Nettoyer l'écouteur d'événement
    return () => {
      document.removeEventListener('cellValueChange', handleCellValueChange as EventListener);
    };
  }, [camProfile, linkedParameters]);

  // Function to convert row and column indices to a cell reference (e.g., "B3")
  const getCellReference = (row: number, col: number): string => {
    // Convert column index to letter (0 = A, 1 = B, etc.)
    const colLetter = String.fromCharCode(65 + col);
    // Convert row index to 1-based number
    const rowNumber = row + 1;
    return `${colLetter}${rowNumber}`;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#111C44' }}>
        <Typography variant="h6">Segments Table</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddSegment}
          disabled={!camProfile}
        >
          Add Segment
        </Button>
      </Paper>

      <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#111C44' }}>
        <Table stickyHeader aria-label="segments table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ py: 1, bgcolor: '#1B254B', width: '50px' }}>#</TableCell>
              <TableCell sx={{ py: 1, bgcolor: '#1B254B', minWidth: '120px' }}>X1</TableCell>
              <TableCell sx={{ py: 1, bgcolor: '#1B254B', minWidth: '120px' }}>Y1</TableCell>
              <TableCell sx={{ py: 1, bgcolor: '#1B254B', minWidth: '120px' }}>V1</TableCell>
              <TableCell sx={{ py: 1, bgcolor: '#1B254B', minWidth: '120px' }}>A1</TableCell>
              <TableCell sx={{ py: 1, bgcolor: '#1B254B', minWidth: '120px' }}>X2</TableCell>
              <TableCell sx={{ py: 1, bgcolor: '#1B254B', minWidth: '120px' }}>Y2</TableCell>
              <TableCell sx={{ py: 1, bgcolor: '#1B254B', minWidth: '120px' }}>V2</TableCell>
              <TableCell sx={{ py: 1, bgcolor: '#1B254B', minWidth: '120px' }}>A2</TableCell>
              <TableCell sx={{ py: 1, bgcolor: '#1B254B', minWidth: '150px' }}>Curve Type</TableCell>
              <TableCell sx={{ py: 1, bgcolor: '#1B254B', width: '100px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hasSegments ? (
              camProfile.segments.map((segment, index) => (
                <TableRow key={index} sx={{ '&:hover': { bgcolor: '#1B254B' } }}>
                  <TableCell sx={{ py: 0.5 }}>{index + 1}</TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField
                        size="small"
                        value={segment.x1}
                        onChange={(e) => updateSegmentParameter(index, 'x1', parseFloat(e.target.value))}
                        type="number"
                        fullWidth
                        disabled={index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'x1')}
                        sx={(index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'x1')) ? { '& .MuiOutlinedInput-root': { '& fieldset': { border: 'none' } } } : {}}
                        inputProps={{ 
                          style: { 
                            padding: '4px 8px',
                            backgroundColor: (index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'x1')) ? '#1B254B' : 'transparent',
                            color: (index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'x1')) ? '#A3AED0' : 'inherit',
                          }
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField
                        size="small"
                        value={segment.y1}
                        onChange={(e) => updateSegmentParameter(index, 'y1', parseFloat(e.target.value))}
                        type="number"
                        fullWidth
                        disabled={index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'y1')}
                        sx={(index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'y1')) ? { '& .MuiOutlinedInput-root': { '& fieldset': { border: 'none' } } } : {}}
                        inputProps={{ 
                          style: { 
                            padding: '4px 8px',
                            backgroundColor: (index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'y1')) ? '#1B254B' : 'transparent',
                            color: (index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'y1')) ? '#A3AED0' : 'inherit',
                          }
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField
                        size="small"
                        value={segment.v1}
                        onChange={(e) => updateSegmentParameter(index, 'v1', parseFloat(e.target.value))}
                        type="number"
                        fullWidth
                        disabled={index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'v1')}
                        sx={(index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'v1')) ? { '& .MuiOutlinedInput-root': { '& fieldset': { border: 'none' } } } : {}}
                        inputProps={{ 
                          style: { 
                            padding: '4px 8px',
                            backgroundColor: (index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'v1')) ? '#1B254B' : 'transparent',
                            color: (index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'v1')) ? '#A3AED0' : 'inherit',
                          }
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField
                        size="small"
                        value={segment.a1}
                        onChange={(e) => updateSegmentParameter(index, 'a1', parseFloat(e.target.value))}
                        type="number"
                        fullWidth
                        disabled={index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'a1')}
                        sx={(index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'a1')) ? { '& .MuiOutlinedInput-root': { '& fieldset': { border: 'none' } } } : {}}
                        inputProps={{ 
                          style: { 
                            padding: '4px 8px',
                            backgroundColor: (index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'a1')) ? '#1B254B' : 'transparent',
                            color: (index > 0 || linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'a1')) ? '#A3AED0' : 'inherit',
                          }
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField
                        size="small"
                        value={segment.x2}
                        onChange={(e) => updateSegmentParameter(index, 'x2', parseFloat(e.target.value))}
                        type="number"
                        fullWidth
                        disabled={linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'x2')}
                        sx={linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'x2') ? { '& .MuiOutlinedInput-root': { '& fieldset': { border: 'none' } } } : {}}
                        inputProps={{ 
                          style: { 
                            padding: '4px 8px',
                            backgroundColor: linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'x2') ? '#1B254B' : 'transparent',
                            color: linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'x2') ? '#A3AED0' : 'inherit',
                          }
                        }}
                      />
                      <Tooltip title={linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'x2') 
                        ? `Délier de la cellule ${linkedParameters.find(lp => lp.segmentIndex === index && lp.parameter === 'x2')?.cellReference}`
                        : "Lier à une cellule"}>
                        <IconButton
                          size="small"
                          onClick={() => linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'x2') 
                            ? handleUnlinkParameter(index, 'x2')
                            : handleStartLinking(index, 'x2')}
                          sx={{ ml: 1 }}
                        >
                          {linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'x2') 
                            ? <LinkIcon fontSize="small" color="primary" />
                            : <LinkOffIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField
                        size="small"
                        value={segment.y2}
                        onChange={(e) => updateSegmentParameter(index, 'y2', parseFloat(e.target.value))}
                        type="number"
                        fullWidth
                        disabled={linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'y2')}
                        sx={linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'y2') ? { '& .MuiOutlinedInput-root': { '& fieldset': { border: 'none' } } } : {}}
                        inputProps={{ 
                          style: { 
                            padding: '4px 8px',
                            backgroundColor: linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'y2') ? '#1B254B' : 'transparent',
                            color: linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'y2') ? '#A3AED0' : 'inherit',
                          }
                        }}
                      />
                      <Tooltip title={linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'y2') 
                        ? `Délier de la cellule ${linkedParameters.find(lp => lp.segmentIndex === index && lp.parameter === 'y2')?.cellReference}`
                        : "Lier à une cellule"}>
                        <IconButton
                          size="small"
                          onClick={() => linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'y2')
                            ? handleUnlinkParameter(index, 'y2')
                            : handleStartLinking(index, 'y2')}
                          sx={{ ml: 1 }}
                        >
                          {linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'y2')
                            ? <LinkIcon fontSize="small" color="primary" />
                            : <LinkOffIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField
                        size="small"
                        value={segment.v2}
                        onChange={(e) => updateSegmentParameter(index, 'v2', parseFloat(e.target.value))}
                        type="number"
                        fullWidth
                        disabled={linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'v2') || segment.curveType === 'Linear'}
                        sx={(linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'v2') || segment.curveType === 'Linear') ? { '& .MuiOutlinedInput-root': { '& fieldset': { border: 'none' } } } : {}}
                        inputProps={{ 
                          style: { 
                            padding: '4px 8px',
                            backgroundColor: (linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'v2') || segment.curveType === 'Linear') ? '#1B254B' : 'transparent',
                            color: (linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'v2') || segment.curveType === 'Linear') ? '#A3AED0' : 'inherit',
                          }
                        }}
                      />
                      <Tooltip title={linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'v2') 
                        ? `Délier de la cellule ${linkedParameters.find(lp => lp.segmentIndex === index && lp.parameter === 'v2')?.cellReference}`
                        : segment.curveType === 'Linear' ? "Calculé automatiquement pour les segments linéaires" : "Lier à une cellule"}>
                        <IconButton
                          size="small"
                          onClick={() => linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'v2')
                            ? handleUnlinkParameter(index, 'v2')
                            : handleStartLinking(index, 'v2')}
                          sx={{ ml: 1 }}
                          disabled={segment.curveType === 'Linear'}
                        >
                          {linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'v2')
                            ? <LinkIcon fontSize="small" color="primary" />
                            : <LinkOffIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField
                        size="small"
                        value={segment.a2}
                        onChange={(e) => updateSegmentParameter(index, 'a2', parseFloat(e.target.value))}
                        type="number"
                        fullWidth
                        disabled={linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'a2')}
                        sx={linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'a2') ? { '& .MuiOutlinedInput-root': { '& fieldset': { border: 'none' } } } : {}}
                        inputProps={{ 
                          style: { 
                            padding: '4px 8px',
                            backgroundColor: linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'a2') ? '#1B254B' : 'transparent',
                            color: linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'a2') ? '#A3AED0' : 'inherit',
                          }
                        }}
                      />
                      <Tooltip title={linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'a2') 
                        ? `Délier de la cellule ${linkedParameters.find(lp => lp.segmentIndex === index && lp.parameter === 'a2')?.cellReference}`
                        : "Lier à une cellule"}>
                        <IconButton
                          size="small"
                          onClick={() => linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'a2')
                            ? handleUnlinkParameter(index, 'a2')
                            : handleStartLinking(index, 'a2')}
                          sx={{ ml: 1 }}
                        >
                          {linkedParameters.some(lp => lp.segmentIndex === index && lp.parameter === 'a2')
                            ? <LinkIcon fontSize="small" color="primary" />
                            : <LinkOffIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={segment.curveType || 'Linear'}
                        onChange={(e) => updateSegmentParameter(index, 'curveType', e.target.value as CurveType)}
                        sx={{ height: '32px' }}
                      >
                        {curveTypeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditSegment(segment)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSegment(segment._id)}
                        disabled={camProfile.segments.length <= 1}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  No segments found. Add a segment to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Cell Reference Dialog */}
      <Dialog open={openLinkDialog} onClose={() => setOpenLinkDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Lier le paramètre {linkingParameter.toUpperCase()} du segment {linkingSegmentIndex + 1}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, mt: 1 }}>
            Entrez la référence de la cellule à lier (ex: B2, C3, etc.)
          </Typography>
          <TextField
            label="Référence de cellule"
            fullWidth
            value={cellReference}
            onChange={(e) => setCellReference(e.target.value.toUpperCase())}
            placeholder="Ex: B2"
            autoFocus
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLinkDialog(false)}>Annuler</Button>
          <Button onClick={handleLinkCellReference} variant="contained" color="primary">
            Lier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Segment Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {isNewSegment ? 'Add New Segment' : 'Edit Segment'}
        </DialogTitle>
        <DialogContent>
          {editingSegment && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Start Point
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label={`X1 (${camProfile?.masterUnit || 'degrees'})`}
                      value={editingSegment.x1}
                      onChange={(e) => handleSegmentChange('x1', parseFloat(e.target.value))}
                      type="number"
                      fullWidth
                      disabled={!isNewSegment}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Y1"
                      value={editingSegment.y1}
                      onChange={(e) => handleSegmentChange('y1', parseFloat(e.target.value))}
                      type="number"
                      fullWidth
                      disabled={!isNewSegment}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="V1"
                      value={editingSegment.v1}
                      onChange={(e) => handleSegmentChange('v1', parseFloat(e.target.value))}
                      type="number"
                      fullWidth
                      disabled={!isNewSegment}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="A1"
                      value={editingSegment.a1}
                      onChange={(e) => handleSegmentChange('a1', parseFloat(e.target.value))}
                      type="number"
                      fullWidth
                      disabled={!isNewSegment}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  End Point
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label={`X2 (${camProfile?.masterUnit || 'degrees'})`}
                      value={editingSegment.x2}
                      onChange={(e) => handleSegmentChange('x2', parseFloat(e.target.value))}
                      type="number"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Y2"
                      value={editingSegment.y2}
                      onChange={(e) => handleSegmentChange('y2', parseFloat(e.target.value))}
                      type="number"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="V2"
                      value={editingSegment.v2}
                      onChange={(e) => handleSegmentChange('v2', parseFloat(e.target.value))}
                      type="number"
                      fullWidth
                      disabled={editingSegment.curveType === 'Linear'}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="A2"
                      value={editingSegment.a2}
                      onChange={(e) => handleSegmentChange('a2', parseFloat(e.target.value))}
                      type="number"
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Typography variant="subtitle2" gutterBottom>
                    Curve Type
                  </Typography>
                  <Select
                    value={editingSegment.curveType}
                    onChange={(e) => handleSegmentChange('curveType', e.target.value)}
                  >
                    {curveTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveSegment} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SegmentsTable;