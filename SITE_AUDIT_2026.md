# OpenWorm Website Audit Report - January 2026

This document identifies inconsistencies, broken links, and outdated materials on openworm.org to guide modernization efforts.

---

## Completed Fixes (January 31, 2026)

The following issues have been resolved and deployed to production:

| Fix | Files Changed | Commit |
|-----|--------------|--------|
| ✅ Removed Google+ widget (dead service) | `index.html` | Merged to master |
| ✅ Removed html5shim references (404 errors) | 16 HTML files | Merged to master |
| ✅ Fixed news.html section ID typo | `news.html` (June2024 → June2025) | Merged to master |
| ✅ Updated HTTP URLs to HTTPS | Multiple files (Twitter, YouTube, CDN, OpenWorm domains) | Merged to master |
| ✅ Removed WormClassroom link (compromised site) | `science.html` | Merged to master |
| ✅ Removed 7 dead external resource links | `science.html` | Merged to master |
| ✅ Updated 20+ HTTP links to HTTPS in science.html | `science.html` | Merged to master |
| ✅ Tumblr blog revival - 19 posts migrated with backdating | `migrate_news_to_tumblr.py`, `tumblr_bot.py` | Deployed! |
| ✅ Fixed broken RSS feed on homepage (Google Feed API deprecated) | `js/main.js`, `index.html` | Merged to master |
| ✅ Rebuilt news.html to pull from Tumblr dynamically | `news.html` | Merged to master |

**Dead links removed from science.html:**
- RNAiDB (connection failed)
- PhenoBank (DNS failure)
- Worm Interactome DB (SSL certificate error)
- Stanford Microarray Database (officially retired)
- BC C. elegans GFP Consortium (connection failed)
- Hope Laboratory Expression Pattern Database (dead)
- Neuroscience Information Framework (403 forbidden)

**Files modified:**
- contacts.html, donate.html, downloads.html, educators.html, events.html
- footer-content.html, get_involved.html, getting_started.html, header-content.html
- index.html, media.html, news.html, people.html, publications.html
- repositories.html, science.html, studentships.html, supporters.html

---

## Executive Summary

| Category | Issues Found | Severity |
|----------|-------------|----------|
| **Tumblr Blog** | Last post July 2020 (6 years stale) | **CRITICAL** |
| **Broken External Links** | 15+ confirmed | HIGH |
| **Outdated Content** | Multiple pages with 2013-2021 references | MEDIUM-HIGH |
| **Deprecated Technologies** | Bootstrap 2.x, Google+, IE6-8 shims | MEDIUM |
| **Structural Issues** | Minor HTML/navigation inconsistencies | LOW |

---

## 0. TUMBLR BLOG - CRITICALLY OUTDATED

**URL:** https://openworm.tumblr.com

### Status: ABANDONED

| Metric | Value |
|--------|-------|
| **Last Post** | July 31, 2020 |
| **Years Since Update** | ~5.5 years |
| **Impact** | HIGH - Blog RSS feeds into homepage |

### Recent Post History

| Date | Title |
|------|-------|
| Jul 31, 2020 | "Are the Worm neurons modeled as Leaky Integrate/Fire..." |
| Dec 16, 2019 | "New OpenWorm Board!" |
| Jul 27, 2019 | GSoC Coding Period updates |
| May 2019 | GSoC Community Bonding posts |
| Apr 5, 2019 | "April is Documentation Month!" |
| 2018 | Monthly project spotlight posts |

### Impact on Website

The blog is referenced throughout the site:
- **`index.html`** - News feed pulls from Tumblr RSS (`openworm.tumblr.com/rss`)
- **`contacts.html`** - Links to blog as primary news source
- **`footer-content.html`** - "Blog" link in footer navigation

When users click "Blog" or see the news feed, they get content from **2020 or earlier**.

### Recommendations

1. **Option A: Revive the Blog**
   - Commit to regular posting schedule
   - Backfill with news.html content (which IS current through 2025)

