---
'@rocket/js': minor
---

Add Atlas Layout Head Content to documentation, hero, blog post, blog index, and not-found layouts. Shared layout data can now define a synchronous `headContent` callback that receives the current `PageData` and returns trusted Lit markup appended at the end of `<head>`.

Rename the document helper's direct head fragment option from `headerContent` to `headContent`. The obsolete name is removed without a compatibility alias.
