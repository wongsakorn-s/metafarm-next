const developmentHost = 'ep-twilight-pine-b3svkey5-pooler.c-4.ap-southeast-1.aws.neon.tech';

let hostname: string;
try {
  hostname = new URL(process.env.DATABASE_URL ?? '').hostname;
} catch {
  throw new Error('ต้องกำหนด DATABASE_URL ของ Neon branch development ใน .dev.vars');
}

if (hostname !== developmentHost) {
  throw new Error(`หยุดคำสั่ง local: DATABASE_URL ต้องชี้ Neon branch development (พบ ${hostname})`);
}

console.log('ตรวจฐานข้อมูล development แล้ว');
