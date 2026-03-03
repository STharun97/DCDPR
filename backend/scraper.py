import requests
from playwright.async_api import async_playwright
import logging
import re
import asyncio
import os
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Persistent browser data directory (saves Amazon login cookies between sessions)
BROWSER_DATA_DIR = os.path.join(os.path.expanduser("~"), ".fprds_browser_data")

# Maximum pages to paginate through (10 reviews per page)
MAX_PAGES = 10  # Up to 100 reviews (ScraperAPI credits: 5 per rendered page)

# Stealth JavaScript to avoid bot detection
STEALTH_JS = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
window.chrome = { runtime: {} };
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
"""


def _extract_asin(url):
    """Extract ASIN from an Amazon URL."""
    patterns = [
        r'/dp/([A-Z0-9]{10})',
        r'/gp/product/([A-Z0-9]{10})',
        r'/product-reviews/([A-Z0-9]{10})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def _parse_reviews_from_soup(soup):
    """Extract reviews from a BeautifulSoup-parsed Amazon page."""
    reviews = []
    
    review_blocks = soup.select('div[data-hook="review"]')
    if not review_blocks:
        review_blocks = soup.select('div[id^="customer_review-"]')
    
    for block in review_blocks:
        try:
            review_body = (
                block.select_one('span[data-hook="review-body"]') or
                block.select_one('div.review-text') or
                block.select_one('span.review-text')
            )
            text = review_body.get_text(strip=True) if review_body else ""
            text = re.sub(r'Read more$', '', text).strip()
            
            rating_elem = (
                block.select_one('i[data-hook="review-star-rating"]') or
                block.select_one('i[data-hook="cmps-review-star-rating"]') or
                block.select_one('i.review-rating')
            )
            rating_text = rating_elem.get_text() if rating_elem else ""
            rating = float(rating_text.split(' out of')[0]) if 'out of' in rating_text else None
            
            author_elem = block.select_one('span.a-profile-name')
            author = author_elem.get_text(strip=True) if author_elem else "Amazon Customer"

            date_elem = block.select_one('span[data-hook="review-date"]')
            date = date_elem.get_text(strip=True) if date_elem else None
            
            if text and len(text) > 10:
                reviews.append({
                    'review_text': text,
                    'rating': rating,
                    'author': author,
                    'source': 'Amazon',
                    'date': date
                })
        except Exception as e:
            logger.error(f"Error parsing review block: {e}")
            continue
    
    return reviews


def _extract_rating_summary(soup):
    """Extract overall rating, total count, and star distribution from product page."""
    summary = {
        'overall_rating': None,
        'total_ratings': None,
        'star_distribution': {}
    }
    
    rating_elem = soup.select_one('span[data-hook="rating-out-of-text"]')
    if not rating_elem:
        rating_elem = soup.select_one('#acrPopover span.a-size-base')
    if rating_elem:
        text = rating_elem.get_text(strip=True)
        match = re.search(r'([\d.]+)\s*out of', text)
        if match:
            summary['overall_rating'] = float(match.group(1))
    
    count_elem = soup.select_one('span[data-hook="total-review-count"]')
    if not count_elem:
        count_elem = soup.select_one('#acrCustomerReviewText')
    if count_elem:
        text = count_elem.get_text(strip=True)
        match = re.search(r'([\d,]+)', text)
        if match:
            summary['total_ratings'] = int(match.group(1).replace(',', ''))
    
    all_links = soup.select('a[aria-label]')
    for link in all_links:
        label = link.get('aria-label', '')
        match = re.search(r'(\d+)\s*percent.*?(\d)\s*star', label)
        if match:
            pct = int(match.group(1))
            star = match.group(2)
            summary['star_distribution'][star] = pct
    
    return summary


def _scraperapi_fetch_sync(target_url, api_key, render=True):
    """Synchronously fetch a URL via ScraperAPI."""
    try:
        params = {
            "api_key": api_key,
            "url": target_url,
        }
        if render:
            params["render"] = "true"
        response = requests.get("http://api.scraperapi.com", params=params, timeout=70)
        if response.status_code == 200:
            return response.text
        else:
            logger.warning(f"ScraperAPI status {response.status_code} for {target_url}")
            return None
    except Exception as e:
        logger.error(f"ScraperAPI request failed: {e}")
        return None


async def _scraperapi_fetch(target_url, api_key, render=True):
    """Async wrapper around ScraperAPI using a thread executor to not block the event loop."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _scraperapi_fetch_sync, target_url, api_key, render)


