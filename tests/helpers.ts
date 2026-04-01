import { getPayload } from 'payload';
import configPromise from '../src/payload.config';

/**
 * Initializes and returns the Payload Local API instance.
 * Uses the configuration defined in src/payload.config.ts.
 */
export async function getTestPayload() {
  console.log('Initializing Payload with config...');
  const config = await configPromise;
  console.log('Config loaded, calling getPayload...');
  return getPayload({ config });
}

export const TEST_ADMIN_EMAIL = 'indexlove0815@icloud.com';
export const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'password';
