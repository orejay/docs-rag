import pg from 'pg';
import { config } from '../config/config';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });
export const closePool = () => pool.end();
