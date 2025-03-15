/**
 * Utility functions for cam profile calculations
 */

// Linear curve calculation
export const calculateLinear = (
  x: number,
  x1: number,
  y1: number,
  v1: number,
  a1: number,
  x2: number,
  y2: number,
  v2: number,
  a2: number
) => {
  // Normalize x to range [0, 1]
  const s = (x - x1) / (x2 - x1);
  
  // Position
  const position = y1 + (y2 - y1) * s;
  
  // Velocity
  const velocity = (y2 - y1) / (x2 - x1);
  
  // Acceleration
  const acceleration = 0;
  
  return { position, velocity, acceleration };
};

// Polynomial 3 curve calculation
export const calculatePolynomial3 = (
  x: number,
  x1: number,
  y1: number,
  v1: number,
  a1: number,
  x2: number,
  y2: number,
  v2: number,
  a2: number
) => {
  // Normalize x to range [0, 1]
  const s = (x - x1) / (x2 - x1);
  
  // Calculate coefficients
  const c0 = y1;
  const c1 = v1 * (x2 - x1);
  const c2 = 3 * (y2 - y1) - 2 * v1 * (x2 - x1) - v2 * (x2 - x1);
  const c3 = 2 * (y1 - y2) + v1 * (x2 - x1) + v2 * (x2 - x1);
  
  // Position
  const position = c0 + c1 * s + c2 * s * s + c3 * s * s * s;
  
  // Velocity
  const velocity = (c1 + 2 * c2 * s + 3 * c3 * s * s) / (x2 - x1);
  
  // Acceleration
  const acceleration = (2 * c2 + 6 * c3 * s) / ((x2 - x1) * (x2 - x1));
  
  return { position, velocity, acceleration };
};

// Polynomial 5 curve calculation
export const calculatePolynomial5 = (
  x: number,
  x1: number,
  y1: number,
  v1: number,
  a1: number,
  x2: number,
  y2: number,
  v2: number,
  a2: number
) => {
  // Normalize x to range [0, 1]
  const s = (x - x1) / (x2 - x1);
  
  // Calculate coefficients
  const c0 = y1;
  const c1 = v1 * (x2 - x1);
  const c2 = a1 * (x2 - x1) * (x2 - x1) / 2;
  const c3 = 10 * (y2 - y1) - 6 * v1 * (x2 - x1) - 4 * v2 * (x2 - x1) - 1.5 * a1 * (x2 - x1) * (x2 - x1) + 0.5 * a2 * (x2 - x1) * (x2 - x1);
  const c4 = -15 * (y2 - y1) + 8 * v1 * (x2 - x1) + 7 * v2 * (x2 - x1) + 1.5 * a1 * (x2 - x1) * (x2 - x1) - a2 * (x2 - x1) * (x2 - x1);
  const c5 = 6 * (y2 - y1) - 3 * v1 * (x2 - x1) - 3 * v2 * (x2 - x1) - 0.5 * a1 * (x2 - x1) * (x2 - x1) + 0.5 * a2 * (x2 - x1) * (x2 - x1);
  
  // Position
  const position = c0 + c1 * s + c2 * s * s + c3 * s * s * s + c4 * s * s * s * s + c5 * s * s * s * s * s;
  
  // Velocity
  const velocity = (c1 + 2 * c2 * s + 3 * c3 * s * s + 4 * c4 * s * s * s + 5 * c5 * s * s * s * s) / (x2 - x1);
  
  // Acceleration
  const acceleration = (2 * c2 + 6 * c3 * s + 12 * c4 * s * s + 20 * c5 * s * s * s) / ((x2 - x1) * (x2 - x1));
  
  return { position, velocity, acceleration };
};

// Sine curve calculation
export const calculateSine = (
  x: number,
  x1: number,
  y1: number,
  v1: number,
  a1: number,
  x2: number,
  y2: number,
  v2: number,
  a2: number
) => {
  // Normalize x to range [0, 1]
  const s = (x - x1) / (x2 - x1);
  
  // Position
  const position = y1 + (y2 - y1) * (1 - Math.cos(Math.PI * s)) / 2;
  
  // Velocity
  const velocity = (y2 - y1) * Math.PI * Math.sin(Math.PI * s) / (2 * (x2 - x1));
  
  // Acceleration
  const acceleration = (y2 - y1) * Math.PI * Math.PI * Math.cos(Math.PI * s) / (2 * (x2 - x1) * (x2 - x1));
  
  return { position, velocity, acceleration };
};

// Cosine curve calculation
export const calculateCosine = (
  x: number,
  x1: number,
  y1: number,
  v1: number,
  a1: number,
  x2: number,
  y2: number,
  v2: number,
  a2: number
) => {
  // Normalize x to range [0, 1]
  const s = (x - x1) / (x2 - x1);
  
  // Position
  const position = y1 + (y2 - y1) * (1 - Math.cos(Math.PI * s)) / 2;
  
  // Velocity
  const velocity = (y2 - y1) * Math.PI * Math.sin(Math.PI * s) / (2 * (x2 - x1));
  
  // Acceleration
  const acceleration = (y2 - y1) * Math.PI * Math.PI * Math.cos(Math.PI * s) / (2 * (x2 - x1) * (x2 - x1));
  
  return { position, velocity, acceleration };
};

// Cycloid curve calculation
export const calculateCycloid = (
  x: number,
  x1: number,
  y1: number,
  v1: number,
  a1: number,
  x2: number,
  y2: number,
  v2: number,
  a2: number
) => {
  // Normalize x to range [0, 1]
  const s = (x - x1) / (x2 - x1);
  
  // Position
  const position = y1 + (y2 - y1) * (s - Math.sin(2 * Math.PI * s) / (2 * Math.PI));
  
  // Velocity
  const velocity = (y2 - y1) * (1 - Math.cos(2 * Math.PI * s)) / (x2 - x1);
  
  // Acceleration
  const acceleration = (y2 - y1) * 2 * Math.PI * Math.sin(2 * Math.PI * s) / ((x2 - x1) * (x2 - x1));
  
  return { position, velocity, acceleration };
};

