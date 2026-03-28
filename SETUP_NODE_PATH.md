# Fix "npm not recognized" on Windows

Node.js is installed at `C:\Program Files\nodejs\` but it may not be in your PATH.

## Quick fix (current session)
```powershell
$env:Path = "${env:ProgramFiles}\nodejs;$env:Path"
npm run dev
```

## Run dev server
Use the helper scripts (they add Node to PATH automatically):
- **PowerShell:** `.\run-dev.ps1`
- **Cmd:** `run-dev.bat`

## Permanent fix
1. Open **System Properties** → **Environment Variables**
2. Under "User variables", edit **Path**
3. Add: `C:\Program Files\nodejs`
4. Restart your terminal/IDE
