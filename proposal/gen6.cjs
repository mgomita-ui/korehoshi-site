// proposal6_plan.json の各ページのイラストを gpt-image-2.5-sunburst で一括生成（あるあるの1枚目を参照に、同じ絵柄）
const fs = require("fs"), path = require("path");
const lb = "C:/Users/mgomi/dev/lovebu-manga-builder/lovebu-manga-builder";
if (!process.env.OPENAI_API_KEY) { try { require(path.join(lb,"node_modules","dotenv")).config({path:path.join(lb,".env")}); } catch(e){} }
const OpenAI = require(path.join(lb,"node_modules","openai")); const { toFile } = OpenAI;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 600000 });
const PLAN = process.argv[2];
const plan = JSON.parse(fs.readFileSync(PLAN, "utf8"));
const outDir = path.join(__dirname, "img6"); fs.mkdirSync(outDir, { recursive: true });
const STYLE = " Style (must match the reference exactly): flat vector illustration for a Japanese corporate SaaS proposal, plain white background, royal blue #0B3FA8, pale blue #EEF3FC, mid grey #8b93a1, one coral accent #E85B52 on the single most important element, the same friendly gender-neutral office worker as the reference (round head, two dot eyes only, short dark-blue hair, white shirt). Clean shapes, no gradients, no shadows, no texture. Absolutely no text, letters, numbers, logos or brand marks anywhere (screens show only grey bars and dots). Landscape 3:2, scene centered, readable at small size. Draw a NEW scene; copy only the style and character design from the reference, not its scene.";
const refBuf = fs.readFileSync(path.join(__dirname, "..", "img", "aru", "aru1.png"));
async function one(p) {
  const f = path.join(outDir, `p${String(p.no).padStart(2, "0")}.png`);
  if (p.image.startsWith("screenshot")) return "skip(screenshot)";
  if (fs.existsSync(f)) return "skip(exists)";
  const ref = await toFile(refBuf, "ref.png", { type: "image/png" });
  const r = await client.images.edit({ model: "gpt-image-2.5-sunburst", image: ref, prompt: "Scene: " + p.image + STYLE, size: "1536x1024", quality: "high" });
  fs.writeFileSync(f, Buffer.from(r.data[0].b64_json, "base64")); return "ok";
}
(async () => {
  const q = plan.pages.slice(); const N = 4; let running = 0;
  await new Promise((done) => {
    const next = () => { if (!q.length && !running) return done(); while (running < N && q.length) { const p = q.shift(); running++; one(p).then(s => console.log("p" + p.no, s)).catch(e => console.error("p" + p.no, "FAIL", String(e.message).slice(0, 160))).finally(() => { running--; next(); }); } };
    next();
  });
  console.log("DONE");
})();
