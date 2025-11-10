# Rift Rewind - AWS Deployment Script
# Run this script to create Lambda deployment package

Write-Host "Creating Rift Rewind Lambda Deployment Package..." -ForegroundColor Cyan

# Check if zip command exists (requires 7-Zip or built-in PowerShell 5+)
Write-Host "`nStep 1: Installing dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "  Dependencies already installed" -ForegroundColor Green
}

# Create deployment package
Write-Host "`nStep 2: Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "lambda-deployment.zip") {
    Remove-Item "lambda-deployment.zip"
}

# Use PowerShell's Compress-Archive
$files = @(
    "league-recap-lambda.js",
    "node_modules"
)

Compress-Archive -Path $files -DestinationPath "lambda-deployment.zip" -Force

Write-Host "  Created lambda-deployment.zip" -ForegroundColor Green

Write-Host "`nDeployment Package Ready!" -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor White
Write-Host "  1. Go to AWS Lambda Console: https://console.aws.amazon.com/lambda"
Write-Host "  2. Click 'Create function'"
Write-Host "  3. Function name: rift-rewind-recap"
Write-Host "  4. Runtime: Node.js 18.x"
Write-Host "  5. Upload lambda-deployment.zip"
Write-Host "  6. Set Handler: league-recap-lambda.handler"
Write-Host "  7. Add Environment Variable: RIOT_API_KEY = RGAPI-59cac837-c14e-4a87-a9e2-41210e279f3b"
Write-Host "  8. Set Timeout: 300 seconds (5 minutes)"
Write-Host "  9. Set Memory: 512 MB"
Write-Host "  10. Add IAM Policy for Bedrock (see README.md)"
Write-Host "  11. Create Function URL with CORS enabled"
Write-Host "  12. Update index.html with your Function URL"
Write-Host ""
Write-Host "Full instructions: See README.md" -ForegroundColor Cyan
Write-Host "Ready to deploy!" -ForegroundColor Green