async def scrape_amazon(url):
    """Scrape reviews from an Amazon product URL.
    
    Uses ScraperAPI (residential proxy) when SCRAPERAPI_KEY env var is set — 
    this works from cloud servers and bypasses Amazon bot detection.
    Falls back to local Playwright-based scraping if no API key is set.
    """
    api_key = os.getenv("SCRAPERAPI_KEY")
    
    if api_key:
        return await _scrape_amazon_via_scraperapi(url, api_key)
    else:
        return await _scrape_amazon_via_playwright(url)


async def _scrape_amazon_via_scraperapi(url, api_key):
    """Scrape Amazon reviews using ScraperAPI (works from cloud deployments)."""
    logger.info(f"Scraping Amazon via ScraperAPI: {url}")
    
    asin = _extract_asin(url)
    if not asin:
        logger.warning("Could not extract ASIN from URL")
        return None
    
    logger.info(f"ASIN: {asin}")
    
    # Fetch product page for title and rating summary
    product_url = f"https://www.amazon.in/dp/{asin}"
    html = await _scraperapi_fetch(product_url, api_key)
    
    product_title = "Amazon Product"
    rating_summary = {}
    
    if html:
        soup = BeautifulSoup(html, "html.parser")
        title_elem = soup.select_one("#productTitle")
        if title_elem:
            product_title = title_elem.get_text(strip=True)
        rating_summary = _extract_rating_summary(soup)
        logger.info(f"Product: {product_title}")
    
    # Paginate through review pages
    all_reviews = []
    for page_num in range(1, MAX_PAGES + 1):
        review_url = (
            f"https://www.amazon.in/product-reviews/{asin}"
            f"?reviewerType=all_reviews&pageNumber={page_num}"
        )
        html = await _scraperapi_fetch(review_url, api_key)
        if not html:
            break
        
        soup = BeautifulSoup(html, "html.parser")
        page_reviews = _parse_reviews_from_soup(soup)
        
        if not page_reviews:
            logger.info(f"No reviews on page {page_num}. Done paginating.")
            break
        
        all_reviews.extend(page_reviews)
        logger.info(f"Page {page_num}: {len(page_reviews)} reviews (total: {len(all_reviews)})")
    
    if not all_reviews:
        logger.warning("No reviews scraped via ScraperAPI.")
        return None
    
    # Deduplicate
    seen = set()
    unique_reviews = []
    for r in all_reviews:
        if r['review_text'] not in seen:
            seen.add(r['review_text'])
            unique_reviews.append(r)
    
    logger.info(f"Final review count: {len(unique_reviews)} for '{product_title}'")
    return {
        'product_title': product_title,
        'reviews': unique_reviews,
        'rating_summary': rating_summary
    }