2. **Option B: Migrate to news.html**
   - Make news.html the primary news source
   - Update RSS feed to point to new source
   - Archive or redirect Tumblr

3. **Option C: Switch Platforms**
   - Consider GitHub Discussions, Medium, or Substack
   - Modern platforms with better engagement features

**Recommendation:** The `news.html` page IS being maintained (has June 2025 content). Consider making it the canonical news source and deprecating Tumblr.

### ✅ Solution Implemented & Deployed (February 1, 2026)

**Decision:** Revive Tumblr blog by backfilling with news.html content using Tumblr API, then make Tumblr the single source of truth for news.

#### OAuth App Setup

Registered a Tumblr OAuth application to enable automated posting:
- **App Name:** OpenWorm Blog Bot
- **App ID:** 652513
- **Credentials:** Stored in `.env.tumblr` (gitignored)
- **Permissions:** Read + Write access to openworm.tumblr.com

#### Migration Script: `migrate_news_to_tumblr.py`

Created automated migration tool using **NPF (Neue Post Format)** for proper image/formatting support:

**Features:**
- Parses `news.html` and extracts 19 individual news items from 5 time periods
- Converts HTML to Tumblr NPF blocks (text, images, links, formatting)
- Supports backdating posts to their original publication dates
- Handles:
  - ✅ Italic text (e.g., "*C. elegans*")
  - ✅ Bold text
  - ✅ Embedded images with proper URLs
  - ✅ Clickable links
  - ✅ Headings and subheadings
  - ✅ Image deduplication

**Migration Overview:**

| Time Period | Posts | Images | Backdate |
|-------------|-------|--------|----------|
| June 2025 | 2 | 2 | 2025-06-15 |
| December 2024 | 1 | 1 | 2024-12-15 |
| May 2024 | 5 | 1 | 2024-05-15 |
| June 2023 | 4 | 4 | 2023-06-15 |
| September 2022 | 7 | 9 | 2022-09-15 |
| **TOTAL** | **19** | **17** | |

**Usage:**
```bash
# Setup
source .venv/bin/activate

# Preview what will be migrated
python migrate_news_to_tumblr.py preview

# Create as drafts for review (recommended)
python migrate_news_to_tumblr.py draft --confirm

# Publish directly with backdates (after review)
python migrate_news_to_tumblr.py publish --confirm
```

**Technical Details:**
- Uses `requests-oauthlib` for OAuth 1.0a authentication
- Converts HTML → NPF blocks via BeautifulSoup parsing
- Fixes relative URLs to absolute (`img/file.png` → `https://openworm.org/img/file.png`)
- Tags posts: `openworm`, `c. elegans`, `computational biology`, `open science`

**Files Created:**
- `migrate_news_to_tumblr.py` - Migration script with NPF format conversion
- `tumblr_bot.py` - CLI tool for manual posting and blog management
- `TUMBLR_MIGRATION_README.md` - Complete documentation
- `.env.tumblr` - OAuth credentials (gitignored)
- `.venv/` - Python virtual environment (gitignored)
- `tumblr_posts_backup_2026-02-01.json` - Backup of migrated posts

#### ✅ Migration Deployed (February 1, 2026)

**Status: COMPLETE** - All 19 posts successfully published with proper backdating!

**Migration Results:**
- ✅ **19 posts published** covering Sept 2022 → June 2025
- ✅ **Backdating successful** - posts appear in chronological order
- ✅ **Formatting verified** - clean whitespace, no mid-sentence line breaks
- ✅ **Images working** - 17 images uploaded to Tumblr CDN
- ✅ **Links functional** - italics, bold, clickable links all preserved

**RSS Feed Integration Restored:**

The homepage news feed was **broken since 2016** (Google Feed API shutdown). Fixed with modern solution:

