```js server
export const config = {
  path: '/blog/blog-systems-with-page-collections',
  metadata: {
    title: 'Blog systems with Page Collections, Page Feeds, and tag archives',
    description:
      'Rocket now covers the full blog workflow: paginated archives over Page Collections, an Atom Page Feed, static params for tag archives, and Atlas blog layouts.',
    date: '2026-07-07',
    tags: ['blog', 'releases', 'collections'],
    authors: ['Rocket Team'],
  },
  menu: false,
};

import { atlasPostLayout } from '@rocket/js/layouts/atlasBlog.js';
export { atlasBlogComponents as components } from '@rocket/js/layouts/atlasBlog.js';
import { blogData } from './blogData.js';

export const layout = pageData => atlasPostLayout(pageData, blogData);
```

# Blog systems with Page Collections, Page Feeds, and tag archives

Rocket now covers the full blog workflow, and this blog is built with it.

Blog posts stay ordinary Markdown Pages with Page Metadata — a `date`, `tags`, and `authors`.
Everything else is generated from the Page Registry:

- **Archive Pages** query the registry with `pageData.pages.query()` and paginate it through the
  `pagination` export. Numbered archive pages like `/blog/2/` are generated automatically.
- **Page Feeds** turn the same Page Collection into an Atom feed. Export `feed` from the archive
  Page and Rocket serves `/blog/feed.xml` in development and emits it during static builds.
- **Tag archives** use a parameterized Page like `/blog/tags/:tag` with a `staticParams` export
  that enumerates one output document per tag — and those concrete URLs join the Sitemap.
- **Atlas blog layouts** render the index and the posts: `atlasBlogIndexLayout` lists the
  collection with pagination links, and `atlasPostLayout` adds the byline with date, authors,
  and tag links you can see above.

Read the [Page Collections guide](/page-collections) for the full walkthrough, or subscribe to
the [Rocket Blog feed](/blog/feed.xml) to follow along.
