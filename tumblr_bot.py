#!/usr/bin/env python3
"""
OpenWorm Tumblr Blog Bot
Handles OAuth authentication and posting to openworm.tumblr.com
"""

import os
import sys
import webbrowser
from pathlib import Path
from dotenv import load_dotenv
from requests_oauthlib import OAuth1Session

# Tumblr API endpoints
REQUEST_TOKEN_URL = "https://www.tumblr.com/oauth/request_token"
AUTHORIZE_URL = "https://www.tumblr.com/oauth/authorize"
ACCESS_TOKEN_URL = "https://www.tumblr.com/oauth/access_token"
API_BASE = "https://api.tumblr.com/v2"

# Blog to post to
BLOG_NAME = "openworm"

# Load environment variables
ENV_FILE = Path(__file__).parent / ".env.tumblr"
load_dotenv(ENV_FILE)


def get_credentials():
    """Load credentials from environment."""
    return {
        "consumer_key": os.getenv("TUMBLR_CONSUMER_KEY"),
        "consumer_secret": os.getenv("TUMBLR_CONSUMER_SECRET"),
        "access_token": os.getenv("TUMBLR_ACCESS_TOKEN"),
        "access_token_secret": os.getenv("TUMBLR_ACCESS_TOKEN_SECRET"),
    }


def save_access_tokens(access_token, access_token_secret):
    """Save access tokens to .env.tumblr file."""
    env_content = ENV_FILE.read_text()

    # Update the tokens in the file
    lines = env_content.split('\n')
    new_lines = []
    for line in lines:
        if line.startswith("TUMBLR_ACCESS_TOKEN="):
            new_lines.append(f"TUMBLR_ACCESS_TOKEN={access_token}")
        elif line.startswith("TUMBLR_ACCESS_TOKEN_SECRET="):
            new_lines.append(f"TUMBLR_ACCESS_TOKEN_SECRET={access_token_secret}")
        else:
            new_lines.append(line)

    ENV_FILE.write_text('\n'.join(new_lines))
    print(f"Access tokens saved to {ENV_FILE}")


def authorize():
    """Run OAuth 1.0a flow to get access tokens."""
    creds = get_credentials()

    if not creds["consumer_key"] or not creds["consumer_secret"]:
        print("ERROR: Missing TUMBLR_CONSUMER_KEY or TUMBLR_CONSUMER_SECRET in .env.tumblr")
        sys.exit(1)

    # Step 1: Get request token
    print("Step 1: Getting request token...")
    oauth = OAuth1Session(
        creds["consumer_key"],
        client_secret=creds["consumer_secret"],
        callback_uri="https://openworm.org/callback"
    )

    try:
        response = oauth.fetch_request_token(REQUEST_TOKEN_URL)
    except Exception as e:
        print(f"ERROR fetching request token: {e}")
        sys.exit(1)

    request_token = response.get("oauth_token")
    request_token_secret = response.get("oauth_token_secret")
    print(f"Got request token: {request_token[:20]}...")

    # Step 2: Direct user to authorize
    auth_url = f"{AUTHORIZE_URL}?oauth_token={request_token}"
    print(f"\nStep 2: Opening browser for authorization...")
    print(f"URL: {auth_url}\n")
    webbrowser.open(auth_url)

    # Step 3: Get verifier from user
    print("After authorizing, you'll be redirected to openworm.org/callback")
    print("The URL will contain 'oauth_verifier=XXXXX'")
    verifier = input("\nPaste the oauth_verifier value here: ").strip()

    if not verifier:
        print("ERROR: No verifier provided")
        sys.exit(1)

    # Step 4: Exchange for access token
    print("\nStep 3: Exchanging for access token...")
    oauth = OAuth1Session(
        creds["consumer_key"],
        client_secret=creds["consumer_secret"],
        resource_owner_key=request_token,
        resource_owner_secret=request_token_secret,
        verifier=verifier
    )

    try:
        response = oauth.fetch_access_token(ACCESS_TOKEN_URL)
    except Exception as e:
        print(f"ERROR fetching access token: {e}")
        sys.exit(1)

    access_token = response.get("oauth_token")
    access_token_secret = response.get("oauth_token_secret")

    print(f"Got access token: {access_token[:20]}...")

    # Save tokens
    save_access_tokens(access_token, access_token_secret)
    print("\nAuthorization complete! You can now post to the blog.")

    return access_token, access_token_secret


def get_authenticated_session():
    """Get an authenticated OAuth session."""
    creds = get_credentials()

    if not all([creds["consumer_key"], creds["consumer_secret"],
                creds["access_token"], creds["access_token_secret"]]):
        print("ERROR: Missing credentials. Run 'python tumblr_bot.py auth' first.")
        sys.exit(1)

    return OAuth1Session(
        creds["consumer_key"],
        client_secret=creds["consumer_secret"],
        resource_owner_key=creds["access_token"],
        resource_owner_secret=creds["access_token_secret"]
    )


