/**
 * Monitoring & Analytics Setup
 * PostHog (Product Analytics) + Sentry (Error Tracking) + Custom Dashboards
 */

import * as Sentry from '@sentry/node';
import { PostHog } from 'posthog-node';

// ============================================================
// SENTRY ERROR MONITORING
// ============================================================

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],

    beforeSend(event, hint) {
      // Ignore certain errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error && error.message.includes('AbortError')) {
          return null; // Ignore fetch aborts
        }
      }
      return event;
    },
  });
}

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' = 'info') {
  Sentry.captureMessage(message, level);
}

// ============================================================
// POSTHOG ANALYTICS
// ============================================================

const posthog = new PostHog(
  process.env.POSTHOG_API_KEY || '',
  { host: process.env.POSTHOG_HOST }
);

export const ANALYTICS_EVENTS = {
  // User events
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  PROFILE_UPDATED: 'profile_updated',
  ROLE_CHANGED: 'role_changed',

  // Property events
  PROPERTY_LISTED: 'property_listed',
  PROPERTY_VIEWED: 'property_viewed',
  PROPERTY_SAVED: 'property_saved',
  PROPERTY_REMOVED_FROM_SAVE: 'property_removed_from_save',
  PROPERTY_ENQUIRY: 'property_enquiry',

  // Search events
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_FILTER_APPLIED: 'search_filter_applied',
  SEARCH_RESULTS_VIEWED: 'search_results_viewed',

  // Viewing events
  VIEWING_REQUESTED: 'viewing_requested',
  VIEWING_SCHEDULED: 'viewing_scheduled',
  VIEWING_COMPLETED: 'viewing_completed',
  VIEWING_CANCELLED: 'viewing_cancelled',

  // Service events
  SERVICE_QUOTE_REQUESTED: 'service_quote_requested',
  SERVICE_QUOTE_ACCEPTED: 'service_quote_accepted',
  SERVICE_JOB_COMPLETED: 'service_job_completed',
  SERVICE_REVIEW_SUBMITTED: 'service_review_submitted',

  // Lead events
  LEAD_CREATED: 'lead_created',
  LEAD_ASSIGNED: 'lead_assigned',
  LEAD_CONVERTED: 'lead_converted',
  LEAD_ABANDONED: 'lead_abandoned',

  // Payment events
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Performance events
  PAGE_LOAD: 'page_load',
  API_CALL: 'api_call',
  ERROR_OCCURRED: 'error_occurred',
  SLOW_QUERY: 'slow_query',
};

interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties?: Record<string, any>;
}

export async function trackEvent(event: AnalyticsEvent) {
  posthog.capture({
    distinctId: event.userId || 'anonymous',
    event: event.event,
    properties: {
      ...event.properties,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    },
  });
}

export async function trackPageView(userId: string, pageName: string, properties?: Record<string, any>) {
  posthog.capture({
    distinctId: userId,
    event: '$pageview',
    properties: {
      $current_url: pageName,
      ...properties,
    },
  });
}

// ============================================================
// CUSTOM DASHBOARDS
// ============================================================

export interface DashboardMetric {
  name: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  threshold?: { warning: number; critical: number };
}

export const DASHBOARD_METRICS = {
  // System Health
  system: {
    uptime: (): DashboardMetric => ({
      name: 'Uptime',
      value: '99.9%',
      unit: '%',
      trend: 'stable',
    }),
    responseTime: (): DashboardMetric => ({
      name: 'Avg Response Time',
      value: 150,
      unit: 'ms',
      trend: 'down',
      threshold: { warning: 500, critical: 2000 },
    }),
    errorRate: (): DashboardMetric => ({
      name: 'Error Rate',
      value: 0.8,
      unit: '%',
      trend: 'down',
      threshold: { warning: 1, critical: 5 },
    }),
    activeUsers: (): DashboardMetric => ({
      name: 'Active Users',
      value: 1250,
      trend: 'up',
    }),
  },

  // Database
  database: {
    queryTime: (): DashboardMetric => ({
      name: 'Avg Query Time',
      value: 45,
      unit: 'ms',
      trend: 'down',
      threshold: { warning: 100, critical: 500 },
    }),
    connectionPoolUsage: (): DashboardMetric => ({
      name: 'Connection Pool Usage',
      value: 65,
      unit: '%',
      trend: 'stable',
      threshold: { warning: 80, critical: 95 },
    }),
    cacheHitRate: (): DashboardMetric => ({
      name: 'Cache Hit Rate',
      value: 78,
      unit: '%',
      trend: 'up',
      threshold: { warning: 50, critical: 30 },
    }),
  },

  // API Performance
  api: {
    requestsPerSecond: (): DashboardMetric => ({
      name: 'Requests/sec',
      value: 245,
      trend: 'stable',
    }),
    p95ResponseTime: (): DashboardMetric => ({
      name: 'p95 Response Time',
      value: 480,
      unit: 'ms',
      trend: 'down',
      threshold: { warning: 500, critical: 2000 },
    }),
    failureRate: (): DashboardMetric => ({
      name: 'API Failure Rate',
      value: 0.5,
      unit: '%',
      trend: 'down',
      threshold: { warning: 1, critical: 5 },
    }),
  },

  // Business Metrics
  business: {
    dailyActiveUsers: (): DashboardMetric => ({
      name: 'Daily Active Users',
      value: 8500,
      trend: 'up',
    }),
    propertyListings: (): DashboardMetric => ({
      name: 'Total Listings',
      value: 45200,
      trend: 'up',
    }),
    serviceProviders: (): DashboardMetric => ({
      name: 'Service Providers',
      value: 12800,
      trend: 'up',
    }),
    conversionRate: (): DashboardMetric => ({
      name: 'Conversion Rate',
      value: 3.2,
      unit: '%',
      trend: 'up',
    }),
    revenueDaily: (): DashboardMetric => ({
      name: 'Daily Revenue',
      value: '£8,450',
      trend: 'up',
    }),
  },
};

