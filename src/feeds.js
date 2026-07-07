import { PageData } from './PageData.js';
import { normalizeDocumentPath } from './standalone-demo-url.js';

/** @typedef {import('@rocket/js/types.js').Page} Page */
/** @typedef {import('@rocket/js/types.js').PageCollectionEntry} PageCollectionEntry */
/** @typedef {import('@rocket/js/types.js').PageFeedConfig} PageFeedConfig */
/** @typedef {import('@rocket/js/types.js').PageFeedDeclaration} PageFeedDeclaration */
/** @typedef {import('@rocket/js/types.js').PageRegistry} PageRegistry */

// Atom requires a feed-level <updated> value even when no entry has dates yet.
const FALLBACK_UPDATED = '1970-01-01';

/**
 * @param {Page} page
 */
export function hasPageFeed(page) {
  return page.file.endsWith('.js') && page.module.feed !== undefined;
}

/**
 * @param {string} pagePath
 */
export function pageFeedPath(pagePath) {
  return `${normalizeDocumentPath(pagePath)}feed.xml`;
}

/**
 * @param {string} pathname
 * @param {PageRegistry} pages
 * @returns {{ page: Page; routePath: string } | null}
 */
export function matchPageFeedPath(pathname, pages) {
  for (const [routePath, page] of pages) {
    if (!hasPageFeed(page) || hasPathParameter(routePath)) {
      continue;
    }
    if (pageFeedPath(routePath) === pathname) {
      return { page, routePath };
    }
  }
  return null;
}

/**
 * @param {{
 *   pages: PageRegistry;
 *   page: Page;
 *   pagePath: string;
 *   siteOrigin: string;
 * }} options
 * @returns {string}
 */
export function createPageFeed({ pages, page, pagePath, siteOrigin }) {
  if (hasPathParameter(pagePath)) {
    throw new Error(
      `Page Feed for ${page.file} cannot use the parameterized path ${pagePath}. ` +
        `Page Feeds need a concrete owning Page path.`,
    );
  }
  const config = resolvePageFeedConfig({ pages, page, pagePath });
  const feedUrl = absoluteUrl(siteOrigin, pageFeedPath(pagePath));
  const pageUrl = absoluteUrl(siteOrigin, normalizeDocumentPath(pagePath));
  const entries =
    config.limit === undefined ? config.collection : config.collection.slice(0, config.limit);

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${escapeXml(config.title)}</title>`,
  ];
  if (config.description) {
    lines.push(`  <subtitle>${escapeXml(config.description)}</subtitle>`);
  }
  lines.push(
    `  <id>${escapeXml(pageUrl)}</id>`,
    `  <link rel="self" type="application/atom+xml" href="${escapeXml(feedUrl)}"/>`,
    `  <link rel="alternate" type="text/html" href="${escapeXml(pageUrl)}"/>`,
    `  <updated>${atomDate(newestEntryDate(entries))}</updated>`,
  );
  for (const entry of entries) {
    lines.push(...feedEntryLines(entry, siteOrigin));
  }
  lines.push('</feed>', '');
  return lines.join('\n');
}

/**
 * @param {PageCollectionEntry} entry
 * @param {string} siteOrigin
 */
function feedEntryLines(entry, siteOrigin) {
  const entryUrl = absoluteUrl(siteOrigin, normalizeDocumentPath(entry.path));
  const lines = [
    '  <entry>',
    `    <title>${escapeXml(entry.metadata.title)}</title>`,
    `    <id>${escapeXml(entryUrl)}</id>`,
    `    <link rel="alternate" type="text/html" href="${escapeXml(entryUrl)}"/>`,
    `    <updated>${atomDate(entry.metadata.updated || entry.metadata.date || FALLBACK_UPDATED)}</updated>`,
  ];
  if (entry.metadata.date) {
    lines.push(`    <published>${atomDate(entry.metadata.date)}</published>`);
  }
  if (entry.metadata.description) {
    lines.push(`    <summary>${escapeXml(entry.metadata.description)}</summary>`);
  }
  for (const author of entry.metadata.authors || []) {
    lines.push('    <author>', `      <name>${escapeXml(author)}</name>`, '    </author>');
  }
  lines.push('  </entry>');
  return lines;
}

/**
 * @param {{
 *   pages: PageRegistry;
 *   page: Page;
 *   pagePath: string;
 * }} options
 * @returns {PageFeedConfig}
 */
function resolvePageFeedConfig({ pages, page, pagePath }) {
  const declaration = /** @type {PageFeedDeclaration} */ (page.module.feed);
  const config =
    typeof declaration === 'function'
      ? declaration(new PageData(pages, page.metadata, pagePath))
      : declaration;
  return normalizePageFeedConfig(config, page);
}

/**
 * @param {unknown} config
 * @param {Page} page
 * @returns {PageFeedConfig}
 */
function normalizePageFeedConfig(config, page) {
  if (typeof config !== 'object' || config === null) {
    throw new Error(pageFeedConfigError(page));
  }
  const feedConfig = /** @type {Record<string, unknown>} */ (config);
  if (
    typeof feedConfig.title !== 'string' ||
    feedConfig.title.trim() === '' ||
    !Array.isArray(feedConfig.collection) ||
    (feedConfig.description !== undefined && typeof feedConfig.description !== 'string') ||
    (feedConfig.limit !== undefined &&
      (typeof feedConfig.limit !== 'number' ||
        !Number.isInteger(feedConfig.limit) ||
        feedConfig.limit <= 0))
  ) {
    throw new Error(pageFeedConfigError(page));
  }
  return /** @type {PageFeedConfig} */ (config);
}

/**
 * @param {Page} page
 */
function pageFeedConfigError(page) {
  return (
    `Page Feed for ${page.file} must provide a non-empty title, a collection array, ` +
    `an optional string description, and an optional positive integer limit.`
  );
}

/**
 * @param {PageCollectionEntry[]} entries
 */
function newestEntryDate(entries) {
  let newest = '';
  for (const entry of entries) {
    const date = entry.metadata.updated || entry.metadata.date || '';
    if (date > newest) {
      newest = date;
    }
  }
  return newest || FALLBACK_UPDATED;
}

/**
 * Page Metadata dates are date-only ISO strings; Atom requires full timestamps.
 * @param {string} date
 */
function atomDate(date) {
  return `${date}T00:00:00Z`;
}

/**
 * @param {string} siteOrigin
 * @param {string} pagePath
 */
function absoluteUrl(siteOrigin, pagePath) {
  return new URL(pagePath, `${siteOrigin}/`).href;
}

/**
 * @param {string} pagePath
 */
function hasPathParameter(pagePath) {
  return /(^|\/):[^/]+/.test(pagePath);
}

/**
 * @param {string} value
 */
function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
