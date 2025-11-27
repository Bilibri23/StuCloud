# PowerShell script to test the distributed system
# Usage: .\test-system.ps1

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  StuCloud System Health Check                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8081/api"
$allPassed = $true

# Test 1: Backend Health
Write-Host "🔍 Test 1: Backend Server..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/network/status" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host " ❌ FAIL (Not responding)" -ForegroundColor Red
    Write-Host "   → Make sure backend is running: mvn spring-boot:run" -ForegroundColor Yellow
    $allPassed = $false
}

# Test 2: Check Registered Nodes
Write-Host "🔍 Test 2: Registered Nodes..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/network/nodes" -Method GET -TimeoutSec 5
    $nodeCount = $response.Count
    if ($nodeCount -gt 0) {
        Write-Host " ✅ PASS ($nodeCount nodes)" -ForegroundColor Green
        foreach ($node in $response) {
            Write-Host "   → $($node.nodeId)" -ForegroundColor Cyan
        }
    } else {
        Write-Host " ⚠️  WARN (0 nodes)" -ForegroundColor Yellow
        Write-Host "   → Start nodes: .\start-nodes.ps1" -ForegroundColor Yellow
        $allPassed = $false
    }
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    $allPassed = $false
}

# Test 3: Check Running Nodes
Write-Host "🔍 Test 3: Running Nodes..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/network/nodes/running" -Method GET -TimeoutSec 5
    $runningCount = $response.count
    if ($runningCount -gt 0) {
        Write-Host " ✅ PASS ($runningCount running)" -ForegroundColor Green
        foreach ($nodeId in $response.runningNodes) {
            Write-Host "   → $nodeId (ACTIVE)" -ForegroundColor Green
        }
    } else {
        Write-Host " ⚠️  WARN (0 running)" -ForegroundColor Yellow
        Write-Host "   → Start nodes via web interface or script" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    $allPassed = $false
}

# Test 4: Network Statistics
Write-Host "🔍 Test 4: Network Statistics..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/network/status" -Method GET -TimeoutSec 5
    Write-Host " ✅ PASS" -ForegroundColor Green
    
    if ($response.totalNodes) {
        Write-Host "   → Total Nodes: $($response.totalNodes)" -ForegroundColor Cyan
    }
    if ($response.totalStorageBytes) {
        $totalGB = [math]::Round($response.totalStorageBytes / 1GB, 2)
        Write-Host "   → Total Storage: $totalGB GB" -ForegroundColor Cyan
    }
    if ($response.usedStorageBytes -ne $null) {
        $usedMB = [math]::Round($response.usedStorageBytes / 1MB, 2)
        Write-Host "   → Used Storage: $usedMB MB" -ForegroundColor Cyan
    }
    if ($response.totalChunks -ne $null) {
        Write-Host "   → Total Chunks: $($response.totalChunks)" -ForegroundColor Cyan
    }
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    $allPassed = $false
}

# Test 5: Frontend
Write-Host "🔍 Test 5: Frontend Server..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host " ⚠️  WARN (Not responding)" -ForegroundColor Yellow
    Write-Host "   → Start frontend: cd frontend/stumatch && npm run dev" -ForegroundColor Yellow
}

# Test 6: Check Node Processes
Write-Host "🔍 Test 6: Node Processes..." -NoNewline
$javaProcesses = Get-Process -Name java -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*EnhancedStorageNode*"
}
if ($javaProcesses) {
    $processCount = ($javaProcesses | Measure-Object).Count
    Write-Host " ✅ PASS ($processCount processes)" -ForegroundColor Green
} else {
    Write-Host " ⚠️  WARN (No node processes found)" -ForegroundColor Yellow
    Write-Host "   → Nodes may not be started yet" -ForegroundColor Yellow
}

# Test 7: Check Storage Directories
Write-Host "🔍 Test 7: Storage Directories..." -NoNewline
$storageDir = "$env:USERPROFILE\distributed-storage"
if (Test-Path $storageDir) {
    $diskDirs = Get-ChildItem -Path "$storageDir\disks" -Directory -ErrorAction SilentlyContinue
    if ($diskDirs) {
        Write-Host " ✅ PASS ($($diskDirs.Count) disks)" -ForegroundColor Green
        foreach ($disk in $diskDirs) {
            Write-Host "   → $($disk.Name)" -ForegroundColor Cyan
        }
    } else {
        Write-Host " ⚠️  WARN (No disks created yet)" -ForegroundColor Yellow
    }
} else {
    Write-Host " ⚠️  WARN (Directory not created)" -ForegroundColor Yellow
    Write-Host "   → Will be created when nodes start" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "║  ✅ SYSTEM HEALTH: GOOD                                ║" -ForegroundColor Green
    Write-Host "╠════════════════════════════════════════════════════════╣" -ForegroundColor Green
    Write-Host "║  All critical tests passed!                            ║" -ForegroundColor Green
    Write-Host "║  Your distributed storage system is ready.             ║" -ForegroundColor Green
} else {
    Write-Host "║  ⚠️  SYSTEM HEALTH: NEEDS ATTENTION                    ║" -ForegroundColor Yellow
    Write-Host "╠════════════════════════════════════════════════════════╣" -ForegroundColor Yellow
    Write-Host "║  Some tests failed. Check the output above.           ║" -ForegroundColor Yellow
}
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Recommendations
if (-not $allPassed) {
    Write-Host "📋 Recommended Actions:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Start backend (if not running):" -ForegroundColor White
    Write-Host "   mvn spring-boot:run" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Start storage nodes:" -ForegroundColor White
    Write-Host "   .\start-nodes.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Start frontend (if not running):" -ForegroundColor White
    Write-Host "   cd frontend\stumatch && npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "4. Run this test again:" -ForegroundColor White
    Write-Host "   .\test-system.ps1" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "🌐 Access Points:" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:8081/api" -ForegroundColor White
Write-Host "   Frontend UI: http://localhost:5173" -ForegroundColor White
Write-Host ""
