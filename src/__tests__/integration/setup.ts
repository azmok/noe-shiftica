/**
 * Integration test global setup
 * Loads .env.test so TEST_ADMIN_PASSWORD and TEST_BASE_URL are available.
 */
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.test') })
