const fs = require("fs");
const path = require("path");

const candidates = [
  path.join(__dirname, "..", "prisma", "dev.db"),
  path.join(__dirname, "..", "dev.db"),
];

const backupDir = path.join(__dirname, "..", "backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

let backedUp = false;
for (const dbPath of candidates) {
  if (fs.existsSync(dbPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `dev.db.backup_${timestamp}`);
    fs.copyFileSync(dbPath, backupPath);
    console.log(`[Backup] Successfully backed up ${dbPath} to: ${backupPath}`);
    console.log(`[Backup] File size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);
    backedUp = true;
    break;
  }
}

if (!backedUp) {
  console.log(`[Backup] No SQLite database found in candidate locations.`);
}
