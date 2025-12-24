# 🧪 Ollama Server Testing Guide

## 📋 Server Information

- **Server IP:** 16.171.19.161
- **Port:** 80 (Nginx reverse proxy)
- **Backend Port:** 11434 (Ollama)
- **Model:** llama3
- **Authentication:** Basic Auth
  - Username: `bipul`
  - Password: `Bipul$Ollama$Roy$2026$`

---

## ✅ Pre-Test Checklist

Before testing, ensure:

- [ ] AWS EC2 instance is running
- [ ] Ollama service is active
- [ ] Nginx is running
- [ ] Security Group allows port 80
- [ ] Basic Auth is configured in Nginx

---

## 🔧 Test Methods

### Method 1: Python Test Script (Recommended)

```bash
# Install dependencies
pip install requests

# Run test
python test-ollama-connection.py
```

**Expected Output:**
```
🔍 Test 1: Checking server availability...
✅ Server is online!
Available models: llama3

🔍 Test 2: Testing text generation...
✅ Generation successful!
Response: Hello

🔍 Test 3: Testing Bangla prompt...
✅ Bangla prompt successful!
Response: বাংলাদেশের রাজধানী ঢাকা।

🔍 Test 4: Testing long response...
✅ Long response successful!

🎉 All tests passed! Your Ollama server is working perfectly!
```

---

### Method 2: Node.js Test Script

```bash
# Run test
node test-ollama-connection.js
```

---

### Method 3: cURL Commands

#### Test 1: Check Server Status
```bash
curl -u bipul:Bipul\$Ollama\$Roy\$2026\$ http://16.171.19.161/api/tags
```

**Expected:** JSON response with available models

#### Test 2: Simple Generation
```bash
curl -u bipul:Bipul\$Ollama\$Roy\$2026\$ \
  -X POST http://16.171.19.161/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3",
    "prompt": "Say hello in one word",
    "stream": false
  }'
```

**Expected:** JSON response with "response" field

#### Test 3: Bangla Prompt
```bash
curl -u bipul:Bipul\$Ollama\$Roy\$2026\$ \
  -X POST http://16.171.19.161/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3",
    "prompt": "বাংলাদেশের রাজধানী কোথায়?",
    "stream": false
  }'
```

---

### Method 4: React App Test

```bash
# Start dev server
cd S.P-by-Bipul-Roy/frontend/medhabangla
npm run dev

# Open browser
http://localhost:5173/ollama

# Check:
1. Server status shows "● Online"
2. Can send messages
3. Receives responses
```

---

## 🐛 Troubleshooting

### Issue 1: Connection Refused

**Symptoms:**
```
❌ Cannot connect to server
Error: ECONNREFUSED
```

**Solutions:**
```bash
# 1. Check if EC2 instance is running
aws ec2 describe-instances --instance-ids YOUR_INSTANCE_ID

# 2. SSH to server and check services
ssh -i your-key.pem ubuntu@16.171.19.161

# Check Ollama
sudo systemctl status ollama

# Check Nginx
sudo systemctl status nginx

# Check if ports are listening
sudo netstat -tulpn | grep -E ':(80|11434)'
```

---

### Issue 2: 401 Unauthorized

**Symptoms:**
```
❌ Server responded with status: 401
```

**Solutions:**
```bash
# 1. Verify credentials in Nginx config
ssh -i your-key.pem ubuntu@16.171.19.161
sudo cat /etc/nginx/.htpasswd

# 2. Check if Basic Auth is configured
sudo cat /etc/nginx/sites-available/ollama | grep auth_basic

# 3. Test credentials
echo -n "bipul:Bipul\$Ollama\$Roy\$2026\$" | base64
```

---

### Issue 3: 403 Forbidden

**Symptoms:**
```
❌ Server responded with status: 403
```

**Solutions:**
```bash
# Check Nginx error log
ssh -i your-key.pem ubuntu@16.171.19.161
sudo tail -f /var/log/nginx/error.log

# Check Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### Issue 4: Timeout

**Symptoms:**
```
❌ Generation error
Error: timeout of 60000ms exceeded
```

**Solutions:**
```bash
# 1. Check Ollama is responding
ssh -i your-key.pem ubuntu@16.171.19.161
curl http://localhost:11434/api/tags

# 2. Check system resources
htop

# 3. Check Ollama logs
sudo journalctl -u ollama -f

# 4. Increase timeout in client code
# Python: timeout=120
# JavaScript: timeout: 120000
```

---

### Issue 5: Model Not Found

**Symptoms:**
```
Error: model 'llama3' not found
```

**Solutions:**
```bash
# SSH to server
ssh -i your-key.pem ubuntu@16.171.19.161

# List models
ollama list

# Pull model if missing
ollama pull llama3

# Verify
ollama list
```

---

## 🔍 Diagnostic Commands

### On Ollama Server (SSH):

```bash
# Check Ollama service
sudo systemctl status ollama

# Check Nginx service
sudo systemctl status nginx

# Check listening ports
sudo netstat -tulpn | grep -E ':(80|11434)'

# Check Ollama logs
sudo journalctl -u ollama -n 50

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Test Ollama locally
curl http://localhost:11434/api/tags

# Test Nginx locally
curl -u bipul:Bipul\$Ollama\$Roy\$2026\$ http://localhost/api/tags

# Check system resources
htop
free -h
df -h

# Check active connections
sudo netstat -an | grep :11434 | wc -l
```

---

## 📊 Performance Testing

### Test Response Time

```bash
# Python script
time python -c "
import requests
import base64

auth = 'Basic ' + base64.b64encode(b'bipul:Bipul\$Ollama\$Roy\$2026\$').decode()
response = requests.post(
    'http://16.171.19.161/api/generate',
    headers={'Authorization': auth, 'Content-Type': 'application/json'},
    json={'model': 'llama3', 'prompt': 'Hello', 'stream': False}
)
print(response.json()['response'])
"
```

### Load Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test with 10 concurrent requests
ab -n 10 -c 2 -A bipul:Bipul\$Ollama\$Roy\$2026\$ \
  -p post_data.json -T application/json \
  http://16.171.19.161/api/generate

# post_data.json:
{
  "model": "llama3",
  "prompt": "Hello",
  "stream": false
}
```

---

## ✅ Success Criteria

Your Ollama server is working correctly if:

- [ ] Server status check returns 200 OK
- [ ] Available models list includes "llama3"
- [ ] Simple generation returns valid response
- [ ] Bangla prompts work correctly
- [ ] Response time < 30 seconds for short prompts
- [ ] No authentication errors
- [ ] No timeout errors
- [ ] React app can connect and chat

---

## 🎯 Next Steps After Successful Test

1. **Document the setup** - Save credentials securely
2. **Set up monitoring** - CloudWatch or custom monitoring
3. **Configure backups** - EC2 snapshots
4. **Optimize performance** - Tune Ollama settings
5. **Add more models** - Download additional models
6. **Set up HTTPS** - Use Let's Encrypt
7. **Configure auto-scaling** - For high load

---

## 📞 Quick Reference

**Test Command (One-liner):**
```bash
curl -u bipul:Bipul\$Ollama\$Roy\$2026\$ http://16.171.19.161/api/tags
```

**Expected Response:**
```json
{
  "models": [
    {
      "name": "llama3",
      "modified_at": "2024-01-01T00:00:00Z",
      "size": 4661224676,
      "digest": "..."
    }
  ]
}
```

---

**Run the test scripts now to verify your Ollama server is working!** 🚀
