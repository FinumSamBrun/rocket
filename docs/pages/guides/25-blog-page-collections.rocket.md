```js server
export const config = {
  path: '/page-collections',
  metadata: {
    title: 'Blog-scale Page Collections',
    description: 'Use Page Collections for dated archives, pagination, and blog-scale content.',
    custom: {
      atlasDoc: {
        asideTip: {
          title: 'Collection tip',
          description:
            'Use Page Collections for index views over real Pages, not as a replacement for ordinary hand-authored content.',
        },
      },
    },
  },
  menu: {
    linkText: 'Page Collections',
    iconName: 'collection',
    parent: '/guides',
    order: 25,
  },
};

import { atlasDocLayout } from '@rocket/js/layouts/atlasDoc.js';
export { atlasDocComponents as components } from '@rocket/js/layouts/atlasDoc.js';
import { globalData } from '../globalData.js';

export const layout = pageData => atlasDocLayout(pageData, globalData);
```

# Blog-scale Page Collections

Most Rocket sites are made from ordinary static Pages. A hand-written home Page, an About Page, a
component reference Page, or a few standalone guides do not need a Page Collection. Create those as
normal Markdown or JavaScript Pages and let Rocket render one output document for each `config.path`.

Use a Page Collection when one Page needs to render a repeatable view of other Pages. Blog indexes,
dated archives, release-note lists, author pages, and tag pages all follow this model: the content
items stay as static Pages, while an archive Page queries the Page Registry and renders the matching
entries.

## Mark blog post Pages

Blog posts can stay as normal static Markdown Pages. Put the Page config in the Page's
`js server` block, and add Page Metadata that the archive can query:

```js label="src/pages/posts/first-launch.rocket.md"
export const config = {
  path: '/posts/first-launch',
  metadata: {
    title: 'First Launch',
    description: 'What changed in the first public launch.',
    date: '2026-05-25',
    tags: ['blog', 'launch'],
    authors: ['Ada Lovelace'],
  },
  menu: false,
};
```

```js label="src/pages/posts/component-notes.rocket.md"
export const config = {
  path: '/posts/component-notes',
  metadata: {
    title: 'Component Notes',
    description: 'Patterns from the first component documentation pass.',
    date: '2026-05-18',
    tags: ['blog', 'components'],
    authors: ['Grace Hopper'],
  },
  menu: false,
};
```

`metadata.date` must be a `YYYY-MM-DD` date string. Use `metadata.tags` for collection membership,
and use `metadata.authors` when the site needs author archives or byline filtering. `menu: false`
keeps posts out of the main navigation without hiding them from direct links, the Page Registry, or
the Sitemap.

## Query the Page Registry

Rocket exposes the Page Registry Query as `pageData.pages`. It returns Page Collection entries with
the Page path, URL, normalized metadata, source file, and original Page record:

```js label="Page Registry Query"
const posts = pageData.pages.query({
  tags: 'blog',
  pathPrefix: '/posts/',
  sortBy: 'date',
  sortDirection: 'desc',
});
```

This query finds Pages under `/posts/` that include the `blog` tag and sorts dated entries newest
first. Undated entries remain in the collection after dated entries. Use `tags: ['blog', 'launch']`
when every tag must be present, and add `author` or `authors` when an archive needs byline filters.

## Add the archive Page

Create one static JavaScript Page to own the archive path:

```js label="src/pages/blog.rocket.js"
import { html } from 'lit';
import { ssrRender } from '@rocket/js/ssr.js';
import { atlasDocLayout, atlasDocComponents as components } from '@rocket/js/layouts/atlasDoc.js';
import { siteData } from '../siteData.js';

export { components };

export const config = {
  path: '/blog',
  metadata: {
    title: 'Blog',
    description: 'Latest posts from the project.',
  },
};

export const pagination = pageData => ({
  pageSize: 10,
  collection: pageData.pages.query({
    tags: 'blog',
    pathPrefix: '/posts/',
    sortBy: 'date',
    sortDirection: 'desc',
  }),
});

export default async (_request, { pageData }) => {
  const pagination = pageData.pagination;

  pageData.content = html`
    <h1>Blog</h1>
    <ol>
      ${pagination.items.map(
        post => html`
          <li>
            <a href=${post.url}>${post.metadata.title}</a>
            <time datetime=${post.metadata.date ?? ''}>${post.metadata.date ?? 'Undated'}</time>
          </li>
        `,
      )}
    </ol>

    <nav aria-label="Blog pages">
      ${pagination.previousPath ? html`<a href=${pagination.previousPath}>Previous</a>` : ''}
      <span>Page ${pagination.currentPage} of ${pagination.totalPages}</span>
      ${pagination.nextPath ? html`<a href=${pagination.nextPath}>Next</a>` : ''}
    </nav>
  `;

  return new Response(await ssrRender(atlasDocLayout(pageData, siteData)), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
};
```

The `pagination` export turns the collection into generated archive Pages. `pageData.pagination`
contains the current slice of entries, the current page number, the total page count, and previous
or next archive paths for links.

## Archive paths

The owning Page path is page 1. With `config.path: '/blog'`, Rocket renders the first archive page
at `/blog` during runtime and `dist/blog/index.html` during a static build. Pagination links and
generated discoverability output use the canonical document path `/blog/` for that first page.