- **Problem:** PaRSS jQuery plugin used deprecated Google Feed API (shut down Dec 2016)
- **Solution:** Replaced with allOrigins CORS proxy (free, no API key required)
- **Files Updated:**
  - `js/main.js` - New `refreshNews()` function using modern fetch
  - `news.html` - Completely rebuilt to dynamically pull from Tumblr RSS

**Result:** Both homepage and news page now pull live from https://openworm.tumblr.com/rss
- **Homepage:** Shows 6 latest titles
- **News page:** Shows 25 latest posts with full descriptions

**Single Source of Truth:** Tumblr is now the canonical news source. The static news.html content has been migrated to Tumblr and the page now displays the RSS feed dynamically.

---

## 1. BROKEN EXTERNAL LINKS (HIGH PRIORITY)

### Confirmed Dead Links

| Page | Broken URL | Issue |
|------|------------|-------|
| Multiple pages | `http://html5shim.googlecode.com/svn/trunk/html5.js` | **404 - Google Code shut down in 2016** |
| `index.html` | `http://wormsim.org` | Site not responding |
| `publications.html` | `https://dl.dropbox.com/u/6318167/fulltext.pdf` | **404 - Old Dropbox URL format** |
| `events.html` | `http://www.neuroinformatics2014.org/...` | Certificate mismatch (redirects to incf.org) |
| `events.html` | `http://www.neuroinformatics2013.org/` | Certificate mismatch |
| `events.html` | `http://www.neuroinformatics2012.org/...` | Certificate mismatch |
| `science.html` | `http://aquila.bio.nyu.edu/cgi-bin/rnaidb/...` | Connection timeout (RNAiDB) |
| `science.html` | `http://interactome.dfci.harvard.edu/...` | **Certificate expired** (Worm Interactome DB) |
| `science.html` | `http://smd.princeton.edu/` | **Certificate expired** (Stanford Microarray DB) |
| `science.html` | `http://gfpweb.aecom.yu.edu/index` | Connection timeout |
| `science.html` | `http://www.worm.mpi-cbg.de/phenobank/...` | **DNS failure - domain doesn't exist** |
| `science.html` | `http://bgypc059.leeds.ac.uk/~web/databaseintro.htm` | Redirects to different site |

### Security-Compromised Links

| Page | URL | Issue |
|------|-----|-------|
| `science.html` | `http://wormclassroom.org/` | **SECURITY WARNING: Site contains spam/cryptocurrency injections** |

### Links Using Deprecated URL Shorteners

| Page | URL | Recommendation |
|------|-----|----------------|
| `index.html` | `https://bit.ly/2AJSCoX` | Replace with full URL |
| `index.html`, `contacts.html` | `https://goo.gl/3ncZWn` | Replace with full URL (goo.gl is deprecated) |

---

## 2. OUTDATED CONTENT (MEDIUM-HIGH PRIORITY)

### Events Page - Severely Outdated

**File:** `events.html`

| Issue | Details |
|-------|---------|
| Most recent event listed | **2021** (5 years ago) |
| Events shown | 2013, 2014, 2016, 2018, 2021 |
| Missing | Any events from 2022-2026 |

**Recommendation:** Add recent conferences/workshops or archive the old events section.

### Studentships Page - Stale Deadline

**File:** `studentships.html`

```html
<!-- Line 183 - commented out but still present -->
<p class="lead">Deadline: <strong><i>October 31st 2021</i></strong>.</p>
```

**Recommendation:** Update with current studentship opportunities or remove outdated references.

### Publications Page - Last Update 2021

**File:** `publications.html`

- Most recent publication: **January 2021** ("Periodicity in the Embryo")
- No publications from 2022-2025 listed
- 5+ years of potential research missing

**Recommendation:** Add recent publications from DevoWorm and other OpenWorm research.

### News Page - Section ID Mismatch

**File:** `news.html`

```html
<!-- Line 80 - ID doesn't match the heading -->
<section id="June2024">  <!-- Wrong ID -->
    <div class="page-header">
        <h1>June 2025</h1>  <!-- Correct heading -->
```

**Recommendation:** Fix section ID to match content (`June2025`).

