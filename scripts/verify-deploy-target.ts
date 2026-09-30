import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { verifyDeployTarget, type DeployTarget } from './deploy-target';

const target = process.argv[2];
if (target !== 'staging' && target !== 'production') {
  throw new Error('ระบุ deploy target เป็น staging หรือ production');
}

const configPath = target === 'staging' ? 'wrangler.staging.jsonc' : 'wrangler.jsonc';
// wrangler config is JSONC, so parse it with a reader that accepts comments and trailing commas.
const parsed = ts.parseConfigFileTextToJson(configPath, readFileSync(configPath, 'utf8'));
if (parsed.error) throw new Error(`อ่าน ${configPath} ไม่สำเร็จ`);
verifyDeployTarget(target as DeployTarget, process.env.DATABASE_URL, parsed.config);
console.log(`ตรวจเป้าหมาย ${target} แล้ว`);
