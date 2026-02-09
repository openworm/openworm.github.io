# OpenWorm Tumblr Blog Tools

Automated tools for managing the OpenWorm Tumblr blog at https://openworm.tumblr.com

## Overview

These tools enable programmatic posting to the OpenWorm Tumblr blog using the Tumblr API. The primary use case is backfilling the stale blog (last post: July 2020) with current content from `news.html`.

## Files

| File | Purpose |
|------|---------|
| `migrate_news_to_tumblr.py` | Automated migration from news.html to Tumblr |
| `tumblr_bot.py` | CLI tool for manual blog management |
| `.env.tumblr` | OAuth credentials (gitignored) |
| `.venv/` | Python virtual environment (gitignored) |

## Setup

### Prerequisites

- Python 3.x
- pip or pip3

### Installation

```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install requests-oauthlib python-dotenv beautifulsoup4
```

### OAuth Credentials

The `.env.tumblr` file contains OAuth credentials for the registered Tumblr app:

```
TUMBLR_CONSUMER_KEY=<key>
TUMBLR_CONSUMER_SECRET=<secret>
TUMBLR_ACCESS_TOKEN=<token>
TUMBLR_ACCESS_TOKEN_SECRET=<token_secret>
```

**⚠️ IMPORTANT:** These credentials are gitignored. Never commit them to version control.

## Migration Script Usage

The `migrate_news_to_tumblr.py` script migrates content from `news.html` to Tumblr with backdating.

### Preview Migration

See what will be migrated without posting:

```bash
source .venv/bin/activate
python migrate_news_to_tumblr.py preview
```

Output:
```
============================================================
MIGRATION PREVIEW - news.html to Tumblr (NPF Format)
============================================================

## June 2025 (backdate: 2025-06-15T12:00:00Z)
----------------------------------------
  1. OpenWorm.ai - a C. elegans specific LLM
     Blocks: 3 (2 text, 1 images)
  2. Updated C. elegans Connectome Toolbox
     Blocks: 3 (2 text, 1 images)

...

============================================================
TOTAL: 19 posts would be created
============================================================
```

### Inspect Single Item

View the NPF block conversion for a specific news item:

```bash
python migrate_news_to_tumblr.py inspect June2025 0
```

This shows:
- Original HTML input
- Converted NPF blocks (JSON)

### Create Draft Posts (Recommended)

Create all posts as **drafts** for review:

```bash
python migrate_news_to_tumblr.py draft --confirm
```

After running, review the drafts in the [Tumblr dashboard](https://www.tumblr.com/blog/openworm/drafts) before publishing.

### Publish Directly

**⚠️ WARNING:** This publishes posts immediately with backdating.

```bash
python migrate_news_to_tumblr.py publish --confirm
# Type 'yes' when prompted
```

## Manual Blog Management

The `tumblr_bot.py` tool provides CLI commands for manual blog operations.

### Get Blog Info

```bash
source .venv/bin/activate
python tumblr_bot.py info
```

Output:
```
Blog: OpenWorm
URL: https://openworm.tumblr.com/
Posts: 275
Followers: 163
```

### Get Recent Posts

```bash
python tumblr_bot.py posts 5
```

### Create a Post (Interactive)

```bash
python tumblr_bot.py post
# Follow prompts for title, body, tags
```

### Create a Draft (Interactive)

```bash
python tumblr_bot.py draft
# Follow prompts for title, body, tags
```

## Technical Details

### NPF Format

The migration script uses **NPF (Neue Post Format)** instead of legacy HTML to ensure proper rendering of:

- ✅ Images (with rich preview cards)
- ✅ Italic text (e.g., "*C. elegans*")
- ✅ Bold text
- ✅ Clickable links
- ✅ Headings (H1, H2, H3)

### HTML to NPF Conversion

The script converts HTML elements to NPF blocks:

| HTML | NPF Block |
|------|-----------|
| `<h1>`, `<h2>` | `{"type": "text", "subtype": "heading1"}` |
| `<h3>` | `{"type": "text", "subtype": "heading2"}` |
| `<p>` | `{"type": "text", "formatting": [...]}` |
| `<img>` | `{"type": "image", "media": [{...}]}` |
| `<a>` | Formatting entry: `{"type": "link", "url": "..."}` |
| `<i>`, `<em>` | Formatting entry: `{"type": "italic"}` |
| `<b>`, `<strong>` | Formatting entry: `{"type": "bold"}` |

### URL Fixing

Relative URLs are converted to absolute:
- `img/file.png` → `https://openworm.org/img/file.png`
- `/assets/file.pdf` → `https://openworm.org/assets/file.pdf`

### Backdating

Posts are backdated to the middle of their publication month using ISO 8601 format:

```python
MONTH_DATES = {
    "June2025": "2025-06-15T12:00:00Z",
    "Dec2024": "2024-12-15T12:00:00Z",
    "May2024": "2024-05-15T12:00:00Z",
    "June2023": "2023-06-15T12:00:00Z",
    "September2022": "2022-09-15T12:00:00Z",
}
```

## Migration Summary

| Time Period | Posts | Images | Backdate |
|-------------|-------|--------|----------|
| June 2025 | 2 | 2 | 2025-06-15 |
| December 2024 | 1 | 1 | 2024-12-15 |
| May 2024 | 5 | 1 | 2024-05-15 |
| June 2023 | 4 | 4 | 2023-06-15 |
| September 2022 | 7 | 9 | 2022-09-15 |
| **TOTAL** | **19** | **17** | |

## Recommended Workflow

1. **Preview the migration**
   ```bash
   python migrate_news_to_tumblr.py preview
   ```

2. **Inspect a sample post** to verify formatting
   ```bash
   python migrate_news_to_tumblr.py inspect June2025 0
   ```

3. **Create drafts**
   ```bash
   python migrate_news_to_tumblr.py draft --confirm
   ```

4. **Review in Tumblr dashboard**
   - Visit https://www.tumblr.com/blog/openworm/drafts
   - Check formatting, images, links
   - Use "Mass Post Editor" to publish all at once if satisfied

5. **Publish** (if not done via UI)
   ```bash
   python migrate_news_to_tumblr.py publish --confirm
   ```

## Future Posting

After the migration, use `tumblr_bot.py` for new posts:

```bash
# Option 1: Interactive
python tumblr_bot.py post

# Option 2: Programmatic (extend tumblr_bot.py)
# Add functions for specific post types or scheduled posting
```

## Troubleshooting

### Authentication Errors

If you get "401 Unauthorized", check:
1. `.env.tumblr` file exists and contains all 4 credentials
2. Virtual environment is activated
3. OAuth tokens haven't expired (regenerate via Tumblr OAuth flow if needed)

### Image Not Rendering

NPF requires absolute URLs. Check that:
1. Image URLs start with `https://openworm.org/`
2. Image files exist at those paths
3. MIME type is correctly detected (PNG, JPEG, GIF)

### Formatting Issues

If text formatting looks wrong:
1. Use `inspect` command to view NPF blocks
2. Check that character offsets in formatting entries are correct
3. Verify nested elements are handled properly

## API Rate Limits

The OpenWorm Blog Bot app has these limits:
- **1,000 requests/hour**
- **5,000 requests/day**

The migration script creates 19 posts = 19 API calls, well within limits.

## References

- [Tumblr API Documentation](https://www.tumblr.com/docs/en/api/v2)
- [NPF Format Specification](https://www.tumblr.com/docs/npf)
- [OAuth 1.0a Documentation](http://oauth.net/)

---

**Last Updated:** January 31, 2026
**Maintainer:** OpenWorm Team
