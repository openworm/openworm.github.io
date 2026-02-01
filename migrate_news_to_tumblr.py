#!/usr/bin/env python3
"""
Migrate news.html content to Tumblr with backdating.
Uses NPF (Neue Post Format) for proper image support.
"""

import os
import re
import json
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
from dotenv import load_dotenv
from requests_oauthlib import OAuth1Session

# Load environment
ENV_FILE = Path(__file__).parent / ".env.tumblr"
load_dotenv(ENV_FILE)

BLOG_NAME = "openworm"
API_BASE = "https://api.tumblr.com/v2"
SITE_BASE = "https://openworm.org"

# Map month names to dates for backdating
MONTH_DATES = {
    "June2025": "2025-06-15T12:00:00Z",
    "Dec2024": "2024-12-15T12:00:00Z",
    "May2024": "2024-05-15T12:00:00Z",
    "June2023": "2023-06-15T12:00:00Z",
    "September2022": "2022-09-15T12:00:00Z",
}

MONTH_TITLES = {
    "June2025": "June 2025",
    "Dec2024": "December 2024",
    "May2024": "May 2024",
    "June2023": "June 2023",
    "September2022": "September 2022",
}


def get_oauth_session():
    """Get authenticated OAuth session."""
    return OAuth1Session(
        os.getenv("TUMBLR_CONSUMER_KEY"),
        client_secret=os.getenv("TUMBLR_CONSUMER_SECRET"),
        resource_owner_key=os.getenv("TUMBLR_ACCESS_TOKEN"),
        resource_owner_secret=os.getenv("TUMBLR_ACCESS_TOKEN_SECRET")
    )


def fix_url(url):
    """Convert relative URLs to absolute URLs."""
    if not url:
        return url
    if url.startswith('//'):
        return 'https:' + url
    if url.startswith('/'):
        return SITE_BASE + url
    if url.startswith('img/') or url.startswith('assets/'):
        return SITE_BASE + '/' + url
    return url


def get_image_type(url):
    """Guess image MIME type from URL."""
    url_lower = url.lower()
    if '.png' in url_lower:
        return 'image/png'
    elif '.gif' in url_lower:
        return 'image/gif'
    elif '.webp' in url_lower:
        return 'image/webp'
    return 'image/jpeg'


