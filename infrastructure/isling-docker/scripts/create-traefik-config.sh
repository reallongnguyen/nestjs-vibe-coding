#!/bin/bash

# Script to create traefik.yaml configuration from template with specific env file
# Usage: ./scripts/create-traefik-config.sh [env-file]
# Example: ./scripts/create-traefik-config.sh .env.dev

set -e

# Default to .env if no env file specified
ENV_FILE=${1:-.env}

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file '$ENV_FILE' not found!"
    echo "Usage: $0 [env-file]"
    echo "Example: $0 .env.dev"
    exit 1
fi

echo "Creating traefik configuration from template using $ENV_FILE..."

# Check if traefik.example.yaml exists
if [ ! -f "traefik-gateway/traefik.example.yaml" ]; then
    echo "Error: traefik.example.yaml template not found!"
    exit 1
fi

# Source the environment file
set -a  # automatically export all variables
source "$ENV_FILE"
set +a  # disable automatic export

# Create traefik.yaml from template
envsubst < traefik-gateway/traefik.example.yaml > traefik-gateway/traefik.yaml

echo "✅ Traefik configuration created successfully: traefik-gateway/traefik.yaml"
echo "   Environment file used: $ENV_FILE"
echo "   Key variables applied:"
echo "   - AUTH_SERVICE_JWT_SECRET: ${AUTH_SERVICE_JWT_SECRET:0:10}..."
echo "   - AUTH_SERVICE_HOST: $AUTH_SERVICE_HOST"
echo "   - API_SERVICE_HOST: $API_SERVICE_HOST"
echo "   - MQTT_SERVICE_HOST: $MQTT_SERVICE_HOST"

# Validate the generated configuration
if command -v traefik >/dev/null 2>&1; then
    echo "🔍 Validating traefik configuration..."
    traefik --configfile=traefik-gateway/traefik.yaml --dry-run
    echo "✅ Configuration validation passed"
else
    echo "⚠️  Traefik not installed locally, skipping validation"
fi

echo ""
echo "📝 Next steps:"
echo "   1. Review the generated traefik-gateway/traefik.yaml"
echo "   2. Deploy to VM: gcloud compute scp traefik-gateway/traefik.yaml VM_NAME:/opt/isling/"
echo "   3. Restart traefik: docker compose restart traefik-gateway" 