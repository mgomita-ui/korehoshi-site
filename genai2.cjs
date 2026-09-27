// 「複数のAI・コンピューターユース」の節のイラスト（あるあると同じ絵柄・同じ人物）
const fs = require("fs"), path = require("path");
const lb = "C:/Users/mgomi/dev/lovebu-manga-builder/lovebu-manga-builder";
if (!process.env.OPENAI_API_KEY) { try { require(path.join(lb,"node_modules","dotenv")).config({path:path.join(lb,".env")}); } catch(e){} }
const OpenAI = require(path.join(lb,"node_modules","openai")); const { toFile } = OpenAI;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 600000 });
const spec = `Draw a NEW scene in exactly the same flat illustration style, palette and the same character design as the reference (do not copy the reference scene). Scene: the same office worker leans back relaxed in a chair with a mug, watching a large monitor where a form is being filled in BY ITSELF: a big cursor arrow with small motion lines is clicking fields, and grey text-bars appear in the fields. Beside the monitor, four small floating rounded badges in a row (pale blue, blue, light grey, coral), each with a tiny sparkle, pass a small document card from one to the next like a relay, ending at a small coral button on the desk that the worker's hand is resting near but not pressing. White background, flat vector, royal blue #0B3FA8, pale blue #EEF3FC, mid grey #8b93a1, one coral accent #E85B52, no text, no letters, no logos, two dot eyes only. Landscape 3:2, scene centered.`;
(async () => {
  const ref = await toFile(fs.readFileSync(path.join(__dirname,"img","aru","aru1.png")), "ref.png", {type:"image/png"});
  const r = await client.images.edit({ model: "gpt-image-2.5-sunburst", image: ref, prompt: spec, size: "1536x1024", quality: "high" });
  fs.writeFileSync(path.join(__dirname,"img","ai2.png"), Buffer.from(r.data[0].b64_json,"base64")); console.log("ok ai2");
})().catch(e=>{console.error("fail",String(e.message).slice(0,300));process.exit(1)});
