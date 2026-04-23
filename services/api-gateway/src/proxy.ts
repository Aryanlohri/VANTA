// ============================================
// API Gateway — Proxy Configuration
// ============================================

import { createProxyMiddleware, fixRequestBody, Options } from 'http-proxy-middleware';
import { SERVICE_PORTS, createLogger } from '@aicr/shared';

const logger = createLogger('api-gateway:proxy');

/** Service URL mappings */
const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || `http://localhost:${SERVICE_PORTS.AUTH_SERVICE}`,
  repos: process.env.REPO_SERVICE_URL || `http://localhost:${SERVICE_PORTS.REPO_SERVICE}`,
  reviews: process.env.REVIEW_SERVICE_URL || `http://localhost:${SERVICE_PORTS.REVIEW_SERVICE}`,
  ai: process.env.AI_SERVICE_URL || `http://localhost:${SERVICE_PORTS.AI_SERVICE}`,
};

/**
 * Create a proxy middleware for a specific service.
 * 
 * IMPORTANT: Express's json() body parser consumes the request stream before
 * the proxy can forward it. fixRequestBody re-serializes req.body so the
 * downstream service receives the correct payload.
 */
function createServiceProxy(serviceName: string, target: string, pathRewrite?: Record<string, string>) {
  const options: Options = {
    target,
    changeOrigin: true,
    pathRewrite,
    timeout: 30000,
    proxyTimeout: 30000,
    on: {
      proxyReq: (proxyReq, req: any, res: any) => {
        logger.info(
          { service: serviceName, method: req.method, path: req.originalUrl, target: `${target}${proxyReq.path}` },
          'Proxying request'
        );
        // Re-serialize body that was consumed by express.json()
        fixRequestBody(proxyReq, req);
      },
      error: (err, req: any, res: any) => {
        logger.error({ err, service: serviceName, path: req.path }, 'Proxy error');
        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: `${serviceName} service is unavailable`,
            },
          });
        }
      },
    },
  };

  return createProxyMiddleware(options);
}

/** Proxy for Auth Service */
// Express strips /api (via app.use) and /auth (via router.use), so req.url = /github
// We need to prepend /auth back so it hits the auth service at /auth/github
export const authProxy = createServiceProxy('auth', SERVICE_URLS.auth, {
  '^/': '/auth/',
});

/** Proxy for Repository Service */
// Same: req.url = / or /github or /:id/files, prepend /repos
export const repoProxy = createServiceProxy('repos', SERVICE_URLS.repos, {
  '^/': '/repos/',
});

/** Proxy for Review Service */
// Same: req.url = / or /:id, prepend /reviews
export const reviewProxy = createServiceProxy('reviews', SERVICE_URLS.reviews, {
  '^/': '/reviews/',
});
