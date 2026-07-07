import { html } from 'lit';
import { ssrRender } from '@rocket/js/ssr.js';
import { atlasBlogIndexLayout } from '@rocket/js/layouts/atlasBlog.js';
import { blogData, blogPosts } from './blog/blogData.js';

export { atlasBlogComponents as components } from '@rocket/js/layouts/atlasBlog.js';

export const config = {
  path: '/blog',
  metadata: {
    title: 'Blog',
    description: 'News and release notes from the Rocket project.',
  },
  menu: false,
};

/** @type {import('@rocket/js/types.js').PagePaginationDeclaration} */
export const pagination = pageData => ({
  pageSize: 10,
  collection: blogPosts(pageData),
});

/** @type {import('@rocket/js/types.js').PageFeedDeclaration} */
export const feed = pageData => ({
  title: 'Rocket Blog',
  description: 'News and release notes from the Rocket project.',
  collection: blogPosts(pageData),
  limit: 20,
});

/** @type {import('@rocket/js/types.js').JsPage} */
export default async (_request, { pageData }) => {
  pageData.content = html`
    <h1>Blog</h1>
    <p>News and release notes from the Rocket project.</p>
  `;
  return await ssrRender(atlasBlogIndexLayout(pageData, blogData));
};
