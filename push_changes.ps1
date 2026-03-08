# git_push.ps1
# Script to stage, commit, and push Kanban moveability changes

Write-Host "Staging Changes..." -ForegroundColor Cyan
git add .

Write-Host "Committing Changes..." -ForegroundColor Cyan
git commit -m "feat(kanban): implement card moveability through columns and fix card modal validation bug"

Write-Host "Pushing to Repository..." -ForegroundColor Cyan
git push

Write-Host "Done!" -ForegroundColor Green
