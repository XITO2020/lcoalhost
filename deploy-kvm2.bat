@echo off
REM ============================================================
REM  Lcoalhost - Mise en ligne sur le KVM2 Hostinger - double-clic
REM  Build le front, envoie tout, relance les conteneurs.
REM  Pre-requis : cle SSH vers le KVM2, deja en place pour tuveuxun.
REM  1er lancement : cree le .env sur le serveur puis s'arrete,
REM  le remplir, puis relancer ce fichier.
REM ============================================================
cd /d "%~dp0"
echo.
echo   Mise en ligne de Lcoalhost sur le KVM2 ...
echo.
bash deploy/deploy-kvm2.sh
echo.
echo   Termine. Appuie sur une touche pour fermer.
pause >nul
