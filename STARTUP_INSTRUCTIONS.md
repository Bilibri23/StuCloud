# 🚀 Quick Start - Fix "No Distributed Nodes Available"

## Problem
You're seeing this warning:
```
No distributed nodes available. File stored locally only.
```

## Solution: Start Storage Nodes

### **Option 1: Automated Script (Recommended)**

Run this command in PowerShell:
```powershell
.\start-nodes.ps1
```

This will:
- Start 3 storage nodes (node1, node2, node3)
- Each in a separate window
- Auto-register with the network controller
- Ready in ~5 seconds

---

### **Option 2: Via Web Interface**

1. **Start backend** (if not running):
   ```bash
   mvn spring-boot:run
   ```

2. **Start frontend** (if not running):
   ```bash
   cd frontend/stumatch
   npm run dev
   ```

3. **Login** to `http://localhost:5173`

4. **Scroll to "Node Management" panel**

5. **Start nodes one by one:**
   - Node ID: `node1`, Port: `50051`, Storage: `100`, RAM: `8` → Click "Start Node"
   - Node ID: `node2`, Port: `50052`, Storage: `100`, RAM: `8` → Click "Start Node"
   - Node ID: `node3`, Port: `50053`, Storage: `100`, RAM: `8` → Click "Start Node"

---

### **Option 3: Manual Terminal Commands**

Open **3 separate terminals** and run:

**Terminal 1:**
```bash
java -cp target/classes org.distributed.stumatchdistributed.node.EnhancedStorageNode node1 50051 100 8
```

**Terminal 2:**
```bash
java -cp target/classes org.distributed.stumatchdistributed.node.EnhancedStorageNode node2 50052 100 8
```

**Terminal 3:**
```bash
java -cp target/classes org.distributed.stumatchdistributed.node.EnhancedStorageNode node3 50053 100 8
```

Wait 3 seconds - nodes auto-register!

---

## ✅ Verify It's Working

### **Check 1: Web Interface**
Look for the **"Distributed Storage Network"** panel showing:
- ✅ Active Nodes: 3
- ✅ Total Storage: ~300 GB
- ✅ Node badges: node1, node2, node3

### **Check 2: Upload a File**
1. Upload any file
2. Check backend logs - should see:
   ```
   Distributing file 'test.pdf' across 3 nodes
   Chunk 1/5: test.pdf_chunk_0 → node1
   ✅ File distributed: 5 chunks across 3 nodes
   ```

### **Check 3: File Details**
Click the info icon on any uploaded file - should show:
```
Distribution: Chunks: 5 | node1:2 node2:2 node3:1
```

---

## 🔍 Troubleshooting

### **Nodes won't start?**

**Error: Port already in use**
```bash
# Check what's using the port
netstat -ano | findstr :50051

# Use different ports (50054, 50055, 50056)
```

**Error: Java not found**
```bash
# Check Java version (need 17+)
java -version

# If missing, install Java 17 or higher
```

**Error: Classes not compiled**
```bash
# Compile the project
mvn clean compile
```

---

### **Nodes start but don't register?**

**Check backend logs** for:
```
✅ Auto-registered node node1 with NetworkController
```

If missing, **manually register**:
```bash
curl -X POST http://localhost:8081/api/network/nodes/register ^
  -H "Content-Type: application/json" ^
  -d "{\"nodeId\": \"node1\", \"host\": \"localhost\", \"port\": 50051}"
```

---

### **Still seeing "No distributed nodes available"?**

**Verify nodes are registered:**
```bash
curl http://localhost:8081/api/network/nodes
```

Should return:
```json
[
  {"nodeId": "node1"},
  {"nodeId": "node2"},
  {"nodeId": "node3"}
]
```

If empty → restart nodes and wait 5 seconds.

---

## 📊 Expected Output

### **Node Startup Logs**
```
╔════════════════════════════════════════════════════════╗
║  ENHANCED STORAGE NODE INITIALIZATION                  ║
╠════════════════════════════════════════════════════════╣
║  Node ID: node1                                        ║
╚════════════════════════════════════════════════════════╝
🌐 Step 1: Assigning network interface...
   ✅ IP Address: 10.0.0.1
   ✅ MAC Address: 00:1A:2B:3C:4D:5E
💾 Step 2: Creating virtual disk...
   ✅ Virtual Disk: 100 GB
   ✅ Disk mounted
╔════════════════════════════════════════════════════════╗
║  ✅ NODE STARTED SUCCESSFULLY                          ║
╠════════════════════════════════════════════════════════╣
║  Node ID:     node1                                    ║
║  IP:Port:     10.0.0.1:50051                          ║
║  State:       WAITING (Ready for requests)            ║
╚════════════════════════════════════════════════════════╝
```

### **File Distribution Logs**
```
═══════════════════════════════════════════════════════
Starting file distribution: test.pdf
═══════════════════════════════════════════════════════
File decomposed into 5 chunks
Distributing across 3 nodes
───────────────────────────────────────────────────────
Chunk 1/5: test.pdf_chunk_0 → node1
  ✓ Transferred in 45 ms
Chunk 2/5: test.pdf_chunk_1 → node2
  ✓ Transferred in 42 ms
Chunk 3/5: test.pdf_chunk_2 → node3
  ✓ Transferred in 38 ms
...
═══════════════════════════════════════════════════════
Distribution completed in 215 ms
═══════════════════════════════════════════════════════
```

---

## 🎯 Next Steps

Once nodes are running:
1. ✅ Upload files → They'll be distributed automatically
2. ✅ Check file details → See which chunks are on which nodes
3. ✅ Download files → System retrieves from distributed storage
4. ✅ Monitor network → See storage usage across nodes

---

## 📝 Node Storage Locations

Files are stored in:
```
C:\Users\noble\distributed-storage\
├── disks\
│   ├── node1-disk\
│   ├── node2-disk\
│   └── node3-disk\
└── nodes\
    ├── node1\
    ├── node2\
    └── node3\
```

You can browse these directories to see the actual chunk files!

---

## 🛑 Stopping Nodes

**If started via script:**
- Close the PowerShell windows

**If started via web interface:**
- Click the ❌ button next to each running node

**If started manually:**
- Press `Ctrl+C` in each terminal

---

## 💡 Tips

1. **Start with 3 nodes** - Good balance for testing
2. **Use different ports** - 50051, 50052, 50053, etc.
3. **Check logs** - Located in `logs/node*.log`
4. **Monitor network panel** - Shows real-time node status
5. **Upload large files** - See chunking in action (>2MB)

---

## ✅ Success Checklist

- [ ] Backend running on port 8081
- [ ] Frontend running on port 5173
- [ ] 3 nodes started (node1, node2, node3)
- [ ] Nodes showing in web interface
- [ ] File upload shows distribution info
- [ ] No "No distributed nodes available" warning

---

**Need help?** Check the logs in `logs/` directory or backend console output.
