# 🚀 AWS EC2-তে Ollama Setup করা - সম্পূর্ণ গাইড (বাংলা)

## 📖 সূচিপত্র
1. [AWS EC2 Instance তৈরি করা](#ধাপ-১-aws-ec2-instance-তৈরি-করা)
2. [Ollama Install করা](#ধাপ-২-ollama-install-করা)
3. [External Access Configure করা](#ধাপ-৩-external-access-configure-করা)
4. [React App থেকে ব্যবহার করা](#ধাপ-৪-react-app-থেকে-ব্যবহার-করা)
5. [Security Setup](#ধাপ-৫-security-setup)
6. [Cost Optimization](#ধাপ-৬-cost-optimization)

---

## ধাপ ১: AWS EC2 Instance তৈরি করা

### ১.১ AWS Console-এ Login করুন
```
https://console.aws.amazon.com/
```

### ১.২ EC2 Instance Launch করুন

1. **EC2 Dashboard** → **Launch Instance** button-এ click করুন

2. **Name and tags:**
   ```
   Name: ollama-server
   ```

3. **Application and OS Images (AMI):**
   - **Ubuntu Server 22.04 LTS** select করুন
   - ✅ "Free tier eligible" দেখুন

4. **Instance type:**
   - ⚠️ **Important:** `t2.medium` বা `t2.large` select করুন
   - `t2.micro` যথেষ্ট নয় (Ollama-র জন্য minimum 8GB RAM দরকার)
   - Free trial-এ 750 hours/month পাবেন

5. **Key pair (login):**
   - **Create new key pair** click করুন
   - Name: `ollama-key`
   - Key pair type: RSA
   - Private key file format: `.pem`
   - **Create key pair** → File download হবে (এটি সংরক্ষণ করুন!)

6. **Network settings:**
   - **Edit** button click করুন
   - **Add security group rule:**
     - Type: SSH
     - Port: 22
     - Source: My IP (আপনার IP automatically select হবে)
   - **Add security group rule** (আরেকটি):
     - Type: Custom TCP
     - Port: 11434
     - Source: Anywhere (0.0.0.0/0)

7. **Configure storage:**
   - Size: **30 GiB** (minimum)
   - Volume type: gp3

8. **Launch instance** button click করুন

### ১.৩ Instance-র Public IP নোট করুন

1. EC2 Dashboard → Instances
2. আপনার instance select করুন
3. **Public IPv4 address** copy করুন (Example: `54.123.45.67`)

---

## ধাপ ২: Ollama Install করা

### ২.১ Instance-এ SSH Connect করুন

**Windows (PowerShell/CMD):**
```bash
# Key file-র permission ঠিক করুন (PowerShell-এ):
icacls "ollama-key.pem" /inheritance:r
icacls "ollama-key.pem" /grant:r "%username%:R"

# SSH connect করুন:
ssh -i "ollama-key.pem" ubuntu@54.123.45.67
```

**Linux/Mac:**
```bash
# Key file-র permission ঠিক করুন:
chmod 400 ollama-key.pem

# SSH connect করুন:
ssh -i ollama-key.pem ubuntu@54.123.45.67
```

### ২.২ Automated Setup Script ব্যবহার করুন

Instance-এ connect হওয়ার পর:

```bash
# Setup script download করুন
wget https://raw.githubusercontent.com/your-repo/aws-ollama-setup.sh

# অথবা manually create করুন:
nano setup.sh
# (আগের script-র content paste করুন)

# Executable করুন:
chmod +x setup.sh

# Run করুন:
./setup.sh
```

### ২.৩ Manual Setup (যদি script কাজ না করে)

```bash
# 1. System update
sudo apt update && sudo apt upgrade -y

# 2. Ollama install
curl -fsSL https://ollama.com/install.sh | sh

# 3. External access configure
sudo mkdir -p /etc/systemd/system/ollama.service.d
sudo tee /etc/systemd/system/ollama.service.d/override.conf > /dev/null <<EOF
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
EOF

# 4. Service restart
sudo systemctl daemon-reload
sudo systemctl restart ollama
sudo systemctl enable ollama

# 5. Status check
sudo systemctl status ollama

# 6. Model download (Llama 3.2 - 3B)
ollama pull llama3.2

# 7. Test
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello",
  "stream": false
}'
```

---

## ধাপ ৩: External Access Configure করা

### ৩.১ Security Group Update করুন

1. AWS Console → EC2 → Security Groups
2. আপনার instance-র security group select করুন
3. **Inbound rules** tab → **Edit inbound rules**
4. নিশ্চিত করুন এই rule আছে:
   ```
   Type: Custom TCP
   Port: 11434
   Source: 0.0.0.0/0 (Anywhere)
   ```
5. **Save rules**

### ৩.২ Test করুন (আপনার Local Computer থেকে)

```bash
# Windows PowerShell/CMD:
curl http://54.123.45.67:11434/api/generate -d "{\"model\":\"llama3.2\",\"prompt\":\"Hello\",\"stream\":false}"

# Linux/Mac:
curl http://54.123.45.67:11434/api/generate -d '{"model":"llama3.2","prompt":"Hello","stream":false}'
```

যদি response আসে, তাহলে সফল! ✅

---

## ধাপ ৪: React App থেকে ব্যবহার করা

### ৪.১ Environment Variable Setup

`.env` file তৈরি করুন:

```bash
cd S.P-by-Bipul-Roy/frontend/medhabangla
```

`.env` file create করুন:
```env
# আপনার AWS instance-র public IP দিন
REACT_APP_OLLAMA_URL=http://54.123.45.67:11434
```

### ৪.২ App.tsx-এ Route যোগ করুন

```typescript
// App.tsx-এ import করুন:
import Ollama from './pages/Ollama';

// Routes-এ যোগ করুন:
<Route path="/ollama" element={<Ollama />} />
```

### ৪.৩ Navbar-এ Link যোগ করুন

```typescript
// Navbar.tsx-এ navItems array-তে যোগ করুন:
{ name: 'AI Chat', path: '/ollama' },
```

### ৪.৪ Test করুন

```bash
# Dev server চালু করুন:
npm run dev

# Browser-এ যান:
http://localhost:5173/ollama
```

---

## ধাপ ৫: Security Setup

### ৫.১ Nginx Reverse Proxy (Optional কিন্তু Recommended)

```bash
# Instance-এ SSH করুন এবং:

# 1. Nginx install
sudo apt install nginx -y

# 2. Config file তৈরি করুন
sudo nano /etc/nginx/sites-available/ollama

# 3. এই content paste করুন:
server {
    listen 80;
    server_name your-domain.com;  # অথবা আপনার IP
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=ollama:10m rate=10r/s;
    
    location /api/ {
        limit_req zone=ollama burst=20;
        
        # Optional: API key check
        # if ($http_x_api_key != "your-secret-key") {
        #     return 401;
        # }
        
        proxy_pass http://localhost:11434/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Timeout settings
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}

# 4. Enable করুন:
sudo ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 5. Security Group-এ port 80 open করুন
```

### ৫.২ HTTPS Setup (Let's Encrypt)

```bash
# 1. Certbot install
sudo apt install certbot python3-certbot-nginx -y

# 2. Domain point করুন আপনার EC2 IP-তে

# 3. SSL certificate পান
sudo certbot --nginx -d your-domain.com

# 4. Auto-renewal test
sudo certbot renew --dry-run
```

### ৫.৩ API Key Protection

`.env` file-এ:
```env
REACT_APP_OLLAMA_URL=http://your-domain.com
REACT_APP_OLLAMA_API_KEY=your-secret-key-here
```

`ollamaService.ts`-এ:
```typescript
headers: {
  'Content-Type': 'application/json',
  'X-API-Key': process.env.REACT_APP_OLLAMA_API_KEY || '',
},
```

---

## ধাপ ৬: Cost Optimization

### ৬.১ Instance Schedule করুন

```bash
# Instance stop করুন যখন ব্যবহার করছেন না:
# AWS Console → EC2 → Instance → Actions → Stop instance

# Start করুন যখন দরকার:
# AWS Console → EC2 → Instance → Actions → Start instance
```

### ৬.২ Elastic IP ব্যবহার করুন

```bash
# Elastic IP allocate করুন:
1. EC2 → Elastic IPs → Allocate Elastic IP address
2. Actions → Associate Elastic IP address
3. আপনার instance select করুন
4. Associate

# এখন instance stop/start করলেও IP same থাকবে
```

### ৬.৩ CloudWatch Billing Alarm

```bash
1. CloudWatch → Alarms → Create alarm
2. Select metric → Billing → Total Estimated Charge
3. Threshold: $10 (বা আপনার limit)
4. Email notification setup করুন
5. Create alarm
```

### ৬.৪ Auto-Stop Script (Optional)

```bash
# Cron job setup করুন instance auto-stop করার জন্য:
crontab -e

# রাত 11 টায় stop (UTC time):
0 23 * * * aws ec2 stop-instances --instance-ids i-1234567890abcdef0
```

---

## 🎯 সম্পূর্ণ Workflow

```
1. AWS EC2 instance তৈরি করুন (t2.medium)
2. SSH connect করুন
3. Setup script run করুন
4. Model download করুন (llama3.2)
5. Security Group configure করুন (port 11434)
6. Local computer থেকে test করুন
7. React app-এ .env file setup করুন
8. /ollama route-এ যান
9. AI-র সাথে chat করুন! 🎉
```

---

## 🔧 Troubleshooting

### Problem: Connection refused

**Solution:**
```bash
# 1. Check if Ollama is running:
sudo systemctl status ollama

# 2. Check if port is open:
sudo netstat -tulpn | grep 11434

# 3. Check security group:
# AWS Console → EC2 → Security Groups → Inbound rules
```

### Problem: Model not found

**Solution:**
```bash
# List models:
ollama list

# Pull model:
ollama pull llama3.2
```

### Problem: Out of memory

**Solution:**
```bash
# Use smaller model:
ollama pull gemma2:2b

# Or upgrade instance to t2.large
```

---

## 📊 Available Models

| Model | Size | RAM Required | Speed | Quality |
|-------|------|--------------|-------|---------|
| gemma2:2b | 1.6GB | 4GB | ⚡⚡⚡ | ⭐⭐ |
| llama3.2 | 2GB | 8GB | ⚡⚡ | ⭐⭐⭐ |
| mistral | 4.1GB | 8GB | ⚡⚡ | ⭐⭐⭐⭐ |
| llama3.1 | 4.7GB | 8GB | ⚡ | ⭐⭐⭐⭐ |

---

## 💡 Pro Tips

1. **Model Selection:** ছোট model দিয়ে শুরু করুন (gemma2:2b)
2. **Monitoring:** `htop` install করুন resource usage দেখার জন্য
3. **Backup:** Important data backup রাখুন
4. **Updates:** Regular system update করুন
5. **Logs:** Logs check করুন: `sudo journalctl -u ollama -f`

---

## 📞 Support

যদি কোনো সমস্যা হয়:
1. Logs check করুন: `sudo journalctl -u ollama -f`
2. Status check করুন: `sudo systemctl status ollama`
3. Test করুন: `curl http://localhost:11434/api/tags`

---

**এখন আপনি যেকোনো জায়গা থেকে আপনার নিজের AI model ব্যবহার করতে পারবেন!** 🚀
