# [Live Site](https://attilaberencsi.github.io/search)
# Search, Visually: a developer quick guide

A single static page that explains how search works, from `grep` and inverted indexes through BM25, fuzzy search, similarity search, vector embeddings, ANN indexes, hybrid search and re-ranking, to RAG and GraphRAG.

Every chapter shows:

- **Purpose**: one line on what the technique is for
- **Index time**: how documents are transformed and stored
- **Query time**: how the query is executed and ranked, step by step
- **Key facts**: short points, including pitfalls
- **Builds on / combines with**: how the technique connects to the others

It includes two interactive demos (a BM25 playground and a Levenshtein edit-distance matrix), a comparison table and a filterable glossary.

## Structure

```
index.html        page content, with inline SVG diagrams
assets/style.css  design tokens and light/dark themes
assets/app.js     theme toggle, scroll-spy, demos (optional; the page works without JS)
.nojekyll         serve files as-is on GitHub Pages
```

There's no build step and no dependencies. The page uses only Google Fonts, and falls back to system fonts if those can't load.

All links are relative, so the page works under the `/<repo>/` sub-path.

## Local preview

Open `index.html` directly in a browser, or serve the folder:

```
python -m http.server 8000
```
