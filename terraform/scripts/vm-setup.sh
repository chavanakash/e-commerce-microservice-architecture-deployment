#!/bin/bash

#############################################
# Azure VM Setup Script for Microservices
# This script completes the installation that
# init.sh failed to finish
#############################################

set -e  # Exit on error

echo "=========================================="
echo "Starting Azure VM Setup..."
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

#############################################
# Step 1: Add azureuser to docker group
#############################################
print_info "Step 1: Adding azureuser to docker group..."
sudo usermod -aG docker azureuser
print_success "azureuser added to docker group"
echo ""

#############################################
# Step 2: Install Docker Compose
#############################################
print_info "Step 2: Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
print_success "Docker Compose installed: $(docker-compose --version)"
echo ""

#############################################
# Step 3: Install Git
#############################################
print_info "Step 3: Installing Git..."
sudo apt-get install -y git > /dev/null 2>&1
print_success "Git installed: $(git --version)"
echo ""

#############################################
# Step 4: Install Java
#############################################
print_info "Step 4: Installing Java (OpenJDK 11)..."
sudo apt-get install -y openjdk-11-jdk > /dev/null 2>&1
print_success "Java installed: $(java -version 2>&1 | head -n 1)"
echo ""

#############################################
# Step 5: Install Jenkins
#############################################
print_info "Step 5: Installing Jenkins..."

# Add Jenkins repository key
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

# Add Jenkins repository
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Update apt and install Jenkins
sudo apt-get update > /dev/null 2>&1
sudo apt-get install -y jenkins > /dev/null 2>&1

print_success "Jenkins installed"
echo ""

#############################################
# Step 6: Start Jenkins
#############################################
print_info "Step 6: Starting Jenkins service..."
sudo systemctl start jenkins
sudo systemctl enable jenkins
sleep 5  # Wait for Jenkins to start

if sudo systemctl is-active --quiet jenkins; then
    print_success "Jenkins is running"
else
    print_error "Jenkins failed to start"
    exit 1
fi
echo ""

#############################################
# Step 7: Add jenkins to docker group
#############################################
print_info "Step 7: Adding jenkins user to docker group..."
sudo usermod -aG docker jenkins
print_success "jenkins added to docker group"
echo ""

#############################################
# Step 8: Create monitoring directory
#############################################
print_info "Step 8: Creating monitoring directory..."
mkdir -p ~/monitoring
cd ~/monitoring
print_success "Monitoring directory created: ~/monitoring"
echo ""

#############################################
# Step 9: Create Prometheus configuration
#############################################
print_info "Step 9: Creating Prometheus configuration..."
cat > prometheus.yml <<'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'product-service'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'

  - job_name: 'order-service'
    static_configs:
      - targets: ['localhost:3002']
    metrics_path: '/metrics'

  - job_name: 'user-service'
    static_configs:
      - targets: ['localhost:3003']
    metrics_path: '/metrics'
EOF
print_success "Prometheus config created"
echo ""

#############################################
# Step 10: Create Docker Compose for monitoring
#############################################
print_info "Step 10: Creating docker-compose for monitoring..."
cat > docker-compose-monitoring.yml <<'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3100:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - prometheus

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
EOF
print_success "Docker Compose config created"
echo ""

#############################################
# Step 11: Start monitoring stack
#############################################
print_info "Step 11: Starting monitoring stack (Prometheus & Grafana)..."
sudo docker-compose -f docker-compose-monitoring.yml up -d

# Wait for containers to start
sleep 10

# Check if containers are running
if sudo docker ps | grep -q prometheus && sudo docker ps | grep -q grafana; then
    print_success "Monitoring stack is running"
else
    print_error "Failed to start monitoring stack"
    sudo docker-compose -f docker-compose-monitoring.yml logs
    exit 1
fi
echo ""

#############################################
# Final verification
#############################################
print_info "Verifying installation..."
echo ""

# Docker version
echo "Docker version:"
docker --version
echo ""

# Docker Compose version
echo "Docker Compose version:"
docker-compose --version
echo ""

# Git version
echo "Git version:"
git --version
echo ""

# Java version
echo "Java version:"
java -version 2>&1 | head -n 1
echo ""

# Jenkins status
echo "Jenkins status:"
sudo systemctl status jenkins --no-pager | grep Active
echo ""

# Docker containers
echo "Running Docker containers:"
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

#############################################
# Display important information
#############################################
echo ""
echo "=========================================="
echo "✓ Installation Complete!"
echo "=========================================="
echo ""
echo "📋 Important Information:"
echo ""
echo "Jenkins:"
echo "  URL: http://$(curl -s ifconfig.me):8080"
echo "  Initial Admin Password:"
if [ -f /var/lib/jenkins/secrets/initialAdminPassword ]; then
    echo "  $(sudo cat /var/lib/jenkins/secrets/initialAdminPassword)"
else
    echo "  Password file not found yet. Wait 1-2 minutes and run:"
    echo "  sudo cat /var/lib/jenkins/secrets/initialAdminPassword"
fi
echo ""
echo "Prometheus:"
echo "  URL: http://$(curl -s ifconfig.me):9090"
echo ""
echo "Grafana:"
echo "  URL: http://$(curl -s ifconfig.me):3100"
echo "  Username: admin"
echo "  Password: admin"
echo ""
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: Logout and login again to apply docker group changes"
echo ""
echo "Run these commands:"
echo "  exit"
echo "  ssh azureuser@<VM_IP>"
echo ""
echo "After re-login, you can use docker without sudo!"
echo ""
echo "=========================================="
echo ""

# Return to home directory
cd ~

print_success "Setup script completed successfully!"
echo ""