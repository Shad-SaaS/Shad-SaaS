const fs = require("fs");
const path = require("path");

const backupDir = path.join(__dirname, "..", "backups");
const targetDb = path.join(__dirname, "..", "prisma", "dev.db");

if (!fs.existsSync(backupDir)) {
  console.error("[Rollback Error] No backups directory found.");
  process.exit(1);
}

const files = fs.readdirSync(backupDir).filter((f) => f.startsWith("dev.db.backup_")).sort().reverse();

if (files.length === 0) {
  console.error("[Rollback Error] No backup files found in backups directory.");
  process.exit(1);
}

const latestBackup = path.join(backupDir, files[0]);
console.log(`[Rollback] Restoring from latest backup: ${files[0]}`);

fs.copyFileSync(latestBackup, targetDb);
console.log(`[Rollback] Successfully restored database from: ${latestBackup}`);
console.log(`[Rollback] Database size: ${(fs.statSync(targetDb).size / 1024).toFixed(2)} KB`);
