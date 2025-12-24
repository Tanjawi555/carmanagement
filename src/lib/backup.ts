import fs from 'fs';
import path from 'path';

// Define backup root - going up two levels from src/lib -> src -> root
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directories exist
const ensureBackupDirs = () => {
    const dirs = ['clients', 'rentals', 'contracts'];
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    dirs.forEach(dir => {
        const fullPath = path.join(BACKUP_DIR, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });
};

export const BackupService = {
    saveClient: async (client: any) => {
        try {
            ensureBackupDirs();
            // Create a dedicated folder for this client to hold data and documents
            const clientDir = path.join(BACKUP_DIR, 'clients', client._id.toString());
            if (!fs.existsSync(clientDir)) {
                fs.mkdirSync(clientDir, { recursive: true });
            }

            // Save Client Data
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const dataFileName = `data_${timestamp}.json`;
            const dataFilePath = path.join(clientDir, dataFileName);
            
            fs.writeFileSync(dataFilePath, JSON.stringify(client, null, 2));

            // Backup Documents (if they exist locally in public/uploads)
            // Note: This relies on where your upload API saves files.
            // Assuming: public/uploads/documents/filename.ext
            const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
            const docFields = ['passport_image', 'license_image'];

            for (const field of docFields) {
                // Handle comma-separated images
                if (client[field]) {
                    const images = client[field].split(',');
                    for (const imgName of images) {
                        if (imgName && !imgName.startsWith('http')) {
                            // Local file
                           const sourcePath = path.join(publicUploadsDir, imgName);
                           if (fs.existsSync(sourcePath)) {
                               const destPath = path.join(clientDir, imgName);
                               // Avoid overwriting if backup already exists (unlikely given names are uuids, but safe copy)
                               if (!fs.existsSync(destPath)) {
                                   fs.copyFileSync(sourcePath, destPath);
                               }
                           }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('BackupService: Failed to backup client', error);
        }
    },

    saveRental: async (rental: any) => {
        try {
            ensureBackupDirs();
            const rentalId = rental._id.toString();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `rental_${rentalId}_${timestamp}.json`;
            const filePath = path.join(BACKUP_DIR, 'rentals', fileName);

            fs.writeFileSync(filePath, JSON.stringify(rental, null, 2));
        } catch (error) {
            console.error('BackupService: Failed to backup rental', error);
        }
    },

    saveContract: async (rentalId: string, contractData: any) => {
        try {
            ensureBackupDirs();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `contract_${rentalId}_${timestamp}.json`;
            const filePath = path.join(BACKUP_DIR, 'contracts', fileName);

            fs.writeFileSync(filePath, JSON.stringify(contractData, null, 2));
        } catch (error) {
             console.error('BackupService: Failed to backup contract', error);
        }
    }
};
