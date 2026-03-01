# Weekly Life Planner

A personal weekly planner with password login, persistent SQLite database, and Docker deployment.

---

## Stack

- **Frontend** — Vanilla HTML/CSS/JS (dark theme)
- **Backend** — Node.js + Express
- **Database** — SQLite (via `better-sqlite3`), stored in a Docker volume
- **Auth** — Password login → JWT token

---

## Run with Docker (Recommended)

### 1. Install Docker & Docker Compose
- https://docs.docker.com/get-docker/

### 2. Clone / copy this project folder

### 3. (Optional) Change your password
Edit `docker-compose.yml` and update `APP_PASSWORD`:
```yaml
environment:
  - APP_PASSWORD=your-new-password
  - JWT_SECRET=some-long-random-secret-string
```

### 4. Build and start
```bash
docker compose up -d --build
```

### 5. Open in browser
```
http://localhost:3000
```

### Stop
```bash
docker compose down
```

### View logs
```bash
docker compose logs -f
```

---

## Deploy to a VPS / Server

1. Copy the project folder to your server (via `scp` or `git`)
2. Install Docker on the server
3. Run `docker compose up -d --build`
4. Point your domain to the server IP
5. (Recommended) Put Nginx in front as a reverse proxy with SSL

### Example Nginx config
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then add SSL with Let's Encrypt:
```bash
certbot --nginx -d yourdomain.com
```

---

## Data Persistence

SQLite database is stored in a Docker named volume (`planner-data`).  
Data **survives** container restarts and updates.

To backup the database:
```bash
docker run --rm -v weekly-planner_planner-data:/data -v $(pwd):/backup alpine \
  cp /data/planner.db /backup/planner-backup.db
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `APP_PASSWORD` | `rizkyr117h` | Login password |
| `JWT_SECRET` | `weekly-planner-secret-...` | JWT signing secret (change in prod!) |

---

## Project Structure

```
weekly-planner/
├── Dockerfile
├── docker-compose.yml
├── README.md
├── backend/
│   ├── package.json
│   └── server.js        ← Express API + SQLite
└── frontend/
    └── index.html       ← Full SPA
```
