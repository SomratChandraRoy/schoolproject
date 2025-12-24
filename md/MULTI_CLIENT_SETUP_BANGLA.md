# 🌐 একই সময়ে Multiple জায়গা থেকে Ollama ব্যবহার করা

## 📋 Overview

এই guide-এ আপনি শিখবেন কিভাবে:
- ✅ 1টি AWS EC2 instance-এ Ollama host করবেন
- ✅ আপনার local computer থেকে ব্যবহার করবেন
- ✅ 3টি আলাদা server থেকে একসাথে ব্যবহার করবেন
- ✅ Load balancing এবং rate limiting setup করবেন

---

## 🏗️ Architecture

```
                    ┌─────────────────────────────┐
                    │   AWS EC2 (Ollama Server)   │
                    │   - Nginx (Load Balancer)   │
                    │   - Ollama (AI Engine)      │
                    │   - Port: 80, 11434         │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
            ┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
            │    Local     │ │ Server 1 │ │  Server 2  │
            │   Computer   │ │ (AWS EC2)│ │ (AWS EC2)  │
            └──────────────┘ └──────────┘ └────────────┘
                                   │
                           ┌───────▼────────┐
                           │    Server 3    │
                           │   (AWS EC2)    │
                           └────────────────┘
```

---

## ধাপ ১: Ollama Server Setup (Main EC2)

### ১.১ Enhanced Configuration

```bash
# SSH connect করুন
ssh -i "ollama-key.pem" ubuntu@YOUR_OLLAMA_IP

# Ollama configuration update করুন
sudo nano /etc/systemd/system/ollama.service.d/override.conf
```

এই content যোগ করুন:
```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_NUM_PARALLEL=4"
Environment="OLLAMA_MAX_LOADED_MODELS=2"
Environment="OLLAMA_KEEP_ALIVE=10m"
Environment="OLLAMA_MAX_QUEUE=100"
```

**Explanation:**
- `OLLAMA_NUM_PARALLEL=4` - একসাথে 4টি request process করবে
- `OLLAMA_MAX_LOADED_MODELS=2` - 2টি model memory-তে রাখবে
- `OLLAMA_KEEP_ALIVE=10m` - 10 minute পর model unload হবে
- `OLLAMA_MAX_QUEUE=100` - Maximum 100 requests queue-তে রাখবে

```bash
# Service restart করুন
sudo systemctl daemon-reload
sudo systemctl restart ollama
sudo systemctl status ollama
```

### ১.২ Nginx Load Balancer Setup

```bash
# Nginx install করুন
sudo apt install nginx -y

# Configuration file তৈরি করুন
sudo nano /etc/nginx/sites-available/ollama
```

এই complete configuration paste করুন:
```nginx
# Connection pooling
upstream ollama_backend {
    server localhost:11434;
    keepalive 32;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=ollama_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=ollama_burst:10m rate=50r/m;

# Connection limiting
limit_conn_zone $binary_remote_addr zone=ollama_conn:10m;

server {
    listen 80;
    server_name _;
    
    # Max body size
    client_REDACTED 10M;
    
    # Logging
    access_log /var/log/nginx/ollama_access.log;
    error_log /var/log/nginx/ollama_error.log;
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
    
    # Metrics endpoint (optional)
    location /metrics {
        access_log off;
        stub_status on;
    }
    
    # Main API endpoint
    location /api/ {
        # Rate limiting
        limit_req zone=ollama_limit burst=20 nodelay;
        limit_req zone=ollama_burst;
        limit_conn ollama_conn 10;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        
        # Handle preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        # Proxy settings
        proxy_pass http://ollama_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Buffering
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
```

```bash
# Enable করুন
sudo ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx
```

### ১.৩ Monitoring Setup

```bash
# htop install করুন (resource monitoring)
sudo apt install htop -y

# Create monitoring script
cat > ~/monitor_ollama.sh << 'EOF'
#!/bin/bash
echo "=== Ollama Server Status ==="
echo ""
echo "Service Status:"
sudo systemctl status ollama --no-pager | head -5
echo ""
echo "Active Connections:"
sudo netstat -an | grep :11434 | wc -l
echo ""
echo "Memory Usage:"
free -h
echo ""
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}'
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager | head -3
EOF

chmod +x ~/monitor_ollama.sh
```

---

## ধাপ ২: Local Computer Setup

### ২.১ Python Setup (Windows/Linux/Mac)

