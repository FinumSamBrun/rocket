import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { html } from 'lit';
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';

import { PageData } from '../../PageData.js';
import {
  atlasBlogComponents,
  atlasBlogIndexLayout,
  atlasPostLayout,
  blogTagPath,
  formatBlogDate,
} from './atlasBlogLayout.js';

/** @type {import('@rocket/js/types.js').BlogData} */
const blogData = {
  headerData: {
    logo: ['/assets/logo.svg'],
    homeLink: '/',
    socials: [],
    navLinks: [{ text: 'Blog', href: '/blog/' }],
  },
  tagPathPrefix: '/blog/tags/',
  feedPath: '/blog/feed.xml',
};

describe('Test Atlas blog layouts', () => {
  it('01: renders post bylines with date, authors, and tag archive links', async () => {
    const pageData = new PageData(new Map(), makePostMetadata(), '/posts/first-launch/');
    pageData.content = html`<h1>First Launch</h1>
      <p>Body</p>`;

    const body = normalizeSsrHtml(await collectResult(render(atlasPostLayout(pageData, blogData))));

    assert.match(body, /<article class="atlas-blog-post">/);
    assert.match(body, /<time datetime="2026-05-25">May 25, 2026<\/time>/);
    assert.match(body, /Ada Lovelace, Grace Hopper/);
    assert.match(body, /<a href="\/blog\/tags\/launch\/" rel="tag">launch<\/a>/);
    assert.match(
      body,
      /<link rel="alternate" type="application\/atom\+xml" href="\/blog\/feed\.xml"/,
    );
    assert.match(body, /atlasBlog\.css/);
  });

  it('02: renders tags as plain text without a tag path prefix', async () => {
    const pageData = new PageData(new Map(), makePostMetadata(), '/posts/first-launch/');
    pageData.content = html`<h1>First Launch</h1>`;

    const body = normalizeSsrHtml(
      await collectResult(render(atlasPostLayout(pageData, { headerData: blogData.headerData }))),
    );

    assert.doesNotMatch(body, /rel="tag"/);
    assert.match(body, /<span>launch<\/span>/);
  });

  it('03: renders the blog index post list with pagination navigation', async () => {
    const pageData = new PageData(new Map(), { title: 'Blog' }, '/blog/');
    pageData.content = html`<h1>Blog</h1>`;
    pageData.pagination = {
      items: [
        {
          path: '/posts/first-launch',
          url: '/posts/first-launch',
          metadata: makePostMetadata(),
          file: 'docs/pages/posts/first-launch.rocket.md',
          page: /** @type {any} */ ({}),
        },
      ],
      currentPage: 2,
      totalPages: 3,
      basePath: '/blog/',
      previousPath: '/blog/',
      nextPath: '/blog/3/',
    };

    const body = normalizeSsrHtml(
      await collectResult(render(atlasBlogIndexLayout(pageData, blogData))),
    );

    assert.match(body, /<ol class="atlas-blog-post-list" reversed>/);
    assert.match(body, /<a href="\/posts\/first-launch">First Launch<\/a>/);
    assert.match(body, /What changed in the first public launch\./);
    assert.match(body, /<a href="\/blog\/" rel="prev">Newer posts<\/a>/);
    assert.match(body, /Page 2 of 3/);
    assert.match(body, /<a href="\/blog\/3\/" rel="next">Older posts<\/a>/);
    assert.match(body, /<a class="atlas-blog-feed-link" href="\/blog\/feed\.xml">/);
  });

  it('04: renders an empty blog index without pagination navigation', async () => {
    const pageData = new PageData(new Map(), { title: 'Blog' }, '/blog/');
    pageData.content = html`<h1>Blog</h1>`;

    const body = normalizeSsrHtml(
      await collectResult(render(atlasBlogIndexLayout(pageData, blogData))),
    );

    assert.match(body, /No posts yet\./);
    assert.doesNotMatch(body, /atlas-blog-pagination/);
  });

  it('05: formats blog dates and tag archive paths', () => {
    assert.equal(formatBlogDate('2026-05-25', undefined), 'May 25, 2026');
    assert.equal(formatBlogDate('not-a-date', undefined), 'not-a-date');
    assert.equal(blogTagPath('/blog/tags/', 'launch'), '/blog/tags/launch/');
    assert.equal(blogTagPath('/blog/tags', 'launch'), '/blog/tags/launch/');
  });

  it('06: client-loads JavaScript Demos in Atlas blog pages', () => {
    assert.deepEqual(atlasBlogComponents['rocket-js-demo'], {
      file: './RocketJsDemo.js',
      className: 'RocketJsDemo',
      loading: 'client',
    });
    assert.equal(atlasBlogComponents['rocket-menu'], undefined);
  });

  it('07: appends Atlas Layout Head Content in blog post and index documents', async () => {
    const postPageData = new PageData(new Map(), makePostMetadata(), '/posts/first-launch/');
    postPageData.content = html`<h1>First Launch</h1>`;
    const indexPageData = new PageData(new Map(), { title: 'Blog' }, '/blog/');
    indexPageData.content = html`<h1>Blog</h1>`;
    /** @type {PageData[]} */
    const receivedPageData = [];
    /** @type {import('@rocket/js/types.js').BlogData} */
    const data = {
      ...blogData,
      stylesheets: ['/blog-theme.css'],
      headContent: ({ pageData }) => {
        receivedPageData.push(pageData);
        return html`<meta name="blog-extension" content=${pageData.url} />`;
      },
    };

    const postBody = await collectResult(render(atlasPostLayout(postPageData, data)));
    const indexBody = await collectResult(render(atlasBlogIndexLayout(indexPageData, data)));

    assert.deepEqual(receivedPageData, [postPageData, indexPageData]);
    assertHeadContentOrder(postBody, '/blog-theme.css', 'name="blog-extension"');
    assertHeadContentOrder(postBody, 'name="blog-extension"', '</head>');
    assertHeadContentOrder(indexBody, '/blog-theme.css', 'name="blog-extension"');
    assertHeadContentOrder(indexBody, 'name="blog-extension"', '</head>');
  });
});

/**
 * @param {string} body
 * @param {string} earlier
 * @param {string} later
 */
function assertHeadContentOrder(body, earlier, later) {
  const headEnd = body.indexOf('</head>');
  const earlierIndex = body.indexOf(earlier);
  const laterIndex = body.indexOf(later);

  assert.ok(earlierIndex >= 0 && earlierIndex < headEnd, `Expected ${earlier} inside <head>`);
  assert.ok(laterIndex >= 0 && laterIndex <= headEnd, `Expected ${later} inside <head>`);
  assert.ok(earlierIndex < laterIndex, `Expected ${earlier} before ${later}`);
}

/**
 * Strips Lit SSR comment markers and collapses whitespace so assertions can
 * match canonical markup.
 *
 * @param {string} body
 */
function normalizeSsrHtml(body) {
  return body
    .replaceAll(/<!--\/?lit[^>]*-->/g, '')
    .replace(/\s+/g, ' ')
    .replaceAll(' >', '>')
    .replaceAll(' />', '/>');
}

/**
 * @returns {import('@rocket/js/types.js').PageMetadata}
 */
function makePostMetadata() {
  return {
    title: 'First Launch',
    description: 'What changed in the first public launch.',
    date: '2026-05-25',
    tags: ['launch'],
    authors: ['Ada Lovelace', 'Grace Hopper'],
  };
}
