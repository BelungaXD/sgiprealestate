# Nginx Templates Reference

This directory contains reference copies of nginx configuration templates used on the production server.

## Template Files

- `domain-blue-green.conf.template` - Main template for blue/green deployment with domain configuration

## Configuration Requirements

### HTTP to HTTPS Redirect

All HTTP requests (port 80) are automatically redirected to HTTPS (port 443) using a 301 permanent redirect.

**Implementation:**

- HTTP server block listens on port 80
- Allows Let's Encrypt ACME challenges for certificate renewal
- All other traffic is redirected to HTTPS with `return 301 https://$host$request_uri;`

### WWW to Canonical Redirect

All `www.sgipreal.com` requests are redirected to the canonical domain `sgipreal.com` (non-www).

**Implementation:**

- Separate HTTPS server block for `www.{{DOMAIN_NAME}}`
- Returns 301 redirect to `https://{{DOMAIN_NAME}}$request_uri`
- Main HTTPS server block only serves the canonical (non-www) domain

## Template Variables

- `{{DOMAIN_NAME}}` - The domain name (e.g., `sgipreal.com`)
- `{{UPSTREAM_BLOCKS}}` - Auto-generated upstream blocks for blue/green deployment
- `{{PROXY_LOCATIONS}}` - Auto-generated proxy location blocks from service registry

## Production Server Location

These templates are stored on the production server at:

```
nginx-microservice/nginx/templates/domain-blue-green.conf.template
```

## Deployment

Templates are automatically used by the deployment script:

```bash
./scripts/deploy.sh
```

The deployment script (`nginx-microservice/scripts/blue-green/deploy-smart.sh`) generates nginx configuration files from these templates during deployment.

## Notes

- Templates are managed on the production server
- This directory serves as a reference for the expected configuration
- Changes to templates should be made on the production server first, then synced here for documentation
