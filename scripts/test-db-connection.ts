
import 'dotenv/config';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
console.log('Connecting to:', connectionString?.replace(/:[^:]*@/, ':****@'));

const pool = new pg.Pool({ connectionString });

pool.query('SELECT 1 as result', (err, res) => {
    if (err) {
        console.error('Connection error:', err);
    } else {
        console.log('Connection success:', res.rows[0]);
    }
    pool.end();
});
