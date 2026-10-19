@echo off
setlocal
cd /d "%~dp0.."
if defined CODEX_MCP_NODE_PATH if exist "%CODEX_MCP_NODE_PATH%" (
  "%CODEX_MCP_NODE_PATH%" "%~dp0..\dist\server.mjs"
  exit /b
)
if defined CODEX_ELECTRON_RESOURCES_PATH if exist "%CODEX_ELECTRON_RESOURCES_PATH%\cua_node\bin\node.exe" (
  "%CODEX_ELECTRON_RESOURCES_PATH%\cua_node\bin\node.exe" "%~dp0..\dist\server.mjs"
  exit /b
)
node "%~dp0..\dist\server.mjs"
