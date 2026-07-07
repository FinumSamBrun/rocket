import { html } from 'lit';
import { ssrRender } from '@rocket/js/ssr.js';
import { atlasBlogIndexLayout } from '@rocket/js/layouts/atlasBlog.js';
import { blogData, blogPosts } from './blogData.js';

export { atlasBlogComponents as components } from '@rocket/js/layouts/atlasBlog.js';

export const config = {
  path: '/blog/tags/:tag',
  metadata: {
    title: 'Blog tag archive',
    description: 'Rocket blog posts for one tag.',
  },
  menu: false,
};

/** @type {import('@rocket/js/types.js').PageStaticParamsDeclaration} */
export const staticParams = pageData => {
  const tags = new Set(blogPosts(pageData).flatMap(post => post.metadata.tags || []));
  tags.delete('blog');
  return [...tags].sort().map(tag => ({ tag }));
};

/** @type {import('@rocket/js/types.js').JsPage} */
export default async (_request, { params, pageData }) => {
  const tag = params.tag || '';
  const items = blogPosts(pageData).filter(post => (post.metadata.tags || []).includes(tag));
  pageData.title = `Posts tagged “${tag}”`;
  pageData.content = html`
    <h1>Posts tagged “${tag}”</h1>
    <p><a href="/blog/">All posts</a></p>
  `;
  pageData.pagination = {
    items,
    currentPage: 1,
    totalPages: 1,
    basePath: `/blog/tags/${tag}/`,
  };
  return await ssrRender(atlasBlogIndexLayout(pageData, blogData));
};
