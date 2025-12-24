#!/usr/bin/env python3
"""
Ollama Client for Local Computer
আপনার local computer থেকে AWS Ollama ব্যবহার করার জন্য
"""

import requests
import json
import time
from typing import Optional, Dict, List

class OllamaClient:
    def __init__(self, base_url: str):
        """
        Initialize Ollama client
        
        Args:
            base_url: আপনার Ollama server-র URL (Example: http://54.123.45.67)
        """
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        
    def check_connection(self) -> bool:
        """Server connection check করুন"""
        try:
            response = requests.get(f"{self.api_url}/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def list_models(self) -> List[str]:
        """Available models-র list পান"""
        try:
            response = requests.get(f"{self.api_url}/tags")
            data = response.json()
            return [model['name'] for model in data.get('models', [])]
        except Exception as e:
            print(f"Error: {e}")
            return []
    
    def generate(
        self, 
        prompt: str, 
        model: str = "llama3.2",
        stream: bool = False,
        temperature: float = 0.7
    ) -> str:
        """
        Text generate করুন
        
        Args:
            prompt: আপনার question/prompt
            model: Model name (default: llama3.2)
            stream: Streaming enable করবেন কিনা
            temperature: Creativity level (0.0 - 1.0)
        
        Returns:
            Generated text
        """
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": stream,
                "options": {
                    "temperature": temperature
                }
            }
            
            response = requests.post(
                f"{self.api_url}/generate",
                json=payload,
                timeout=300  # 5 minutes timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('response', '')
            else:
                return f"Error: {response.status_code} - {response.text}"
                
        except Exception as e:
            return f"Error: {str(e)}"
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama3.2",
        stream: bool = False
    ) -> str:
        """
        Chat with conversation history
        
        Args:
            messages: List of messages [{"role": "user", "content": "..."}]
            model: Model name
            stream: Streaming enable করবেন কিনা
        
        Returns:
            AI response
        """
        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": stream
            }
            
            response = requests.post(
                f"{self.api_url}/chat",
                json=payload,
                timeout=300
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('message', {}).get('content', '')
            else:
                return f"Error: {response.status_code}"
                
        except Exception as e:
            return f"Error: {str(e)}"


# Example usage
if __name__ == "__main__":
    # আপনার Ollama server-র URL দিন
    OLLAMA_URL = "http://54.123.45.67"  # আপনার EC2 IP দিন
    
    # Client initialize করুন
    client = OllamaClient(OLLAMA_URL)
    
    # Connection test করুন
    print("🔍 Testing connection...")
    if client.check_connection():
        print("✅ Connected to Ollama server!")
    else:
        print("❌ Cannot connect to Ollama server")
        exit(1)
    
    # Available models দেখুন
    print("\n📋 Available models:")
    models = client.list_models()
    for model in models:
        print(f"  - {model}")
    
    # Simple generation test
    print("\n💬 Testing text generation...")
    response = client.generate(
        prompt="বাংলাদেশের রাজধানী কোথায়?",
        model="llama3.2"
    )
    print(f"Response: {response}")
    
    # Chat test
    print("\n💬 Testing chat...")
    messages = [
        {"role": "user", "content": "What is Python?"},
        {"role": "assistant", "content": "Python is a programming language."},
        {"role": "user", "content": "What can I do with it?"}
    ]
    response = client.chat(messages, model="llama3.2")
    print(f"Response: {response}")
    
    print("\n✅ All tests completed!")
