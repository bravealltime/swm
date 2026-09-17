import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env if present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      process.env[k.trim()] = v.join('=').trim();
    }
  });
}

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME
} = process.env;

const isDryRun = process.argv.includes('--dry-run');

console.log('====================================================');
console.log('⚡ Summoners War Master • Cloudflare R2 Sync Engine');
console.log('====================================================\n');

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.log('⚠️  ยังไม่ได้ตั้งค่า R2 Credentials ในไฟล์ .env');
  console.log('\nวิธีตั้งค่า Cloudflare R2 (ทำเพียง 2 นาที):');
  console.log('1. ล็อกอินเข้า https://dash.cloudflare.com/');
  console.log('2. ไปที่เมนู R2 Object Storage -> Create Bucket -> ตั้งชื่อว่า "swm-assets"');
  console.log('3. กด Settings -> Public Development R2.dev bucket -> เปิดใช้งาน (Enable)');
  console.log('4. ไปที่ R2 Overview -> คลิก "Manage R2 API Tokens" -> "Create API Token"');
  console.log('5. ให้สิทธิ์ "Admin Read & Write" แล้วคัดลอกค่ามาใส่ใน .env ดังนี้:');
  console.log(`
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=swm-assets
VITE_R2_PUBLIC_URL=https://pub-xxxxxx.r2.dev
  `);
  console.log('เมื่อตั้งค่าเสร็จแล้ว ให้รันคำสั่งนี้อีกครั้งเพื่ออัปโหลดข้อมูลจริงขึ้น R2 ทันที!\n');
  process.exit(0);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function uploadBuffer(key, buffer, contentType) {
  if (isDryRun) {
    console.log(`[DRY RUN] Would upload: ${key} (${buffer.length} bytes, ${contentType})`);
    return true;
  }

  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  await s3Client.send(cmd);
  console.log(`✅ Uploaded: ${key} (${(buffer.length / 1024).toFixed(1)} KB)`);
  return true;
}

async function syncAll() {
  const playersPath = path.resolve(__dirname, '../src/data/playerProfiles.json');
  if (!fs.existsSync(playersPath)) {
    console.error('❌ ไม่พบไฟล์ playerProfiles.json');
    return;
  }

  const players = JSON.parse(fs.readFileSync(playersPath, 'utf8'));
  console.log(`📦 ตรวจพบผู้เล่นทั้งหมด: ${players.length} คน\n`);

  let successCount = 0;
  let failCount = 0;

  // 1. Sync Profile Avatars
  console.log('--- 1. อัปโหลดรูปโปรไฟล์ผู้เล่นขึ้น Cloudflare R2 ---');
  for (const p of players) {
    const avatarUrl = p.profileAvatar;
    if (!avatarUrl || avatarUrl.includes('dicebear')) continue;

    const key = `avatars/${p.id}.webp`;

    try {
      const res = await fetch(avatarUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await uploadBuffer(key, buffer, 'image/webp');
      successCount++;
    } catch (err) {
      console.warn(`⚠️ ไม่สามารถดาวน์โหลดรูปของ ${p.name}: ${err.message}`);
      failCount++;
    }
  }

  // 2. Sync Match Histories (Heavy JSON chunks)
  console.log('\n--- 2. แยกประวัติการแข่งหลายร้อยแมตช์เป็น JSON Chunks ขึ้น R2 ---');
  for (const p of players) {
    if (!p.recentMatches || p.recentMatches.length === 0) continue;

    const key = `matches/s38/${p.id}.json`;
    const dataBuffer = Buffer.from(JSON.stringify(p.recentMatches), 'utf8');

    try {
      await uploadBuffer(key, dataBuffer, 'application/json');
      successCount++;
    } catch (err) {
      console.warn(`⚠️ อัปโหลดประวัติแข่งของ ${p.name} ล้มเหลว: ${err.message}`);
      failCount++;
    }
  }

  console.log('\n====================================================');
  console.log(`🎉 ซิงค์ข้อมูลขึ้น Cloudflare R2 สำเร็จ: ${successCount} ไฟล์ (ล้มเหลว: ${failCount})`);
  console.log('====================================================\n');
}

syncAll().catch(err => {
  console.error('Fatal Error during R2 sync:', err);
});
