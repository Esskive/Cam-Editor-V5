import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  Alert
} from '@mui/material';
import { Link as LinkIcon, LinkOff as LinkOffIcon } from '@mui/icons-material';
import Spreadsheet from 'react-spreadsheet';
import { SpreadsheetCell, CamProfile, Segment, CellLink } from '../../types';
import { camProfileAPI } from '../../services/api';

interface LinkingInfo {
  active: boolean;
  segmentIndex: number;
  parameter: string;
}

interface CellPosition {
  row: number;
  col: number;
}

interface CamSpreadsheetProps {
  camProfile: CamProfile | null;
  onProfileUpdate: (updatedProfile: CamProfile) => void;
  linkingInfo?: LinkingInfo;
  onLinkComplete?: () => void;
}

// Utility function to debounce function calls
const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
): ((...args: Parameters<F>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<F>): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
};

// Composant pour l'édition des cellules
const CellEditor: React.FC<{
  cell: SpreadsheetCell;
  onChange: (cell: SpreadsheetCell) => void;
  currentData: SpreadsheetCell[][];
  onCalculateValue: (cell: SpreadsheetCell, data: SpreadsheetCell[][]) => number | null;
}> = ({ cell, onChange, currentData, onCalculateValue }) => {
  const [editValue, setEditValue] = useState<string>((cell?.value ?? '').toString());

  useEffect(() => {
    setEditValue((cell?.value ?? '').toString());
  }, [cell?.value]);

  const updateLinkedParameters = (value: number) => {
    if (cell.linkedSegments && cell.linkedSegments.length > 0) {
      const updateEvent = new CustomEvent('updateLinkedCell', {
        detail: {
          row: currentData.findIndex(row => row.includes(cell)),
          col: currentData[currentData.findIndex(row => row.includes(cell))].indexOf(cell),
          value: value
        }
      });
      document.dispatchEvent(updateEvent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditing();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    
    // Créer une nouvelle cellule avec la nouvelle valeur
    const newCell = {
      ...cell,
      value: newValue
    };

    // Si c'est une formule, calculer la valeur
    if (newValue.startsWith('=')) {
      const calculatedValue = onCalculateValue(newCell, currentData);
      if (calculatedValue !== null) {
        updateLinkedParameters(calculatedValue);
      }
    } else {
      // Si c'est une valeur directe
      const numericValue = parseFloat(newValue);
      if (!isNaN(numericValue)) {
        updateLinkedParameters(numericValue);
      }
    }

    onChange(newCell);
  };

  const finishEditing = () => {
    const newCell = {
      ...cell,
      value: editValue
    };

    // Si c'est une formule, calculer la valeur
    if (editValue.startsWith('=')) {
      const calculatedValue = onCalculateValue(newCell, currentData);
      if (calculatedValue !== null) {
        updateLinkedParameters(calculatedValue);
      }
    } else {
      // Si c'est une valeur directe
      const numericValue = parseFloat(editValue);
      if (!isNaN(numericValue)) {
        updateLinkedParameters(numericValue);
      }
    }

    onChange(newCell);
  };

  return (
    <input
      type="text"
      value={editValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onBlur={finishEditing}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        padding: '0 4px',
        background: 'white',
        fontFamily: 'inherit',
        fontSize: 'inherit'
      }}
      autoFocus
    />
  );
};

// Types augmentés pour react-spreadsheet
interface SpreadsheetProps {
  data: SpreadsheetCell[][];
  onChange: (data: SpreadsheetCell[][]) => void;
  cellRenderer?: (props: any) => React.ReactNode;
  contextMenu?: (cell: SpreadsheetCell | null, row: number, col: number) => { label: string; action: () => void }[];
  editComponent?: (props: any) => React.ReactNode;
}

const EnhancedSpreadsheet = Spreadsheet as React.ComponentType<SpreadsheetProps>;

// Hook personnalisé pour la liaison des cellules
const useCellLinking = (
  data: SpreadsheetCell[][],
  setData: React.Dispatch<React.SetStateAction<SpreadsheetCell[][]>>,
  camProfile: CamProfile | null,
  onProfileUpdate: (updatedProfile: CamProfile) => void,
  getCalculatedCellValue: (cell: SpreadsheetCell, currentData: SpreadsheetCell[][]) => number | null
) => {
  return useCallback((row: number, col: number, segmentIndex: number, parameter: string) => {
    console.log(`Linking cell at row ${row}, col ${col} to segment ${segmentIndex}, parameter ${parameter}`);
    
    if (!camProfile) return;

    // Créer une copie des données
    const newData = [...data];
    const currentCell = newData[row][col] || { value: null };
    
    // Vérifier si le paramètre est déjà lié à une autre cellule
    let cellToUnlink: { row: number; col: number } | null = null;
    newData.forEach((r, rowIndex) => {
      r.forEach((cell, colIndex) => {
        if (cell?.linkedSegments?.some(link => 
          link.segmentIndex === segmentIndex && link.parameter === parameter
        )) {
          cellToUnlink = {
            row: rowIndex,
            col: colIndex
          };
        }
      });
    });

    // Si le paramètre était lié à une autre cellule, le délier
    if (cellToUnlink !== null) {
      const { row: unlinkRow, col: unlinkCol } = cellToUnlink;
      const cell = newData[unlinkRow][unlinkCol];
      if (cell && cell.linkedSegments) {
        cell.linkedSegments = cell.linkedSegments.filter(
          link => !(link.segmentIndex === segmentIndex && link.parameter === parameter)
        );
        if (cell.linkedSegments.length === 0) {
          cell.linkedSegments = undefined;
          cell.readOnly = false;
        }
      }
    }

    // Créer ou mettre à jour les liens de la cellule cible
    const existingLinks = currentCell.linkedSegments || [];
    const newLink: CellLink = { segmentIndex, parameter };
    
    // Vérifier si le lien n'existe pas déjà
    if (!existingLinks.some(link => 
      link.segmentIndex === segmentIndex && link.parameter === parameter
    )) {
      existingLinks.push(newLink);
    }

    // Calculer la valeur à appliquer
    const calculatedValue = getCalculatedCellValue(currentCell, newData);
    const numericValue = calculatedValue !== null ? calculatedValue : 
      (typeof currentCell.value === 'number' ? currentCell.value : 
      parseFloat(currentCell.value?.toString() || '0'));

    // Mettre à jour la cellule
    newData[row][col] = {
      ...currentCell,
      linkedSegments: existingLinks,
      value: currentCell.value ?? numericValue.toString(),
      calculatedValue: numericValue
    };

    // Mettre à jour le segment avec la nouvelle valeur
    const updatedSegments = [...camProfile.segments];
    if (!isNaN(numericValue)) {
      updatedSegments[segmentIndex] = {
        ...updatedSegments[segmentIndex],
        [parameter]: numericValue
      };
    }

    // Mettre à jour le state local
    setData(newData);

    // Mettre à jour le profil
    const updatedProfile = {
      ...camProfile,
      segments: updatedSegments,
      spreadsheetData: newData
    };
    onProfileUpdate(updatedProfile);
  }, [camProfile, data, getCalculatedCellValue, onProfileUpdate, setData]);
};

export const CamSpreadsheet: React.FC<CamSpreadsheetProps> = ({
  camProfile,
  onProfileUpdate,
  linkingInfo,
  onLinkComplete,
}) => {
  const [data, setData] = useState<SpreadsheetCell[][]>([]);

  // Function to get the calculated value from a cell, handling formulas
  const getCalculatedCellValue = useCallback((cell: SpreadsheetCell, currentData: SpreadsheetCell[][]): number | null => {
    if (!cell) return null;
    
    // Si la cellule a une valeur calculée, l'utiliser
    if (cell.calculatedValue !== undefined) {
      console.log(`Using calculated value: ${cell.calculatedValue}`);
      return cell.calculatedValue;
    }
    
    // Si la cellule a une formule, l'évaluer
    if (cell.formula || (typeof cell.value === 'string' && cell.value.startsWith('='))) {
      try {
        // Get the formula string without the equals sign
        const formulaStr = cell.formula || (cell.value as string).substring(1);
        console.log(`Evaluating formula: ${formulaStr}`);
        
        // Si la formule est vide ou incomplète, retourner null
        if (!formulaStr || formulaStr.length <= 1) {
          console.log('Formula is empty or incomplete');
          return null;
        }

        // Vérifier si la formule se termine par un opérateur
        if (formulaStr.match(/[+\-*/]$/)) {
          console.log('Formula ends with an operator, returning null');
          return null;
        }
        
        // Replace cell references (like A1, B2) with their values
        const cellRefRegex = /([A-Z]+)(\d+)/g;
        let evaluatedFormula = formulaStr;
        let hasValidReferences = false;
        
        evaluatedFormula = evaluatedFormula.replace(cellRefRegex, (match, colStr, rowStr) => {
          // Convert column letter to index (A=0, B=1, C=2, etc.)
          let colIndex = 0;
          for (let i = 0; i < colStr.length; i++) {
            colIndex = colIndex * 26 + (colStr.charCodeAt(i) - 'A'.charCodeAt(0));
          }
          
          // Convert row string to index (1-based to 0-based)
          const rowIndex = parseInt(rowStr, 10) - 1;
          
          // Get the cell value
          if (rowIndex >= 0 && rowIndex < currentData.length && 
              colIndex >= 0 && colIndex < (currentData[rowIndex]?.length || 0)) {
            const refCell = currentData[rowIndex][colIndex];
            if (refCell) {
              hasValidReferences = true;
              // Si la cellule référencée a une valeur calculée, l'utiliser
              if (refCell.calculatedValue !== undefined) {
                return refCell.calculatedValue.toString();
              }
              
              // Si c'est une valeur numérique directe
              if (typeof refCell.value === 'number') {
                return refCell.value.toString();
              }
              
              // Si c'est une chaîne qui peut être convertie en nombre
              if (typeof refCell.value === 'string' && !refCell.value.startsWith('=')) {
                const numValue = parseFloat(refCell.value);
                if (!isNaN(numValue)) {
                  return numValue.toString();
                }
              }
            }
          }
          return '0'; // Valeur par défaut si la référence n'est pas trouvée
        });
        
        // Si la formule ne contient pas de références valides, retourner null
        if (!hasValidReferences) {
          console.log('No valid references found in formula');
          return null;
        }
        
        console.log(`Evaluated formula: ${evaluatedFormula}`);
        
        // Vérifier si la formule est valide avant de l'évaluer
        if (!/^[\d\s+\-*/().]+$/.test(evaluatedFormula)) {
          console.log('Invalid formula characters detected');
          return null;
        }
        
        // Create a function that returns the evaluated formula
        const evalFunc = new Function(`return ${evaluatedFormula}`);
        const result = evalFunc();
        
        // Check if the result is a number
        if (typeof result === 'number' && !isNaN(result)) {
          console.log(`Formula result: ${result}`);
          return result;
        }
      } catch (error) {
        console.error('Error evaluating formula:', error);
      }
      return null;
    }
    
    // Si la cellule a une valeur directe
    if (cell.value !== null && cell.value !== undefined) {
      // Convert to number
      const numValue = typeof cell.value === 'string' ? parseFloat(cell.value) : (cell.value as number);
      if (!isNaN(numValue)) {
        console.log(`Using direct value: ${numValue}`);
        return numValue;
      }
    }
    
    console.log('No valid value found for cell');
    return null;
  }, []);

  // Modifier le hook useCellLinking pour inclure la confirmation
  const linkCell = useCellLinking(
    data,
    setData,
    camProfile,
    onProfileUpdate,
    getCalculatedCellValue
  );

  const getCellValueFromSegment = (segmentIndex: number, parameter: string): number | null => {
    if (!camProfile || !camProfile.segments || !camProfile.segments[segmentIndex]) {
      return null;
    }
    
    const segment = camProfile.segments[segmentIndex];
    return segment[parameter as keyof typeof segment] as number;
  };
  
  // Use a ref to store the debounced function
  const debouncedUpdateRef = useRef<(newData: SpreadsheetCell[][]) => void>(
    debounce(async (newData: SpreadsheetCell[][]) => {
      console.log("Debounced spreadsheet data update");

      if (!camProfile) return;

      let profileChanged = false;
      const updatedProfile = { ...camProfile };
      const updatedSegments = [...updatedProfile.segments];

      // Parcourir toutes les cellules pour trouver celles qui sont liées
      newData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell && cell.linkedSegments) {
            cell.linkedSegments.forEach(link => {
              const segmentIndex = link.segmentIndex;
              const parameter = link.parameter;
              const value = cell.calculatedValue !== undefined ? cell.calculatedValue : parseFloat(cell.value?.toString() || '0');

              if (!isNaN(value)) {
                // Mettre à jour le paramètre du segment
                updatedSegments[segmentIndex] = {
                  ...updatedSegments[segmentIndex],
                  [parameter]: value
                };

                // Si c'est un paramètre de fin (x2, y2, v2, a2) et qu'il y a un segment suivant
                if (['x2', 'y2', 'v2', 'a2'].includes(parameter) && segmentIndex < updatedSegments.length - 1) {
                  // Mettre à jour le paramètre correspondant du segment suivant
                  const nextSegmentIndex = segmentIndex + 1;
                  const nextParameter = parameter.replace('2', '1'); // Convertir x2 en x1, y2 en y1, etc.
                  
                  updatedSegments[nextSegmentIndex] = {
                    ...updatedSegments[nextSegmentIndex],
                    [nextParameter]: value
                  };
                }

                profileChanged = true;
              }
            });
          }
        });
      });

      if (profileChanged) {
        console.log("Updating profile with new segment values");
        const finalProfile = {
          ...updatedProfile,
          segments: updatedSegments,
          spreadsheetData: newData
        };
        onProfileUpdate(finalProfile);
      }
    }, 300)
  );

  // Initialize spreadsheet data
  useEffect(() => {
    if (camProfile?.spreadsheetData) {
      setData(camProfile.spreadsheetData);
    } else {
      // Create a default 10x10 spreadsheet
      const defaultData: SpreadsheetCell[][] = Array(10)
        .fill(null)
        .map(() =>
          Array(10)
            .fill(null)
            .map(() => ({ value: null }))
        );
      setData(defaultData);
    }
  }, [camProfile?._id]); // Ne se déclenche que lorsque l'ID du profil change

  // Update the debounced function
  useEffect(() => {
    debouncedUpdateRef.current = debounce(async (newData: SpreadsheetCell[][]) => {
      console.log("Debounced spreadsheet data update");
      
      if (camProfile) {
        let updatedProfile = { ...camProfile };
        let profileChanged = false;
        
        // Check each cell for changes
        newData.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            if (!cell || !cell.linkedSegments || cell.linkedSegments.length === 0 || cell.isEditing) {
              return;
            }

            // Obtenir la valeur calculée de la cellule
            const calculatedValue = getCalculatedCellValue(cell, newData);
            console.log(`Calculated value for cell: ${calculatedValue}`);
            
            if (calculatedValue !== null) {
              // Mettre à jour chaque segment lié
              cell.linkedSegments.forEach((link: CellLink) => {
                console.log(`Found linked cell at row ${rowIndex}, col ${colIndex}`);
                console.log(`Linked to segment ${link.segmentIndex}, parameter ${link.parameter}`);

                if (updatedProfile.segments[link.segmentIndex]) {
                  const currentSegmentValue = updatedProfile.segments[link.segmentIndex][link.parameter as keyof Segment];
                  console.log(`Current segment value: ${currentSegmentValue}`);
                  
                  // Mettre à jour uniquement le paramètre spécifié
                  updatedProfile.segments[link.segmentIndex] = {
                    ...updatedProfile.segments[link.segmentIndex],
                    [link.parameter]: calculatedValue
                  };
                  
                  profileChanged = true;
                  console.log(`Updated segment ${link.segmentIndex} parameter ${link.parameter} to ${calculatedValue}`);
                }
              });
            }
          });
        });
        
        if (profileChanged) {
          console.log("Updating profile with new segment values");
          const finalProfile = {
            ...updatedProfile,
            spreadsheetData: newData
          };
          onProfileUpdate(finalProfile);
        }
      }
    }, 300);
  }, [camProfile, onProfileUpdate]);

  const handleDataChange = (newData: SpreadsheetCell[][]) => {
    console.log("Spreadsheet data changed");
    
    // Create a copy of the data to work with
    const updatedData = [...newData];
    
    // Vérifier les cellules modifiées et mettre à jour les segments immédiatement
    if (camProfile) {
      let updatedProfile = { ...camProfile };
      let profileChanged = false;

      // Première passe : calculer toutes les formules
      updatedData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell?.formula || (typeof cell?.value === 'string' && cell?.value.startsWith('='))) {
            const calculatedValue = getCalculatedCellValue(cell, updatedData);
            if (calculatedValue !== null) {
              updatedData[rowIndex][colIndex] = {
                ...cell,
                calculatedValue: calculatedValue
              };
            }
          }
        });
      });

      // Deuxième passe : mettre à jour les segments liés
      updatedData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          // Ignorer les cellules qui n'ont pas de liens
          if (!cell?.linkedSegments?.length) {
            return;
          }

          // Obtenir la valeur à utiliser
          let valueToUse: number | null = null;

          // Si la cellule a une valeur calculée (formule ou valeur directe), l'utiliser
          if (cell.calculatedValue !== undefined) {
            valueToUse = cell.calculatedValue;
          } else if (typeof cell.value === 'string' && !cell.value.startsWith('=')) {
            // Si c'est une valeur directe
            const directValue = parseFloat(cell.value);
            valueToUse = !isNaN(directValue) ? directValue : null;
          }

          console.log(`Cell [${rowIndex}, ${colIndex}] value: ${cell.value}, calculatedValue: ${valueToUse}`);
          
          if (valueToUse !== null) {
            // Mettre à jour chaque segment lié
            cell.linkedSegments.forEach((link: CellLink) => {
              if (updatedProfile.segments[link.segmentIndex]) {
                console.log(`Updating segment ${link.segmentIndex} parameter ${link.parameter} to ${valueToUse}`);
                
                // Mettre à jour le paramètre du segment
                updatedProfile.segments[link.segmentIndex] = {
                  ...updatedProfile.segments[link.segmentIndex],
                  [link.parameter]: valueToUse
                };
                
                profileChanged = true;

                // Si c'est un paramètre de fin (x2, y2, v2, a2), mettre à jour le paramètre de début du segment suivant
                if (['x2', 'y2', 'v2', 'a2'].includes(link.parameter) && link.segmentIndex < updatedProfile.segments.length - 1) {
                  const nextSegmentIndex = link.segmentIndex + 1;
                  const nextParameter = link.parameter.replace('2', '1');
                  updatedProfile.segments[nextSegmentIndex] = {
                    ...updatedProfile.segments[nextSegmentIndex],
                    [nextParameter]: valueToUse
                  };
                }
              }
            });
          }
        });
      });

      if (profileChanged) {
        console.log("Profile changed, updating immediately...");
        const finalProfile = {
          ...updatedProfile,
          spreadsheetData: updatedData
        };
        onProfileUpdate(finalProfile);
      }
    }

    setData(updatedData);
  };

  const handleSaveSpreadsheet = async () => {
    if (!camProfile) return;

    try {
      // Préparer les données à sauvegarder en préservant les liens
      const dataToSave = data.map(row => 
        row.map(cell => {
          if (!cell) return { value: null };
          
          // Préserver toutes les propriétés importantes de la cellule
          return {
            value: cell.value,
            formula: cell.formula,
            calculatedValue: cell.calculatedValue,
            linkedSegments: cell.linkedSegments,
            isEditing: false // Réinitialiser l'état d'édition
          };
        })
      );

      // Créer un profil mis à jour avec les dernières valeurs
      const updatedProfile = {
        ...camProfile,
        spreadsheetData: dataToSave,
        segments: camProfile.segments.map((segment, index) => {
          // Trouver toutes les cellules liées à ce segment
          const linkedCells = dataToSave.flatMap((row, rowIndex) =>
            row.map((cell, colIndex) => {
              if (cell?.linkedSegments?.some(link => link.segmentIndex === index)) {
                const link = cell.linkedSegments.find(link => link.segmentIndex === index);
                return {
                  parameter: link?.parameter || '',
                  value: cell.calculatedValue || getCalculatedCellValue(cell, dataToSave)
                };
              }
              return null;
            }).filter((cell): cell is { parameter: string; value: number | null } => cell !== null)
          );

          // Mettre à jour uniquement les paramètres liés du segment
          const updatedSegment = { ...segment };
          linkedCells.forEach(({ parameter, value }) => {
            if (value !== null) {
              // Vérifier que le paramètre existe dans le segment
              if (parameter in updatedSegment) {
                (updatedSegment as any)[parameter] = value;
              }
            }
          });

          return updatedSegment;
        })
      };

      // Sauvegarder le profil complet
      const savedProfile = await camProfileAPI.updateProfile(updatedProfile._id || '', updatedProfile);
      
      // Mettre à jour l'interface avec le profil sauvegardé
      onProfileUpdate(savedProfile);
      
      console.log("Feuille de calcul et segments sauvegardés avec succès");
    } catch (error) {
      console.error('Error saving spreadsheet data:', error);
      // TODO: Afficher une notification d'erreur à l'utilisateur
    }
  };

  // Unlink a cell from a segment parameter
  const handleUnlinkCell = (row: number, col: number, segmentIndex?: number, parameter?: string) => {
    console.log(`Attempting to unlink cell at [${row}, ${col}] from segment ${segmentIndex}, parameter ${parameter}`);
    
    if (row < 0 || col < 0 || row >= data.length || col >= data[0]?.length) {
      console.error(`Invalid cell coordinates: [${row}, ${col}]`);
      return;
    }

    const newData = [...data];
    const cell = newData[row][col];
    
    if (!cell) {
      console.error(`Cell at [${row}, ${col}] is null or undefined`);
      return;
    }

    if (!cell.linkedSegments || cell.linkedSegments.length === 0) {
      console.log(`Cell at [${row}, ${col}] has no linked segments`);
      return;
    }

    console.log('Current cell linkedSegments:', cell.linkedSegments);
    
    let updatedLinks = [...cell.linkedSegments];
    
    if (segmentIndex !== undefined && parameter !== undefined) {
      // Supprimer uniquement le lien spécifique
      updatedLinks = updatedLinks.filter(
        link => !(link.segmentIndex === segmentIndex && link.parameter === parameter)
      );
      console.log(`Filtered links for segment ${segmentIndex}, parameter ${parameter}:`, updatedLinks);
    } else {
      // Supprimer tous les liens
      updatedLinks = [];
      console.log('Removing all links from cell');
    }
    
    // Mettre à jour la cellule
    newData[row][col] = {
      ...cell,
      linkedSegments: updatedLinks.length > 0 ? updatedLinks : undefined,
      value: cell.calculatedValue !== undefined ? cell.calculatedValue.toString() : cell.value
    };
    
    // Mettre à jour le profil
    if (camProfile) {
      const updatedProfile = {
        ...camProfile,
        spreadsheetData: newData
      };
      onProfileUpdate(updatedProfile);
    }
    
    setData(newData);
    
    console.log(`Successfully unlinked cell at [${row}, ${col}]`);
  };
  
  // Listen for the custom events to link and unlink cells
  useEffect(() => {
    const handleLinkCellEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{
        row: number;
        col: number;
        segmentIndex: number;
        parameter: string;
      }>;
      const { row, col, segmentIndex, parameter } = customEvent.detail;
      linkCell(row, col, segmentIndex, parameter);
    };
    
    const handleUnlinkCellEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{
        row: number;
        col: number;
        segmentIndex: number;
        parameter: string;
      }>;

      if (!customEvent.detail) {
        console.error('Event detail is missing');
        return;
      }

      const { row, col, segmentIndex, parameter } = customEvent.detail;

      console.log('Received unlink event:', {
        row,
        col,
        segmentIndex,
        parameter
      });

      if (typeof row !== 'number' || typeof col !== 'number') {
        console.error('Invalid row or col in event:', { row, col });
        return;
      }

      handleUnlinkCell(row, col, segmentIndex, parameter);
    };

    const handleUpdateLinkedCellEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{
        row: number;
        col: number;
        value: number;
      }>;
      const { row, col, value } = customEvent.detail;
      
      if (!camProfile) return;
      
      const cell = data[row][col];
      
      if (cell?.linkedSegments) {
        const updatedSegments = [...camProfile.segments];
        
        cell.linkedSegments.forEach(link => {
          // Mettre à jour le segment actuel
          updatedSegments[link.segmentIndex] = {
            ...updatedSegments[link.segmentIndex],
            [link.parameter]: value
          };
          
          // Si c'est un paramètre de fin, mettre à jour le début du segment suivant
          if (['x2', 'y2', 'v2', 'a2'].includes(link.parameter) && link.segmentIndex < updatedSegments.length - 1) {
            const nextSegmentIndex = link.segmentIndex + 1;
            const nextParameter = link.parameter.replace('2', '1');
            updatedSegments[nextSegmentIndex] = {
              ...updatedSegments[nextSegmentIndex],
              [nextParameter]: value
            };
          }
        });
        
        // Mettre à jour le profil immédiatement
        const updatedProfile = {
          ...camProfile,
          segments: updatedSegments
        };
        
        onProfileUpdate(updatedProfile);
      }
    };
    
    document.addEventListener('linkCell', handleLinkCellEvent);
    document.addEventListener('unlinkCell', handleUnlinkCellEvent);
    document.addEventListener('updateLinkedCell', handleUpdateLinkedCellEvent);
    
    return () => {
      document.removeEventListener('linkCell', handleLinkCellEvent);
      document.removeEventListener('unlinkCell', handleUnlinkCellEvent);
      document.removeEventListener('updateLinkedCell', handleUpdateLinkedCellEvent);
    };
  }, [data, camProfile, linkCell, handleUnlinkCell]);
  
  // Handle cell click when in linking mode
  const handleCellClick = (row: number, col: number) => {
    if (linkingInfo?.active && linkingInfo.segmentIndex >= 0 && linkingInfo.parameter) {
      linkCell(row, col, linkingInfo.segmentIndex, linkingInfo.parameter);
    }
  };

  // Fonction utilitaire pour calculer la valeur d'affichage d'une cellule
  const calculateDisplayValue = useCallback((cell: SpreadsheetCell | null, currentData: SpreadsheetCell[][]) => {
    if (!cell) return '';
    
    // Si la cellule a une valeur calculée, l'utiliser
    if (cell.calculatedValue !== undefined) {
      return cell.calculatedValue.toString();
    }
    
    // Si la cellule a une formule, afficher la formule pendant la saisie
    if (cell.formula || (typeof cell.value === 'string' && cell.value.startsWith('='))) {
      return cell.value?.toString() || '';
    }
    
    if (cell.value === null || cell.value === undefined) {
      return '';
    }
    
    return cell.value.toString();
  }, []);

  // Custom cell renderer to show linked cells differently
  const cellRenderer = useCallback((props: any) => {
    const { cell } = props;
    
    return (
      <div 
        style={{ 
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      >
        {props.children}
      </div>
    );
  }, []);

  // Context menu for cells
  const getContextMenu = useCallback((cell: SpreadsheetCell | null, row: number, col: number) => {
    if (cell && cell.linkedSegments && cell.linkedSegments.length > 0) {
      return [
        {
          label: 'Délier du paramètre de segment',
          action: () => handleUnlinkCell(row, col),
        },
      ];
    }
    return [];
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#111C44' }}>
        <Box>
          <Typography variant="h6">Feuille de calcul</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleSaveSpreadsheet}
            disabled={!camProfile}
          >
            Enregistrer
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, flexGrow: 1, overflow: 'auto', bgcolor: '#111C44' }}>
        <EnhancedSpreadsheet
          data={data}
          onChange={(newData: any) => handleDataChange(newData as SpreadsheetCell[][])}
          cellRenderer={cellRenderer}
          contextMenu={getContextMenu}
          editComponent={(props: any) => (
            <CellEditor
              {...props}
              currentData={data}
              onCalculateValue={getCalculatedCellValue}
            />
          )}
        />
      </Paper>
    </Box>
  );
};