import { describe, expect, it } from 'vitest';
import { verifyDeployTarget } from './deploy-target';

const staging = {
  name: 'metafarm-next-staging',
  r2_buckets: [{ binding: 'MEDIA', bucket_name: 'metafarm-next-media-staging' }]
};
const stagingUrl = 'postgresql://user:password@ep-summer-frost-b38pqku0-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb';

describe('deploy target guard', () => {
  it('accepts matching staging resources', () => {
    expect(() => verifyDeployTarget('staging', stagingUrl, staging)).not.toThrow();
  });

  it('rejects a production database during staging deploy', () => {
    const productionUrl = 'postgresql://user:password@ep-green-tree-b3jpebj1-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb';
    expect(() => verifyDeployTarget('staging', productionUrl, staging)).toThrow('Neon hostname ไม่ตรง');
  });

  it('rejects the wrong R2 bucket', () => {
    const config = { ...staging, r2_buckets: [{ binding: 'MEDIA', bucket_name: 'metafarm-next-media' }] };
    expect(() => verifyDeployTarget('staging', stagingUrl, config)).toThrow('R2 bucket ไม่ตรง');
  });

  it('rejects missing credentials', () => {
    expect(() => verifyDeployTarget('staging', undefined, staging)).toThrow('DATABASE_URL');
  });

  it('rejects an incomplete PostgreSQL URL', () => {
    expect(() => verifyDeployTarget('staging', 'https://ep-summer-frost-b38pqku0-pooler.c-4.ap-southeast-1.aws.neon.tech', staging)).toThrow('PostgreSQL');
  });
});
