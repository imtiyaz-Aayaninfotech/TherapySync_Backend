const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { MongoClient } = require('mongodb');

exports.downloadBackupJSON = async (req, res) => {
  const backupFolderName = `backup_json_${new Date().toISOString().slice(0,10)}`;
  const backupDir = path.join(__dirname, '..', 'backups', backupFolderName);
  const zipFilePath = `${backupDir}.zip`;
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    return res.status(500).json({ message: 'MONGODB_URI not set' });
  }

  // Create backup folder
  fs.mkdirSync(backupDir, { recursive: true });

  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const adminDb = client.db().admin();

    // List all databases
    const dbs = await adminDb.listDatabases();

    // For each database, get collections and export JSON for each
    for (const dbInfo of dbs.databases) {
      if (dbInfo.name === 'admin' || dbInfo.name === 'local' || dbInfo.name === 'config') {
        // Skip system DBs
        continue;
      }

      const dbName = dbInfo.name;
      const dbFolder = path.join(backupDir, dbName);
      fs.mkdirSync(dbFolder, { recursive: true });

      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();

      for (const coll of collections) {
        const collName = coll.name;

        // Path for JSON file for this collection
        const outFile = path.join(dbFolder, `${collName}.json`);

        // mongoexport command to export collection to JSON
        const exportCmd = `mongoexport --uri="${mongoUri}" --db=${dbName} --collection=${collName} --out="${outFile}" --jsonArray`;


        // Use execSync to ensure sequential export (alternatively, use async exec with Promises)
        await new Promise((resolve, reject) => {
          exec(exportCmd, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error exporting ${dbName}.${collName}:`, error, stderr);
              return reject(error);
            }
            console.log(`Exported ${dbName}.${collName} to JSON`);
            resolve();
          });
        });
      }
    }

    await client.close();

    // Zip the entire backup folder containing JSON exports
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`ZIP file created: ${zipFilePath} (${archive.pointer()} bytes)`);
      res.download(zipFilePath, `${backupFolderName}.zip`, (err) => {
        if (err) {
          console.error('Error sending ZIP:', err);
        }
        // Clean up after sending
        fs.unlinkSync(zipFilePath);
        fs.rmdirSync(backupDir, { recursive: true });
      });
    });

    archive.on('error', (err) => {
      console.error(`Archiver error: ${err}`);
      res.status(500).json({ message: 'Error creating archive' });
    });

    archive.pipe(output);
    archive.directory(backupDir, false);
    archive.finalize();

  } catch (err) {
    console.error('Backup JSON export error:', err);
    res.status(500).json({ message: 'Error during backup', error: err.message });
  }
};
