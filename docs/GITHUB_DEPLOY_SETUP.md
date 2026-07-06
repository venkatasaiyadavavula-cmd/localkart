# GitHub Actions Auto-Deploy Setup

`main` branch ki push ayyaka production server (DigitalOcean) automatic ga deploy avutundi.

---

## One-time setup (15 minutes)

### Step 1: Deploy SSH key generate cheyandi

**Mee laptop PowerShell / Terminal lo** (server lo kadu):

```bash
ssh-keygen -t ed25519 -C "github-actions-localkart-deploy" -f ~/.ssh/localkart_deploy -N ""
```

Rendu files create avtayi:
- `~/.ssh/localkart_deploy` — **private key** (GitHub Secret lo pettali)
- `~/.ssh/localkart_deploy.pub` — **public key** (server lo pettali)

Public key chudandi:
```bash
cat ~/.ssh/localkart_deploy.pub
```

---

### Step 2: Public key server lo add cheyandi

Server ki login:
```bash
ssh root@159.89.160.94
```

Server lo run cheyandi (public key paste cheyandi):
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the .pub key line, save (Ctrl+O, Enter, Ctrl+X)
chmod 600 ~/.ssh/authorized_keys
```

Test — **mee laptop nunchi** (password adagakunda login avvali):
```bash
ssh -i ~/.ssh/localkart_deploy root@159.89.160.94 "echo OK && hostname"
```

`OK` vasthe success.

---

### Step 3: GitHub Secrets add cheyandi

GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret name | Value |
|-------------|-------|
| `DEPLOY_HOST` | `159.89.160.94` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | `~/.ssh/localkart_deploy` file **full content** (private key) |
| `DEPLOY_PORT` | `22` (optional) |
| `DEPLOY_PATH` | `/root/localkart` (optional — default `~/localkart`) |

**Private key copy:**
```bash
cat ~/.ssh/localkart_deploy
```
Mottam copy chesi `DEPLOY_SSH_KEY` secret lo paste cheyandi (`-----BEGIN...` nunchi `-----END...` varaku).

---

### Step 4: GitHub Environment (optional but recommended)

Repo → **Settings** → **Environments** → **New environment** → name: `production`

Ikkada deploy approval add cheyochu (manual approve tarvata deploy).

Workflow already `environment: production` use chestundi.

---

### Step 5: Server lo deploy script executable

Server lo okasari:
```bash
cd ~/localkart
git pull origin main
chmod +x scripts/deploy-server.sh
```

---

## Deploy ela trigger avutundi

1. **Automatic** — `main` branch ki merge/push ayyaka
2. **Manual** — GitHub → **Actions** → **Deploy** → **Run workflow**

---

## Deploy script emi chestundi

`scripts/deploy-server.sh`:
1. `git pull` (hard reset to `origin/main`)
2. Backend: `npm ci` → `build` → `migration:run`
3. Frontend: `npm ci` → `build`
4. `pm2 restart localkart-backend localkart-frontend`

**Note:** Server `.env` / `.env.local` files touch cheyadu — Razorpay keys alage untayi.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Permission denied (publickey)` | Step 2 public key correct ga add chesara check |
| `git pull` fails on server | Server lo git credentials / repo path verify |
| `migration:run` fails | `pm2 logs localkart-backend` chudandi |
| Frontend build fails | `frontend/.env.local` lo `NEXT_PUBLIC_API_URL` unda check |
| Deploy OK but site broken | `pm2 logs` + `bash scripts/qa-smoke.sh` |

---

## Security notes

- Deploy key **password empty** unte GitHub Actions lo easy ga use avutundi
- Private key **evariki share cheyakandi** — GitHub Secrets lo matrame
- Live server ki root access undi — future lo separate `deploy` user create cheyochu
