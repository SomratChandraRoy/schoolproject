# Kubernetes Deploy + Health Check Command Runbook (বাংলা)

এই গাইডটি আপনার DOKS (DigitalOcean Kubernetes) ক্লাস্টারের জন্য।
লক্ষ্য: কোথায় কমান্ড চালাবেন, কোন কমান্ড কেন লাগবে, কীভাবে পুরো health যাচাই করবেন, এবং সমস্যা হলে কী করবেন।

## 1) কমান্ড কোথায় চালাবেন

- লোকাল মেশিনের PowerShell বা CMD থেকে চালাবেন।
- Project root folder: `E:\schoolproject`
- এই root এ দাঁড়িয়ে `kubectl apply -k k8s` চালালে `k8s/kustomization.yaml` থেকে সব manifest apply হবে।

PowerShell:

```powershell
Set-Location E:\schoolproject
```

CMD:

```cmd
cd /d E:\schoolproject
```

## 2) একবারের প্রাথমিক সেটআপ (One-Time)

| Command | কী কাজ করে | কেন দরকার |
|---|---|---|
| `kubectl version --client` | kubectl আছে কি না চেক | kubectl ছাড়া ক্লাস্টার কমান্ড চালবে না |
| `doctl version` | DigitalOcean CLI আছে কি না চেক | DOKS kubeconfig আনতে doctl লাগে |
| `doctl auth init -t YOUR_DIGITALOCEAN_TOKEN` | DO account auth | ক্লাস্টার/registry access পেতে |
| `doctl kubernetes cluster list` | cluster list দেখায় | exact cluster name নিশ্চিত করতে |
| `doctl kubernetes cluster kubeconfig save --expiry-seconds 1200 YOUR_CLUSTER_NAME` | kubeconfig context সেট করে | kubectl কে সঠিক DOKS cluster এর সাথে যুক্ত করতে |
| `kubectl config current-context` | active context দেখায় | ভুল cluster এ deploy আটকাতে |
| `kubectl get nodes -o wide` | node status দেখায় | node ready কিনা বুঝতে |

## 3) Deploy এর আগে Safe Pre-Check

| Command | কী কাজ করে | কেন দরকার |
|---|---|---|
| `Test-Path .\k8s\kustomization.yaml` (PowerShell) | kustomize root file আছে কি না | ভুল path থেকে apply করা ঠেকাতে |
| `kubectl diff -k k8s` | apply দিলে কী change হবে দেখায় | production-এ blind apply না করতে |
| `kubectl apply -k k8s --dry-run=client` | local validation | YAML/manifest syntax error আগে ধরতে |
| `kubectl get ns` | namespace list | target namespace (`schoolproject`) আছে কি না নিশ্চিত করতে |

## 4) Main Deploy Commands (Manual)

| Command | কী কাজ করে | কেন দরকার |
|---|---|---|
| `kubectl apply -k k8s` | সব manifest apply | আপনার main deployment command |
| `kubectl -n schoolproject rollout status deployment/postgres --timeout=600s` | postgres ready অপেক্ষা | DB ready না হলে app ঠিকমতো উঠবে না |
| `kubectl -n schoolproject rollout status deployment/redis --timeout=600s` | redis ready অপেক্ষা | cache/queue readiness নিশ্চিত করতে |
| `kubectl -n schoolproject rollout status deployment/web --timeout=600s` | web deployment ready অপেক্ষা | backend+nginx healthy হয়েছে কি না নিশ্চিত করতে |

## 5) Full Health Check (Required)

### 5.1 Cluster Health

| Command | কী দেখবেন | Healthy হলে কী দেখায় |
|---|---|---|
| `kubectl cluster-info` | control plane reachable কি না | control plane URL respond করে |
| `kubectl get nodes` | সব node ready কি না | সব node `Ready` |
| `kubectl get nodes -o wide` | node details | Internal IP/OS/Version ঠিক |

### 5.2 Namespace + Workload Health

| Command | কী দেখবেন | Healthy হলে কী দেখায় |
|---|---|---|
| `kubectl -n schoolproject get deploy` | desired/available replicas | `AVAILABLE = DESIRED` |
| `kubectl -n schoolproject get pods -o wide` | pod phase/restarts | pod `Running`, restart কম/শূন্য |
| `kubectl -n schoolproject get svc` | service expose status | web/postgres/redis/web-lb service উপস্থিত |
| `kubectl -n schoolproject get endpoints web` | service backend pod attach হয়েছে কি না | endpoints খালি না |
| `kubectl -n schoolproject get svc web-lb -o wide` | external load balancer status | `EXTERNAL-IP` populated |

### 5.3 Ingress + Domain + TLS Health

| Command | কী দেখবেন | Healthy হলে কী দেখায় |
|---|---|---|
| `kubectl -n schoolproject get ingress` | ingress address/host | ADDRESS populated, hosts ঠিক |
| `kubectl -n schoolproject describe ingress schoolproject` | rule/annotation/event | routing error নেই |
| `kubectl -n cert-manager get pods` | cert-manager চলছে কি না | pods `Running` |
| `kubectl get clusterissuer` | letsencrypt issuer আছে কি না | `letsencrypt-prod` present |
| `kubectl -n schoolproject get certificate` | cert ready কি না | `READY=True` |
| `kubectl -n schoolproject describe certificate schoolproject-tls` | cert failure reason | challenge error না |

