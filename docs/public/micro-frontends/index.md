# Micro Frontend Integration Guide

This document describes how to configure and use Micro Frontends (MFEs) in the FEWS Web Operator Client (Web OC).

A demonstration Micro Frontend is available at:

https://deltares.github.io/fews-web-oc-components/micro-frontends/mf-manifest.json

> **Disclaimer**
>
> The Deltares-hosted Micro Frontend is intended for testing, evaluation, and development purposes only. Production environments should host and manage their own Micro Frontends and manifests.

---

# Overview

FEWS Web OC supports runtime integration of Micro Frontends through a manifest-based configuration. Micro Frontends are loaded dynamically and can extend the application with additional functionality without modifying the FEWS Web OC core application.

The Micro Frontend manifest URL is configured through:

```text
VITE_FEWS_WEBOC_MF_MANIFEST_URL
```

At startup, Web OC retrieves the manifest and loads the configured remote modules.

---

# Development

There are two common development scenarios:

1. Developing FEWS Web OC against the public demo Micro Frontend.
2. Developing FEWS Web OC together with a locally running Micro Frontend.

---

# Scenario 1: FEWS Web OC Host with Demo Remote

Start FEWS Web OC locally while connecting to the publicly hosted demo Micro Frontend.

## .env.development

Create or update:

```text
.env.development
```

```env
VITE_FEWS_WEBOC_MF_MANIFEST_URL=/mf-manifest-github.json

DEV_CSP_CONNECT_SRC=https://deltares.github.io
DEV_CSP_SCRIPT_SRC=https://deltares.github.io
DEV_CSP_FONT_SRC=https://deltares.github.io
DEV_CSP_STYLE_SRC=https://deltares.github.io
```

## Manifest Proxy

The FEWS Web OC development server serves a local proxy endpoint:

```text
/mf-manifest-github.json
```

which points to:

```text
https://deltares.github.io/fews-web-oc-components/micro-frontends/mf-manifest.json
```

## Start FEWS Web OC

```bash
npm run dev
```

The application will:

1. Start the FEWS Web OC development server.
2. Load the manifest from `/mf-manifest-github.json`.
3. Retrieve remote Micro Frontends from `https://deltares.github.io`.

---

# Scenario 2: Local Host and Local Remote Development

In this scenario both FEWS Web OC and the Micro Frontend are developed locally.

## Start the Remote

In the Micro Frontend project:

```bash
npm run dev
```

Typical development URL:

```text
http://localhost:4174
```

## Configure FEWS Web OC

Create or update:

```env
VITE_FEWS_WEBOC_MF_MANIFEST_URL=http://localhost:4174/mf-manifest.json

DEV_CSP_CONNECT_SRC=http://localhost:4174
DEV_CSP_SCRIPT_SRC=http://localhost:4174
DEV_CSP_FONT_SRC=http://localhost:4174
DEV_CSP_STYLE_SRC=http://localhost:4174
```

> Adjust the port number to match the Micro Frontend development server.

## Start FEWS Web OC

```bash
npm run dev
```

The host application will connect directly to the local Micro Frontend manifest and dynamically load the remote modules.

---

# Development CSP Configuration

During development additional Content Security Policy (CSP) permissions are usually required to allow loading remote assets.

Example:

```env
DEV_CSP_CONNECT_SRC=https://deltares.github.io
DEV_CSP_SCRIPT_SRC=https://deltares.github.io
DEV_CSP_FONT_SRC=https://deltares.github.io
DEV_CSP_STYLE_SRC=https://deltares.github.io
```

For local development:

```env
DEV_CSP_CONNECT_SRC=http://localhost:4174
DEV_CSP_SCRIPT_SRC=http://localhost:4174
DEV_CSP_FONT_SRC=http://localhost:4174
DEV_CSP_STYLE_SRC=http://localhost:4174
```

These settings should only be used during development and testing.

---

# Production Configuration

Production environments should use a dedicated Micro Frontend hosting location controlled by the deployment organization.

## app-config.json Example

```json
{
  "VITE_FEWS_WEBOC_MF_MANIFEST_URL": "https://my-organization.example.com/micro-frontends/mf-manifest.json"
}
```

The FEWS Web OC application will retrieve the Micro Frontend manifest from the configured location.

---

# Production Example Using the Deltares Demo

