import { globalData } from '../globalData.js';

/** @type {import('@rocket/js/types.js').BlogData} */
export const blogData = {
  headerData: globalData.headerData,
  tagPathPrefix: '/blog/tags/',
  feedPath: '/blog/feed.xml',
};

/**
 * @param {import('@rocket/js/PageData.js').PageData} pageData
 */
export function blogPosts(pageData) {
  return pageData.pages.query({
    tags: 'blog',
    pathPrefix: '/blog/',
    sortBy: 'date',
    sortDirection: 'desc',
  });
}
