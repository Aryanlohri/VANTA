// ============================================
// API Gateway — Proxy Configuration
// ============================================

import { createProxyMiddleware, Options } from 'http-proxy-middleware';
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
 */
function createServiceProxy(serviceName: string, target: string, pathRewrite?: Record<string, string>) {
  const options: Options = {
    target,
    changeOrigin: true,
    pathRewrite,
    timeout: 30000,
    proxyTimeout: 30000,
    on: {
      proxyReq: (proxyReq, req: any) => {
        logger.debug(
          { service: serviceName, method: req.method, path: req.path },
          'Proxying request'
        );
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
export const authProxy = createServiceProxy('auth', SERVICE_URLS.auth, {
  '^/api/auth': '/auth',
});

/** Proxy for Repository Service */
export const repoProxy = createServiceProxy('repos', SERVICE_URLS.repos, {
  '^/api/repos': '/repos',
});

/** Proxy for Review Service */
export const reviewProxy = createServiceProxy('reviews', SERVICE_URLS.reviews, {
  '^/api/reviews': '/reviews',
});
