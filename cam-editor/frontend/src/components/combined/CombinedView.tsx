import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import CamProfileGraph from '../graph/CamProfileGraph';
import SegmentsTable from '../segments/SegmentsTable';
import { CamSpreadsheet } from '../spreadsheet/CamSpreadsheet';
import { CamProfile, CamValuePoint, SpreadsheetCell, CellLink } from '../../types';

interface CombinedViewProps {
  camProfile: CamProfile | null;
  showPosition: boolean;
  showVelocity: boolean;
  showAcceleration: boolean;
  onCursorPositionChange: (position: CamValuePoint | null) => void;
  onProfileUpdate: (updatedProfile: CamProfile) => void;
  onTogglePosition?: () => void;
  onToggleVelocity?: () => void;
  onToggleAcceleration?: () => void;
}

interface LinkingInfo {
  active: boolean;
  segmentIndex: number;
  parameter: string;
}

const CombinedView: React.FC<CombinedViewProps> = ({
  camProfile,
  showPosition,
  showVelocity,
  showAcceleration,
  onCursorPositionChange,
  onProfileUpdate,
  onTogglePosition,
  onToggleVelocity,
  onToggleAcceleration,
}) => {
  // State for the active tab in the bottom section
  const [tabValue, setTabValue] = useState(0);
  
  // State for linking segment parameters to spreadsheet cells
  const [linkingInfo, setLinkingInfo] = useState<LinkingInfo>({
    active: false,
    segmentIndex: -1,
    parameter: '',
  });
  
  // State to track linked parameters
  const [linkedParameters, setLinkedParameters] = useState<Array<{segmentIndex: number, parameter: string, cellReference?: string}>>([]);
  
  // Function to convert row and column indices to a cell reference (e.g., "B3")
  const getCellReference = (row: number, col: number): string => {
    // Convert column index to letter (0 = A, 1 = B, etc.)
    const colLetter = String.fromCharCode(65 + col);
    // Convert row index to 1-based number
    const rowNumber = row + 1;
    return `${colLetter}${rowNumber}`;
  };
  
  // Effect to extract linked parameters from spreadsheet data
  useEffect(() => {
    if (!camProfile?.spreadsheetData) return;
    
    const linked: Array<{segmentIndex: number, parameter: string, cellReference: string}> = [];
    
    // Scan all cells in the spreadsheet for linked parameters
    camProfile.spreadsheetData.forEach((row: SpreadsheetCell[], rowIndex: number) => {
      row.forEach((cell: SpreadsheetCell, colIndex: number) => {
        if (cell && cell.linkedSegments && cell.linkedSegments.length > 0) {
          cell.linkedSegments.forEach((link: CellLink) => {
            linked.push({
              segmentIndex: link.segmentIndex,
              parameter: link.parameter,
              cellReference: getCellReference(rowIndex, colIndex)
            });
          });
        }
      });
    });
    
    setLinkedParameters(linked);
  }, [camProfile?.spreadsheetData]);
  
  // Handle linking a segment parameter to a spreadsheet cell
  const handleLinkParameter = (segmentIndex: number, parameter: string) => {
    console.log('Starting linking mode:', { segmentIndex, parameter });
    
    // Mettre à jour l'état de liaison
    setLinkingInfo({
      active: false,
      segmentIndex,
      parameter,
    });
  };

  // Listen for linkCell and unlinkCell events
  useEffect(() => {
    const handleLinkCellEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { row, col, segmentIndex, parameter } = customEvent.detail;
      
      // Create a cell reference (e.g., "B3")
      const cellRef = getCellReference(row, col);
      
      // Update the linkedParameters array
      setLinkedParameters(prev => {
        // Remove any existing link for this parameter
        const filtered = prev.filter(p => 
          !(p.segmentIndex === segmentIndex && p.parameter === parameter)
        );
        
        // Add the new link
        return [
          ...filtered,
          {
            segmentIndex,
            parameter,
            cellReference: cellRef
          }
        ];
      });
      
      console.log(`Linked segment ${segmentIndex} parameter ${parameter} to cell ${cellRef}`);
    };
    
    const handleUnlinkCellEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { segmentIndex, parameter } = customEvent.detail;
      
      // Remove the link from the linkedParameters array
      setLinkedParameters(prev => 
        prev.filter(p => !(p.segmentIndex === segmentIndex && p.parameter === parameter))
      );
      
      console.log(`Unlinked segment ${segmentIndex} parameter ${parameter}`);
    };
    
    // Add event listeners
    document.addEventListener('linkCell', handleLinkCellEvent);
    document.addEventListener('unlinkCell', handleUnlinkCellEvent);
    
    // Clean up
    return () => {
      document.removeEventListener('linkCell', handleLinkCellEvent);
      document.removeEventListener('unlinkCell', handleUnlinkCellEvent);
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 2, 
      p: 0.5,
      width: '100%'
    }}>
      <Paper sx={{ p: 2, bgcolor: '#111C44', width: '100%', height: '600px' }}>
        <CamProfileGraph
          camProfile={camProfile}
          showPosition={showPosition}
          showVelocity={showVelocity}
          showAcceleration={showAcceleration}
          onCursorPositionChange={onCursorPositionChange}
          onTogglePosition={onTogglePosition}
          onToggleVelocity={onToggleVelocity}
          onToggleAcceleration={onToggleAcceleration}
        />
      </Paper>
      
      <Paper sx={{ p: 2, bgcolor: '#111C44', width: '100%' }}>
        <SegmentsTable
          camProfile={camProfile}
          onProfileUpdate={onProfileUpdate}
          onLinkParameter={handleLinkParameter}
          linkedParameters={linkingInfo.active ? [] : linkedParameters}
        />
      </Paper>
      
      <Paper sx={{ p: 2, bgcolor: '#111C44', width: '100%' }}>
        <CamSpreadsheet
          camProfile={camProfile}
          onProfileUpdate={onProfileUpdate}
          linkingInfo={linkingInfo}
          onLinkComplete={() => setLinkingInfo({ active: false, segmentIndex: -1, parameter: '' })}
        />
      </Paper>
    </Box>
  );
};

export default CombinedView;