### 5.4 Application Runtime Health

| Command | কী দেখবেন | কেন দরকার |
|---|---|---|
| `kubectl -n schoolproject logs deployment/web -c backend --tail=200` | backend runtime errors | Django/app exception ধরতে |
| `kubectl -n schoolproject logs deployment/web -c nginx --tail=200` | nginx upstream/proxy errors | 502/504/domain route issue ধরতে |
| `kubectl -n schoolproject get events --sort-by=.lastTimestamp` | latest warning/error | root cause দ্রুত ধরতে |

## 6) External Health Check (Domain থেকে)

> Windows PowerShell-এ `curl` alias থাকতে পারে, তাই `curl.exe` ব্যবহার করুন।

| Command | কী কাজ করে | কেন দরকার |
|---|---|---|
| `nslookup bipulroy.me` | DNS resolve ঠিক কি না | domain সঠিক IP তে point করছে কি না |
| `nslookup www.bipulroy.me` | www DNS resolve | www record ঠিক আছে কি না |
| `curl.exe -I https://bipulroy.me/` | HTTP headers check | site live + HTTPS respond করছে কি না |
| `curl.exe -I https://www.bipulroy.me/` | www endpoint check | redirect/SSL valid কি না |

## 7) Common Necessary Admin Commands

| Command | কী কাজ করে | কেন দরকার |
|---|---|---|
| `kubectl -n schoolproject describe pod POD_NAME` | pod level detail | CrashLoop/ImagePull root cause জানতে |
| `kubectl -n schoolproject logs POD_NAME -c backend --previous` | previous crashed container logs | crash এর আগের error ধরতে |
| `kubectl -n schoolproject rollout restart deployment/web` | web deployment restart | env/config change পরে নতুন pod তুলতে |
| `kubectl -n schoolproject rollout history deployment/web` | rollout revision history | rollback target বুঝতে |
| `kubectl -n schoolproject rollout undo deployment/web` | previous revision এ rollback | bad deploy থেকে দ্রুত recover করতে |
| `kubectl -n schoolproject get secret docr-auth` | image pull secret check | private DOCR image pull fail diagnose করতে |
| `kubectl -n schoolproject describe secret backend-secrets` | secret key-count verify | env secret sync হয়েছে কি না বুঝতে |

## 8) Frequent Problems + Quick Fix Commands

### সমস্যা: `ImagePullBackOff`

```powershell
kubectl -n schoolproject get secret docr-auth
kubectl -n schoolproject describe pod POD_NAME
```

কেন: image registry auth বা image tag সমস্যা ধরতে।

### সমস্যা: `CrashLoopBackOff`

```powershell
kubectl -n schoolproject logs POD_NAME -c backend --previous
kubectl -n schoolproject describe pod POD_NAME
kubectl -n schoolproject get events --sort-by=.lastTimestamp
```

কেন: startup error, env ভুল, DB connect issue দ্রুত identify করতে।

### সমস্যা: Domain open হচ্ছে না

```powershell
kubectl -n schoolproject get ingress
kubectl -n schoolproject describe ingress schoolproject
kubectl -n ingress-nginx get svc
nslookup bipulroy.me
```

কেন: ingress address, DNS, controller service mismatch ধরতে।

### সমস্যা: HTTPS certificate pending

```powershell
kubectl -n cert-manager get pods
kubectl get clusterissuer
kubectl -n schoolproject get certificate
kubectl -n schoolproject describe certificate schoolproject-tls
```

কেন: cert-manager বা ACME challenge issue diagnose করতে।

## 9) Daily Health Snapshot (একসাথে চালানোর জন্য)

```powershell
Set-Location E:\schoolproject
kubectl config current-context
kubectl get nodes
kubectl -n schoolproject get deploy
kubectl -n schoolproject get pods -o wide
kubectl -n schoolproject get svc
kubectl -n schoolproject get svc web-lb -o wide
kubectl -n schoolproject get ingress
kubectl -n schoolproject get certificate
kubectl -n schoolproject get events --sort-by=.lastTimestamp | Select-Object -Last 20
```

কেন: প্রতিদিন cluster + app + ingress + tls overall health দ্রুত বুঝতে।

## 10) GitHub Actions vs Manual Deploy

- Auto deploy (main push) workflow apply command: `.github/workflows/cd-doks.yml` এ `kubectl apply -k k8s` আছে।
- Manual deploy দরকার হয় যখন:
  - production hotfix তৎক্ষণাত দিতে হবে
  - workflow fail হলেও cluster manually recover করতে হবে
  - ingress/domain test সাথে সাথে করতে হবে

## 11) Final Healthy Checklist

সব কিছু ঠিক আছে ধরে নিন যদি নিচেরগুলো true হয়:

1. `kubectl get nodes` এ সব node `Ready`
2. `schoolproject` namespace এর deployments available
3. `web` service endpoints খালি না
4. `web-lb` service এ `EXTERNAL-IP` populated
5. ingress এ ADDRESS আছে এবং host rules ঠিক
6. certificate `READY=True`
7. backend/nginx logs এ critical continuous error নেই
8. domain URL (root + www) এ `curl.exe -I` এ valid HTTPS response আসে