def html_to_npf_blocks(html_content):
    """
    Convert HTML content to NPF (Neue Post Format) blocks.
    Returns list of content blocks for Tumblr API.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    blocks = []

    def normalize_whitespace(text):
        """Normalize whitespace - collapse multiple spaces/newlines into single space."""
        return re.sub(r'\s+', ' ', text)

    def extract_text_with_formatting(element):
        """Extract text and formatting info from an element."""
        text = ""
        formatting = []

        for child in element.children:
            if isinstance(child, NavigableString):
                # Normalize internal whitespace but check for boundary spaces
                child_str = str(child)
                has_leading_space = bool(re.match(r'^\s', child_str))
                has_trailing_space = bool(re.search(r'\s$', child_str))

                normalized = normalize_whitespace(child_str).strip()
                if normalized:
                    # Add leading space if original had it and we need separation
                    if has_leading_space and text and not text.endswith(' '):
                        text += ' '
                    text += normalized
                    # Add trailing space if original had it
                    if has_trailing_space:
                        text += ' '
            elif child.name == 'a':
                start = len(text)
                link_text = normalize_whitespace(child.get_text()).strip()
                text += link_text
                end = len(text)
                href = fix_url(child.get('href', ''))
                if href:
                    formatting.append({
                        "start": start,
                        "end": end,
                        "type": "link",
                        "url": href
                    })
            elif child.name in ['b', 'strong']:
                start = len(text)
                bold_text = normalize_whitespace(child.get_text()).strip()
                text += bold_text
                end = len(text)
                formatting.append({"start": start, "end": end, "type": "bold"})
            elif child.name in ['i', 'em']:
                start = len(text)
                italic_text = normalize_whitespace(child.get_text()).strip()
                text += italic_text
                end = len(text)
                formatting.append({"start": start, "end": end, "type": "italic"})
            elif child.name == 'br':
                text += "\n"
            else:
                # Recursively handle nested elements
                nested_text, nested_fmt = extract_text_with_formatting(child)
                offset = len(text)
                text += nested_text
                for fmt in nested_fmt:
                    formatting.append({
                        **fmt,
                        "start": fmt["start"] + offset,
                        "end": fmt["end"] + offset
                    })

        return text.strip(), formatting

    def process_element(elem):
        """Process a single HTML element into NPF blocks."""
        if isinstance(elem, NavigableString):
            text = normalize_whitespace(str(elem))
            if text:
                return [{"type": "text", "text": text}]
            return []

        if elem.name == 'h1':
            text = normalize_whitespace(elem.get_text())
            if text:
                return [{"type": "text", "subtype": "heading1", "text": text}]

        elif elem.name == 'h2':
            text = normalize_whitespace(elem.get_text())
            if text:
                return [{"type": "text", "subtype": "heading1", "text": text}]

        elif elem.name == 'h3':
            text = normalize_whitespace(elem.get_text())
            if text:
                return [{"type": "text", "subtype": "heading2", "text": text}]

        elif elem.name == 'p':
            # Check if this is primarily an image container
            img = elem.find('img')
            if img:
                src = fix_url(img.get('src', ''))
                if src:
                    alt = img.get('alt', '')
                    block = {
                        "type": "image",
                        "media": [{
                            "url": src,
                            "type": get_image_type(src)
                        }]
                    }
                    if alt:
                        block["alt_text"] = alt

                    # Also check for any text/link accompanying the image
                    result = [block]

                    # Check if there's a link wrapping the image
                    parent_link = img.find_parent('a')
                    if parent_link:
                        href = fix_url(parent_link.get('href', ''))
                        if href and href != src:
                            # Add a link block after the image
                            result.append({
                                "type": "text",
                                "text": f"View: {href}",
                                "formatting": [{
                                    "start": 6,
                                    "end": 6 + len(href),
                                    "type": "link",
                                    "url": href
                                }]
                            })
                    return result

            # Regular paragraph with text
            text, formatting = extract_text_with_formatting(elem)
            if text:
                block = {"type": "text", "text": text}
                if formatting:
                    block["formatting"] = formatting
                return [block]

        elif elem.name == 'img':
            src = fix_url(elem.get('src', ''))
            if src:
                block = {
                    "type": "image",
                    "media": [{
                        "url": src,
                        "type": get_image_type(src)
                    }]
                }
                alt = elem.get('alt', '')
                if alt:
                    block["alt_text"] = alt
                return [block]

        elif elem.name == 'a':
            # Standalone link
            href = fix_url(elem.get('href', ''))
            text = normalize_whitespace(elem.get_text())
            if href and text:
                return [{
                    "type": "text",
                    "text": text,
                    "formatting": [{
                        "start": 0,
                        "end": len(text),
                        "type": "link",
                        "url": href
                    }]
                }]

        elif elem.name == 'blockquote':
            text = normalize_whitespace(elem.get_text())
            if text:
                return [{"type": "text", "subtype": "indented", "text": text}]

        elif elem.name in ['ul', 'ol']:
            items = []
            for li in elem.find_all('li', recursive=False):
                text, formatting = extract_text_with_formatting(li)
                if text:
                    block = {
                        "type": "text",
                        "subtype": "unordered-list-item" if elem.name == 'ul' else "ordered-list-item",
                        "text": text
                    }
                    if formatting:
                        block["formatting"] = formatting
                    items.append(block)
            return items

        elif elem.name == 'kbd':
            text = normalize_whitespace(elem.get_text())
            if text:
                return [{"type": "text", "text": f"`{text}`"}]

        elif elem.name == 'figure':
            img = elem.find('img')
            if img:
                return process_element(img)
            return []

        elif elem.name == 'div':
            # Process children of divs
            result = []
            for child in elem.children:
                if not isinstance(child, NavigableString) or str(child).strip():
                    result.extend(process_element(child))
            return result

        return []

    # Process all direct children
    for elem in soup.children:
        blocks.extend(process_element(elem))

    # Clean up: remove empty blocks (or blocks with just whitespace)
    blocks = [b for b in blocks if (b.get('text', '').strip()) or b.get('type') == 'image']

    # Dedupe images (same URL can appear multiple times due to HTML structure)
    seen_urls = set()
    deduped = []
    for block in blocks:
        if block['type'] == 'image':
            url = block['media'][0]['url']
            if url not in seen_urls:
                seen_urls.add(url)
                deduped.append(block)
        else:
            deduped.append(block)

    return deduped


def parse_news_html(html_path):
    """
    Parse news.html and extract individual news items.
    Returns list of dicts with: section_id, date, title, items
    """
    with open(html_path, 'r') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    sections = []

    for section in soup.find_all('section'):
        section_id = section.get('id')
        if not section_id or section_id not in MONTH_DATES:
            continue

        page_header = section.find('div', class_='page-header')
        if not page_header:
            continue

        month_title = MONTH_TITLES.get(section_id, section_id)
        backdate = MONTH_DATES.get(section_id)

        # Find all h3 items (individual news items)
        items = []
        current_item = None

        # Get all relevant elements
        for elem in page_header.find_all(['h1', 'h3', 'p', 'ul', 'ol', 'img', 'blockquote']):
            if elem.name == 'h1':
                continue  # Skip the main section heading

            if elem.name == 'h3':
                # Start a new item
                if current_item:
                    items.append(current_item)

                # Clean up the h3 title (remove numbering like "1) ")
                title_text = elem.get_text().strip()
                title_text = re.sub(r'^\d+\)\s*', '', title_text)

                current_item = {
                    'title': title_text,
                    'html_parts': [],
                }
            elif current_item:
                # Add content to current item
                current_item['html_parts'].append(str(elem))

        # Don't forget the last item
        if current_item:
            items.append(current_item)

        sections.append({
            'section_id': section_id,
            'month_title': month_title,
            'backdate': backdate,
            'items': items,
        })

    return sections


def create_npf_post(oauth, title, npf_blocks, backdate, state="draft", tags=None):
    """Create a Tumblr post using NPF format."""
    # Add title as first heading block
    content = [
        {"type": "text", "subtype": "heading1", "text": title}
    ] + npf_blocks

    payload = {
        "content": content,
        "state": state,
    }

    if tags:
        payload["tags"] = ",".join(tags)

    # NPF supports date parameter too
    if backdate:
        payload["date"] = backdate

    response = oauth.post(
        f"{API_BASE}/blog/{BLOG_NAME}.tumblr.com/posts",
        json=payload
    )

    return response


def preview_migration(html_path):
    """Preview what would be migrated without posting."""
    sections = parse_news_html(html_path)

    print("\n" + "="*60)
    print("MIGRATION PREVIEW - news.html to Tumblr (NPF Format)")
    print("="*60)

    total_posts = 0
    for section in sections:
        print(f"\n## {section['month_title']} (backdate: {section['backdate']})")
        print("-" * 40)

        for i, item in enumerate(section['items'], 1):
            # Convert HTML to NPF for preview
            html_content = "\n".join(item['html_parts'])
            npf_blocks = html_to_npf_blocks(html_content)

            text_blocks = sum(1 for b in npf_blocks if b['type'] == 'text')
            image_blocks = sum(1 for b in npf_blocks if b['type'] == 'image')

            print(f"  {i}. {item['title'][:50]}")
            print(f"     Blocks: {len(npf_blocks)} ({text_blocks} text, {image_blocks} images)")
            total_posts += 1

    print("\n" + "="*60)
    print(f"TOTAL: {total_posts} posts would be created")
    print("="*60)

    return sections


def preview_single(html_path, section_id, item_index):
    """Preview NPF blocks for a single item."""
    sections = parse_news_html(html_path)

    for section in sections:
        if section['section_id'] == section_id:
            if item_index < len(section['items']):
                item = section['items'][item_index]
                print(f"\n=== {item['title']} ===\n")

                html_content = "\n".join(item['html_parts'])
                print("--- HTML Input ---")
                print(html_content[:1000])

                print("\n--- NPF Output ---")
                npf_blocks = html_to_npf_blocks(html_content)
                print(json.dumps(npf_blocks, indent=2))
            return

    print(f"Section {section_id} or item {item_index} not found")


def run_migration(html_path, state="draft", confirm=False):
    """
    Run the migration.

    Args:
        html_path: Path to news.html
        state: 'draft' or 'published'
        confirm: If False, just preview. If True, actually post.
    """
    sections = parse_news_html(html_path)
    oauth = get_oauth_session()

    if not confirm:
        print("\n[DRY RUN] Add --confirm to actually create posts\n")

    created = 0
    failed = 0

    for section in sections:
        print(f"\n## {section['month_title']}")

        for item in section['items']:
            title = f"{section['month_title']}: {item['title']}"

            # Convert HTML to NPF
            html_content = "\n".join(item['html_parts'])
            npf_blocks = html_to_npf_blocks(html_content)

            # Default tags
            tags = ["openworm", "c. elegans", "computational biology", "open science"]

            if confirm:
                response = create_npf_post(
                    oauth, title, npf_blocks,
                    section['backdate'],
                    state=state,
                    tags=tags
                )

                if response.status_code in [200, 201]:
                    result = response.json()
                    post_id = result.get('response', {}).get('id')
                    print(f"  ✓ Created: {item['title'][:40]}... (ID: {post_id})")
                    created += 1
                else:
                    print(f"  ✗ FAILED: {item['title'][:40]}...")
                    print(f"    Error: {response.status_code} - {response.text[:200]}")
                    failed += 1
            else:
                print(f"  [would create] {title[:50]}... ({len(npf_blocks)} blocks)")

    print(f"\n{'='*60}")
    if confirm:
        print(f"Created: {created} | Failed: {failed}")
    else:
        print("DRY RUN complete. Use --confirm to actually create posts.")
    print(f"{'='*60}")


if __name__ == "__main__":
    import sys

    html_path = Path(__file__).parent / "news.html"

    if len(sys.argv) < 2:
        print("""
