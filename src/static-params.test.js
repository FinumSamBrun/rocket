import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasStaticParams, staticParamsPagePaths } from './static-params.js';

describe('Test Static Params', () => {
  it('01: recognizes static params on JavaScript Pages only', () => {
    const tagArchive = makePage({ path: '/blog/tags/:tag', staticParams: [{ tag: 'launch' }] });
    const plainJsPage = makePage({ path: '/plain' });
    const markdownPage = makePage({
      path: '/posts/one',
      file: 'docs/pages/posts/one.rocket.md',
      staticParams: [{ tag: 'launch' }],
    });

    assert.equal(hasStaticParams(tagArchive), true);
    assert.equal(hasStaticParams(plainJsPage), false);
    assert.equal(hasStaticParams(markdownPage), false);
  });

  it('02: enumerates concrete output paths from static params', () => {
    const tagArchive = makePage({
      path: '/blog/tags/:tag',
      staticParams: [{ tag: 'launch' }, { tag: 'components' }],
    });
    const pages = makePageRegistry(tagArchive);

    assert.deepEqual(
      staticParamsPagePaths({ pages, page: tagArchive, pagePath: '/blog/tags/:tag' }),
      ['/blog/tags/launch', '/blog/tags/components'],
    );
  });

  it('03: enumerates static params from a Page Registry Query', () => {
    const first = makePage({
      path: '/posts/first',
      file: 'docs/pages/posts/first.rocket.md',
      metadata: { title: 'First', date: '2026-05-25', tags: ['blog', 'launch'] },
    });
    const second = makePage({
      path: '/posts/second',
      file: 'docs/pages/posts/second.rocket.md',
      metadata: { title: 'Second', date: '2026-05-18', tags: ['blog', 'components'] },
    });
    const tagArchive = makePage({
      path: '/blog/tags/:tag',
      staticParams: pageData => {
        const tags = new Set(
          pageData.pages
            .query({ tags: 'blog', pathPrefix: '/posts/' })
            .flatMap(entry => entry.metadata.tags || []),
        );
        tags.delete('blog');
        return [...tags].sort().map(tag => ({ tag }));
      },
    });
    const pages = makePageRegistry(tagArchive, first, second);

    assert.deepEqual(
      staticParamsPagePaths({ pages, page: tagArchive, pagePath: '/blog/tags/:tag' }),
      ['/blog/tags/components', '/blog/tags/launch'],
    );
  });

  it('04: substitutes multiple route params per output path', () => {
    const archive = makePage({
      path: '/archive/:year/:month',
      staticParams: [
        { year: '2026', month: '05' },
        { year: '2026', month: '06' },
      ],
    });
    const pages = makePageRegistry(archive);

    assert.deepEqual(
      staticParamsPagePaths({ pages, page: archive, pagePath: '/archive/:year/:month' }),
      ['/archive/2026/05', '/archive/2026/06'],
    );
  });

  it('05: rejects invalid static params declarations', () => {
    const pages = makePageRegistry();
    /**
     * @param {string} pagePath
     * @param {unknown} staticParams
     */
    const enumerate = (pagePath, staticParams) =>
      staticParamsPagePaths({
        pages,
        page: makePage({ path: pagePath, staticParams: /** @type {any} */ (staticParams) }),
        pagePath,
      });

    assert.throws(
      () => enumerate('/concrete', [{ tag: 'x' }]),
      /require a parameterized Page path/,
    );
    assert.throws(() => enumerate('/blog/tags/:tag', 'nope'), /must be an array/);
    assert.throws(() => enumerate('/blog/tags/:tag', ['nope']), /objects with string values/);
    assert.throws(
      () => enumerate('/blog/tags/:tag', [{}]),
      /non-empty string for route param "tag"/,
    );
    assert.throws(
      () => enumerate('/blog/tags/:tag', [{ tag: '' }]),
      /non-empty string for route param "tag"/,
    );
    assert.throws(
      () => enumerate('/blog/tags/:tag', [{ tag: 'launch', extra: 'x' }]),
      /unknown route param "extra"/,
    );
    assert.throws(
      () => enumerate('/blog/tags/:tag', [{ tag: 'web components' }]),
      /not a URL-safe path segment/,
    );
    assert.throws(
      () => enumerate('/blog/tags/:tag', [{ tag: 'launch' }, { tag: 'launch' }]),
      /duplicate output path \/blog\/tags\/launch/,
    );
  });
});

/**
 * @param {{
 *   path?: string;
 *   file?: string;
 *   title?: string;
 *   metadata?: import('@rocket/js/types.js').PageMetadata;
 *   staticParams?: import('@rocket/js/types.js').PageStaticParamsDeclaration;
 * }} [options]
 * @returns {import('@rocket/js/types.js').Page}
 */
function makePage({
  path = '/example',
  file = 'docs/pages/example.rocket.js',
  title = 'Example',
  metadata,
  staticParams,
} = {}) {
  const pageMetadata = metadata || { title, linkText: title };
  return {
    file,
    module: { config: { path, metadata: { title: pageMetadata.title } }, staticParams },
    metadata: pageMetadata,
  };
}

/**
 * @param {import('@rocket/js/types.js').Page[]} pageEntries
 */
function makePageRegistry(...pageEntries) {
  /** @type {import('@rocket/js/types.js').PageRegistry} */
  const pages = new Map();
  for (const page of pageEntries) {
    pages.set(page.module.config.path, page);
  }
  return pages;
}
