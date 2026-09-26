@echo off
title Lcoalhost - arret
echo  Arret de Lcoalhost...

for /f "tokens=5" %%p in ('netstat -ano ^| findstr :4200 ^| findstr LISTENING') do (
  echo   - backend PID %%p
  taskkill /PID %%p /F >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :5180 ^| findstr LISTENING') do (
  echo   - frontend PID %%p
  taskkill /PID %%p /F >nul 2>&1
)

echo  Termine.
pause
