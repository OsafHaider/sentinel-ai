# Deployment Guide

## Table of Contents
1. [Local Development](#local-development)
2. [Docker Compose (Recommended)](#docker-compose-recommended)
3. [Environment Configuration](#environment-configuration)
4. [MongoDB Setup](#mongodb-setup)
5. [Troubleshooting](#troubleshooting)
6. [Health Checks](#health-checks)

---

## Local Development

### Prerequisites
```bash
Node.js 18+
Python 3.11+
Redis 7.0+
MongoDB (or Atlas account)
Groq API Key (free)
```

### Step 1: Setup Python Environment

```bash
cd sentinel-ai
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r sentinel-worker/requirements.txt
```

### Step 2: Setup Node Environments

```bash
# Gateway
cd sentinel-gateway
npm install

# Scripts (benchmarking)
cd ../scripts
npm install
```

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
```
GROQ_API_KEY=gsk_xxxxxxx
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/sentinel_db
REDIS_URL=redis://localhost:6379
```

### Step 4: Start Services

**Terminal 1: Redis**
```bash
redis-server --port 6379
```

**Terminal 2: Python Worker**
```bash
cd sentinel-worker
python -m src.worker
```

**Terminal 3: Node.js Gateway**
```bash
cd sentinel-gateway
npm run dev
```

**Terminal 4: Test**
```bash
cd scripts
npm run test:sentinel
```

---

## Docker Compose (Recommended)

### Why Docker?
✅ No local dependency management  
✅ Reproducible environment  
✅ Easy to scale  
✅ Production-like setup locally  

### Quick Start

```bash
cd sentinel-ai

# Start all services
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f
```

### Service Status

```bash
# Check Gateway health
curl http://localhost:8008/health

# Check Redis
curl http://localhost:8001  # Redis Commander

# View Worker logs
docker-compose logs sentinel-worker

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Environment Configuration

### Required Variables

```bash
# .env or environment variables

# Groq API
GROQ_API_KEY=your_groq_key_here
# Get free: https://console.groq.com

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGO_DB_NAME=sentinel_db (optional, default: sentinel_db)

# Redis
REDIS_URL=redis://localhost:6379

# Gateway
PORT=8008 (default)
NODE_ENV=production or development

# Worker
PYTHONUNBUFFERED=1 (recommended for Docker)
```

### Optional Variables

```bash
# Gateway webhook URL for worker callback
GATEWAY_WEBHOOK_URL=http://localhost:8008/api/v1/chat/webhook/result

# Rate limiting
RATE_LIMIT_WINDOW=60 (seconds)
RATE_LIMIT_MAX=30 (requests per window)

# Caching
CACHE_TTL=86400 (seconds, default 24 hours)
CACHE_SIMILARITY_THRESHOLD=0.75 (0-1.0)

# Monitoring
STATS_ENABLED=true
STATS_INTERVAL=60000 (milliseconds)
```

---

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended - Free)

1. **Create Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create free account
   - Create free tier cluster

2. **Create Database**
   - Database name: `sentinel_db`
   - Create collection: `knowledge_base`

3. **Create Vector Index**

   In MongoDB Atlas UI → Collections → knowledge_base → Search:

   ```json
   {
     "indexName": "vector_index",
     "mappings": {
       "fields": {
         "embedding": {
           "dimensions": 384,
           "similarity": "cosine",
           "type": "vector"
         },
         "text": {
           "type": "string"
         },
         "source": {
           "type": "string"
         },
         "tenant_id": {
           "type": "string"
         }
       }
     }
   }
   ```

4. **Get Connection String**
   - Cluster → Connect → Drivers
   - Copy URI: `mongodb+srv://user:pass@cluster.mongodb.net/sentinel_db`

### Option 2: Local MongoDB

```bash
# Install
brew install mongodb-community  # macOS
# or download from mongodb.com/try/download/community

# Start service
brew services start mongodb-community

# Verify
mongosh
> use sentinel_db
> db.createCollection("knowledge_base")
```

### Sample Data (Optional)

```bash
# Insert sample documents
mongosh
> use sentinel_db
> db.knowledge_base.insertMany([
    {
      "_id": ObjectId(),
      "text": "Machine learning is a subset of AI...",
      "embedding": [0.1, 0.2, ..., 0.9],  // 384 dimensions
      "source": "wiki",
      "tenant_id": "global"
    }
  ])
```

---

## Health Checks

### Manual Health Verification

```bash
# 1. Check Gateway
curl http://localhost:8008/api/v1/stats

Expected response:
{
  "cache_hits": 0,
  "cache_misses": 0,
  "hit_rate": "0%",
  "avg_latency_ms": 0,
  "status": "healthy"
}

# 2. Check Redis
redis-cli ping
# Should output: PONG

# 3. Check MongoDB
mongosh --eval "db.adminCommand('ping')"
# Should output: { ok: 1 }

# 4. Check Worker
docker-compose logs sentinel-worker | grep "🛡️ Sentinel Worker is live"
# Should show: worker listening on redis://sentinel-redis:6379
```

### Automated Health Checks

Docker Compose includes health checks:

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5
```

---

## Troubleshooting

### Issue: Redis Connection Refused

```
Error: Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**:
```bash
# Check if Redis is running
redis-cli ping

# If not running:
redis-server  # macOS/Linux

# For Docker:
docker-compose up redis
```

### Issue: MongoDB Connection Error

```
Error: MongoServerError: authentication failed
```

**Solution**:
```bash
# Verify connection string format:
mongodb+srv://user:password@cluster.mongodb.net/database

# Check:
- Username and password correct
- IP whitelist includes your IP (Atlas → Network Access)
- Database name spelled correctly
```

### Issue: Groq API Rate Limit

```
Error: RateLimitError: 429 Too Many Requests
```

**Solution**:
```bash
# This is normal! Sentinel handles it with:
# 1. Python Semaphore (1 at a time)
# 2. Redis Sliding Window throttling
# 3. Exponential backoff retry

# Check logs for "retrying after X seconds"
docker-compose logs sentinel-worker | grep -i retry
```

### Issue: Worker Not Processing Tasks

```
Worker logs show: "Ready to process and hydrate..." but no tasks being picked up
```

**Debug steps**:
```bash
# 1. Check BullMQ queue
redis-cli
> KEYS *chat-tasks*
# Should show queue keys

# 2. Check queue length
> LLEN bull:chat-tasks:active
> LLEN bull:chat-tasks:wait

# 3. Send test task
curl -X POST http://localhost:8008/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "embedding": [0.1, 0.2, ...], "userId": "test"}'

# 4. Watch worker logs
docker-compose logs -f sentinel-worker
```

### Issue: Cache Not Hitting

```
All queries hitting the API (cache_hits = 0)
```

**Possible causes**:
1. **Similarity threshold too high**: Reduce from 0.75 → 0.70
2. **Cache TTL expired**: Check CACHE_TTL value
3. **Different embedding models**: Ensure same model on query and cache
4. **Query too different**: Test with identical queries

**Debug**:
```bash
# Check Redis cache contents
redis-cli
> KEYS cache:*
# Should show cached entries

# Check cache entry
> GET cache:global:abc123
# Should return JSON with vector and value
```

### Issue: Docker Compose Port Already in Use

```
Error: bind: address already in use
```

**Solution**:
```bash
# Option 1: Stop conflicting service
lsof -i :8008
kill -9 <PID>

# Option 2: Use different port
# Edit docker-compose.yaml:
# ports:
#   - "8009:8008"  # Changed from 8008

# Option 3: Use Docker without mapping
docker-compose up
# Access via container IP instead
```

### Issue: Out of Memory in Docker

```
Error: OOMKilled (exit code 137)
```

**Solution**:
```bash
# Increase Docker memory limit
# Docker Desktop: Preferences → Resources → Memory: 4GB+

# For specific service:
docker-compose up -m 2g  # 2GB limit
```

---

## Performance Tuning

### Optimize for Throughput

```yaml
# docker-compose.yaml
sentinel-worker:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2048M
      reservations:
        cpus: '1'
        memory: 1024M
```

### Optimize for Latency

```env
# .env
CACHE_SIMILARITY_THRESHOLD=0.80  # More strict = fewer false hits
CACHE_TTL=604800  # 7 days instead of 24 hours
RATE_LIMIT_MAX=40  # Up from 30 for shorter queue times
```

### Optimize for Cost

```env
# .env
CACHE_SIMILARITY_THRESHOLD=0.70  # More lenient = more cache hits
PROACTIVE_HYDRATION=true  # Generate questions upfront
```

---

## Monitoring in Production

### Prometheus Metrics (Future)

```bash
# Not yet implemented, but planned:
curl http://localhost:8008/metrics
# Prometheus-compatible metrics
```

### Log Aggregation

```bash
# Send all logs to ELK/Datadog
docker-compose logs sentinel-gateway > /var/log/sentinel-gateway.log
docker-compose logs sentinel-worker > /var/log/sentinel-worker.log
```

### Uptime Monitoring

```bash
# Health check endpoint
curl -f http://localhost:8008/api/v1/stats || exit 1

# Add to crontab for regular checks
* * * * * curl -f http://localhost:8008/api/v1/stats || notify-admin
```

---

## Deployment Checklist

- [ ] Environment variables configured (.env file)
- [ ] MongoDB Atlas vector index created
- [ ] Redis running and accessible
- [ ] Groq API key valid
- [ ] Docker images built
- [ ] Health checks passing
- [ ] Sample queries working
- [ ] Logs being captured
- [ ] Monitoring setup complete
- [ ] Backup strategy in place

---

## Next Steps

1. **Local Testing**: Run stress tests
   ```bash
   npm run test:sentinel
   ```

2. **Production Deployment**: Kubernetes (coming soon)
   ```bash
   kubectl apply -f k8s/
   ```

3. **Enable Monitoring**: Setup Prometheus/Grafana
4. **Configure Auto-scaling**: Based on queue depth

---

**Last Updated**: May 2026  
**Support**: Check GitHub Issues for common problems
