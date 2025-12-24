#!/bin/bash

# AWS EC2-তে Ollama Setup Script
# এই script টি আপনার EC2 instance-এ run করুন

echo "=========================================="
echo "  AWS Ollama Setup Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. System Update
echo -e "${YELLOW}[1/7] System update করা হচ্ছে...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Install Ollama
echo -e "${YELLOW}[2/7] Ollama install করা হচ্ছে...${NC}"
curl -fsSL https://ollama.com/install.sh | sh

# 3. Configure Ollama for external access
echo -e "${YELLOW}[3/7] Ollama configure করা হচ্ছে...${NC}"
sudo mkdir -p /etc/systemd/system/ollama.service.d
sudo tee /etc/systemd/system/ollama.service.d/override.conf > /dev/null <<EOF
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
EOF

# 4. Restart Ollama service
echo -e "${YELLOW}[4/7] Ollama service restart করা হচ্ছে...${NC}"
sudo systemctl daemon-reload
sudo systemctl restart ollama
sudo systemctl enable ollama

# 5. Wait for Ollama to start
echo -e "${YELLOW}[5/7] Ollama start হওয়ার জন্য অপেক্ষা করা হচ্ছে...${NC}"
sleep 5

# 6. Download models
echo -e "${YELLOW}[6/7] AI models download করা হচ্ছে...${NC}"
echo "এটি কিছু সময় নিতে পারে..."

# Download Llama 3.2 (3B - ছোট এবং দ্রুত)
ollama pull llama3.2

# Optional: আরো models download করতে চাইলে uncomment করুন
# ollama pull mistral
# ollama pull gemma2:2b

# 7. Test installation
echo -e "${YELLOW}[7/7] Installation test করা হচ্ছে...${NC}"
RESPONSE=$(curl -s http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Say hello in one word",
  "stream": false
}')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Ollama successfully installed এবং running!${NC}"
    echo ""
    echo "=========================================="
    echo "  Setup Complete!"
    echo "=========================================="
    echo ""
    echo "আপনার Ollama API URL:"
    PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
    echo "http://${PUBLIC_IP}:11434"
    echo ""
    echo "Downloaded models:"
    ollama list
    echo ""
    echo "Test command (আপনার local computer থেকে):"
    echo "curl http://${PUBLIC_IP}:11434/api/generate -d '{\"model\":\"llama3.2\",\"prompt\":\"Hello\",\"stream\":false}'"
    echo ""
    echo "⚠️ Security Group-এ port 11434 open করতে ভুলবেন না!"
    echo ""
else
    echo -e "${YELLOW}⚠ Installation complete কিন্তু test failed${NC}"
    echo "Ollama logs check করুন: sudo journalctl -u ollama -f"
fi
