# Run dev server - adds Node to PATH if not found
$nodePath = "${env:ProgramFiles}\nodejs"
if (Test-Path $nodePath) {
  $env:Path = "$nodePath;$env:Path"
}
npm.cmd run dev
