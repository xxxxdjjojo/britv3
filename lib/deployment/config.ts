/**
 * Production Deployment Configuration
 * CI/CD Pipeline + Environment Setup + Launch Checklist
 */

// ============================================================
// DEPLOYMENT ENVIRONMENT CONFIG
// ============================================================

export const DEPLOYMENT_CONFIG = {
  environments: {
    development: {
      name: 'development',
      domain: 'dev.brit-estate.uk',
      database: 'britv3_dev',
      cache: 'dev:redis',
      monitoring: false,
      logLevel: 'debug',
      apiTimeout: 30000,
    },
    staging: {
      name: 'staging',
      domain: 'staging.brit-estate.uk',
      database: 'britv3_staging',
      cache: 'staging:redis',
      monitoring: true,
      logLevel: 'info',
      apiTimeout: 30000,
    },
    production: {
      name: 'production',
      domain: 'brit-estate.uk',
      database: 'britv3_prod',
      cache: 'prod:redis',
      monitoring: true,
      logLevel: 'warning',
      apiTimeout: 10000,
      replicas: 3,
      autoScaling: true,
    },
  },

  features: {
    caching: true,
    monitoring: true,
    notifications: true,
    aiFeatures: true,
    rateLimit: true,
    ddosProtection: true,
  },

  security: {
    jwtSecret: process.env.JWT_SECRET,
    apiKeyEncryption: true,
    tlsVersion: 'TLSv1.3',
    corsOrigins: [
      'https://brit-estate.uk',
      'https://www.brit-estate.uk',
      'https://app.brit-estate.uk',
    ],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
    },
  },

  database: {
    connectionLimit: 100,
    idleTimeout: 30000,
    maxQueryTime: 5000,
    autoMigrate: false,
    backup: {
      enabled: true,
      frequency: 'daily',
      retention: 30, // days
    },
  },

  cdn: {
    provider: 'cloudflare',
    caching: true,
    compression: true,
    minification: true,
    imageOptimization: true,
  },

  storage: {
    provider: 'supabase',
    bucket: 'brit-estate-assets',
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
};

// ============================================================
// PRE-DEPLOYMENT CHECKLIST
// ============================================================

export interface ChecklistItem {
  category: string;
  item: string;
  checked: boolean;
  critical: boolean;
  notes?: string;
}

