#!/bin/bash

################################################################################
# Ollama Client Setup Script for Remote Servers
# এই script আপনার Server 1, 2, 3-তে run করুন
################################################################################

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Ollama Client Setup for Remote Server"
echo "=========================================="
echo ""

# Configuration
read -p "আপনার Ollama server-র IP address দিন: " OLLAMA_IP
read -p "Server name দিন (Server1/Server2/Server3): " SERVER_NAME

OLLAMA_URL="http://${OLLAMA_IP}:11434"

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Ollama URL: $OLLAMA_URL"
echo "  Server Name: $SERVER_NAME"
echo ""

# Test connection
echo -e "${YELLOW}[1/5] Testing connection to Ollama server...${NC}"
if curl -s --connect-timeout 5 "${OLLAMA_URL}/api/tags" > /dev/null; then
    echo -e "${GREEN}✓ Connection successful!${NC}"
else
    echo -e "${RED}✗ Cannot connect to Ollama server${NC}"
    echo "Please check:"
    echo "  1. Ollama server is running"
    echo "  2. Security Group allows port 11434"
    echo "  3. IP address is correct"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
if command -v python3 &> /dev/null; then
    echo "Python3 already installed"
else
    sudo apt update
    sudo apt install -y python3 python3-pip
fi

pip3 install requests --quiet

# Create Python client
echo -e "${YELLOW}[3/5] Creating Ollama client script...${NC}"
cat > ~/ollama_client.py << 'PYTHON_SCRIPT'
#!/usr/bin/env python3
import requests
import json
import sys
import os

class OllamaClient:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
    
    def generate(self, prompt, model="llama3.2"):
        try:
            response = requests.post(
                f"{self.api_url}/generate",
                json={"model": model, "prompt": prompt, "stream": False},
                timeout=300
            )
            if response.status_code == 200:
                return response.json().get('response', '')
            else:
                return f"Error: {response.status_code}"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def chat(self, messages, model="llama3.2"):
        try:
            response = requests.post(
                f"{self.api_url}/chat",
                json={"model": model, "messages": messages, "stream": False},
                timeout=300
            )
            if response.status_code == 200:
                return response.json().get('message', {}).get('content', '')
            else:
                return f"Error: {response.status_code}"
        except Exception as e:
            return f"Error: {str(e)}"

if __name__ == "__main__":
    ollama_url = os.environ.get('OLLAMA_URL', 'http://localhost:11434')
    client = OllamaClient(ollama_url)
    
    if len(sys.argv) < 2:
        print("Usage: python3 ollama_client.py 'your prompt here'")
        sys.exit(1)
    
    prompt = ' '.join(sys.argv[1:])
    print(f"Asking: {prompt}")
    print(f"Response: {client.generate(prompt)}")
PYTHON_SCRIPT

chmod +x ~/ollama_client.py

# Create environment file
echo -e "${YELLOW}[4/5] Creating environment configuration...${NC}"
cat > ~/.ollama_env << EOF
# Ollama Configuration for ${SERVER_NAME}
export OLLAMA_URL="${OLLAMA_URL}"
export SERVER_NAME="${SERVER_NAME}"
EOF

# Add to bashrc
if ! grep -q "source ~/.ollama_env" ~/.bashrc; then
    echo "source ~/.ollama_env" >> ~/.bashrc
fi

# Create convenient alias
cat >> ~/.bashrc << 'EOF'

# Ollama aliases
alias ollama-ask='python3 ~/ollama_client.py'
alias ollama-test='curl -s ${OLLAMA_URL}/api/tags | python3 -m json.tool'
EOF

# Test the setup
echo -e "${YELLOW}[5/5] Testing setup...${NC}"
source ~/.ollama_env
source ~/.bashrc

# Test with a simple prompt
echo ""
echo "Testing with a simple prompt..."
python3 ~/ollama_client.py "Say hello in one word" 2>/dev/null

echo ""
echo -e "${GREEN}=========================================="
echo "  Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Available commands:"
echo "  ollama-ask 'your question'  - Ask AI a question"
echo "  ollama-test                 - Test connection"
echo ""
echo "Example:"
echo "  ollama-ask 'What is Python?'"
echo ""
echo "Python script location: ~/ollama_client.py"
echo "Configuration: ~/.ollama_env"
echo ""
echo -e "${YELLOW}Note: Logout and login again to use aliases${NC}"
echo ""
