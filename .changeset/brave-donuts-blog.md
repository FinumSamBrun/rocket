---
'@rocket/js': minor
---

Add a full blog system on top of Page Collections:

- **Page Feeds**: archive Pages can export `feed` to publish a Page Collection as an Atom feed at `<page path>/feed.xml`, served in development and emitted during static builds.
- **Static Params**: parameterized static JavaScript Pages can export `staticParams` to enumerate concrete output documents (for example one tag archive per tag) that build statically and join the Sitemap.
- **Atlas blog layouts**: `atlasPostLayout` renders posts with a byline (date, authors, tag links) and `atlasBlogIndexLayout` renders the paginated post list with feed link, both exported from `@rocket/js/layouts/atlasBlog.js`.