> **Warning**
>
> The following configuration is intended only for testing and demonstration purposes. Do not rely on the public Deltares demo Micro Frontend in operational environments.

```json
{
  "VITE_FEWS_WEBOC_MF_MANIFEST_URL": "https://deltares.github.io/fews-web-oc-components/micro-frontends/mf-manifest.json"
}
```

---

# Recommended CSP Configuration

CSP requirements depend on the hosting infrastructure and security policies of the organization operating FEWS Web OC.

> **Recommendation**
>
> CSP settings should be reviewed and configured by the responsible ICT/security team.

Example:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://my-organization.example.com;
  connect-src 'self' https://my-organization.example.com;
  style-src 'self' https://my-organization.example.com;
  font-src 'self' https://my-organization.example.com;
  img-src 'self' data: https:;
  frame-ancestors 'none';
  object-src 'none';
```

When using the Deltares demo for testing:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://deltares.github.io;
  connect-src 'self' https://deltares.github.io;
  style-src 'self' https://deltares.github.io;
  font-src 'self' https://deltares.github.io;
  img-src 'self' data: https:;
  frame-ancestors 'none';
  object-src 'none';
```

---

# Building Micro Frontends

## Build for Production

Create an optimized production build:

```bash
npm run build
```

Verify that:

- All assets are generated with content hashes.
- Source maps are disabled or appropriately protected.
- The generated manifest references production URLs.
- No localhost references remain in the generated files.

---

# Deploying Micro Frontends

A typical deployment consists of:

```text
micro-frontends/
├── mf-manifest.json
├── assets/
│   ├── remoteEntry.js
│   ├── index-xxxxx.js
│   └── index-xxxxx.css
└── ...
```

Deploy the complete build output to a secure HTTPS endpoint.

Example:

```text
https://my-organization.example.com/micro-frontends/
```

Ensure the manifest remains available at a stable URL.

---

# Security Best Practices

## Use HTTPS Everywhere

Always serve:

- Manifest files
- Remote entry files
- JavaScript bundles
- CSS assets

over HTTPS.

---

## Restrict CSP

Only allow trusted origins.

Avoid:

```http
script-src *
```

Prefer explicit allowlists:

```http
script-src 'self' https://my-organization.example.com;
```

---

## Host Trusted Code

Only load Micro Frontends from trusted and controlled locations.

Do not load code from:

- Untrusted third parties
- Public file sharing services
- User-configurable URLs

without appropriate validation and governance.

---

## Version and Release Management

Maintain versioned releases of Micro Frontends.

Example:

```text
https://my-organization.example.com/micro-frontends/v1/
https://my-organization.example.com/micro-frontends/v2/
```

This enables controlled rollout and rollback.

---

## Apply CI/CD Security Controls

Consider:

- Dependency vulnerability scanning
- License compliance checks
- Static application security testing (SAST)
- Software bill of materials (SBOM) generation
- Signed release artifacts

---

## Keep Dependencies Updated

Regularly update:

- Framework dependencies
- Build tooling
- Module Federation tooling
- Security-related packages

Monitor published security advisories.

---

## Limit Permissions

Micro Frontends should:

- Request only the APIs they require.
- Avoid global browser modifications.
- Avoid modifying host application state outside supported APIs.
- Communicate through documented extension points.

---

## Validate External Data

Always validate:

- API responses
- User input
- Configuration values
- Manifest content

before use.

---

# Troubleshooting

## Manifest Cannot Be Loaded

Verify:

- Manifest URL is reachable.
- CSP configuration allows the remote host.
- Browser developer tools show no network errors.

---

## Remote Entry Cannot Be Loaded

Verify:

- `script-src` CSP settings.
- Correct asset URLs in the manifest.
- Remote files exist on the server.

---

## Micro Frontend Not Visible

Verify:

- Manifest contents are correct.
- Exposed module names match the expected configuration.
- Browser console contains no loading errors.

---

# Summary

For development, FEWS Web OC can connect either to the public Deltares demo Micro Frontend or to a locally running Micro Frontend using the `VITE_FEWS_WEBOC_MF_MANIFEST_URL` configuration. For production deployments, organizations should host their own manifests and remote assets, apply strict CSP policies, serve all assets over HTTPS, and follow standard software supply chain and web security best practices.