### People Page - Potentially Outdated

**File:** `people.html` (950 lines)

- Team roster may not reflect current active contributors
- Bio information may be outdated

**Recommendation:** Audit team list for accuracy.

### Index Page - Google+ Widget (DEAD SERVICE)

**File:** `index.html:224-227`

```html
<!-- Place this tag where you want the +1 button to render. -->
<li>
    <div class="g-plusone" data-size="medium"
         data-href="https://plus.google.com/117948341754627144949"></div>
</li>
```

**Google+ shut down in April 2019** - This widget does nothing.

**Recommendation:** Remove Google+ integration entirely.

---

## 3. DEPRECATED TECHNOLOGIES (MEDIUM PRIORITY)

### Bootstrap 2.x (Released 2012)

The site uses Bootstrap 2.x which is **14 years old** and no longer maintained:

```
css/bootstrap.css
css/bootstrap-responsive.css
js/bootstrap.js
```

**Issues:**
- No longer receives security updates
- Missing modern responsive features
- Uses `span*` classes instead of modern grid
- No flexbox/CSS grid support

**Recommendation:** Upgrade to Bootstrap 5.x or a modern alternative.

### IE6-8 HTML5 Shim (Obsolete)

**Found in:** Most HTML files

```html
<!--[if lt IE 9]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
<![endif]-->
```

**Issues:**
- IE6-8 market share is effectively 0%
- The googlecode.com URL returns 404
- Adds unnecessary complexity

**Recommendation:** Remove entirely. IE support is no longer needed.

### Mixed HTTP/HTTPS Resources

Many pages load resources over insecure HTTP:

| Resource | Files Affected |
|----------|---------------|
| `http://platform.twitter.com/widgets.js` | 10+ files |
| `http://html5shim.googlecode.com/...` | All HTML files |
| `http://browser.openworm.org` | Multiple files |
| `http://docs.openworm.org` | Multiple files |

**Recommendation:** Update all URLs to HTTPS.

### Touch Icon References (Broken Paths)

**Found in:** All HTML files

```html
<link rel="apple-touch-icon-precomposed" sizes="144x144"
      href="../assets/ico/apple-touch-icon-144-precomposed.png">
```

The `../assets/ico/` path doesn't exist - these icons won't load.

**Comment in code even acknowledges this:**
```html
<!-- Fav and touch icons - this code is outdated -->
```

**Recommendation:** Create proper favicon set or remove broken references.

---

## 4. STRUCTURAL & NAVIGATION ISSUES (LOW PRIORITY)

### Inconsistent Protocol Usage

| File | Protocol | Should Be |
|------|----------|-----------|
| `index.html:20` | `https://html5shim...` | Consistent |
| `donate.html:20` | `http://html5shim...` | HTTPS |
| `science.html:20` | `http://html5shim...` | HTTPS |

### Duplicate Page: education.htm vs educators.html

Two files serve similar purposes:
- `education.htm` (177 lines)
- `educators.html` (177 lines)

**Recommendation:** Consolidate or clarify distinction.

### Comment Artifacts

**File:** `publications.html:23`
```html
<!-- Fav and touch icons - this code is outdated -->
```

**File:** `news.html:8`
```html
<meta name="description" content="OpenWorm Studentships">
<!-- Wrong description - this is the News page -->
```

### HTML in `<head>` Tag

**Found in:** All HTML files

```html
<head>
    ...
    <div class="navbar navbar-inverse navbar-fixed-top">
        <!-- This div should be in <body>, not <head> -->
    </div>
    <script src="js/jquery-3.6.0.js"></script>
</head>
```

The navbar `<div>` is incorrectly placed inside `<head>`. While browsers tolerate this, it's invalid HTML.

---

## 5. CONTENT ACCURACY ISSUES

### Outdated External Resources (science.html)

The "External Resources" table contains many links to databases that have:
- Moved to new URLs
- Been deprecated
- Changed names
- Gone offline

