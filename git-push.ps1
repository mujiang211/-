# Git 上传脚本 - 将代码推送到 Gitee
$ErrorActionPreference = "Stop"
Set-Location "D:\ieal\course-catalog"

Write-Host "=== 1. 初始化 Git 仓库 ===" -ForegroundColor Green
git init

Write-Host "=== 2. 添加远程仓库 ===" -ForegroundColor Green
# 请替换为你的实际仓库地址
git remote add origin https://gitee.com/mujiang211/course-catalog.git

Write-Host "=== 3. 添加所有文件 ===" -ForegroundColor Green
git add .

Write-Host "=== 4. 提交 ===" -ForegroundColor Green
git commit -m "feat: 学生课程管理系统 - 包含选课、退课、截止时间管理功能"

Write-Host "=== 5. 推送到远程 ===" -ForegroundColor Green
git branch -M main
git push -u origin main

Write-Host "=== 完成！ ===" -ForegroundColor Green
Write-Host "请查看: https://gitee.com/mujiang211/course-catalog" -ForegroundColor Yellow
