```js server
export const config = {
  path: '/blog/atlas-starter-sites-from-rocket-init',
  metadata: {
    title: 'Atlas starter sites from rocket init',
    description:
      'The Rocket Initializer now creates a compact Atlas-backed starter site with shared layout data, starter documentation Pages, and a Rocket Agent Skill.',
    date: '2026-06-24',
    tags: ['blog', 'atlas', 'cli'],
    authors: ['Rocket Team'],
  },
  menu: false,
};

import { atlasPostLayout } from '@rocket/js/layouts/atlasBlog.js';
export { atlasBlogComponents as components } from '@rocket/js/layouts/atlasBlog.js';
import { blogData } from './blogData.js';

export const layout = pageData => atlasPostLayout(pageData, blogData);
```

# Atlas starter sites from rocket init

Running `npx rocket init` in a project now creates a compact Atlas-backed starter site. The
Rocket Initializer adds shared layout data, starter documentation Pages, demo examples, and a
Rocket Agent Skill so coding agents can keep maintaining the site after the first start.

The starter works the same in an empty project and in an existing codebase: General
Documentation Pages live in the project's documentation area, while Component Reference Pages
can stay next to the components they document.

See [How Rocket works](/setup/how-rocket-works) for the model behind configured Pages, and the
[Atlas layouts guide](/advanced/atlas-layouts) for customizing the look of your starter site.
