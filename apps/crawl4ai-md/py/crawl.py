"""Thin Crawl4AI sidecar: crawl one URL, write JSON result to a file.

Usage: python crawl.py <url> <output-json-path>

Crawl4AI logs freely to stdout/stderr; the structured result goes to the
output file so the caller never has to parse log noise.
"""

import asyncio
import json
import sys

from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig


async def main(url: str, out_path: str) -> int:
    browser_config = BrowserConfig(headless=True, verbose=False)
    run_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)

    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(url=url, config=run_config)

    if result.success:
        payload = {
            "ok": True,
            "url": result.url,
            "title": (result.metadata or {}).get("title", ""),
            "markdown": str(result.markdown),
        }
    else:
        payload = {"ok": False, "error": result.error_message or "Crawl failed"}

    with open(out_path, "w") as f:
        json.dump(payload, f)

    return 0 if result.success else 1


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("usage: crawl.py <url> <output-json-path>", file=sys.stderr)
        sys.exit(2)
    sys.exit(asyncio.run(main(sys.argv[1], sys.argv[2])))