Later archive pages are numbered child paths:

```txt
/blog/
/blog/2/
/blog/3/
```

Rocket does not generate `/blog/1/`. The numbered archive Pages are generated variants of the
owning JavaScript Page, so they do not become separate entries in `pageData.pageRegistry` or the
menu tree.

## Add a Page Feed

A Page Feed turns the same Page Collection into an Atom feed. Export `feed` from the archive
Page, next to `pagination`:

```js label="src/pages/blog.rocket.js"
export const feed = pageData => ({
  title: 'Example Blog',
  description: 'Latest posts from the project.',
  collection: pageData.pages.query({
    tags: 'blog',
    pathPrefix: '/posts/',
    sortBy: 'date',
    sortDirection: 'desc',
  }),
  limit: 20,
});
```

Rocket derives the feed path from the owning Page path: with `config.path: '/blog'`, the feed is
served at `/blog/feed.xml` in development and written to `dist/blog/feed.xml` during a static
build. Feed entries use the collection order and take their titles, links, dates, summaries, and
authors from normalized Page Metadata. `limit` caps the entry count from the start of the
collection.

Feed URLs are absolute, so static builds with a Page Feed require a
[Site Origin](/reference/configuration). Development falls back to the dev server origin before
a Site Origin is configured. The Page Feed is generated output, not a configured Page — it does
not join the menu, the Page Registry, or the Sitemap.

## Add tag archive Pages

Tag archives use one parameterized JavaScript Page for all tags. Export `staticParams` to
enumerate one output document per tag during static builds:

```js label="src/pages/blog-tags.rocket.js"
export const config = {
  path: '/blog/tags/:tag',
  metadata: {
    title: 'Blog tag archive',
  },
  menu: false,
};

export const staticParams = pageData => {
  const tags = new Set(
    pageData.pages
      .query({ tags: 'blog', pathPrefix: '/posts/' })
      .flatMap(post => post.metadata.tags || []),
  );
  tags.delete('blog');
  return [...tags].sort().map(tag => ({ tag }));
};

export default async (_request, { params, pageData }) => {
  const posts = pageData.pages.query({
    tags: ['blog', params.tag],
    pathPrefix: '/posts/',
    sortBy: 'date',
    sortDirection: 'desc',
  });
  // render the filtered list...
};
```

Every route param in the Page path must appear in each static params object, and param values
must already be URL-safe path segments — slugify tag names before returning them. In
development, parameterized Pages render at request time as before; `staticParams` only controls
static build output and Site Discoverability. Enumerated output paths join the Sitemap, while
parameterized Pages without `staticParams` stay excluded. Static params cannot be combined with
`pagination` on the same Page.

## Use the Atlas blog layouts

The Atlas theme ships blog layouts for the archive and the posts. Posts use `atlasPostLayout`,
which renders a byline with the Page Metadata date, authors, and tag links above the content:

```js label="src/pages/posts/first-launch.rocket.md (js server block)"
import { atlasPostLayout } from '@rocket/js/layouts/atlasBlog.js';
export { atlasBlogComponents as components } from '@rocket/js/layouts/atlasBlog.js';
import { blogData } from './blogData.js';

export const layout = pageData => atlasPostLayout(pageData, blogData);
```

The archive Page uses `atlasBlogIndexLayout`, which lists `pageData.pagination.items` as post
cards and renders the pagination navigation:

```js label="src/pages/blog.rocket.js"
import { ssrRender } from '@rocket/js/ssr.js';
import { atlasBlogIndexLayout } from '@rocket/js/layouts/atlasBlog.js';
export { atlasBlogComponents as components } from '@rocket/js/layouts/atlasBlog.js';

export default async (_request, { pageData }) => {
  pageData.content = html`<h1>Blog</h1>`;
  return await ssrRender(atlasBlogIndexLayout(pageData, blogData));
};
```

Both layouts share a `BlogData` object: `headerData` reuses the site header, `tagPathPrefix`
(for example `/blog/tags/`) turns tags into archive links, and `feedPath` adds the feed
alternate link to the document head plus a visible feed link on the index. The
[Rocket blog](/blog/) is built exactly this way.

## Sitemap and Robots File behavior

Generated archive Pages participate in Site Discoverability when the project enables those outputs
in `rocket-config.js`:

```js label="rocket-config.js"
export default {
  includeGlobs: ['src/pages/**/*.rocket.{md,js}'],
  siteOrigin: 'https://docs.example.com',
  siteDiscoverability: {
    sitemap: true,
    robots: true,
  },
};
```

When the Sitemap is enabled, Rocket includes the archive page 1 path and every generated numbered
archive path unless the owning archive Page sets `discoverability.sitemap: false`.

When the Robots File is enabled, `discoverability.robots: 'disallow'` on the owning archive Page
emits `Disallow` directives for page 1 and every generated numbered archive path. The post Pages
keep their own discoverability settings; hiding or disallowing the archive does not automatically
hide or disallow the posts.

## Checkpoint

Run a build and inspect the generated archive paths, the Page Feed, and the tag archives:

```bash
npm run build
ls dist/blog dist/blog/2 dist/blog/tags
cat dist/blog/feed.xml
```

Use [PageData](/reference/page-data) for the Page Registry Query and pagination reference, and
[Configuration](/reference/configuration) for Sitemap and Robots File settings.
