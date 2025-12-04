 = Get-ChildItem -Recurse -File -Filter *.sql | Where-Object { .FullName -notmatch '\\supabase\\migrations\\' -and .FullName -notmatch '\\archive\\sql\\' } | Select-Object -First 20
foreach ( in ) {
  Copy-Item -Path .FullName -Destination 'archive/sql' -Force
  Write-Output ('ARCHIVED: ' + .FullName)
}