async def _scrape_amazon_via_playwright(url):
    """Original Playwright-based scraper for local use."""
    logger.info(f"Scraping Amazon URL via Playwright: {url}")
    
    async def _create_browser_context(playwright):
        context = await playwright.chromium.launch_persistent_context(
            BROWSER_DATA_DIR,
            headless=True,
            slow_mo=150,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            locale='en-IN',
            timezone_id='Asia/Kolkata',
        )
        await context.add_init_script(STEALTH_JS)
        return context

    async def _handle_signin_wall(page, timeout_seconds=30):
        signin_patterns = ["/ap/signin", "/ax/claim", "/ap/cvf", "/ap/mfa"]
        if not any(p in page.url for p in signin_patterns):
            return True
        logger.warning("Amazon sign-in wall detected on cloud — returning None")
        return False


    async with async_playwright() as p:
        try:
            context = await _create_browser_context(p)
        except Exception as e:
            logger.error(f"Failed to launch browser: {e}")
            return None
        
        page = context.pages[0] if context.pages else await context.new_page()
        
        try:
            # Visit homepage for session warmup
            logger.info("Visiting Amazon homepage...")
            try:
                await page.goto("https://www.amazon.in", timeout=30000, wait_until='domcontentloaded')
                await asyncio.sleep(1)
            except Exception as e:
                logger.warning(f"Homepage load failed: {e}")
            
            # Navigate to product page
            logger.info(f"Navigating to product: {url}")
            await page.goto(url, timeout=60000, wait_until='domcontentloaded')
            await asyncio.sleep(2)
            
            # Check for CAPTCHA
            title = await page.title()
            if "Robot Check" in title or "CAPTCHA" in title:
                logger.warning("CAPTCHA detected on product page.")
                await context.close()
                return None
            
            # Scroll down to load reviews section and get rating summary
            logger.info("Scrolling to load reviews section...")
            for _ in range(15):
                await page.evaluate("window.scrollBy(0, 500)")
                await asyncio.sleep(0.3)
            await asyncio.sleep(2)
            
            # Parse product page for title and rating summary
            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            product_title_elem = soup.select_one('#productTitle')
            product_title = product_title_elem.get_text(strip=True) if product_title_elem else "Amazon Product"
            logger.info(f"Product: {product_title}")
            
            rating_summary = _extract_rating_summary(soup)
            logger.info(f"Rating summary: {rating_summary}")
            
            # Extract ASIN for direct review URL navigation
            asin = _extract_asin(page.url)
            if not asin:
                asin = _extract_asin(url)
            
            # Get product page reviews as fallback
            product_page_reviews = _parse_reviews_from_soup(soup)
            logger.info(f"Product page reviews: {len(product_page_reviews)}")
            
            if not asin:
                logger.warning("Could not extract ASIN from URL. Using product page reviews only.")
                await context.close()
                return {
                    'product_title': product_title,
                    'reviews': product_page_reviews,
                    'rating_summary': rating_summary
                }
            
            # Navigate to the reviews page
            all_reviews = []
            reviews_page_reached = False
            review_base_url = f"https://www.amazon.in/product-reviews/{asin}?reviewerType=all_reviews&pageNumber=1"
            
            logger.info(f"Navigating to reviews page: {review_base_url}")
            await page.goto(review_base_url, timeout=30000, wait_until='domcontentloaded')
            await asyncio.sleep(3)
            
            # Handle sign-in wall (waits for user to sign in manually)
            signed_in = await _handle_signin_wall(page)
            
            if signed_in:
                # After sign-in, Amazon may redirect to a different page (homepage, CVF completion, etc.)
                # We need to explicitly navigate to the review page
                current_url = page.url
                if "product-reviews" not in current_url:
                    logger.info(f"Post-signin URL: {current_url[:80]} — Navigating to review page...")
                    await page.goto(review_base_url, timeout=30000, wait_until='domcontentloaded')
                    await asyncio.sleep(3)
                    
                    # Check if we got redirected again
                    if "/ap/signin" in page.url or "/ax/claim" in page.url:
                        logger.warning("Still blocked after sign-in. Using product page reviews.")
                    elif "product-reviews" in page.url:
                        reviews_page_reached = True
                        logger.info(f"Successfully reached review page: {page.url[:80]}")
                    else:
                        logger.warning(f"Unexpected post-signin page: {page.url[:80]}")
                else:
                    reviews_page_reached = True
                    logger.info(f"On reviews page: {page.url[:80]}")
            else:
                logger.warning("Could not reach reviews page — sign-in timed out.")
            
            # Paginate through all review pages
            if reviews_page_reached:
                page_num = 1
                while page_num <= MAX_PAGES:
                    logger.info(f"Extracting reviews from page {page_num}...")
                    
                    # Scroll to load all reviews on page
                    for _ in range(5):
                        await page.evaluate("window.scrollBy(0, 500)")
                        await asyncio.sleep(0.3)
                    await asyncio.sleep(1)
                    
                    content = await page.content()
                    soup = BeautifulSoup(content, 'html.parser')
                    page_reviews = _parse_reviews_from_soup(soup)
                    
                    if not page_reviews:
                        logger.info(f"No reviews on page {page_num}. Reached end.")
                        break
                    
                    all_reviews.extend(page_reviews)
                    logger.info(f"Page {page_num}: {len(page_reviews)} reviews (total: {len(all_reviews)})")
                    
                    # Find and click "Next" button
                    next_btn = await page.query_selector('li.a-last a')
                    if not next_btn:
                        next_btn = await page.query_selector('a:has-text("Next page")')
                    
                    if next_btn:
                        try:
                            page_num += 1
                            await next_btn.click()
                            await page.wait_for_load_state('domcontentloaded', timeout=15000)
                            await asyncio.sleep(1.5)
                            
                            # Check for CAPTCHA or redirect
                            current_url = page.url
                            if "/ap/signin" in current_url or "/ax/claim" in current_url:
                                logger.warning("Sign-in required during pagination. Stopping.")
                                break
                            title = await page.title()
                            if "Robot Check" in title:
                                logger.warning("CAPTCHA during pagination. Stopping.")
                                break
                        except Exception as e:
                            logger.warning(f"Navigation error on page {page_num}: {e}")
                            break
                    else:
                        logger.info("No 'Next' button found. Reached last page.")
                        break
                
                logger.info(f"Total reviews from pagination: {len(all_reviews)}")
            
            await context.close()
            
            # Use paginated reviews if available, otherwise fall back to product page reviews
            final_reviews = all_reviews if all_reviews else product_page_reviews
            
            if not final_reviews:
                logger.warning("No reviews found.")
                return None
            
            # Deduplicate
            seen = set()
            unique_reviews = []
            for r in final_reviews:
                if r['review_text'] not in seen:
                    seen.add(r['review_text'])
                    unique_reviews.append(r)
            
            logger.info(f"Final review count: {len(unique_reviews)} for '{product_title}'")
            
            return {
                'product_title': product_title,
                'reviews': unique_reviews,
                'rating_summary': rating_summary
            }
            
        except Exception as e:
            logger.error(f"Error scraping Amazon: {e}")
            try:
                await context.close()
            except:
                pass
            return None


