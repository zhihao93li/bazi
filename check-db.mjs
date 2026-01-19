import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Lee_112358@localhost:5432/bazi_dev'
});

await client.connect();

// 先查询所有表
const tables = await client.query(`
  SELECT tablename FROM pg_tables WHERE schemaname = 'public'
`);
console.log('数据库中的表：', tables.rows.map(r => r.tablename));

const res = await client.query(`
  SELECT id, name, "baziData"::jsonb->'trueSolarTime' as true_solar_time
  FROM "Subject"
  ORDER BY "createdAt" DESC
  LIMIT 5
`);

console.log('最近5个命盘的真太阳时数据：');
res.rows.forEach(row => {
  console.log(`\nID: ${row.id}`);
  console.log(`名字: ${row.name}`);
  console.log(`真太阳时:`, JSON.stringify(row.true_solar_time, null, 2));
});

await client.end();
