"""
Web Scraping Service for AI Integration
Fetches and analyzes web content for educational purposes
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
import logging
from typing import Tuple, Dict, List, Optional

logger = logging.getLogger(__name__)


class WebScrapingService:
    """Service for fetching and processing web content"""
    
    # User-Agent to avoid being blocked
    USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    
    # Timeout for requests
    REQUEST_TIMEOUT = 15
    
    # Maximum content size to fetch (50 MB)
    MAX_CONTENT_SIZE = 50 * 1024 * 1024
    
    # Educational domains that are safe to scrape
    ALLOWED_DOMAINS = [
        'wikipedia.org',
        'khanacademy.org',
        'byjus.com',
        'vedantu.com',
        'ncert.nic.in',
        'toppr.com',
        'doubtnut.com',
        'youtube.com',
        'github.com',
        'stackoverflow.com',
        'medium.com',
        'geeksforgeeks.org',
        'w3schools.com',
        'codecademy.com',
        'coursera.org',
        'edx.org',
        'udacity.com',
        'datacamp.com',
        'kaggle.com',
        'pytorch.org',
        'tensorflow.org',
        'docs.python.org',
        'javascript.info',
        'mdn.org',
    ]
    
    @staticmethod
    def is_domain_allowed(url: str) -> bool:
        """Check if URL is from an allowed educational domain"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower().replace('www.', '')
            
            # Check against allowed domains
            return any(domain.endswith(allowed) for allowed in WebScrapingService.ALLOWED_DOMAINS)
        except Exception as e:
            logger.error(f"Error parsing URL domain: {e}")
            return False
    
    @staticmethod
    def fetch_url_content(url: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Fetch content from a URL
        
        Returns:
            Tuple[success: bool, content: str, error: str]
        """
        try:
            # Validate URL
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            # Check if domain is allowed
            if not WebScrapingService.is_domain_allowed(url):
                return False, None, f"Domain not in allowed list. Supported: Wikipedia, Khan Academy, BYJUS, Vedantu, NCERT, and more."
            
            # Fetch the URL
            response = requests.get(
                url,
                headers={'User-Agent': WebScrapingService.USER_AGENT},
                timeout=WebScrapingService.REQUEST_TIMEOUT,
                allow_redirects=True
            )
            
            # Check response status
            if response.status_code != 200:
                return False, None, f"Unable to fetch page (HTTP {response.status_code})"
            
            # Check content size
            if len(response.content) > WebScrapingService.MAX_CONTENT_SIZE:
                return False, None, "Page content too large"
            
            return True, response.text, None
            
        except requests.exceptions.Timeout:
            return False, None, "Request timeout - page took too long to load"
        except requests.exceptions.ConnectionError:
            return False, None, "Connection error - unable to reach the website"
        except Exception as e:
            return False, None, f"Error fetching URL: {str(e)}"
    
    @staticmethod
    def extract_text_from_html(html_content: str, max_words: int = 2000) -> Tuple[str, str]:
        """
        Extract meaningful text from HTML content
        
        Returns:
            Tuple[main_text: str, title: str]
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Remove script and style tags
            for script in soup(['script', 'style', 'nav', 'footer']):
                script.decompose()
            
            # Get title
            title = ''
            title_tag = soup.find('title')
            if title_tag:
                title = title_tag.get_text(strip=True)
            elif soup.h1:
                title = soup.h1.get_text(strip=True)
            
            # Extract main content
            # Try common content containers first
            main_content = None
            for selector in ['main', 'article', '[role="main"]', '.content', '#content']:
                element = soup.select_one(selector)
                if element:
                    main_content = element
                    break
            
            # Fallback to body if no main content found
            if not main_content:
                main_content = soup.body or soup
            
            # Extract text paragraphs
            paragraphs = []
            for tag in main_content.find_all(['p', 'li', 'h2', 'h3', 'h4', 'span']):
                text = tag.get_text(strip=True)
                if text and len(text) > 20:  # Filter out short text
                    paragraphs.append(text)
            
            # Join paragraphs and limit to max_words
            full_text = '\n'.join(paragraphs)
            words = full_text.split()
            if len(words) > max_words:
                full_text = ' '.join(words[:max_words]) + '...'
            
            return full_text, title
            
        except Exception as e:
            logger.error(f"Error extracting text from HTML: {e}")
            return '', ''
    
    @staticmethod
    def extract_structured_data(html_content: str) -> Dict:
        """
        Extract structured data from HTML (headings, lists, tables)
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Remove script and style tags
            for script in soup(['script', 'style']):
                script.decompose()
            
            data = {
                'headings': [],
                'lists': [],
                'tables': [],
                'images': [],
                'links': []
            }
            
            # Extract headings
            for heading in soup.find_all(['h1', 'h2', 'h3']):
                text = heading.get_text(strip=True)
                if text:
                    data['headings'].append({'level': heading.name, 'text': text})
            
            # Extract lists
            for ul in soup.find_all('ul'):
                items = []
                for li in ul.find_all('li', recursive=False):
                    item_text = li.get_text(strip=True)
                    if item_text:
                        items.append(item_text)
                if items:
                    data['lists'].append(items)
            
            # Extract tables
            for table in soup.find_all('table'):
                rows = []
                for tr in table.find_all('tr'):
                    cells = []
                    for td in tr.find_all(['td', 'th']):
                        cell_text = td.get_text(strip=True)
                        if cell_text:
                            cells.append(cell_text)
                    if cells:
                        rows.append(cells)
                if rows:
                    data['tables'].append(rows)
            
            # Extract images with alt text
            for img in soup.find_all('img')[:5]:  # Limit to 5 images
                src = img.get('src', '')
                alt = img.get('alt', 'Image')
                if src:
                    data['images'].append({'src': src, 'alt': alt})
            
            # Extract important links
            for link in soup.find_all('a')[:10]:  # Limit to 10 links
                href = link.get('href', '')
                text = link.get_text(strip=True)
                if href and text and len(text) < 100:
                    data['links'].append({'text': text, 'href': href})
            
            return data
            
        except Exception as e:
            logger.error(f"Error extracting structured data: {e}")
            return {'error': str(e)}
    
    @staticmethod
    def analyze_url_for_education(url: str, query: str = '') -> Tuple[bool, str, Optional[str]]:
        """
        Fetch and analyze a URL for educational content
        
        Args:
            url: The URL to analyze
            query: Optional search query within the content
        
        Returns:
            Tuple[success: bool, analysis: str, error: str]
        """
        # Fetch content
        success, html_content, error = WebScrapingService.fetch_url_content(url)
        if not success:
            return False, '', error
        
        # Extract text and structured data
        text_content, title = WebScrapingService.extract_text_from_html(html_content)
        structured_data = WebScrapingService.extract_structured_data(html_content)
        
        # Build analysis string
        analysis = f"""
# Web Content Analysis

## Source
- **URL**: {url}
- **Title**: {title}

## Content Structure
- **Headings**: {len(structured_data.get('headings', []))} found
- **Lists**: {len(structured_data.get('lists', []))} found
- **Tables**: {len(structured_data.get('tables', []))} found
- **Images**: {len(structured_data.get('images', []))} found
- **Links**: {len(structured_data.get('links', []))} found

## Main Content (Excerpt)
{text_content[:1500]}...

## Key Headings Found
"""
        for heading in structured_data.get('headings', [])[:5]:
            analysis += f"\n- {heading['text']}"
        
        # Add lists if found
        if structured_data.get('lists'):
            analysis += "\n\n## Lists Found\n"
            for i, list_items in enumerate(structured_data.get('lists', [])[:3]):
                analysis += f"\n**List {i+1}:**\n"
                for item in list_items[:5]:
                    analysis += f"- {item}\n"
        
        # Add tables if found
        if structured_data.get('tables'):
            analysis += "\n\n## Tables Found\n"
            for i, table in enumerate(structured_data.get('tables', [])[:2]):
                analysis += f"\n**Table {i+1}:**\n"
                for row in table[:3]:
                    analysis += f"| {' | '.join(row)} |\n"
        
        analysis += f"\n\n## Resources
- Full content length: {len(text_content)} characters
- Query highlight: {query if query else 'None'}"
        
        return True, analysis, None


class SearchService:
    """Service for searching educational content online"""
    
    # Add basic search implementation
    SEARCH_ENDPOINTS = {
        'wikipedia': 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={}&format=json&srlimit=5',
        'ddg': 'https://duckduckgo.com/?q={}&format=json',  # Basic DDG search
    }
    
    @staticmethod
    def search_wikipedia(query: str) -> Tuple[bool, List[Dict], Optional[str]]:
        """Search Wikipedia for educational content"""
        try:
            url = SearchService.SEARCH_ENDPOINTS['wikipedia'].format(query.replace(' ', '+'))
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                return False, [], "Wikipedia search unavailable"
            
            data = response.json()
            results = []
            
            for item in data.get('query', {}).get('search', []):
                results.append({
                    'title': item.get('title', ''),
                    'snippet': item.get('snippet', ''),
                    'url': f"https://en.wikipedia.org/wiki/{item.get('title', '').replace(' ', '_')}"
                })
            
            return True, results, None
            
        except Exception as e:
            logger.error(f"Wikipedia search error: {e}")
            return False, [], f"Search error: {str(e)}"
