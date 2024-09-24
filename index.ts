import { join } from "node:path";
import linguist from "linguist-js";
import piston from "piston-client";

const acePath = join(__dirname, "ace-builds", "src-min");
const modulePath = join(__dirname, "node_modules");
const sauce = join(__dirname, "sauce");
const errorPage = await Bun.file(join(sauce, "404.html")).text();
const client = piston({ server: "http://2.dreamnity.in:2000" });

console.log("\u001bcIt works", Date.now()%10000);
Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    // Modules
    if (url.pathname.startsWith("/module"))
      return new Response(Bun.file(join(modulePath, url.pathname.split("/").slice(2).join("/"))));
    // Ace-related files
    if (url.pathname.startsWith("/ace"))
      return new Response(Bun.file(join(acePath, url.pathname.split("/").slice(2).join("/"))));
    if (url.pathname.startsWith("/api/classify")) {
      const { files } = await linguist("file", {
        fileContent: await req.text(),
        //offline: true,
        //categories: ["programming"]
      });
      if (!files.results["file"]) return new Response("null", {
        status: 404
      });
      return new Response(files.results["file"]);
    }
    if (url.pathname.startsWith("/api/execute")) {
      return new Response(
        JSON.stringify(
          await client.execute(url.searchParams.get("lang") || 'javascript', await req.text(), {
            version: 'latest'
          })
        )
      )
    }
    let path = join(sauce,url.pathname);
    if (path.endsWith("/") && await Bun.file(path + "index.html").exists())
      return new Response(Bun.file(path + "index.html"));
    const file = Bun.file(path);
    if (!await file.exists()) return makeErrorPage("Page not found", 404);
    return new Response(file);
  },
  error(req) {
    return makeErrorPage(req.message);
  },
  port: 50004
});

function makeErrorPage(message: string, code: number = 500) {
  return new Response(errorPage.replace("{{ERROR}}", message), {
    status: code,
    statusText: message,
    headers: {
      'Content-Type': "text/html"
    }
  });
}

type Runtime = {
  language: string,
  version: string,
  aliases: string[]
}