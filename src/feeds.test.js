import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createPageFeed, hasPageFeed, matchPageFeedPath, pageFeedPath } from './feeds.js';

describe('Test Page Feeds', () => {
  it('01: derives the Page Feed path from the owning Page path', () => {
    assert.equal(pageFeedPath('/blog'), '/blog/feed.xml');
    assert.equal(pageFeedPath('/blog/'), '/blog/feed.xml');
    assert.equal(pageFeedPath('/'), '/feed.xml');
  });

  it('02: recognizes Page Feeds on JavaScript Pages only', () => {
    const feedPage = makePage({ path: '/blog', feed: { title: 'Blog', collection: [] } });
    const plainJsPage = makePage({ path: '/plain' });
    const markdownPage = makePage({
      path: '/posts/one',
      file: 'docs/pages/posts/one.rocket.md',
      feed: { title: 'Not a feed owner', collection: [] },
    });

    assert.equal(hasPageFeed(feedPage), true);
    assert.equal(hasPageFeed(plainJsPage), false);
    assert.equal(hasPageFeed(markdownPage), false);
  });

  it('03: matches Page Feed request paths to their owning Page', () => {
    const blog = makePage({ path: '/blog', feed: { title: 'Blog', collection: [] } });
    const tagArchive = makePage({
      path: '/blog/tags/:tag',
      feed: { title: 'Tag', collection: [] },
    });
    const pages = makePageRegistry(blog, tagArchive);

    assert.deepEqual(matchPageFeedPath('/blog/feed.xml', pages), {
      page: blog,
      routePath: '/blog',
    });
    assert.equal(matchPageFeedPath('/blog/', pages), null);
    assert.equal(matchPageFeedPath('/other/feed.xml', pages), null);
    assert.equal(matchPageFeedPath('/blog/tags/:tag/feed.xml', pages), null);
  });

  it('04: creates an Atom feed with absolute URLs from a Page Collection', () => {
    const first = makePage({
      path: '/posts/first-launch',
      file: 'docs/pages/posts/first-launch.rocket.md',
      metadata: {
        title: 'First Launch',
        description: 'What changed in the first public launch.',
        date: '2026-05-25',
        tags: ['blog'],
        authors: ['Ada Lovelace'],
      },
    });
    const second = makePage({
      path: '/posts/component-notes',
      file: 'docs/pages/posts/component-notes.rocket.md',
      metadata: {
        title: 'Component Notes & <Patterns>',
        date: '2026-05-18',
        updated: '2026-05-30',
        tags: ['blog'],
      },
    });
    const blog = makePage({
      path: '/blog',
      feed: pageData => ({
        title: 'Rocket Blog',
        description: 'Latest posts from the project.',
        collection: pageData.pages.query({
          tags: 'blog',
          pathPrefix: '/posts/',
          sortBy: 'date',
          sortDirection: 'desc',
        }),
      }),
    });
    const pages = makePageRegistry(blog, first, second);

    const feed = createPageFeed({
      pages,
      page: blog,
      pagePath: '/blog',
      siteOrigin: 'https://rocket.example',
    });

    assert.match(feed, /^<\?xml version="1.0" encoding="UTF-8"\?>\n/);
    assert.match(feed, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/);
    assert.match(feed, /<title>Rocket Blog<\/title>/);
    assert.match(feed, /<subtitle>Latest posts from the project\.<\/subtitle>/);
    assert.match(feed, /<id>https:\/\/rocket\.example\/blog\/<\/id>/);
    assert.match(
      feed,
      /<link rel="self" type="application\/atom\+xml" href="https:\/\/rocket\.example\/blog\/feed\.xml"\/>/,
    );
    assert.match(
      feed,
      /<link rel="alternate" type="text\/html" href="https:\/\/rocket\.example\/blog\/"\/>/,
    );
    // Feed updated uses the newest entry date or updated value.
    assert.match(feed, /<updated>2026-05-30T00:00:00Z<\/updated>/);
    // Entries keep collection order (newest post first).
    const firstEntryIndex = feed.indexOf('<title>First Launch</title>');
    const secondEntryIndex = feed.indexOf('<title>Component Notes &amp; &lt;Patterns&gt;</title>');
    assert.ok(firstEntryIndex > 0);
    assert.ok(secondEntryIndex > firstEntryIndex);
    assert.match(feed, /<id>https:\/\/rocket\.example\/posts\/first-launch\/<\/id>/);
    assert.match(
      feed,
      /<link rel="alternate" type="text\/html" href="https:\/\/rocket\.example\/posts\/first-launch\/"\/>/,
    );
    assert.match(feed, /<published>2026-05-25T00:00:00Z<\/published>/);
    assert.match(feed, /<summary>What changed in the first public launch\.<\/summary>/);
    assert.match(feed, /<author>\n {6}<name>Ada Lovelace<\/name>\n {4}<\/author>/);
    // Entry updated prefers metadata.updated over metadata.date.
    assert.match(feed, /<updated>2026-05-30T00:00:00Z<\/updated>[\s\S]*Component Notes/);
  });

  it('05: limits Page Feed entries and keeps a valid updated fallback', () => {
    const posts = ['one', 'two', 'three'].map((name, index) =>
      makePage({
        path: `/posts/${name}`,
        file: `docs/pages/posts/${name}.rocket.md`,
        metadata: { title: `Post ${name}`, date: `2026-05-2${index}`, tags: ['blog'] },
      }),
    );
    const blog = makePage({
      path: '/blog',
      feed: pageData => ({
        title: 'Rocket Blog',
        collection: pageData.pages.query({ tags: 'blog', sortBy: 'date', sortDirection: 'desc' }),
        limit: 2,
      }),
    });
    const emptyBlog = makePage({
      path: '/empty',
      feed: { title: 'Empty', collection: [] },
    });
    const pages = makePageRegistry(blog, emptyBlog, ...posts);

    const feed = createPageFeed({
      pages,
      page: blog,
      pagePath: '/blog',
      siteOrigin: 'https://rocket.example',
    });
    const emptyFeed = createPageFeed({
      pages,
      page: emptyBlog,
      pagePath: '/empty',
      siteOrigin: 'https://rocket.example',
    });

    assert.equal(feed.match(/<entry>/g)?.length, 2);
    assert.match(feed, /Post three/);
    assert.match(feed, /Post two/);
    assert.doesNotMatch(feed, /Post one/);
    assert.equal(emptyFeed.match(/<entry>/g), null);
    assert.match(emptyFeed, /<updated>1970-01-01T00:00:00Z<\/updated>/);
  });

  it('06: rejects invalid Page Feed declarations and parameterized owning paths', () => {
    const pages = makePageRegistry();
    const feedError = /must provide a non-empty title, a collection array/;
    /** @param {unknown} feed */
    const feedPage = feed => makePage({ path: '/blog', feed: /** @type {any} */ (feed) });

    for (const invalid of [
      null,
      {},
      { title: '', collection: [] },
      { title: 'Blog' },
      { title: 'Blog', collection: 'nope' },
      { title: 'Blog', collection: [], limit: 0 },
      { title: 'Blog', collection: [], limit: 1.5 },
      { title: 'Blog', collection: [], description: 42 },
    ]) {
      assert.throws(
        () =>
          createPageFeed({
            pages,
            page: feedPage(invalid),
            pagePath: '/blog',
            siteOrigin: 'https://rocket.example',
          }),
        feedError,
      );
    }

    assert.throws(
      () =>
        createPageFeed({
          pages,
          page: makePage({ path: '/blog/tags/:tag', feed: { title: 'Tag', collection: [] } }),
          pagePath: '/blog/tags/:tag',
          siteOrigin: 'https://rocket.example',
        }),
      /cannot use the parameterized path/,
    );
  });
});

/**
 * @param {{
 *   path?: string;
 *   file?: string;
 *   title?: string;
 *   metadata?: import('@rocket/js/types.js').PageMetadata;
 *   feed?: import('@rocket/js/types.js').PageFeedDeclaration;
 * }} [options]
 * @returns {import('@rocket/js/types.js').Page}
 */
function makePage({
  path = '/example',
  file = 'docs/pages/example.rocket.js',
  title = 'Example',
  metadata,
  feed,
} = {}) {
  const pageMetadata = metadata || { title, linkText: title };
  return {
    file,
    module: { config: { path, metadata: { title: pageMetadata.title } }, feed },
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
