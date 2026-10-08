---
name: release-post
description: "Draft the X (Twitter) post and Discord announcement for a release of this project from its release notes. Use whenever the user wants to announce a release, write release posts, \"tell people about vX.Y\", or post about what just shipped."
---

# Release post

Turn a release's changelog into posts for people who *use* the product, not people who read code.

## 1. Get the release

```bash
gh release view v<X.Y.Z>            # a specific version
gh release list --limit 5          # if the user said "the latest"
```

release-please groups commits under Features and Bug Fixes. That's the raw material, not the post.

## 2. Triage

Read each line as a user would:
- **Headline wins:** new things a user can see or do. These lead.
- **Fixes users felt:** "notifications no longer pile up". Keep, phrased as the relief.
- **Internal work** (refactors, CI, dependency bumps): drop unless it changes something a user notices.

If nothing user-visible shipped, say so to the user instead of inflating a post.

## 3. Write

**X post** (under 280 characters, or a short thread):

```
<Product> v<X.Y> is out <one emoji that fits the product>

<emoji> <user-visible win, plain words>
<emoji> <user-visible win>
<emoji> <user-visible win>

<link to release or news post>
```

**Discord post:** same wins, a little more room. One line of context per item, and a "how to get it" line (update command or "already live on hosted").

## 4. Hand over

Show both drafts. Never post on the user's behalf without an explicit yes for that post.
