import { PageData } from './PageData.js';

/** @typedef {import('@rocket/js/types.js').Page} Page */
/** @typedef {import('@rocket/js/types.js').PageRegistry} PageRegistry */
/** @typedef {import('@rocket/js/types.js').PageStaticParams} PageStaticParams */
/** @typedef {import('@rocket/js/types.js').PageStaticParamsDeclaration} PageStaticParamsDeclaration */

/**
 * @param {Page} page
 */
export function hasStaticParams(page) {
  return page.file.endsWith('.js') && page.module.staticParams !== undefined;
}

/**
 * @param {string} pagePath
 */
export function hasPathParameter(pagePath) {
  return /(^|\/):[^/]+/.test(pagePath);
}

/**
 * Enumerates the concrete output paths of a parameterized static JavaScript
 * Page from its `staticParams` export.
 *
 * @param {{
 *   pages: PageRegistry;
 *   page: Page;
 *   pagePath: string;
 * }} options
 * @returns {string[]}
 */
export function staticParamsPagePaths({ pages, page, pagePath }) {
  if (!hasPathParameter(pagePath)) {
    throw new Error(
      `Static params for ${page.file} require a parameterized Page path, ` +
        `but its path ${pagePath} has no route params.`,
    );
  }
  const declaration = /** @type {PageStaticParamsDeclaration} */ (page.module.staticParams);
  const paramsList =
    typeof declaration === 'function'
      ? declaration(new PageData(pages, page.metadata, pagePath))
      : declaration;
  if (!Array.isArray(paramsList)) {
    throw new Error(`Static params for ${page.file} must be an array of route param objects.`);
  }
  const paths = [];
  const seen = new Set();
  for (const params of paramsList) {
    const concretePath = substituteRouteParams(pagePath, params, page);
    if (seen.has(concretePath)) {
      throw new Error(
        `Static params for ${page.file} produce the duplicate output path ${concretePath}.`,
      );
    }
    seen.add(concretePath);
    paths.push(concretePath);
  }
  return paths;
}

/**
 * @param {string} pagePath
 * @param {unknown} params
 * @param {Page} page
 * @returns {string}
 */
function substituteRouteParams(pagePath, params, page) {
  if (typeof params !== 'object' || params === null || Array.isArray(params)) {
    throw new Error(`Static params for ${page.file} must be objects with string values.`);
  }
  const paramValues = /** @type {Record<string, unknown>} */ (params);
  const usedNames = new Set();
  const segments = pagePath.split('/').map(segment => {
    if (!segment.startsWith(':')) {
      return segment;
    }
    const name = segment.slice(1);
    usedNames.add(name);
    return routeParamValue(name, paramValues[name], page);
  });
  for (const name of Object.keys(paramValues)) {
    if (!usedNames.has(name)) {
      throw new Error(
        `Static params for ${page.file} set unknown route param "${name}" ` +
          `for the Page path ${pagePath}.`,
      );
    }
  }
  return segments.join('/');
}

/**
 * @param {string} name
 * @param {unknown} value
 * @param {Page} page
 * @returns {string}
 */
function routeParamValue(name, value, page) {
  if (typeof value !== 'string' || value === '') {
    throw new Error(
      `Static params for ${page.file} must provide a non-empty string ` +
        `for route param "${name}".`,
    );
  }
  if (encodeURIComponent(value) !== value) {
    throw new Error(
      `Static params for ${page.file} route param "${name}" value ${JSON.stringify(value)} ` +
        `is not a URL-safe path segment. Slugify param values before returning them.`,
    );
  }
  return value;
}