export const PRE_DEPLOYMENT_CHECKLIST: ChecklistItem[] = [
  // Security
  {
    category: 'Security',
    item: 'All RLS policies implemented and tested',
    checked: true,
    critical: true,
  },
  {
    category: 'Security',
    item: 'JWT tokens configured and rotated',
    checked: true,
    critical: true,
  },
  {
    category: 'Security',
    item: 'API rate limiting enabled',
    checked: true,
    critical: true,
  },
  {
    category: 'Security',
    item: 'CORS whitelist configured',
    checked: true,
    critical: true,
  },
  {
    category: 'Security',
    item: 'SSL/TLS certificates installed',
    checked: false,
    critical: true,
  },
  {
    category: 'Security',
    item: 'Environment variables secured',
    checked: false,
    critical: true,
  },

  // Performance
  {
    category: 'Performance',
    item: 'Database indexes verified (35+ indexes)',
    checked: true,
    critical: true,
  },
  {
    category: 'Performance',
    item: 'Cache strategy implemented',
    checked: true,
    critical: true,
  },
  {
    category: 'Performance',
    item: 'CDN configured and tested',
    checked: false,
    critical: false,
  },
  {
    category: 'Performance',
    item: 'Load testing passed (250+ RPS)',
    checked: true,
    critical: true,
  },
  {
    category: 'Performance',
    item: 'Query optimization complete',
    checked: true,
    critical: false,
  },

  // Quality
  {
    category: 'Quality',
    item: 'All unit tests passing',
    checked: true,
    critical: false,
  },
  {
    category: 'Quality',
    item: 'Integration tests passing',
    checked: true,
    critical: false,
  },
  {
    category: 'Quality',
    item: 'E2E tests for critical flows',
    checked: true,
    critical: false,
  },
  {
    category: 'Quality',
    item: 'Mobile responsiveness verified',
    checked: true,
    critical: true,
  },
  {
    category: 'Quality',
    item: 'Accessibility compliance (WCAG 2.1)',
    checked: true,
    critical: false,
  },

  // Monitoring
  {
    category: 'Monitoring',
    item: 'Error tracking (Sentry) configured',
    checked: false,
    critical: true,
  },
  {
    category: 'Monitoring',
    item: 'Analytics (PostHog) configured',
    checked: false,
    critical: false,
  },
  {
    category: 'Monitoring',
    item: 'Alerting system activated',
    checked: false,
    critical: true,
  },
  {
    category: 'Monitoring',
    item: 'Dashboard deployed',
    checked: false,
    critical: false,
  },

  // Infrastructure
  {
    category: 'Infrastructure',
    item: 'Load balancer configured',
    checked: false,
    critical: true,
  },
  {
    category: 'Infrastructure',
    item: 'Database replicas set up',
    checked: false,
    critical: true,
  },
  {
    category: 'Infrastructure',
    item: 'Redis cluster operational',
    checked: false,
    critical: true,
  },
  {
    category: 'Infrastructure',
    item: 'Backup system verified',
    checked: false,
    critical: true,
  },
  {
    category: 'Infrastructure',
    item: 'DNS configured and propagated',
    checked: false,
    critical: true,
  },

  // Notifications
  {
    category: 'Notifications',
    item: 'Email service (Resend) configured',
    checked: false,
    critical: true,
  },
  {
    category: 'Notifications',
    item: 'SMS service (Twilio) configured',
    checked: false,
    critical: false,
  },
  {
    category: 'Notifications',
    item: 'Email templates tested',
    checked: false,
    critical: false,
  },
  {
    category: 'Notifications',
    item: 'Slack integration configured',
    checked: false,
    critical: false,
  },

  // Documentation
  {
    category: 'Documentation',
    item: 'API documentation complete',
    checked: true,
    critical: false,
  },
  {
    category: 'Documentation',
    item: 'Runbooks written for support team',
    checked: false,
    critical: true,
  },
  {
    category: 'Documentation',
    item: 'Incident response procedures documented',
    checked: false,
    critical: true,
  },
  {
    category: 'Documentation',
    item: 'Architecture diagram updated',
    checked: false,
    critical: false,
  },

  // Team
  {
    category: 'Team',
    item: 'Support team trained',
    checked: false,
    critical: true,
  },
  {
    category: 'Team',
    item: 'On-call rotation established',
    checked: false,
    critical: true,
  },
  {
    category: 'Team',
    item: 'Escalation procedures defined',
    checked: false,
    critical: true,
  },
];

// ============================================================
// GO-LIVE DECISION GATE
// ============================================================

export function calculateReadiness(): {
  percentage: number;
  status: 'ready' | 'warning' | 'blocked';
  criticalGaps: string[];
} {
  const total = PRE_DEPLOYMENT_CHECKLIST.length;
  const completed = PRE_DEPLOYMENT_CHECKLIST.filter(item => item.checked).length;
  const percentage = Math.round((completed / total) * 100);

  const criticalGaps = PRE_DEPLOYMENT_CHECKLIST
    .filter(item => item.critical && !item.checked)
    .map(item => `${item.category}: ${item.item}`);

  let status: 'ready' | 'warning' | 'blocked' = 'ready';
  if (criticalGaps.length > 0) {
    status = 'blocked';
  } else if (percentage < 95) {
    status = 'warning';
  }

  return { percentage, status, criticalGaps };
}

// ============================================================
// DEPLOYMENT STEPS
// ============================================================

export const DEPLOYMENT_STEPS = [
  {
    step: 1,
    name: 'Pre-flight Checks',
    actions: [
      'Verify all checklist items',
      'Check system health',
      'Verify backup system',
      'Confirm team is ready',
    ],
    duration: '30 minutes',
  },
  {
    step: 2,
    name: 'Database Migration',
    actions: [
      'Run schema migrations',
      'Create indexes',
      'Verify RLS policies',
      'Test rollback procedure',
    ],
    duration: '15 minutes',
  },
  {
    step: 3,
    name: 'Infrastructure Deployment',
    actions: [
      'Deploy API servers',
      'Configure load balancer',
      'Verify DNS',
      'Health check endpoints',
    ],
    duration: '20 minutes',
  },
  {
    step: 4,
    name: 'Feature Activation',
    actions: [
      'Enable caching',
      'Enable monitoring',
      'Enable notifications',
      'Verify all systems',
    ],
    duration: '10 minutes',
  },
  {
    step: 5,
    name: 'Beta Launch',
    actions: [
      'Enable for 100 beta users',
      'Monitor for errors',
      'Collect feedback',
      'Verify performance metrics',
    ],
    duration: '2 hours',
  },
  {
    step: 6,
    name: 'Gradual Rollout',
    actions: [
      'Expand to 500 users',
      'Monitor metrics',
      'Expand to 5000 users',
      'Full production rollout',
    ],
    duration: '6 hours',
  },
  {
    step: 7,
    name: 'Post-Launch Monitoring',
    actions: [
      'Monitor error rates',
      'Track performance metrics',
      'Respond to user feedback',
      'Prepare incident response',
    ],
    duration: '24 hours',
  },
];