// Modified Sine curve calculation
export const calculateModifiedSine = (
  x: number,
  x1: number,
  y1: number,
  v1: number,
  a1: number,
  x2: number,
  y2: number,
  v2: number,
  a2: number
) => {
  // Normalize x to range [0, 1]
  const s = (x - x1) / (x2 - x1);
  
  // Position
  const position = y1 + (y2 - y1) * (s - Math.sin(2 * Math.PI * s) / (2 * Math.PI));
  
  // Velocity
  const velocity = (y2 - y1) * (1 - Math.cos(2 * Math.PI * s)) / (x2 - x1);
  
  // Acceleration
  const acceleration = (y2 - y1) * 2 * Math.PI * Math.sin(2 * Math.PI * s) / ((x2 - x1) * (x2 - x1));
  
  return { position, velocity, acceleration };
};

// Modified Trapezoid curve calculation
export const calculateModifiedTrapezoid = (
  x: number,
  x1: number,
  y1: number,
  v1: number,
  a1: number,
  x2: number,
  y2: number,
  v2: number,
  a2: number
) => {
  // Normalize x to range [0, 1]
  const s = (x - x1) / (x2 - x1);
  
  let position, velocity, acceleration;
  
  if (s < 0.25) {
    // First quarter - acceleration phase
    position = y1 + 2 * (y2 - y1) * s * s;
    velocity = 4 * (y2 - y1) * s / (x2 - x1);
    acceleration = 4 * (y2 - y1) / ((x2 - x1) * (x2 - x1));
  } else if (s < 0.75) {
    // Middle half - constant velocity phase
    position = y1 + (y2 - y1) * (2 * s * s - 0.25);
    velocity = (y2 - y1) / (x2 - x1);
    acceleration = 0;
  } else {
    // Last quarter - deceleration phase
    position = y2 - 2 * (y2 - y1) * (1 - s) * (1 - s);
    velocity = 4 * (y2 - y1) * (1 - s) / (x2 - x1);
    acceleration = -4 * (y2 - y1) / ((x2 - x1) * (x2 - x1));
  }
  
  return { position, velocity, acceleration };
};

// Calculate cam profile values for a given x
export const calculateCamProfile = (
  x: number,
  segment: {
    x1: number;
    y1: number;
    v1: number;
    a1: number;
    x2: number;
    y2: number;
    v2: number;
    a2: number;
    curveType: string;
  }
) => {
  const { x1, y1, v1, a1, x2, y2, v2, a2, curveType } = segment;
  
  // Check if x is within segment range
  if (x < x1 || x > x2) {
    return null;
  }
  
  // Calculate based on curve type
  switch (curveType) {
    case 'Linear':
      return calculateLinear(x, x1, y1, v1, a1, x2, y2, v2, a2);
    case 'Polynomial3':
      return calculatePolynomial3(x, x1, y1, v1, a1, x2, y2, v2, a2);
    case 'Polynomial5':
      return calculatePolynomial5(x, x1, y1, v1, a1, x2, y2, v2, a2);
    case 'Sine':
      return calculateSine(x, x1, y1, v1, a1, x2, y2, v2, a2);
    case 'Cosine':
      return calculateCosine(x, x1, y1, v1, a1, x2, y2, v2, a2);
    case 'Cycloid':
      return calculateCycloid(x, x1, y1, v1, a1, x2, y2, v2, a2);
    case 'ModifiedSine':
      return calculateModifiedSine(x, x1, y1, v1, a1, x2, y2, v2, a2);
    case 'ModifiedTrapezoid':
      return calculateModifiedTrapezoid(x, x1, y1, v1, a1, x2, y2, v2, a2);
    default:
      return null;
  }
};

// Calculate cam profile values for a range of x values
export const calculateCamProfileRange = (
  start: number,
  end: number,
  step: number,
  segments: Array<{
    x1: number;
    y1: number;
    v1: number;
    a1: number;
    x2: number;
    y2: number;
    v2: number;
    a2: number;
    curveType: string;
  }>
) => {
  console.log('Calculating cam profile range:', { start, end, step, segments });
  
  if (!segments || segments.length === 0) {
    console.error('No segments provided');
    return [];
  }

  // Vérifier que les segments sont valides
  const validSegments = segments.filter(seg => {
    const isValid = !isNaN(seg.x1) && !isNaN(seg.y1) && !isNaN(seg.v1) && 
                   !isNaN(seg.a1) && !isNaN(seg.x2) && !isNaN(seg.y2) && 
                   !isNaN(seg.v2) && !isNaN(seg.a2) && seg.x2 > seg.x1;
    
    if (!isValid) {
      console.error('Invalid segment:', seg);
    }
    
    return isValid;
  });

  if (validSegments.length === 0) {
    console.error('No valid segments found');
    return [];
  }

  const result = [];
  let currentX = start;
  
  while (currentX <= end) {
    // Trouver le segment qui contient le point x actuel
    const segment = validSegments.find(
      seg => currentX >= seg.x1 && currentX <= seg.x2
    );
    
    if (segment) {
      const values = calculateCamProfile(currentX, segment);
      if (values) {
        result.push({
          x: currentX,
          ...values
        });
      }
    }
    
    currentX += step;
  }
  
  console.log('Calculation complete. Number of points:', result.length);
  return result;
};
