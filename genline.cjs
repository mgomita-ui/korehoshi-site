// チャッピーさん案のテイスト：紺の線画イラスト（あるある6枚）と、トップの背景写真
const fs = require("fs"), path = require("path");
const lb = "C:/Users/mgomi/dev/lovebu-manga-builder/lovebu-manga-builder";
if (!process.env.OPENAI_API_KEY) { try { require(path.join(lb,"node_modules","dotenv")).config({path:path.join(lb,".env")}); } catch(e){} }
const OpenAI = require(path.join(lb,"node_modules","openai")); const { toFile } = OpenAI;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 600000 });
const out = path.join(__dirname, "img", "line"); fs.mkdirSync(out, { recursive: true });
const STYLE = " Style: refined Japanese business line illustration, thin navy (#0B2A5B) ink outlines with soft pale-blue (#DCE8F8) and light grey fills, a little navy solid on hair and jacket, pure white background, no gradients, no shadows, elegant and calm like a consulting firm brochure. One Japanese office worker in business attire, waist-up, seated at a desk with a laptop, realistic proportions (not cartoon, not chibi), simple face. Small squiggle 'worry' mark near the head. No text, no letters, no numbers, no logos. Square 1:1, subject centered with white margin.";
const S = [
 ["a1", "A woman resting her head on one hand, tired, a small clock icon floating beside her, a stack of papers at her elbow. She forgot a task she left for later."],
 ["a2", "A man in a suit with hand on chin, thinking, next to a very tall stack of books and papers on his desk. Heavy tasks have piled up."],
 ["a3", "A woman with hand on chin looking at an open laptop, a tall stack of binders beside her. She has to look up past records before replying."],
 ["a4", "A man in a suit holding his forehead with one hand, head down, a stack of thick documents beside his laptop. The text he received is too long to read."],
 ["a5", "A woman resting her cheek on her hand, looking bored, with several document sheets floating in the air between two screens. She keeps copying and pasting."],
 ["a6", "A man in a suit with hand on chin and a large question mark above his head, a stack of papers beside him. He no longer understands what is going on."],
];
async function edit(spec, ref, file, size) {
  if (fs.existsSync(file)) return "skip";
  const img = await toFile(fs.readFileSync(ref), "ref.jpg", { type: "image/jpeg" });
  const r = await client.images.edit({ model: "gpt-image-2.5-sunburst", image: img, prompt: spec, size, quality: "high" });
  fs.writeFileSync(file, Buffer.from(r.data[0].b64_json, "base64")); return "ok";
}
(async () => {
  const ref = "C:/Users/mgomi/dev/ifbox-site/ref/chappy-fv.jpg";
  const jobs = S.map(([n, t]) => edit("Draw ONE new illustration in the same line-illustration style as the six small people illustrations in the lower half of the reference image (ignore everything else in the reference). Scene: " + t + STYLE, ref, path.join(out, n + ".png"), "1024x1024").then(r => console.log(n, r)).catch(e => console.error(n, "FAIL", String(e.message).slice(0, 160))));
  jobs.push(client.images.generate({ model: "gpt-image-2.5-sunburst", size: "1536x1024", quality: "high",
    prompt: "Bright, airy photograph of a modern Japanese office desk by a window, shallow depth of field, heavily blurred background with soft daylight, white and pale blue tones, a small green plant at the right edge, a notebook and pen on a white desk in the lower foreground. The LEFT 55% of the frame is almost white and empty (for a headline). No people, no screens, no text, no logos. Clean corporate look." })
    .then(r => { fs.writeFileSync(path.join(out, "hero-bg.png"), Buffer.from(r.data[0].b64_json, "base64")); console.log("hero-bg ok"); }).catch(e => console.error("hero FAIL", String(e.message).slice(0, 160))));
  await Promise.all(jobs); console.log("DONE");
})();
