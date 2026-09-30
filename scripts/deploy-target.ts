export type DeployTarget = 'development' | 'staging' | 'production';

type WorkerConfig = {
  name?: unknown;
  r2_buckets?: unknown;
};

const expected = {
  development: {
    databaseHost: 'ep-twilight-pine-b3svkey5-pooler.c-4.ap-southeast-1.aws.neon.tech',
    worker: 'metafarm-next-dev',
    bucket: 'metafarm-next-media-dev'
  },
  staging: {
    databaseHost: 'ep-summer-frost-b38pqku0-pooler.c-4.ap-southeast-1.aws.neon.tech',
    worker: 'metafarm-next-staging',
    bucket: 'metafarm-next-media-staging'
  },
  production: {
    databaseHost: 'ep-green-tree-b3jpebj1-pooler.c-4.ap-southeast-1.aws.neon.tech',
    worker: 'metafarm-next',
    bucket: 'metafarm-next-media'
  }
} satisfies Record<DeployTarget, { databaseHost: string; worker: string; bucket: string }>;

export function verifyDeployTarget(target: DeployTarget, databaseUrl: string | undefined, config: WorkerConfig): void {
  const settings = expected[target];
  let database: URL;
  try {
    database = new URL(databaseUrl ?? '');
  } catch {
    throw new Error('ไม่มี DATABASE_URL ที่ถูกต้องสำหรับ deploy');
  }

  if (!['postgres:', 'postgresql:'].includes(database.protocol) || !database.username || !database.password) {
    throw new Error(`หยุด deploy ${target}: DATABASE_URL ไม่ใช่ PostgreSQL connection string ที่ครบถ้วน`);
  }
  if (database.hostname !== settings.databaseHost) {
    throw new Error(`หยุด deploy ${target}: Neon hostname ไม่ตรง (พบ ${database.hostname})`);
  }
  if (config.name !== settings.worker) {
    throw new Error(`หยุด deploy ${target}: Worker name ไม่ตรง`);
  }
  if (
    !Array.isArray(config.r2_buckets) ||
    config.r2_buckets.length !== 1 ||
    config.r2_buckets[0]?.binding !== 'MEDIA' ||
    config.r2_buckets[0]?.bucket_name !== settings.bucket
  ) {
    throw new Error(`หยุด deploy ${target}: R2 bucket ไม่ตรง`);
  }
}
