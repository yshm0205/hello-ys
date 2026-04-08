/**
 * 기존 JSON 채널 데이터를 Supabase hot_channels에 일괄 등록
 * Usage: node scripts/seed-channels.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// .env.local 수동 파싱
const envContent = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  if (line.startsWith("#")) continue;
  const idx = line.indexOf("=");
  if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
}
process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const FILES = [
  { file: "public/data/channels_2026_01.json", month: "2026-01" },
  { file: "public/data/channels_2026_02.json", month: "2026-02" },
];

function extractHandle(url) {
  // https://www.youtube.com/@handle/shorts -> handle
  const match = url.match(/@([^/]+)/);
  return match ? match[1] : url;
}

async function seed() {
  for (const { file, month } of FILES) {
    console.log(`\n📂 Processing ${file} (${month})...`);
    const raw = readFileSync(file, "utf-8");
    const data = JSON.parse(raw);

    const rows = data.channels.map((ch) => ({
      channel_id: `ch_${month}_${extractHandle(ch.channel_url)}`,
      title: ch.name,
      subscriber_count: ch.subscribers || 0,
      avg_view_count: ch.avg_views || 0,
      median_views: ch.median_views || 0,
      category: ch.category || "",
      subcategory: ch.subcategory || "",
      format: ch.format || "",
      channel_url: ch.channel_url || "",
      month,
      video_count: 0,
      total_view_count: 0,
      thumbnail_url: null,
      updated_at: new Date().toISOString(),
    }));

    // 50개씩 batch upsert
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase
        .from("hot_channels")
        .upsert(batch, { onConflict: "channel_id" });

      if (error) {
        console.error(`  ❌ Batch ${i}-${i + batch.length}: ${error.message}`);
      } else {
        console.log(`  ✅ Batch ${i}-${i + batch.length} (${batch.length}개)`);
      }
    }

    console.log(`  총 ${rows.length}개 채널 처리 완료`);
  }
}

seed().then(() => console.log("\n🎉 Done!"));
