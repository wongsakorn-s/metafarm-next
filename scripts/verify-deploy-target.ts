import { readFileSync } from 'node:fs';
import { verifyDeployTarget, type DeployTarget } from './deploy-target';

const target = process.argv[2];
if (target !== 'staging' && target !== 'production') {
  throw new Error('ระบุ deploy target เป็น staging หรือ production');
}

const configPath = target === 'staging' ? 'wrangler.staging.jsonc' : 'wrangler.jsonc';
const config = JSON.parse(readFileSync(configPath, 'utf8'));
verifyDeployTarget(target as DeployTarget, process.env.DATABASE_URL, config);
console.log(`ตรวจเป้าหมาย ${target} แล้ว`);