```bash
# Python install করুন (যদি না থাকে)
# Windows: https://www.python.org/downloads/
# Linux: sudo apt install python3 python3-pip
# Mac: brew install python3

# Dependencies install করুন
pip install requests

# Client script download করুন
# ollama-client-local.py file ব্যবহার করুন
```

**Usage:**
```python
# Python script run করুন
python ollama-client-local.py

# অথবা interactive mode-এ:
python
>>> from ollama_client_local import OllamaClient
>>> client = OllamaClient("http://YOUR_OLLAMA_IP")
>>> response = client.generate("What is AI?")
>>> print(response)
```

### ২.২ Node.js Setup (Windows/Linux/Mac)

```bash
# Node.js install করুন (যদি না থাকে)
# https://nodejs.org/

# Dependencies install করুন
npm install axios

# Client script run করুন
node ollama-client-local.js
```

### ২.৩ React App থেকে ব্যবহার

```bash
cd S.P-by-Bipul-Roy/frontend/medhabangla

# .env file তৈরি করুন
echo "REACT_APP_OLLAMA_URL=http://YOUR_OLLAMA_IP" > .env

# Dev server চালু করুন
npm run dev

# Browser-এ যান: http://localhost:5173/ollama
```

---

## ধাপ ৩: Server 1 Setup

### ৩.১ SSH Connect করুন

```bash
# আপনার Server 1-এ SSH করুন
ssh -i "server1-key.pem" ubuntu@SERVER1_IP
```

### ৩.২ Client Setup Script Run করুন

```bash
# Setup script download করুন
wget https://raw.githubusercontent.com/your-repo/ollama-server-client.sh

# অথবা manually create করুন:
nano setup_ollama_client.sh
# (ollama-server-client.sh-র content paste করুন)

# Executable করুন
chmod +x setup_ollama_client.sh

# Run করুন
./setup_ollama_client.sh

# Prompts:
# - Ollama server IP: YOUR_OLLAMA_IP
# - Server name: Server1
```

### ৩.৩ Test করুন

```bash
# Logout এবং login করুন (aliases activate করার জন্য)
exit
ssh -i "server1-key.pem" ubuntu@SERVER1_IP

# Test commands
ollama-test  # Connection test
ollama-ask "What is Python?"  # Ask a question

# Python script directly
python3 ~/ollama_client.py "Tell me a joke"
```

---

## ধাপ ৪: Server 2 Setup

```bash
# Server 2-তে SSH করুন
ssh -i "server2-key.pem" ubuntu@SERVER2_IP

# Same setup script run করুন
./setup_ollama_client.sh

# Prompts:
# - Ollama server IP: YOUR_OLLAMA_IP
# - Server name: Server2

# Test করুন
ollama-ask "What is JavaScript?"
```

---

## ধাপ ৫: Server 3 Setup

```bash
# Server 3-তে SSH করুন
ssh -i "server3-key.pem" ubuntu@SERVER3_IP

# Same setup script run করুন
./setup_ollama_client.sh

# Prompts:
# - Ollama server IP: YOUR_OLLAMA_IP
# - Server name: Server3

# Test করুন
ollama-ask "What is Docker?"
```

---

## ধাপ ৬: Concurrent Testing

### ৬.১ সব জায়গা থেকে একসাথে Test করুন

**Terminal 1 (Local Computer):**
```bash
python ollama-client-local.py
# Ask: "What is machine learning?"
```

**Terminal 2 (Server 1):**
```bash
ssh server1
ollama-ask "What is deep learning?"
```

**Terminal 3 (Server 2):**
```bash
ssh server2
ollama-ask "What is neural network?"
```

**Terminal 4 (Server 3):**
```bash
ssh server3
ollama-ask "What is AI?"
```

**Terminal 5 (React App):**
```
Browser: http://localhost:5173/ollama
Type: "What is NLP?"
```

### ৬.২ Load Testing Script

```bash
# Ollama server-এ monitoring করুন
ssh ollama-server
~/monitor_ollama.sh

# অথবা real-time monitoring
watch -n 1 '~/monitor_ollama.sh'
```

---

## 🔒 Security Best Practices

### ১. IP Whitelisting (Recommended)

```bash
# Ollama server-এ
sudo nano /etc/nginx/sites-available/ollama
```

এই section যোগ করুন:
```nginx
# Whitelist specific IPs
geo $allowed_ip {
    default 0;
    YOUR_LOCAL_IP 1;
    SERVER1_IP 1;
    SERVER2_IP 1;
    SERVER3_IP 1;
}

server {
    # ... existing config ...
    
    location /api/ {
        if ($allowed_ip = 0) {
            return 403;
        }
        # ... rest of config ...
    }
}
```

