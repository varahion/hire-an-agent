---
name: news-post
description: "Write a short news post for this project's website: a plain-English mini-tutorial about one feature, fix or release that shipped. Use whenever the user wants a news post, blog post, dispatch, changelog article or \"write up\" of something that shipped."
---

# News post

One post explains one shipped thing: what it is, how to use it, and why it helps. It's a mini-tutorial, not a changelog dump.

## Where it goes

`<content/news>/YYYY-MM-DD-slug.md`. Use the date the feature actually shipped:

```bash
git show -s --format=%cs <commit-sha>
```

Match the length and voice of the existing posts in that folder. If there are none yet, aim for 150–350 words.

## Frontmatter

```yaml
---
title: <sentence case, says what the reader can now do>
date: <YYYY-MM-DD>
category: <Release | Feature | Fix | Announcement | Spotlight>
version: <vX.Y.Z, optional>
summary: <one sentence for the list page>
---
```

## Body

1. **The hook:** one or two sentences on the problem it solves, in the reader's words.
2. **How to use it:** numbered steps or a short example. Show the setting, command or screen.
3. **Why it works this way:** one short paragraph on the design choice, tied to the product's defining rules where it fits.
4. **What's next:** optional, one line.

## Rules

- Plain words. No marketing superlatives.
- Only describe what actually shipped; check the code or the PR if unsure.
- Show the draft to the user before committing it.