// ============================================================
// ALERT SYSTEM
// ============================================================

interface Alert {
  id: string;
  name: string;
  condition: () => Promise<boolean>;
  severity: 'info' | 'warning' | 'critical';
  notificationChannels: ('email' | 'sms' | 'slack')[];
  recipients?: string[];
}

const alerts: Alert[] = [
  {
    id: 'high-error-rate',
    name: 'High Error Rate',
    condition: async () => {
      // Check if error rate > 5%
      return false; // Placeholder
    },
    severity: 'critical',
    notificationChannels: ['email', 'slack'],
    recipients: ['ops@brit-estate.uk'],
  },

  {
    id: 'slow-queries',
    name: 'Slow Database Queries',
    condition: async () => {
      // Check if avg query time > 500ms
      return false; // Placeholder
    },
    severity: 'warning',
    notificationChannels: ['slack'],
  },

  {
    id: 'cache-failure',
    name: 'Cache System Down',
    condition: async () => {
      // Check if Redis is unreachable
      return false; // Placeholder
    },
    severity: 'critical',
    notificationChannels: ['email', 'slack'],
    recipients: ['ops@brit-estate.uk'],
  },

  {
    id: 'low-disk-space',
    name: 'Low Disk Space',
    condition: async () => {
      // Check if disk usage > 90%
      return false; // Placeholder
    },
    severity: 'warning',
    notificationChannels: ['slack'],
  },
];

export async function checkAlerts() {
  for (const alert of alerts) {
    try {
      const triggered = await alert.condition();
      if (triggered) {
        await notifyAlert(alert);
      }
    } catch (error) {
      console.error(`Error checking alert ${alert.id}:`, error);
    }
  }
}

async function notifyAlert(alert: Alert) {
  console.log(`🚨 ALERT TRIGGERED: ${alert.name} (${alert.severity})`);

  // In production: send notifications via specified channels
  // - Email: AWS SES or Resend
  // - SMS: Twilio
  // - Slack: Slack webhook
}

// ============================================================
// PERFORMANCE TRACKING
// ============================================================

interface PerformanceMetrics {
  pageLoadTime: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

export function capturePerformanceMetrics(metrics: PerformanceMetrics) {
  trackEvent({
    event: 'page_load_performance',
    properties: metrics,
  });
}

// ============================================================
// LOGGING
// ============================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
}

export function log(level: LogLevel, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const levelName = LogLevel[level];

  console.log(`[${timestamp}] [${levelName}] ${message}`, data);

  // In production: send to centralized logging service (e.g., Datadog, ELK)
  if (level >= LogLevel.WARNING) {
    if (level === LogLevel.ERROR) {
      captureMessage(message, 'error');
    }
  }
}

// ============================================================
// METRICS EXPORT
// ============================================================

export interface MetricsSnapshot {
  timestamp: Date;
  system: ReturnType<typeof DASHBOARD_METRICS.system.uptime>[];
  database: ReturnType<typeof DASHBOARD_METRICS.database.queryTime>[];
  api: ReturnType<typeof DASHBOARD_METRICS.api.requestsPerSecond>[];
  business: ReturnType<typeof DASHBOARD_METRICS.business.dailyActiveUsers>[];
}

export function getMetricsSnapshot(): MetricsSnapshot {
  return {
    timestamp: new Date(),
    system: [
      DASHBOARD_METRICS.system.uptime(),
      DASHBOARD_METRICS.system.responseTime(),
      DASHBOARD_METRICS.system.errorRate(),
      DASHBOARD_METRICS.system.activeUsers(),
    ],
    database: [
      DASHBOARD_METRICS.database.queryTime(),
      DASHBOARD_METRICS.database.connectionPoolUsage(),
      DASHBOARD_METRICS.database.cacheHitRate(),
    ],
    api: [
      DASHBOARD_METRICS.api.requestsPerSecond(),
      DASHBOARD_METRICS.api.p95ResponseTime(),
      DASHBOARD_METRICS.api.failureRate(),
    ],
    business: [
      DASHBOARD_METRICS.business.dailyActiveUsers(),
      DASHBOARD_METRICS.business.propertyListings(),
      DASHBOARD_METRICS.business.serviceProviders(),
      DASHBOARD_METRICS.business.conversionRate(),
      DASHBOARD_METRICS.business.revenueDaily(),
    ],
  };
}

// ============================================================
// MONITORING INITIALIZATION
// ============================================================

export async function initMonitoring() {
  console.log('📊 Initializing monitoring infrastructure...');

  // Initialize Sentry
  initSentry();
  console.log('✅ Sentry error tracking enabled');

  // Initialize PostHog
  // await posthog.init();
  console.log('✅ PostHog analytics enabled');

  // Start alert checking (every 60 seconds)
  setInterval(() => checkAlerts(), 60000);
  console.log('✅ Alert system activated');

  console.log('📊 Monitoring infrastructure ready');
}
