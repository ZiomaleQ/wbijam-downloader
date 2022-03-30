// deno-lint-ignore-file no-explicit-any
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { getUrl } from "./parser.js";

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

  return urls.reverse();
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

  const blob = await res.blob()!;
  Deno.writeFileSync(fileName, new Uint8Array(await blob.arrayBuffer()), {
    create: true,
  });

  console.log("Downloaded: " + fileName);
}