// ============================================================
// ROLLBACK PROCEDURE
// ============================================================

export const ROLLBACK_PROCEDURE = {
  description: 'Steps to rollback to previous stable version',
  trigger: [
    'Error rate > 5%',
    'Response time p95 > 5s',
    'Database connectivity loss',
    'Critical security issue found',
  ],
  steps: [
    {
      num: 1,
      action: 'Announce incident in Slack #incidents channel',
      owner: 'On-call engineer',
    },
    {
      num: 2,
      action: 'Disable new user traffic to production',
      owner: 'Ops team',
    },
    {
      num: 3,
      action: 'Revert to previous stable version',
      owner: 'DevOps engineer',
    },
    {
      num: 4,
      action: 'Verify system health',
      owner: 'Monitoring system',
    },
    {
      num: 5,
      action: 'Re-enable user traffic gradually',
      owner: 'Ops team',
    },
    {
      num: 6,
      action: 'Post-mortem analysis',
      owner: 'Engineering team',
    },
  ],
  estimatedTime: '30-60 minutes',
};

// ============================================================
// LAUNCH DAY SCHEDULE (Day 14, May 5)
// ============================================================

export const LAUNCH_DAY_SCHEDULE = [
  { time: '06:00 UTC', task: 'Team arrives, final checks' },
  { time: '07:00 UTC', task: 'Go/No-Go decision meeting' },
  { time: '07:30 UTC', task: 'Deploy to staging, verify' },
  { time: '08:00 UTC', task: 'Deploy to production' },
  { time: '08:15 UTC', task: 'Enable for beta group (100 users)' },
  { time: '08:30 UTC', task: 'Monitor metrics, first 15 minutes' },
  { time: '09:00 UTC', task: 'Expand to 500 users' },
  { time: '10:00 UTC', task: 'Expand to 5,000 users' },
  { time: '12:00 UTC', task: 'Full rollout to all users' },
  { time: '18:00 UTC', task: 'Post-launch review' },
  { time: '22:00 UTC', task: 'Night monitoring handoff' },
];

// ============================================================
// SUCCESS CRITERIA
// ============================================================

export const SUCCESS_CRITERIA = {
  performance: {
    p95ResponseTime: '< 500ms',
    errorRate: '< 1%',
    uptime: '> 99.9%',
    throughput: '> 250 RPS',
  },
  quality: {
    criticalBugs: 0,
    highSeverityBugs: '< 3',
    userComplaints: '< 5',
  },
  business: {
    betaUserRetention: '> 80%',
    conversionRate: '> 2%',
    systemAdoption: '> 50% of users',
  },
};

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

export const REQUIRED_ENV_VARS = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'REDIS_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'RESEND_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'POSTHOG_API_KEY',
  'POSTHOG_HOST',
  'SENTRY_DSN',
  'ANTHROPIC_API_KEY',
  'CDN_DOMAIN',
];

export function verifyEnvironment(): { isValid: boolean; missing: string[] } {
  const missing = REQUIRED_ENV_VARS.filter(
    varName => !process.env[varName]
  );

  return {
    isValid: missing.length === 0,
    missing,
  };
}

// ============================================================
// FINAL DEPLOYMENT STATUS
// ============================================================

export function getDeploymentStatus() {
  const readiness = calculateReadiness();
  const envValid = verifyEnvironment();

  return {
    readiness,
    environment: envValid,
    overallStatus: readiness.status === 'ready' && envValid.isValid ? '✅ READY' : '⚠️ NEEDS ATTENTION',
    timestamp: new Date().toISOString(),
  };
}
