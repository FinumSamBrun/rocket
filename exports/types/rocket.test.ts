import { html } from 'lit';
import type { AtlasLayoutHeadContent, BlogData, DocData, HeroData } from './rocket.js';

const pageAwareHeadContent: AtlasLayoutHeadContent = ({ pageData }) =>
  html`<meta name="page-url" content=${pageData.url} />`;

const siteWideHeadContent: AtlasLayoutHeadContent = () =>
  html`<meta name="site-extension" content="enabled" />`;

function sharedAtlasHeadContent(data: DocData | HeroData | BlogData) {
  return data.headContent;
}

// @ts-expect-error Atlas Layout Head Content requires a Lit template result.
const rawStringHeadContent: AtlasLayoutHeadContent = () => '<meta name="raw-string" />';

// @ts-expect-error Atlas Layout Head Content is synchronous.
const asyncHeadContent: AtlasLayoutHeadContent = async () => html`<meta name="async" />`;

export {
  asyncHeadContent,
  pageAwareHeadContent,
  rawStringHeadContent,
  sharedAtlasHeadContent,
  siteWideHeadContent,
};
