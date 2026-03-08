# VOXTREE Deployment Guide

This guide covers deploying the VOXTREE Project Management System using Docker Compose on a Linux VM and AWS ECS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Linux VM Deployment](#linux-vm-deployment)
3. [AWS ECS Deployment](#aws-ecs-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Management](#database-management)
6. [Monitoring and Logs](#monitoring-and-logs)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended for production)
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Software Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to apply docker group changes
```

## Linux VM Deployment

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/voxtree.git
cd voxtree

# Switch to production branch (if applicable)
git checkout main
```

### 2. Environment Configuration

```bash
# Copy environment template
cp infra/env.example infra/.env

# Edit environment variables
nano infra/.env
```

**Required Environment Variables:**

```env
# Database Configuration
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_DATABASE=voxtree
MYSQL_USER=voxtree
MYSQL_PASSWORD=your-secure-database-password

# JWT Configuration (Generate strong secrets)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters

# Email Configuration (Optional but recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Application URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

### 3. Deploy with Docker Compose

```bash
# Navigate to infra directory
cd infra

# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Database Setup

```bash
# Wait for MySQL to be ready
docker-compose exec mysql mysqladmin ping -h localhost

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed the database
docker-compose exec backend npm run prisma:seed
```

### 5. Verify Deployment

```bash
# Check health endpoints
curl http://localhost:3001/health  # Backend health
curl http://localhost:3000/health  # Frontend health

# Check all services
docker-compose ps
```

### 6. Configure Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/voxtree`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/voxtree /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## AWS ECS Deployment

### 1. Prerequisites

- AWS CLI configured
- ECR repositories created
- ECS cluster created
- RDS MySQL instance
- Application Load Balancer
- Route 53 domain (optional)

### 2. Build and Push Images

```bash
# Configure AWS CLI
aws configure

# Create ECR repositories
aws ecr create-repository --repository-name voxtree-backend
aws ecr create-repository --repository-name voxtree-frontend

# Get login token
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

# Build and push backend
cd backend
docker build -t voxtree-backend .
docker tag voxtree-backend:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/voxtree-backend:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/voxtree-backend:latest

# Build and push frontend
cd ../frontend
docker build -t voxtree-frontend .
docker tag voxtree-frontend:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/voxtree-frontend:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/voxtree-frontend:latest
```

### 3. Create Task Definitions

**Backend Task Definition** (`backend-task-definition.json`):

```json
{
  "family": "voxtree-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "voxtree-backend",
      "image": "<account-id>.dkr.ecr.us-west-2.amazonaws.com/voxtree-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "mysql://username:password@rds-endpoint:3306/voxtree"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-west-2:<account-id>:secret:voxtree/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/voxtree-backend",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**Frontend Task Definition** (`frontend-task-definition.json`):

```json
{
  "family": "voxtree-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "voxtree-frontend",
      "image": "<account-id>.dkr.ecr.us-west-2.amazonaws.com/voxtree-frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/voxtree-frontend",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 4. Create ECS Services

```bash
# Register task definitions
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json
aws ecs register-task-definition --cli-input-json file://frontend-task-definition.json

# Create services
aws ecs create-service \
  --cluster voxtree-cluster \
  --service-name voxtree-backend \
  --task-definition voxtree-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345,subnet-67890],securityGroups=[sg-12345],assignPublicIp=ENABLED}"

aws ecs create-service \
  --cluster voxtree-cluster \
  --service-name voxtree-frontend \
  --task-definition voxtree-frontend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345,subnet-67890],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

### 5. Configure Load Balancer

```bash
# Create target groups
aws elbv2 create-target-group \
  --name voxtree-backend-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-12345 \
  --target-type ip \
  --health-check-path /health

aws elbv2 create-target-group \
  --name voxtree-frontend-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-12345 \
  --target-type ip \
  --health-check-path /health

# Create load balancer listeners
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-west-2:<account-id>:loadbalancer/app/voxtree-alb/12345 \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-west-2:<account-id>:certificate/12345 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-west-2:<account-id>:targetgroup/voxtree-frontend-tg/12345
```

## Environment Configuration

### Production Environment Variables

```env
# Database (Use RDS for production)
DATABASE_URL=mysql://username:password@rds-endpoint:3306/voxtree

# JWT Secrets (Use AWS Secrets Manager)
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com

# Application URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Security
NODE_ENV=production
```

### AWS Secrets Manager

```bash
# Store JWT secrets
aws secretsmanager create-secret \
  --name voxtree/jwt-secret \
  --description "JWT secret for VOXTREE" \
  --secret-string "your-super-secret-jwt-key"

aws secretsmanager create-secret \
  --name voxtree/jwt-refresh-secret \
  --description "JWT refresh secret for VOXTREE" \
  --secret-string "your-super-secret-refresh-key"
```

## Database Management

### Backup Database

```bash
# Create backup
docker-compose exec mysql mysqldump -u root -p voxtree > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker-compose exec -T mysql mysql -u root -p voxtree < backup_file.sql
```

### Database Migrations

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Reset database (development only)
docker-compose exec backend npx prisma migrate reset
```

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# AWS ECS logs
aws logs describe-log-groups
aws logs get-log-events --log-group-name /ecs/voxtree-backend --log-stream-name ecs/voxtree-backend/task-id
```

### Health Monitoring

```bash
# Check service health
curl http://localhost:3001/health
curl http://localhost:3000/health

# Database health
docker-compose exec mysql mysqladmin ping -h localhost
```

### Performance Monitoring

```bash
# Container stats
docker stats

# Resource usage
docker-compose top
```

## Troubleshooting

### Common Issues

**1. Database Connection Issues**

```bash
# Check MySQL logs
docker-compose logs mysql

# Test connection
docker-compose exec backend npx prisma db pull
```

**2. Frontend Not Loading**

```bash
# Check nginx configuration
docker-compose exec frontend nginx -t

# Check frontend logs
docker-compose logs frontend
```

**3. Backend API Errors**

```bash
# Check backend logs
docker-compose logs backend

# Test API endpoints
curl http://localhost:3001/api/health
```

**4. SSL Certificate Issues**

```bash
# Check certificate validity
openssl x509 -in certificate.crt -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443
```

### Performance Optimization

**1. Database Optimization**

```sql
-- Add indexes for better performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_time_entries_user_date ON time_entries(userId, startTime);
CREATE INDEX idx_invoices_status ON invoices(status);
```

**2. Application Optimization**

```bash
# Enable gzip compression
# Already configured in nginx.conf

# Optimize Docker images
docker system prune -a
```

**3. Monitoring Setup**

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor system resources
htop
iotop
```

### Security Considerations

1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Enable SSL/TLS**
4. **Configure firewall rules**
5. **Regular security updates**
6. **Database access restrictions**
7. **API rate limiting**
8. **Input validation**

### Backup Strategy

1. **Database backups** (daily)
2. **Application data backups** (daily)
3. **Configuration backups** (weekly)
4. **Disaster recovery plan**

---

## Support

For deployment issues or questions:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Test health endpoints
4. Review this documentation
5. Contact the development team

**Happy Deploying! 🚀**
