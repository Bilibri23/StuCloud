# PowerShell script to start multiple storage nodes
# Usage: .\start-nodes.ps1

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Starting Distributed Storage Nodes                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Maven compiled the project
if (-not (Test-Path "target\classes")) {
    Write-Host "⚠️  target\classes not found. Compiling project..." -ForegroundColor Yellow
    mvn clean compile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Compilation failed. Please fix errors and try again." -ForegroundColor Red
        exit 1
    }
}

# Node configurations
$nodes = @(
    @{Id="node1"; Port=50051; Storage=100; Ram=8},
    @{Id="node2"; Port=50052; Storage=100; Ram=8},
    @{Id="node3"; Port=50053; Storage=100; Ram=8}
)

Write-Host "Starting $($nodes.Count) storage nodes..." -ForegroundColor Green
Write-Host ""

foreach ($node in $nodes) {
    Write-Host "🚀 Starting $($node.Id) on port $($node.Port)..." -ForegroundColor Cyan
    
    # Start node in new PowerShell window
    $command = "java -cp target\classes org.distributed.stumatchdistributed.node.EnhancedStorageNode $($node.Id) $($node.Port) $($node.Storage) $($node.Ram)"
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $command -WindowStyle Normal
    
    Write-Host "   ✅ $($node.Id) started (Port: $($node.Port), Storage: $($node.Storage)GB, RAM: $($node.Ram)GB)" -ForegroundColor Green
    
    # Small delay between starts
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ All nodes started successfully!                    ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Nodes will auto-register in 3 seconds...             ║" -ForegroundColor Green
Write-Host "║  Check web interface at http://localhost:5173         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Node logs are in: logs\node*.log" -ForegroundColor Yellow
Write-Host "🛑 To stop nodes: Close the PowerShell windows or press Ctrl+C" -ForegroundColor Yellow
