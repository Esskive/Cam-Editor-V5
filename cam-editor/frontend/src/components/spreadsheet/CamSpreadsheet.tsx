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
import * as _ from 'lodash';

interface LinkingInfo {
  active: boolean;
  segmentIndex: number;
  parameter: string;
}

interface CellPosition {
  row: number;
  col: number;
}

interface CellChange {
  row: number;
  col: number;
  value: string;
}

interface CamSpreadsheetProps {
  camProfile: CamProfile | null;
  onProfileUpdate: (updatedProfile: CamProfile) => void;
  linkingInfo?: LinkingInfo;
  onLinkComplete?: () => void;
}

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
    if (!cell || cell.value === null || cell.value === undefined) return null;

    // Si c'est une valeur numérique directe
    if (typeof cell.value === 'number') {
      return cell.value;
    }

    // Si c'est une chaîne
    if (typeof cell.value === 'string') {
      // Si c'est une formule
      if (cell.value.startsWith('=')) {
        try {
          const formulaStr = cell.value.substring(1);
          
          if (!formulaStr || formulaStr.length <= 1) {
            return null;
          }

          if (formulaStr.match(/[+\-*/]$/)) {
            return null;
          }

          const cellRefRegex = /([A-Z]+)(\d+)/g;
          let evaluatedFormula = formulaStr;
          let allReferencesValid = true;
          const processedCells = new Set<string>();

          evaluatedFormula = evaluatedFormula.replace(cellRefRegex, (match, colStr, rowStr) => {
            // Éviter les boucles infinies en vérifiant si on a déjà traité cette cellule
            if (processedCells.has(match)) {
              allReferencesValid = false;
              return '0';
            }
            processedCells.add(match);

            let colIndex = 0;
            for (let i = 0; i < colStr.length; i++) {
              colIndex = colIndex * 26 + (colStr.charCodeAt(i) - 'A'.charCodeAt(0));
            }

            const rowIndex = parseInt(rowStr, 10) - 1;

            if (rowIndex >= 0 && rowIndex < currentData.length &&
                colIndex >= 0 && colIndex < (currentData[rowIndex]?.length || 0)) {
              const refCell = currentData[rowIndex][colIndex];
              
              if (refCell) {
                // Si la cellule référencée a une valeur calculée, l'utiliser
                if (refCell.calculatedValue !== undefined) {
                  return refCell.calculatedValue.toString();
                }
                
                // Sinon, calculer sa valeur
                const refValue = getCalculatedCellValue(refCell, currentData);
                if (refValue !== null) {
                  return refValue.toString();
                }
              }
            }
            
            allReferencesValid = false;
            return '0';
          });

          if (!allReferencesValid) {
            console.error('Invalid cell references in formula:', formulaStr);
            return null;
          }

          if (!/^[\d\s+\-*/().]+$/.test(evaluatedFormula)) {
            console.error('Invalid characters in formula:', evaluatedFormula);
            return null;
          }

          console.log('Evaluating formula:', evaluatedFormula);
          const result = new Function(`return ${evaluatedFormula}`)();
          return typeof result === 'number' && !isNaN(result) ? result : null;

        } catch (error) {
          console.error('Error evaluating formula:', error);
          return null;
        }
      }
      
      // Si c'est une chaîne numérique
      const numValue = parseFloat(cell.value);
      return !isNaN(numValue) ? numValue : null;
    }

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
    _.debounce(async (newData: SpreadsheetCell[][]) => {
      console.log("Debounced spreadsheet data update");

      if (!camProfile) return;

      let profileChanged = false;
      const updatedProfile = { ...camProfile };
      const updatedSegments = [...updatedProfile.segments];
      const processedLinks = new Set<string>(); // Pour éviter les mises à jour en double

      // Première passe : mettre à jour les segments liés aux cellules
      newData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell && cell.linkedSegments) {
            cell.linkedSegments.forEach(link => {
              const segmentIndex = link.segmentIndex;
              const parameter = link.parameter;
              const linkKey = `${segmentIndex}-${parameter}`;

              if (!processedLinks.has(linkKey)) {
                processedLinks.add(linkKey);
                
                // Calculer la valeur à utiliser
                const calculatedValue = getCalculatedCellValue(cell, newData);
                const value = calculatedValue !== null ? calculatedValue : 
                            (cell.calculatedValue !== undefined ? cell.calculatedValue : 
                            parseFloat(cell.value?.toString() || '0'));

                if (!isNaN(value)) {
                  // Mettre à jour le paramètre du segment
                  updatedSegments[segmentIndex] = {
                    ...updatedSegments[segmentIndex],
                    [parameter]: value
                  };
                  profileChanged = true;
                }
              }
            });
          }
        });
      });

      // Deuxième passe : propager les valeurs aux segments suivants
      updatedSegments.forEach((segment, index) => {
        if (index < updatedSegments.length - 1) {
          const nextSegment = updatedSegments[index + 1];
          
          // Pour chaque paramètre de fin
          ['x2', 'y2', 'v2', 'a2'].forEach(endParam => {
            const startParam = endParam.replace('2', '1');
            const nextSegmentIndex = index + 1;
            
            // Vérifier si le paramètre du segment suivant n'est pas lié à une cellule
            const isNextParameterLinked = newData.some(row =>
              row.some(cell =>
                cell?.linkedSegments?.some(link =>
                  link.segmentIndex === nextSegmentIndex && link.parameter === startParam
                )
              )
            );

            if (!isNextParameterLinked) {
              // Copier la valeur du paramètre de fin vers le paramètre de début du segment suivant
              const endValue = segment[endParam as keyof Segment];
              if (typeof endValue === 'number') {
                updatedSegments[nextSegmentIndex] = {
                  ...nextSegment,
                  [startParam]: endValue
                };
                profileChanged = true;
              }
            }
          });
        }
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
    debouncedUpdateRef.current = _.debounce(async (newData: SpreadsheetCell[][]) => {
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
    const updatedData = newData.map(row => [...row]);  // Créer une copie profonde des données
    let profileNeedsUpdate = false;
    let updatedSegments = camProfile ? [...camProfile.segments] : [];
    
    // Fonction pour mettre à jour une cellule et ses dépendances
    const updateCellAndDependencies = (row: number, col: number, processedCells = new Set<string>()) => {
      const cellKey = `${row}-${col}`;
      if (processedCells.has(cellKey)) return;
      processedCells.add(cellKey);

      const cell = updatedData[row][col];
      if (!cell) return;

      // Calculer la nouvelle valeur
      const calculatedValue = getCalculatedCellValue(cell, updatedData);
      if (calculatedValue !== null) {
        cell.calculatedValue = calculatedValue;
        console.log(`Cell [${row},${col}] calculated value: ${calculatedValue}`);
        
        // Si la cellule est liée à des paramètres de segment, les mettre à jour
        if (cell.linkedSegments && cell.linkedSegments.length > 0 && camProfile) {
          cell.linkedSegments.forEach(link => {
            if (updatedSegments[link.segmentIndex]) {
              updatedSegments[link.segmentIndex] = {
                ...updatedSegments[link.segmentIndex],
                [link.parameter]: calculatedValue
              };
              profileNeedsUpdate = true;
              console.log(`Updated segment ${link.segmentIndex} ${link.parameter} to ${calculatedValue}`);

              // Propager aux segments suivants si nécessaire
              if (['x2', 'y2', 'v2', 'a2'].includes(link.parameter) && 
                  link.segmentIndex < updatedSegments.length - 1) {
                const nextSegmentIndex = link.segmentIndex + 1;
                const nextParameter = link.parameter.replace('2', '1');
                
                const isNextParameterLinked = updatedData.some(row =>
                  row.some(cell =>
                    cell?.linkedSegments?.some(link =>
                      link.segmentIndex === nextSegmentIndex && link.parameter === nextParameter
                    )
                  )
                );

                if (!isNextParameterLinked) {
                  console.log(`Propagating ${calculatedValue} to next segment ${nextSegmentIndex} ${nextParameter}`);
                  updatedSegments[nextSegmentIndex] = {
                    ...updatedSegments[nextSegmentIndex],
                    [nextParameter]: calculatedValue
                  };
                  profileNeedsUpdate = true;
                }
              }
            }
          });
        }
      }

      // Trouver et mettre à jour toutes les cellules qui dépendent de celle-ci
      updatedData.forEach((rowData, rowIndex) => {
        rowData.forEach((depCell, colIndex) => {
          if (depCell?.value?.toString().startsWith('=')) {
            const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
            if (depCell.value.toString().includes(cellRef)) {
              updateCellAndDependencies(rowIndex, colIndex, processedCells);
            }
          }
        });
      });
    };

    // Traiter chaque cellule modifiée
    newData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (!data[rowIndex] || !data[rowIndex][colIndex] || data[rowIndex][colIndex].value !== cell.value) {
          console.log(`Processing changed cell [${rowIndex},${colIndex}]: ${cell.value}`);
          updateCellAndDependencies(rowIndex, colIndex);
        }
      });
    });

    setData(updatedData);
    
    // Mettre à jour le profil si nécessaire
    if (profileNeedsUpdate && camProfile) {
      const updatedProfile = {
        ...camProfile,
        segments: updatedSegments,
        spreadsheetData: updatedData
      };
      onProfileUpdate(updatedProfile);
    }
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

  const createEmptyCell = (): SpreadsheetCell => ({
    value: '',
    formula: '',
    calculatedValue: undefined,
    linkedSegments: []
  });

  const evaluateCellValue = (cell: SpreadsheetCell): number | null => {
    if (!cell.value) return null;
    
    // Si c'est une formule
    if (cell.value.toString().startsWith('=')) {
      return cell.calculatedValue || null;
    }
    
    // Si c'est une valeur numérique
    const numValue = parseFloat(cell.value.toString());
    return isNaN(numValue) ? null : numValue;
  };

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