async def scrape_flipkart(url):
    """Scrape ALL reviews from Flipkart product page with pagination."""
    logger.info(f"Scraping Flipkart URL: {url}")
    
    async with async_playwright() as p:
        try:
            context = await _create_browser_context(p)
        except Exception as e:
            logger.error(f"Failed to launch browser: {e}")
            return None
        
        page = context.pages[0] if context.pages else await context.new_page()
        
        try:
            await page.goto(url, timeout=30000, wait_until='domcontentloaded')
            await asyncio.sleep(2)
            
            # Scroll to load content
            for _ in range(10):
                await page.evaluate("window.scrollBy(0, 500)")
                await asyncio.sleep(0.3)
            await asyncio.sleep(1)
            
            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Product title
            title_elem = soup.select_one('span.B_NuCI') or soup.select_one('h1')
            product_title = title_elem.get_text(strip=True) if title_elem else "Flipkart Product"
            
            # Rating summary
            rating_summary = _extract_flipkart_rating_summary(soup)
            
            # Extract reviews from product page
            all_reviews = _parse_flipkart_reviews(soup)
            
            # Try all reviews page
            all_reviews_link = await page.query_selector('a[href*="product-reviews"]')
            if all_reviews_link:
                logger.info("Found 'All reviews' link on Flipkart. Navigating...")
                try:
                    await all_reviews_link.click()
                    await page.wait_for_load_state('domcontentloaded')
                    await asyncio.sleep(2)
                    
                    all_reviews = []  # Reset since we're on the full reviews page now
                    
                    for page_num in range(1, MAX_PAGES + 1):
                        content = await page.content()
                        soup = BeautifulSoup(content, 'html.parser')
                        page_reviews = _parse_flipkart_reviews(soup)
                        
                        if not page_reviews:
                            break
                        
                        all_reviews.extend(page_reviews)
                        logger.info(f"Flipkart page {page_num}: {len(page_reviews)} reviews (total: {len(all_reviews)})")
                        
                        next_btn = await page.query_selector('a._1LKTO3:has-text("Next")')
                        if not next_btn:
                            next_btn = await page.query_selector('nav a:last-child')
                        if next_btn:
                            try:
                                await next_btn.click()
                                await page.wait_for_load_state('domcontentloaded')
                                await asyncio.sleep(1)
                            except:
                                break
                        else:
                            break
                except Exception as e:
                    logger.warning(f"Flipkart review pagination failed: {e}")
            
            await context.close()
            
            # Deduplicate
            seen = set()
            unique_reviews = []
            for r in all_reviews:
                if r['review_text'] not in seen:
                    seen.add(r['review_text'])
                    unique_reviews.append(r)
            
            logger.info(f"Total unique Flipkart reviews: {len(unique_reviews)}")
            
            if not unique_reviews:
                return None
                
            return {
                'product_title': product_title,
                'reviews': unique_reviews,
                'rating_summary': rating_summary
            }

        except Exception as e:
            logger.error(f"Error scraping Flipkart: {e}")
            try:
                await context.close()
            except:
                pass
            return None


