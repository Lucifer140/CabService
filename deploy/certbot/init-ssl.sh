#!/usr/bin/env bash
# ==============================================================================
# SANGITA TRAVELS PUNE - LET'S ENCRYPT SSL INITIALIZATION & AUTO-RENEWAL
# Obtains TLS certificates via Certbot for sangitatravelspune.com & punemumbaicab.com
# ==============================================================================

set -euo pipefail

DOMAINS=("sangitatravelspune.com" "www.sangitatravelspune.com" "punemumbaicab.com" "www.punemumbaicab.com")
EMAIL="admin@sangitatravelspune.com"

echo "=== 🔒 Sangita Travels Pune SSL Setup ==="

# Check Certbot installation
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot and python3-certbot-nginx..."
    apt-get update && apt-get install -y certbot python3-certbot-nginx
fi

DOMAIN_ARGS=""
for d in "${DOMAINS[@]}"; do
    DOMAIN_ARGS="$DOMAIN_ARGS -d $d"
done

echo "Requesting TLS Certificate for: ${DOMAINS[*]}..."
certbot --nginx \
    $DOMAIN_ARGS \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --redirect \
    --hsts \
    --staple-ocsp

echo "Setting up automatic renewal cron job..."
(crontab -l 2>/dev/null || true; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sort -u | crontab -

echo "=== ✅ SSL setup completed successfully! ==="