### ২. API Key Authentication

```bash
# Generate API key
API_KEY=$(openssl rand -hex 32)
echo "API Key: $API_KEY"

# Nginx config update করুন
sudo nano /etc/nginx/sites-available/ollama
```

এই section যোগ করুন:
```nginx
location /api/ {
    # API key check
    if ($http_x_api_key != "YOUR_API_KEY_HERE") {
        return 401 "Unauthorized\n";
    }
    # ... rest of config ...
}
```

**Clients-এ API key use করুন:**
```python
# Python
headers = {"X-API-Key": "YOUR_API_KEY"}
response = requests.post(url, json=data, headers=headers)
```

### ৩. HTTPS Setup

```bash
# Ollama server-এ
sudo apt install certbot python3-certbot-nginx -y

# Domain point করুন আপনার EC2 IP-তে
# Then:
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 📊 Monitoring & Logging

### ১. Real-time Monitoring

```bash
# Ollama server-এ

# Active connections
watch -n 1 'sudo netstat -an | grep :11434 | wc -l'

# Nginx access log
sudo tail -f /var/log/nginx/ollama_access.log

# Ollama service log
sudo journalctl -u ollama -f

# System resources
htop
```

### ২. Log Analysis

```bash
# Top clients by request count
sudo awk '{print $1}' /var/log/nginx/ollama_access.log | sort | uniq -c | sort -rn | head -10

# Requests per minute
sudo awk '{print $4}' /var/log/nginx/ollama_access.log | cut -d: -f1-2 | uniq -c

# Response times
sudo awk '{print $NF}' /var/log/nginx/ollama_access.log | sort -n | tail -20
```

---

## 💰 Cost Optimization

### ১. Auto-scaling (Advanced)

```bash
# CloudWatch alarm setup করুন
# CPU > 80% হলে alert

# Lambda function তৈরি করুন instance stop/start করার জন্য
```

### ২. Scheduled Shutdown

```bash
# Ollama server-এ cron job
crontab -e

# রাত 11 টায় stop (UTC)
0 23 * * * sudo systemctl stop ollama

# সকাল 8 টায় start (UTC)
0 8 * * * sudo systemctl start ollama
```

### ৩. Cost Monitoring

```bash
# AWS Cost Explorer ব্যবহার করুন
# CloudWatch billing alarm set করুন
# Threshold: $20/month
```

---

## 🎯 Performance Tuning

### ১. Model Caching

```bash
# Frequently used models pre-load করুন
ollama pull llama3.2
ollama pull mistral
ollama pull gemma2:2b

# Keep alive time বাড়ান
# /etc/systemd/system/ollama.service.d/override.conf
Environment="OLLAMA_KEEP_ALIVE=30m"
```

### ২. Nginx Optimization

```nginx
# Worker processes
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Keepalive
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # Buffers
    client_REDACTED 128k;
    client_REDACTED 10m;
}
```

---

## 🔧 Troubleshooting

### Problem: Connection timeout

**Solution:**
```bash
# Check if Ollama is running
sudo systemctl status ollama

# Check if Nginx is running
sudo systemctl status nginx

# Check firewall
sudo ufw status

# Check security group (AWS Console)
```

### Problem: Slow responses

**Solution:**
```bash
# Check CPU/Memory
htop

# Check active connections
sudo netstat -an | grep :11434 | wc -l

# Reduce parallel requests
# Edit: /etc/systemd/system/ollama.service.d/override.conf
Environment="OLLAMA_NUM_PARALLEL=2"
```

### Problem: Rate limit errors

**Solution:**
```bash
# Increase rate limit in Nginx
sudo nano /etc/nginx/sites-available/ollama

# Change:
limit_req_zone $binary_remote_addr zone=ollama_limit:10m rate=20r/s;
```

---

## ✅ Success Checklist

- [ ] Ollama server running এবং accessible
- [ ] Nginx load balancer configured
- [ ] Local computer থেকে connect করতে পারছি
- [ ] Server 1 থেকে connect করতে পারছি
- [ ] Server 2 থেকে connect করতে পারছি
- [ ] Server 3 থেকে connect করতে পারছি
- [ ] Concurrent requests কাজ করছে
- [ ] Monitoring setup করা আছে
- [ ] Security measures applied
- [ ] Cost optimization configured

---

**এখন আপনি একই সময়ে multiple জায়গা থেকে আপনার AI ব্যবহার করতে পারবেন!** 🎉
