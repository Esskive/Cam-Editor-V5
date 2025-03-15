# Cam Editor

A web application for creating and visualizing electronic cam profiles. This application allows users to design cam profiles with various segment types, visualize position, velocity, and acceleration curves, and perform custom calculations using an integrated spreadsheet.

## Features

- Interactive graph displaying position, velocity, and acceleration curves
- Vertical cursor for precise value reading at specific points
- Segment table for managing cam profile segments
- Integrated spreadsheet for custom calculations
- Dark mode UI for better readability and reduced eye strain
- Dynamic linking between spreadsheet cells and segment parameters

## Technology Stack

### Frontend
- React.js with TypeScript
- Material-UI for UI components
- Recharts for graph visualization
- React-Spreadsheet for the spreadsheet component

### Backend
- Node.js with Express
- MongoDB for data storage
- Mongoose for database modeling

## Project Structure

```
cam-editor/
├── backend/                 # Backend server code
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   └── server.ts        # Server entry point
│   ├── .env                 # Environment variables
│   ├── package.json         # Backend dependencies
│   └── tsconfig.json        # TypeScript configuration
│
└── frontend/                # Frontend React application
    ├── public/              # Static files
    ├── src/
    │   ├── components/      # React components
    │   │   ├── graph/       # Graph visualization components
    │   │   ├── layout/      # Layout components
    │   │   ├── segments/    # Segment management components
    │   │   └── spreadsheet/ # Spreadsheet components
    │   ├── services/        # API services
    │   ├── theme/           # UI theme configuration
    │   ├── types/           # TypeScript type definitions
    │   ├── App.tsx          # Main application component
    │   └── index.tsx        # Application entry point
    ├── package.json         # Frontend dependencies
    └── tsconfig.json        # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/cam-editor.git
   cd cam-editor
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/cam-editor
   ```

4. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```
   cd ../frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Creating a Cam Profile**:
   - Click the "New Profile" button in the header
   - Configure the master and slave units
   - Add segments to the profile

2. **Editing Segments**:
   - Use the Segments Table view to add, edit, or delete segments
   - Configure segment parameters (X1, Y1, V1, A1, X2, Y2, V2, A2)
   - Select the curve type for each segment

3. **Visualizing the Cam Profile**:
   - Switch to the Graph view to see the position, velocity, and acceleration curves
   - Use the cursor to see precise values at specific points
   - Toggle curve visibility using the switches

4. **Using the Spreadsheet**:
   - Switch to the Spreadsheet view to perform custom calculations
   - Link cells to segment parameters for dynamic updates
   - Save the spreadsheet data with the cam profile

## License

This project is licensed under the MIT License - see the LICENSE file for details.
