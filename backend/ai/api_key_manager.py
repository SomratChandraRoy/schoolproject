"""
Multi-API-Key Manager for Gemini API
Automatically rotates through multiple API keys when quota is exceeded
"""
import warnings
warnings.filterwarnings('ignore', message='.*google.generativeai.*', category=FutureWarning)

import google.generativeai as genai
from typing import Optional, List, Tuple
import logging

logger = logging.getLogger(__name__)


class GeminiAPIKeyManager:
    """Manages multiple Gemini API keys with automatic rotation on quota errors"""
    
    def __init__(self, api_keys: List[str]):
        """
        Initialize with a list of API keys
        
        Args:
            api_keys: List of Gemini API keys to rotate through
        """
        self.api_keys = [key.strip() for key in api_keys if key and key.strip()]
        self.current_index = 0
        self.failed_keys = set()
        
        if not self.api_keys:
            raise ValueError("No valid API keys provided")
        
        logger.info(f"Initialized GeminiAPIKeyManager with {len(self.api_keys)} API keys")
    
    def get_current_key(self) -> str:
        """Get the current API key"""
        return self.api_keys[self.current_index]
    
    def rotate_key(self) -> bool:
        """
        Rotate to the next API key
        
        Returns:
            True if rotation successful, False if all keys exhausted
        """
        # Mark current key as failed
        self.failed_keys.add(self.current_index)
        
        # Try to find next working key
        attempts = 0
        while attempts < len(self.api_keys):
            self.current_index = (self.current_index + 1) % len(self.api_keys)
            
            # If we haven't tried this key yet, use it
            if self.current_index not in self.failed_keys:
                logger.info(f"Rotated to API key #{self.current_index + 1}")
                return True
            
            attempts += 1
        
        # All keys have been tried
        logger.error("All API keys have been exhausted")
        return False
    
    def reset_failed_keys(self):
        """Reset the failed keys set (useful for daily quota resets)"""
        self.failed_keys.clear()
        self.current_index = 0
        logger.info("Reset all failed keys")
    
    def generate_content(
        self, 
        prompt: str, 
        model_name: str = 'gemini-2.5-flash',
        max_retries: Optional[int] = None,
        timeout: int = 30
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Generate content with automatic key rotation on quota errors
        
        Args:
            prompt: The prompt to send to Gemini
            model_name: The model to use (default: gemini-2.5-flash)
            max_retries: Maximum number of keys to try (default: all keys)
            timeout: Timeout in seconds for API call (default: 30)
        
        Returns:
            Tuple of (success: bool, response_text: str, error_message: str)
        """
        if max_retries is None:
            max_retries = len(self.api_keys)
        
        attempts = 0
        last_error = None
        
        while attempts < max_retries:
            try:
                # Get current API key
                current_key = self.get_current_key()
                
                # Configure Gemini with current key
                genai.configure(api_key=current_key)
                
                # Create model and generate content with timeout
                model = genai.GenerativeModel(model_name)
                
                # Use ThreadPoolExecutor for timeout
                from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
                
                def _generate():
                    return model.generate_content(prompt)
                
                with ThreadPoolExecutor() as executor:
                    future = executor.submit(_generate)
                    try:
                        response = future.result(timeout=timeout)
                    except FutureTimeoutError:
                        raise Exception(f"API call timed out after {timeout} seconds")
                
                if response and response.text:
                    logger.info(f"Successfully generated content using API key #{self.current_index + 1}")
                    return True, response.text, None
                else:
                    last_error = "No response from API"
                    logger.warning(f"No response from API key #{self.current_index + 1}")
                    
            except Exception as e:
                error_str = str(e).lower()
                last_error = str(e)
                
                # Check if it's a timeout
                if 'timeout' in error_str or 'timed out' in error_str:
                    logger.warning(f"Timeout for API key #{self.current_index + 1}")
                    # Try next key on timeout
                    if not self.rotate_key():
                        return False, None, "All API keys timed out. Please try again later."
                    attempts += 1
                    continue
                
                # Check if it's a quota error
                if 'quota' in error_str or '429' in error_str:
                    logger.warning(f"Quota exceeded for API key #{self.current_index + 1}")
                    
                    # Try to rotate to next key
                    if not self.rotate_key():
                        # All keys exhausted
                        return False, None, "All API keys have exceeded their quota. Please try again later."
                    
                    attempts += 1
                    continue
                
                # Check if it's an API key error
                elif 'api key' in error_str or 'api_key' in error_str or 'invalid' in error_str:
                    logger.error(f"Invalid API key #{self.current_index + 1}: {error_str}")
                    
                    # Try next key
                    if not self.rotate_key():
                        return False, None, "All API keys are invalid. Please check your configuration."
                    
                    attempts += 1
                    continue
                
                # Other errors - don't rotate, just fail
                else:
                    logger.error(f"Error with API key #{self.current_index + 1}: {error_str}")
                    return False, None, f"API error: {error_str}"
            
            attempts += 1
        
        # Max retries reached
        return False, None, f"Failed after {attempts} attempts. Last error: {last_error}"
    
    def get_status(self) -> dict:
        """Get current status of the key manager"""
        return {
            'total_keys': len(self.api_keys),
            'current_key_index': self.current_index + 1,
            'failed_keys_count': len(self.failed_keys),
            'available_keys_count': len(self.api_keys) - len(self.failed_keys),
            'all_keys_exhausted': len(self.failed_keys) >= len(self.api_keys)
        }


# Global instance (will be initialized in views.py)
_key_manager: Optional[GeminiAPIKeyManager] = None


def get_key_manager() -> GeminiAPIKeyManager:
    """Get the global key manager instance"""
    global _key_manager
    
    if _key_manager is None:
        raise RuntimeError("GeminiAPIKeyManager not initialized. Call initialize_key_manager() first.")
    
    return _key_manager


def initialize_key_manager(api_keys: List[str]):
    """Initialize the global key manager"""
    global _key_manager
    _key_manager = GeminiAPIKeyManager(api_keys)
    logger.info("Global GeminiAPIKeyManager initialized")


def reset_key_manager():
    """Reset the global key manager (useful for testing or daily resets)"""
    global _key_manager
    if _key_manager:
        _key_manager.reset_failed_keys()
        logger.info("Global GeminiAPIKeyManager reset")
