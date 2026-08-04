@echo off
chcp 65001 > nul
set PYTHONIOENCODING=utf-8
cd /d "C:\Users\User\OneDrive\Documentos\Claude-Practica\linkedin-agent"
"C:\Users\User\.venvs\linkedin-agent\Scripts\python.exe" "C:\Users\User\OneDrive\Documentos\Claude-Practica\linkedin-agent\run_agent.py" >> "C:\Users\User\OneDrive\Documentos\Claude-Practica\linkedin-agent\logs\agent.log" 2>&1
