// Segment interface
export interface Segment {
  _id?: string;
  x1: number;
  y1: number;
  v1: number;
  a1: number;
  x2: number;
  y2: number;
  v2: number;
  a2: number;
  curveType: CurveType;
}

// Cell link interface
export interface CellLink {
  segmentIndex: number;
  parameter: string;
}

// Cam Profile interface
export interface CamProfile {
  _id?: string;
  name: string;
  description: string;
  masterUnit: string;
  slaveUnit: string;
  segments: Segment[];
  spreadsheetData: SpreadsheetCell[][];
  createdAt: Date;
  updatedAt: Date;
}

// Curve types
export type CurveType = 
  | 'Linear'
  | 'Polynomial3'
  | 'Polynomial5'
  | 'Sine'
  | 'Cosine'
  | 'Cycloid'
  | 'ModifiedSine'
  | 'ModifiedTrapezoid'
  | 'Sinusoidal';

// Curve type options for dropdown
export const curveTypeOptions: { value: CurveType; label: string }[] = [
  { value: 'Linear', label: 'Linear' },
  { value: 'Polynomial3', label: 'Polynomial 3' },
  { value: 'Polynomial5', label: 'Polynomial 5' },
  { value: 'Sine', label: 'Sine' },
  { value: 'Cosine', label: 'Cosine' },
  { value: 'Cycloid', label: 'Cycloid' },
  { value: 'ModifiedSine', label: 'Modified Sine' },
  { value: 'ModifiedTrapezoid', label: 'Modified Trapezoid' },
  { value: 'Sinusoidal', label: 'Sinusoidal' }
];

// Unit options
export const unitOptions: { value: string; label: string }[] = [
  { value: 'degrees', label: 'Degrees (°)' },
  { value: 'radians', label: 'Radians (rad)' },
  { value: 'mm', label: 'Millimeters (mm)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'ft', label: 'Feet (ft)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'steps', label: 'Steps' },
  { value: 'pulses', label: 'Pulses' },
  { value: 'revolutions', label: 'Revolutions' },
];

// Cam value point
export interface CamValuePoint {
  x: number;
  position: number;
  velocity: number;
  acceleration: number;
}

// Chart data series
export interface ChartSeries {
  name: string;
  data: number[];
  color?: string;
}

// Chart data
export interface ChartData {
  labels: number[];
  series: ChartSeries[];
}

// Spreadsheet cell
export interface SpreadsheetCell {
  value: string | number | null;
  formula?: string;
  readOnly?: boolean;
  linkedSegments?: {
    segmentIndex: number;
    parameter: string;
  }[];
  calculatedValue?: number;
  isEditing?: boolean;
}

// Spreadsheet data
export type SpreadsheetData = SpreadsheetCell[][];

// Cursor position
export interface CursorPosition {
  x: number;
  position: number;
  velocity: number;
  acceleration: number;
}
