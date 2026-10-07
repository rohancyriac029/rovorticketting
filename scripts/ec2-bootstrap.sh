#!/usr/bin/env bash
# Idempotent one-time setup for a fresh Ubuntu 24.04 EC2 instance.
set -euo pipefail

echo "==> Updating system packages"
sudo apt-get update -y
sudo apt-get upgrade -y

if ! command -v docker &> /dev/null; then
  echo "==> Installing Docker Engine + Compose plugin"
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  echo "==> Docker already installed, skipping"
fi

if ! groups "$USER" | grep -q docker; then
  echo "==> Adding $USER to docker group (re-login required)"
  sudo usermod -aG docker "$USER"
fi

if [ ! -f /swapfile ]; then
  echo "==> Creating 2GB swapfile (prevents OOM during Docker builds on small instances)"
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
else
  echo "==> Swapfile already exists, skipping"
fi

echo "==> Enabling unattended-upgrades"
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> Bootstrap complete. Log out and back in for the docker group to take effect."
