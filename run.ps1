$ErrorActionPreference = "Continue"
Set-Location "D:\ieal\course-catalog"
Write-Output "Starting Spring Boot application..."
Write-Output "Current directory: $(Get-Location)"
Write-Output "Java version:"
java -version 2>&1
Write-Output "---"
.\mvnw.cmd spring-boot:run 2>&1 | Tee-Object -FilePath "D:\ieal\course-catalog\run.log"
