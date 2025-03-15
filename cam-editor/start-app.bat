@echo off
echo Starting Cam Editor Application...
echo.

echo Starting Backend Server...
start cmd /k "cd /d %~dp0backend && npm run dev"

echo Starting Frontend Server...
start cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo Cam Editor Application is starting...
echo Backend will be available at http://localhost:5000
echo Frontend will be available at http://localhost:3000
echo.
echo Press any key to stop all servers...
pause > nul

echo Stopping servers...
taskkill /f /im node.exe > nul 2>&1
echo All servers stopped.
