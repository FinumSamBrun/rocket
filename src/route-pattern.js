/** Runs on: server */
import { URLPattern } from 'urlpattern-polyfill';

/** @type {Map<string, URLPattern>} */
const patterns = new Map();

/**
 * Compiling a URLPattern is comparatively expensive and route paths repeat on
 * every request, so compiled patterns are cached per route path.
 *
 * @param {string} routePath
 * @returns {URLPattern}
 */
export function routePattern(routePath) {
  let pattern = patterns.get(routePath);
  if (!pattern) {
    pattern = new URLPattern({ pathname: routePath });
    patterns.set(routePath, pattern);
  }
  return pattern;
}