| Resource | Status |
|----------|--------|
| RNAiDB | Timeout - may be offline |
| PhenoBank (MPI-CBG) | DNS failure - gone |
| Stanford Microarray DB | Certificate expired |
| Worm Interactome DB | Certificate expired |
| WormClassroom | Compromised with spam |
| Hope Lab Expression DB | Redirects elsewhere |
| BC C. elegans GFP Consortium | Timeout |

**Recommendation:** Audit all 30+ external resource links and update or remove dead ones.

### Kickstarter Archive References

The `/kickstarter/` directory contains archived campaign pages with links to:
- Old repository structures
- Deprecated documentation URLs
- Historical donation links

**Recommendation:** Add "Archive" banner or redirect to current donation page.

---

## 6. PRIORITY ACTION ITEMS

### Immediate (This Week)

1. ~~**Decide on blog strategy**~~ ✅ DONE (Jan 31, 2026) - Revive Tumblr via API migration
2. ~~**Remove Google+ widget**~~ ✅ DONE (Jan 31, 2026)
3. ~~**Remove/replace html5shim**~~ ✅ DONE (Jan 31, 2026)
4. ~~**Fix news.html section ID**~~ ✅ DONE (Jan 31, 2026)
5. ~~**Update HTTP URLs to HTTPS**~~ ✅ DONE (Jan 31, 2026)

### Short-term (This Month)

1. ~~**Migrate news to Tumblr**~~ ✅ READY (Jan 31, 2026) - Migration script created, 19 posts ready to publish
2. ~~**Audit and fix broken external links**~~ ✅ DONE (Jan 31, 2026) - 7 dead links removed, 20+ updated to HTTPS
3. **Update Events page** - Add 2022-2026 events or archive
4. **Update Publications page** - Add recent research
5. ~~**Remove Google+ code from all files**~~ ✅ DONE (Jan 31, 2026)

### Medium-term (This Quarter)

1. **Upgrade Bootstrap** - 2.x to 5.x
2. **Audit People page** - Verify current team
3. **Fix HTML structure** - Move navbar to body
4. **Create proper favicon set**
5. **Consolidate education pages**

### Long-term (This Year)

1. **Consider full site redesign** - Modern framework
2. **Implement build process** - For asset optimization
3. **Add automated link checking** - CI/CD integration

---

## 7. FILES/RESOURCES REQUIRING IMMEDIATE ATTENTION

| Priority | Resource | Main Issues |
|----------|----------|-------------|
| ~~**CRITICAL**~~ ✅ | `openworm.tumblr.com` | ~~Last post July 2020~~ - **Migration script ready, 19 posts to backfill** |
| ~~HIGH~~ ✅ | `science.html` | ~~10+ broken external links~~ - **7 dead links removed, 20+ updated to HTTPS** |
| HIGH | `events.html` | No events since 2021, broken conference links |
| HIGH | `publications.html` | No publications since 2021, broken PDF link |
| ~~MEDIUM~~ ✅ | `index.html` | ~~Google+ widget removed, html5shim removed, HTTP URLs fixed~~ |
| MEDIUM | `studentships.html` | Outdated deadline reference |
| ~~MEDIUM~~ ✅ | All HTML files | ~~IE shim removed, HTTP→HTTPS updated~~ |

---

## Appendix: Technology Stack Recommendations for 2026

### Current Stack (Outdated)
- Bootstrap 2.x (2012)
- jQuery 3.6.0 (acceptable)
- PJAX navigation
- Manual HTML templating

### Recommended Modern Stack
- **CSS Framework:** Bootstrap 5.3+ or Tailwind CSS
- **Static Site Generator:** Jekyll, Hugo, or Eleventy (for GitHub Pages)
- **Build Tools:** Vite or webpack for asset optimization
- **Templating:** Nunjucks or Liquid (reduces duplication)
- **Link Checking:** htmlproofer in CI/CD

---

*Report generated: January 2026*
*Auditor: Claude Code*
