import fs from "fs";
const path = "dist/server/index.js";

let content = fs.readFileSync(path, "utf8");
content = content.replace(
  /from\s+['"]?\.\.\/http-backend\/dist['"]?/g,
  "from '../../http-backend/dist/index.js'",
);
content = content.replace(
  /from\s+['"]?\.\.\/ws-backend\/dist['"]?/g,
  "from '../../ws-backend/dist/index.js'",
);
fs.writeFileSync(path, content);
console.log("Fixed import paths");
