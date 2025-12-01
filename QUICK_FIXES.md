# Quick Fixes for Common Issues

## ✅ Fixed Issues

### 1. **JSON Circular Reference Error** ✅
**Error:** `Document nesting depth (1001) exceeds maximum`

**Fixed by:**
- Added `@JsonIgnoreProperties` to `FileMetadata.owner` field
- Created `FileDTO` to return files without circular references
- Controller now converts `FileMetadata` → `FileDTO` before sending to frontend

### 2. **Files Not Displaying** ✅
**Issue:** Files upload successfully but don't show in "My Files"

**Fixed by:**
- Changed `file.fileSize` → `file.sizeBytes` (correct field name)
- Changed `file.uploadedAt` → `file.createdAt` (correct field name)
- These match the actual entity field names

---

## ⚠️ Current Issues & Solutions

### 3. **Node Port Conflict** (Port 50051 already in use)
**Error:** `java.net.BindException: Address already in use: bind`

**Cause:** A node process from a previous session is still running

**Solution - Choose One:**

#### Option A: Kill the Process (Windows)
```powershell
# Find process using port 50051
netstat -ano | findstr :50051

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F
```

#### Option B: Use Different Port
Start nodes on different ports:
```java
// In CloudDashboard.jsx, change:
const port = 50052 + nodes.length;  // Start from 50052 instead of 50051
```

#### Option C: Restart Computer
Simple but effective - restart your computer to kill all processes.

---

### 4. **Storage Used Shows 0**
**Current Issue:** Files upload but storage usage stays at 0

**Likely Cause:** `UserStorage.usedBytes` is not being updated after file upload

**To Fix:** Need to update `FileService.upload()` to increment user's storage:

```java
// In FileService.java, after saving file:
userStorage.setUsedBytes(userStorage.getUsedBytes() + file.length());
userStorageRepository.save(userStorage);
```

---

### 5. **Nodes Not Appearing in UI**
**Issue:** Nodes auto-create but don't show in Node Management section

**Cause:** Frontend is calling `/api/network/nodes` which might be empty initially

**Check:**
1. Open browser console (F12)
2. Look for API responses from `/api/network/nodes`
3. Check if nodes array is populated

**Temporary Test:**
```javascript
// In browser console:
fetch('http://localhost:8081/api/network/nodes', {
  headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}
})
.then(r => r.json())
.then(console.log)
```

---

## 🚀 Step-by-Step Recovery

### **If Everything is Broken:**

1. **Stop Everything**
   ```powershell
   # Stop backend (Ctrl+C in terminal)
   # Stop frontend (Ctrl+C in terminal)
   
   # Kill any stuck node processes
   taskkill /F /IM java.exe
   ```

2. **Clean Start**
   ```powershell
   # Start backend
   cd c:\Users\noble\Downloads\dsc\stumatch-distributed
   .\mvnw.cmd clean spring-boot:run
   
   # In new terminal, start frontend
   cd frontend\stumatch
   npm run dev
   ```

3. **Test Step by Step**
   - Login
   - Go to Cloud Storage page
   - Upload a small file (< 1MB)
   - Check if it appears
   - Try starting a node manually from UI

---

## 📝 Testing Checklist

After fixing, test these:

- [ ] Login works (OTP via email)
- [ ] Dashboard shows quota (2GB)
- [ ] Upload file - success message appears
- [ ] File appears in "My Files" section
- [ ] File shows correct size
- [ ] Can download file
- [ ] Can delete file
- [ ] Storage usage increases after upload
- [ ] Start node button works
- [ ] Node appears in list with "Running" status
- [ ] Can stop node
- [ ] Active nodes count updates

---

## 🔧 Development Tips

### **Check Backend Logs:**
Look for these in console:
```
✅ Good: "File uploaded successfully"
✅ Good: "Node registered: node1"
❌ Bad: "Address already in use"
❌ Bad: "Document nesting depth"
```

### **Check Frontend Console:**
```javascript
// Should see API responses:
GET /api/user/dashboard → {userName, quotaGB, usedGB, ...}
GET /api/user/dashboard/files → [{id, fileName, sizeBytes, ...}]
GET /api/network/nodes → [{nodeId: "node1", ...}]
```

### **Common Mistakes:**
1. Using wrong field names (`fileSize` vs `sizeBytes`)
2. Not converting entities to DTOs (causes circular references)
3. Not updating storage quota after upload
4. Trying to bind to used ports
5. Not refreshing data after operations

---

## 🎯 Priority Fixes Needed

1. **HIGH:** Fix storage usage tracking (implement in FileService)
2. **MEDIUM:** Add node startup with different ports automatically
3. **LOW:** Add file distribution animation
4. **LOW:** Show individual node statistics

---

**Last Updated:** Dec 1, 2025, 5:35 AM
