// deno-lint-ignore-file no-explicit-any
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { getUrl } from "./parser.js";
import ProgressBar from "https://deno.land/x/progress@v1.2.4/mod.ts";

const mainUrl = "https://" + new URL(Deno.args[0]).host;

async function getUrls(url: string): Promise<{ url: string; name: string }[]> {
  const urls = [];
  const raw = (await (await fetch(url)).text());
  const parsed = new DOMParser().parseFromString(raw, "text/html");
  const tableData = parsed?.querySelector("tbody")?.childNodes!;
  const rows = [...tableData].filter((elt) => elt.nodeName === "TR");
  for (const row of rows) {
    const nodes = [...row.childNodes].filter((elt) => elt.nodeName === "TD");

    const anchor = nodes[0].childNodes[0];
    const href = (anchor as any).attributes.href;
    urls.push({
      url: mainUrl + "/" + href,
      name: anchor.textContent.trim(),
    });
  }

  const fromIndex = urls.findIndex(elt => elt.url === Deno.args[2])
  return (fromIndex === -1 ? urls : urls.slice(0, fromIndex)).reverse();
}

async function getPlayerUrl(url: string): Promise<string> {
  const raw = (await (await fetch(url)).text());
  const parsed = new DOMParser().parseFromString(raw, "text/html")!;
  const tableData = parsed?.querySelector("tbody")?.childNodes!;
  const rows = [...tableData].filter((elt) => elt.nodeName === "TR");

  for (const row of rows) {
    const nodes = [...row.childNodes].filter((elt) => elt.nodeName === "TD");
    if (nodes.length === 0) continue;
    const service = nodes[2].textContent;
    if (service === "cda") {
      return mainUrl + "/odtwarzacz-" +
        (nodes[4].firstChild as any).attributes.rel + ".html";
    }
  }
  return "";
}

async function getCDAUrl(url: string): Promise<string> {
  const raw = (await (await fetch(url)).text());
  const parsed = new DOMParser().parseFromString(raw, "text/html")!;
  return [...parsed.querySelectorAll("iframe")].map((elt) =>
    (elt as any).attributes.src
  ).filter((elt) => elt.indexOf("cda") > 0)[0];
}

async function getVideoUrl(url: string): Promise<string> {
  return await getUrl(url);
}

const urls = await getUrls(Deno.args[0]);
const playerUrls = await Promise.all(
  urls.map(async (link) => ({
    url: await getPlayerUrl(link.url),
    name: link.name,
  })),
);

const cdaUrls = await Promise.all(
  playerUrls.map(async (link) => ({
    url: await getCDAUrl(link.url),
    name: link.name,
  })),
);

const videoUrls = await Promise.all(
  cdaUrls.map(async (link) => ({
    url: await getVideoUrl(link.url),
    name: link.name,
  })),
);

for (const dataRow of videoUrls) {
  const res = await fetch(dataRow.url);
  const fileName = (Deno.args[1] ? Deno.args[1] : "./") +
    dataRow.name.split(":")[0] + ".mp4";

  const reader = res.body?.getReader()!;
  const length = +res.headers.get("Content-Length")!;
  let received = 0;
  const chunks = [];

  const bar = new ProgressBar({
    title: "Download " + fileName,
    complete: "=",
    incomplete: "-",
    display: "[:bar] :percent :time :completed/:total",
    total: length,
    clear: true
  });

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      bar.end();
      console.log("Finished downloading " + fileName);
      break;
    }

    chunks.push(value);
    received += value?.length!;

    bar.render(received);
  }

  const allChunks = new Uint8Array(received);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk!, position);
    position += chunk?.length!;
  }

  Deno.writeFileSync(fileName, allChunks, {
    create: true,
  });
}
