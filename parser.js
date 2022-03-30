import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

async function getFile(url) {
  const raw = (await (await fetch(url)).text());
  const parsed = new DOMParser().parseFromString(raw, "text/html");

  const x = parsed.querySelector(`#mediaplayer${getID(url)}`);
  return JSON.parse(x.attributes.player_data).video.file;
}

function getID(url) {
  return new URL(url).pathname.split("/")[2];
}

export async function getUrl(url) {
  return M(await getFile(url));
}
function da(a) {
  a = a.replace(".cda.mp4", "");
  a = a.replace(".2cda.pl", ".cda.pl");
  a = a.replace(".3cda.pl", ".cda.pl");
  return -1 < a.indexOf("/upstream")
    ? ((a = a.replace("/upstream", ".mp4/upstream")), "https://" + a)
    : "https://" + a + ".mp4";
}
function ca(a) {
  return decodeURIComponent(a);
}
function L(a) {
  const b = [];
  for (let e = 0; e < a.length; e++) {
    const f = a.charCodeAt(e);
    b[e] = 33 <= f && 126 >= f
      ? String.fromCharCode(33 + ((f + 14) % 94))
      : String.fromCharCode(f);
  }
  return da(b.join(""));
}
function ba(a) {
  return aa(ca(K(a)));
}
function M(a) {
  let c = ""
  String.fromCharCode(
    ("Z" >= a ? 11 : 344) >= (c = a.charCodeAt(0) + 22) ? c : c - 11,
  );
  a = a.replace("_XDDD", "");
  a = a.replace("_CDA", "");
  a = a.replace("_ADC", "");
  a = a.replace("_CXD", "");
  a = a.replace("_QWE", "");
  a = a.replace("_Q5", "");
  a = a.replace("_IKSDE", "");
  return ba(K(a));
}
function K(a) {
  return a.replace(/[a-zA-Z]/g, function (a) {
    return String.fromCharCode(
      ("Z" >= a ? 90 : 122) >= (a = a.charCodeAt(0) + 13) ? a : a - 26,
    );
  });
}
function aa(a) {
  return L(a);
}