def get_blog_info():
    """Get info about the OpenWorm blog."""
    oauth = get_authenticated_session()
    response = oauth.get(f"{API_BASE}/blog/{BLOG_NAME}.tumblr.com/info")

    if response.status_code == 200:
        data = response.json()
        blog = data.get("response", {}).get("blog", {})
        print(f"\nBlog: {blog.get('title', 'Unknown')}")
        print(f"URL: {blog.get('url', 'Unknown')}")
        print(f"Posts: {blog.get('posts', 0)}")
        print(f"Followers: {blog.get('followers', 'N/A')}")
        return blog
    else:
        print(f"ERROR: {response.status_code} - {response.text}")
        return None


def get_recent_posts(limit=5):
    """Get recent posts from the blog."""
    oauth = get_authenticated_session()
    response = oauth.get(
        f"{API_BASE}/blog/{BLOG_NAME}.tumblr.com/posts",
        params={"limit": limit}
    )

    if response.status_code == 200:
        data = response.json()
        posts = data.get("response", {}).get("posts", [])
        print(f"\n=== Last {len(posts)} Posts ===\n")
        for post in posts:
            date = post.get("date", "Unknown date")
            title = post.get("title") or post.get("summary", "")[:50] or "(no title)"
            post_url = post.get("post_url", "")
            print(f"[{date}] {title}")
            print(f"  {post_url}\n")
        return posts
    else:
        print(f"ERROR: {response.status_code} - {response.text}")
        return None


def create_text_post(title, body, tags=None, state="published"):
    """
    Create a text post on the blog.

    Args:
        title: Post title
        body: Post body (supports HTML)
        tags: List of tags (optional)
        state: 'published', 'draft', 'queue', or 'private'
    """
    oauth = get_authenticated_session()

    data = {
        "type": "text",
        "title": title,
        "body": body,
        "state": state,
    }

    if tags:
        data["tags"] = ",".join(tags)

    response = oauth.post(
        f"{API_BASE}/blog/{BLOG_NAME}.tumblr.com/post",
        data=data
    )

    if response.status_code in [200, 201]:
        result = response.json()
        post_id = result.get("response", {}).get("id")
        print(f"Post created! ID: {post_id}")
        print(f"URL: https://{BLOG_NAME}.tumblr.com/post/{post_id}")
        return post_id
    else:
        print(f"ERROR: {response.status_code} - {response.text}")
        return None


def create_link_post(url, title=None, description=None, tags=None, state="published"):
    """Create a link post."""
    oauth = get_authenticated_session()

    data = {
        "type": "link",
        "url": url,
        "state": state,
    }

    if title:
        data["title"] = title
    if description:
        data["description"] = description
    if tags:
        data["tags"] = ",".join(tags)

    response = oauth.post(
        f"{API_BASE}/blog/{BLOG_NAME}.tumblr.com/post",
        data=data
    )

    if response.status_code in [200, 201]:
        result = response.json()
        post_id = result.get("response", {}).get("id")
        print(f"Link post created! ID: {post_id}")
        return post_id
    else:
        print(f"ERROR: {response.status_code} - {response.text}")
        return None


def main():
    """CLI interface."""
    if len(sys.argv) < 2:
        print("""
OpenWorm Tumblr Bot

Usage:
  python tumblr_bot.py auth          - Authorize the app (first time setup)
  python tumblr_bot.py info          - Get blog info
  python tumblr_bot.py posts         - Get recent posts
  python tumblr_bot.py post          - Interactive post creation
  python tumblr_bot.py draft         - Create a draft post (interactive)
        """)
        sys.exit(0)

    command = sys.argv[1].lower()

    if command == "auth":
        authorize()

    elif command == "info":
        get_blog_info()

    elif command == "posts":
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        get_recent_posts(limit)

    elif command in ["post", "draft"]:
        state = "draft" if command == "draft" else "published"

        print(f"\n=== Create {'Draft' if state == 'draft' else 'Published'} Post ===\n")
        title = input("Title: ").strip()

        print("\nBody (HTML supported, enter blank line to finish):")
        body_lines = []
        while True:
            line = input()
            if line == "":
                break
            body_lines.append(line)
        body = "\n".join(body_lines)

        tags_input = input("\nTags (comma-separated, or blank): ").strip()
        tags = [t.strip() for t in tags_input.split(",")] if tags_input else None

        print(f"\nCreating {state} post...")
        create_text_post(title, body, tags=tags, state=state)

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