def _parse_flipkart_reviews(soup):
    """Extract reviews from a Flipkart page."""
    reviews = []
    
    rating_divs = soup.select('div._3LWZlK')
    
    for r_div in rating_divs:
        try:
            parent = r_div.find_parent('div', class_='col-12-12')
            if not parent:
                continue
                
            text_div = parent.select_one('div.t-ZTKy') or parent.select_one('div._27M-vq')
            text = text_div.get_text(strip=True).replace('READ MORE', '').strip() if text_div else ""
            
            rating_text = r_div.get_text(strip=True)
            rating = float(rating_text) if rating_text.replace('.','',1).isdigit() else None
            
            footer_row = parent.select_one('div.row._3n8db9')
            if footer_row:
                author_elem = footer_row.select_one('p._2sc7ZR')
                author = author_elem.get_text(strip=True) if author_elem else "Flipkart Customer"
                date_elems = footer_row.select('p._2sc7ZR')
                date = date_elems[1].get_text(strip=True) if len(date_elems) > 1 else None
            else:
                author = "Flipkart Customer"
                date = None

            if text and len(text) > 10:
                reviews.append({
                    'review_text': text,
                    'rating': rating,
                    'author': author,
                    'source': 'Flipkart',
                    'date': date
                })
        except Exception:
            continue
    
    return reviews


def _extract_flipkart_rating_summary(soup):
    """Extract rating summary from Flipkart product page."""
    summary = {
        'overall_rating': None,
        'total_ratings': None,
        'star_distribution': {}
    }
    
    rating_elem = soup.select_one('div._3LWZlK')
    if rating_elem:
        try:
            summary['overall_rating'] = float(rating_elem.get_text(strip=True))
        except:
            pass
    
    count_elem = soup.select_one('span._2_R_DZ')
    if count_elem:
        text = count_elem.get_text(strip=True)
        match = re.search(r'([\d,]+)\s*[Rr]ating', text)
        if match:
            summary['total_ratings'] = int(match.group(1).replace(',', ''))
    
    return summary


def get_mock_data():
    """Return realistic mock data for demo purposes"""
    logger.info("Returning mock data for demo")
    return {
        'product_title': "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        'reviews': [
            {
                'review_text': "These headphones are absolutely amazing! The noise cancellation is top notch and the sound quality is crisp. Battery life lasts forever.",
                'rating': 5.0,
                'author': "AudioPhile99",
                'source': 'Demo',
                'date': "Reviewed on September 21, 2023"
            },
            {
                'review_text': "Overpriced garbage. Stopped working after 2 days. Customer support was useless. Do not buy!",
                'rating': 1.0,
                'author': "AngryCustomer",
                'source': 'Demo',
                'date': "Reviewed on October 5, 2023"
            },
            {
                'review_text': "Good product but a bit expensive. Comfort is great for long flights. The app is a bit buggy though.",
                'rating': 4.0,
                'author': "FrequentFlyer",
                'source': 'Demo',
                'date': "Reviewed on November 12, 2023"
            },
            {
                'review_text': "BEST HEADPHONES EVER!!! BUY NOW!!! LIMITED TIME OFFER!!!",
                'rating': 5.0,
                'author': "Bot123",
                'source': 'Demo',
                'date': "Reviewed on January 1, 2024"
            },
            {
                'review_text': "I received this product for free. It is okay. Not great, not terrible.",
                'rating': 3.0,
                'author': "ReviewerX",
                'source': 'Demo',
                'date': "Reviewed on February 15, 2024"
            }
        ],
        'rating_summary': {
            'overall_rating': 4.2,
            'total_ratings': 1547,
            'star_distribution': {'5': 55, '4': 20, '3': 10, '2': 5, '1': 10}
        }
    }
