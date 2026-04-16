const fs = require("fs");
const path = require("path");
const sharp = require("sharp"); // npm i sharp

const ROOT = __dirname;
const SRC = path.join(ROOT, "logo.png");

async function makeSet(baseDir, sizes) {
  const outDir = path.join(ROOT, baseDir, "icons");
  fs.mkdirSync(outDir, { recursive: true });

  for (const s of sizes) {
    const outPath = path.join(outDir, `favicon-${s}x${s}.png`);
    await sharp(SRC).resize(s, s).png().toFile(outPath);
    console.log(`${baseDir}: ${s}x${s} -> ${outPath}`);
  }
}

async function run() {
  if (!fs.existsSync(SRC)) {
    console.error("logo.png не найден в корне проекта");
    process.exit(1);
  }

  // Практика 13-14
  await makeSet("practice_13_14", [16, 32, 48, 64, 128, 256, 512]);

  // Практика 15-16-17
  await makeSet("practice_15_16_17", [16, 32, 128, 512]);

  console.log("Все иконки сгенерированы.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});