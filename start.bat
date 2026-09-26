@echo off
title Lcoalhost - lancement
cd /d "%~dp0"

echo.
echo  LCOALHOST - ca marche sur ma machine
echo  ------------------------------------
echo  Backend  : http://localhost:4200  API + scraping toutes les 30 min
echo  Frontend : http://localhost:5180  le site
echo.

if not exist "backend\.env" (
  echo  [!] backend\.env absent. Je copie le modele : ouvre-le et mets ton mot de passe Postgres.
  copy "backend\.env.example" "backend\.env" >nul
  notepad "backend\.env"
  echo  Relance start.bat une fois le fichier enregistre.
  pause
  exit /b 1
)

if not exist "backend\node_modules" (
  echo  Installation des dependances backend...
  call npm --prefix backend install --no-audit --no-fund
)
if not exist "frontend\node_modules" (
  echo  Installation des dependances frontend...
  call npm --prefix frontend install --no-audit --no-fund
)

echo  Migration de la base...
call npm --prefix backend run -s prisma:migrate:deploy
if errorlevel 1 (
  echo  [!] Migration en echec. Postgres est-il demarre, et le mot de passe de backend\.env est-il bon ?
  pause
  exit /b 1
)
call npm --prefix backend run -s seed

start "Lcoalhost backend :4200" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 4 /nobreak >nul
start "Lcoalhost frontend :5180" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak >nul
start "" http://localhost:5180

echo.
echo  Deux fenetres ouvertes. Le premier scraping demarre 5 secondes apres le backend.
echo  Pour tout couper : stop.bat. Pour voir l etat des sources : connectors.bat.
echo.
pause
