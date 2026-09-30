const developmentHost = 'ep-twilight-pine-b3svkey5-pooler.c-4.ap-southeast-1.aws.neon.tech';
const stagingHost = 'ep-summer-frost-b38pqku0-pooler.c-4.ap-southeast-1.aws.neon.tech';
const productionHost = 'ep-green-tree-b3jpebj1-pooler.c-4.ap-southeast-1.aws.neon.tech';
const isCi = process.env.METAFARM_CI_DB === 'true';
const expectedHost = isCi ? process.env.NEON_CI_DATABASE_HOST : developmentHost;
if (isCi && (!expectedHost || [developmentHost, stagingHost, productionHost].includes(expectedHost))) {
  throw new Error('CI ต้องกำหนด NEON_CI_DATABASE_HOST เป็น Neon branch แยกที่ไม่ใช่ development, staging หรือ production');
}

let hostname: string;
try {
  hostname = new URL(process.env.DATABASE_URL ?? '').hostname;
} catch {
  throw new Error('ต้องกำหนด DATABASE_URL ของ Neon branch development ใน .dev.vars');
}

if (hostname !== expectedHost) {
  throw new Error(`หยุดคำสั่ง: DATABASE_URL ไม่ตรงกับ branch ${isCi ? 'CI' : 'development'} ที่อนุญาต (พบ ${hostname})`);
}

console.log(`ตรวจฐานข้อมูล ${isCi ? 'CI' : 'development'} แล้ว`);
