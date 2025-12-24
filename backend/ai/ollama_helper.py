"""
Ollama AI Helper
Provides functions to interact with AWS-hosted Ollama AI
"""
import os
import requests
import base64
from django.conf import settings


class OllamaHelper:
    """Helper class for Ollama AI interactions"""
    
    def __init__(self):
        self.base_url = os.getenv('OLLAMA_BASE_URL', 'http://16.171.19.161')
        self.username = os.getenv('OLLAMA_USERNAME', 'bipul')
        self.password = os.getenv('OLLAMA_PASSWORD', 'Bipul$Ollama$Roy$2026$')
        self.model = os.getenv('OLLAMA_MODEL', 'llama3')
        
        # Create Basic Auth token
        credentials = f"{self.username}:{self.password}"
        self.auth_token = 'Basic ' + base64.b64encode(credentials.encode()).decode()
    
    def check_server_status(self):
        """Check if Ollama server is online"""
        try:
            response = requests.get(
                f"{self.base_url}/api/tags",
                headers={'Authorization': self.auth_token},
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Ollama server check failed: {str(e)}")
            return False
    
    def generate(self, prompt, stream=False, timeout=120):
        """
        Generate response from Ollama
        
        Args:
            prompt (str): The prompt to send to Ollama
            stream (bool): Whether to stream the response
            timeout (int): Request timeout in seconds
            
        Returns:
            tuple: (success: bool, response: str, error: str)
        """
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': self.auth_token
                },
                json={
                    'model': self.model,
                    'prompt': prompt,
                    'stream': stream
                },
                timeout=timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                return True, data.get('response', ''), None
            else:
                error_msg = f"Ollama API error: {response.status_code}"
                return False, '', error_msg
                
        except requests.exceptions.Timeout:
            return False, '', "Request timeout - Ollama server took too long to respond"
        except requests.exceptions.ConnectionError:
            return False, '', "Connection error - Cannot reach Ollama server. Please check if EC2 instance is running."
        except Exception as e:
            return False, '', f"Ollama error: {str(e)}"
    
    def chat(self, messages, stream=False, timeout=120):
        """
        Chat with Ollama using conversation history
        
        Args:
            messages (list): List of message dicts with 'role' and 'content'
            stream (bool): Whether to stream the response
            timeout (int): Request timeout in seconds
            
        Returns:
            tuple: (success: bool, response: str, error: str)
        """
        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': self.auth_token
                },
                json={
                    'model': self.model,
                    'messages': messages,
                    'stream': stream
                },
                timeout=timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', {})
                return True, message.get('content', ''), None
            else:
                error_msg = f"Ollama API error: {response.status_code}"
                return False, '', error_msg
                
        except requests.exceptions.Timeout:
            return False, '', "Request timeout - Ollama server took too long to respond"
        except requests.exceptions.ConnectionError:
            return False, '', "Connection error - Cannot reach Ollama server"
        except Exception as e:
            return False, '', f"Ollama error: {str(e)}"


# Global instance
_ollama_helper = None


def get_ollama_helper():
    """Get or create global Ollama helper instance"""
    global _ollama_helper
    if _ollama_helper is None:
        _ollama_helper = OllamaHelper()
    return _ollama_helper
