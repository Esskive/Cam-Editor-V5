import mongoose, { Schema, Document } from 'mongoose';

// Interface for segment parameters
export interface ISegment extends Document {
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

// Interface for cam profile
export interface ICamProfile extends Document {
  name: string;
  description?: string;
  masterUnit: string;
  slaveUnit: string;
  segments: ISegment[];
  spreadsheetData?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for segment
const SegmentSchema: Schema = new Schema({
  x1: { type: Number, required: true },
  y1: { type: Number, required: true },
  v1: { type: Number, required: true },
  a1: { type: Number, required: true },
  x2: { type: Number, required: true },
  y2: { type: Number, required: true },
  v2: { type: Number, required: true },
  a2: { type: Number, required: true },
  curveType: { 
    type: String, 
    required: true,
    enum: ['Linear', 'Polynomial3', 'Polynomial5', 'Sine', 'Cosine', 'Cycloid', 'ModifiedSine', 'ModifiedTrapezoid']
  }
});

// Schema for cam profile
const CamProfileSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  masterUnit: { type: String, required: true, default: 'degrees' },
  slaveUnit: { type: String, required: true, default: 'mm' },
  segments: [SegmentSchema],
  spreadsheetData: { type: Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model<ICamProfile>('CamProfile', CamProfileSchema);
