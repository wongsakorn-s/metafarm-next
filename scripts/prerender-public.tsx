import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { PublicPage } from "../src/pages/PublicPage";
import { publicNavigationRoutes, publicRoutes } from "../src/pages/publicRoutes";
import { th } from "../src/i18n/th";

const dist = path.resolve("dist");
const template = await readFile(path.join(dist, "index.html"), "utf8");
const origin = (process.env.PUBLIC_SITE_ORIGIN ?? "https://metafarm-next.wong-saengsurasak.workers.dev").replace(/\/$/, "");
if (!/^https:\/\/[^/]+$/.test(origin)) throw new Error("PUBLIC_SITE_ORIGIN ต้องเป็น HTTPS origin เท่านั้น");

const descriptions: Record<string, string> = {
  "/": th.public.homeLead,
  "/stingless-bee": th.public.beeIntro,
  "/stingless-bee-honey": th.public.honeyIntro,
  "/contact": th.public.contactIntro,
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

for (const route of publicRoutes) {
  const title = `${route.label} | MetaFarm`;
  const description = descriptions[route.path] ?? title;
  const url = new URL(route.path, `${origin}/`).href;
  const markup = renderToString(<PublicPage initialPath={route.path} />);
  const metadata = route.published ? [
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    '<meta name="robots" content="index,follow" />',
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
  ] : ['<meta name="robots" content="noindex,nofollow" />'];
  if (route.path === "/") metadata.push(
    '<link rel="preload" as="image" href="/videos/metafarm-poster.webp" fetchpriority="high" />',
    `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "LocalBusiness", name: "MetaFarm", url: origin }).replace(/</g, "\\u003c")}</script>`,
  );
  const html = template
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace("</head>", `${metadata.join("\n    ")}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
  const target = route.path === "/" ? path.join(dist, "index.html") : path.join(dist, route.path.slice(1), "index.html");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicNavigationRoutes.map((route) => `<url><loc>${escapeHtml(new URL(route.path, `${origin}/`).href)}</loc></url>`).join("")}</urlset>\n`;
await writeFile(path.join(dist, "sitemap.xml"), sitemap);
await writeFile(path.join(dist, "robots.txt"), `User-agent: *\nDisallow: /admin\nDisallow: /api\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Prerendered ${publicNavigationRoutes.length} public and ${publicRoutes.length - publicNavigationRoutes.length} unpublished routes`);
