@echo off
title Lcoalhost - etat des connecteurs
cd /d "%~dp0backend"
echo.
call npm run -s connectors
echo.
pause
