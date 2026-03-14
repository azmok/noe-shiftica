import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testGCS() {
  const bucketName = process.env.GCS_BUCKET || 'noe-shiftica.firebasestorage.app';
  console.log(`Testing bucket: ${bucketName}`);
  
  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID || 'noe-shiftica',
    // Local testing uses keyfile, production uses ADC
    ...(process.env.GCS_KEYFILE_PATH ? { keyFilename: process.env.GCS_KEYFILE_PATH } : {}),
  });

  try {
    const [files] = await storage.bucket(bucketName).getFiles({ maxResults: 10 });
    console.log('Successfully connected to GCS. Found files:');
    files.forEach(file => console.log(` - ${file.name}`));
    
    // Test a specific 400x300 file if known
    const testFile = 'is-wp-outdated-and-up-to-date-stack.modified-400x300.png';
    const [exists] = await storage.bucket(bucketName).file(testFile).exists();
    console.log(`File ${testFile} exists: ${exists}`);
    
  } catch (err) {
    console.error('GCS Test Failed:', err);
  }
}

testGCS();