News to Tumblr Migration Tool (NPF Format)

Usage:
  python migrate_news_to_tumblr.py preview              - See what would be migrated
  python migrate_news_to_tumblr.py inspect SECTION IDX  - Inspect a single item's NPF conversion
                                                          (e.g., inspect September2022 0)
  python migrate_news_to_tumblr.py draft                - Create as drafts (dry run)
  python migrate_news_to_tumblr.py draft --confirm      - Actually create drafts
  python migrate_news_to_tumblr.py publish --confirm    - Publish directly (careful!)
        """)
        sys.exit(0)

    command = sys.argv[1].lower()
    confirm = "--confirm" in sys.argv

    if command == "preview":
        preview_migration(html_path)
    elif command == "inspect":
        if len(sys.argv) >= 4:
            section_id = sys.argv[2]
            item_idx = int(sys.argv[3])
            preview_single(html_path, section_id, item_idx)
        else:
            print("Usage: inspect SECTION_ID ITEM_INDEX")
            print("Sections: June2025, Dec2024, May2024, June2023, September2022")
    elif command == "draft":
        run_migration(html_path, state="draft", confirm=confirm)
    elif command == "publish":
        if confirm:
            print("\n⚠️  WARNING: This will PUBLISH posts directly!")
            answer = input("Type 'yes' to continue: ")
            if answer.lower() != 'yes':
                print("Aborted.")
                sys.exit(0)
        run_migration(html_path, state="published", confirm=confirm)
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
