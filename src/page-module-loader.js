import { normalizeLoadedPageModule } from './loaded-page-module.js';
import { parseComponents } from './components.js';

/** @typedef {import('./page-runtime.js').PageModuleLoaderOptions} PageModuleLoaderOptions */

/**
 * The Page Module Loader used by both the development server and static builds.
 * Loading goes through Rocket's import hooks, which behave the same in both
 * runtime environments.
 */
export function createPageModuleLoader() {
  return {
    /**
     * @param {PageModuleLoaderOptions} options
     */
    async load({ page, variant }) {
      if (page.file.endsWith('.js')) {
        const module = await import(`./${page.file}`, {
          with: { type: 'rocketLoadJsInitial' },
        });
        return normalizeLoadedPageModule({ kind: 'javascript', module });
      }

      const importAttributes = { type: 'rocketLoadMdInitial' };
      if (typeof variant === 'object' && variant.kind === 'standalone-demo') {
        Object.assign(importAttributes, { singleDemo: variant.demoName });
      }
      const module = await import(`./${page.file}`, {
        with: importAttributes,
      });
      return normalizeLoadedPageModule({ kind: 'markdown', module, parseComponents });
    },
  };
}
