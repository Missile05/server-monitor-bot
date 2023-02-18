import mysql from 'mysql2/promise';
import { databaseSettings, poolSettings } from '../../../config';

if (!global.pool) global.pool = mysql.createPool({ ...databaseSettings, ...poolSettings });

export const pool = global.pool;