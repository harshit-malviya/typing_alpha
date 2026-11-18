@echo off
title TypingAlpha Launcher
cd /d "%~dp0"
echo Starting TypingAlpha Windows Desktop App...
call npm run electron:start
