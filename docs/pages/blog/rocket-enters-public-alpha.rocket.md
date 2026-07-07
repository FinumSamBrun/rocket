```js server
export const config = {
  path: '/blog/rocket-enters-public-alpha',
  metadata: {
    title: 'Rocket enters public alpha',
    description:
      'Rocket is now available on npm as @rocket/js — an HTML-first static-site framework for content sites and Web Component docs.',
    date: '2026-06-10',
    tags: ['blog', 'releases'],
    authors: ['Rocket Team'],
  },
  menu: false,
};

import { atlasPostLayout } from '@rocket/js/layouts/atlasBlog.js';
export { atlasBlogComponents as components } from '@rocket/js/layouts/atlasBlog.js';
import { blogData } from './blogData.js';

export const layout = pageData => atlasPostLayout(pageData, blogData);
```

# Rocket enters public alpha

Rocket is now available on npm as `@rocket/js`. It is an HTML-first static-site framework for
content sites and Web Component documentation: Pages start as Markdown or JavaScript modules,
render to static HTML, and add browser JavaScript only where a Page asks for it.

The public alpha focuses on a small, dependable core:

- Configured Pages with normalized Page Metadata, menus, and a queryable Page Registry
- The Atlas layouts for documentation sites, landing pages, and 404 Pages
- Site Head Metadata, Social Preview Images, Sitemap and Robots File generation
- A Netlify adapter for server-rendered JavaScript Pages

Head over to the [manual quick start](/setup/manual-quick-start) to create your first site, or
let a coding agent scaffold one for you with [Build with AI](/setup/build-with-ai).
