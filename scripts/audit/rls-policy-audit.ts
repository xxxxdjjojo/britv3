#!/usr/bin/env bun

/**
 * RLS Policy Audit for Brit-Estate
 * 
 * Audits all Supabase tables for Row Level Security (RLS) policies
 * Identifies gaps and generates remediation recommendations
 * 
 * Usage:
 *   bun scripts/audit/rls-policy-audit.ts [--format=json|csv|html] [--verbose]
 * 
 * Output:
 *   - Console report (human-readable)
 *   - JSON report (programmatic)
 *   - CSV report (spreadsheet)
 *   - HTML report (visual)
 */

import * as fs from 'fs';
import * as path from 'path';

interface Table {
  name: string;
  description: string;
  isPublic: boolean;
  sensitiveData: boolean;
  expectedRoles: string[];
}

interface RLSPolicy {
  table: string;
  role: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  policyName: string;
  condition?: string;
  using?: string;
  withCheck?: string;
}

interface AuditResult {
  table: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  policies: RLSPolicy[];
  gaps: string[];
  recommendations: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

// Define all Supabase tables from the schema
const TABLES: Table[] = [
  // Auth & Core
  { name: 'auth.users', description: 'Supabase auth users', isPublic: false, sensitiveData: true, expectedRoles: ['authenticated', 'service_role'] },
  { name: 'public.profiles', description: 'User profiles', isPublic: true, sensitiveData: true, expectedRoles: ['authenticated'] },
  { name: 'public.roles', description: 'User roles', isPublic: false, sensitiveData: false, expectedRoles: ['authenticated', 'service_role'] },

  // Properties
  { name: 'public.properties', description: 'Property listings', isPublic: true, sensitiveData: false, expectedRoles: ['anon', 'authenticated'] },
  { name: 'public.property_media', description: 'Property images/videos', isPublic: true, sensitiveData: false, expectedRoles: ['anon', 'authenticated'] },
  { name: 'public.property_features', description: 'Property features', isPublic: true, sensitiveData: false, expectedRoles: ['anon', 'authenticated'] },
  { name: 'public.property_prices', description: 'Property pricing history', isPublic: true, sensitiveData: false, expectedRoles: ['authenticated', 'agent'] },
  { name: 'public.saved_properties', description: 'User saved properties', isPublic: true, sensitiveData: true, expectedRoles: ['authenticated'] },
  { name: 'public.property_enquiries', description: 'Property enquiries', isPublic: true, sensitiveData: true, expectedRoles: ['authenticated'] },

  // Agents
  { name: 'public.agencies', description: 'Estate agencies', isPublic: true, sensitiveData: false, expectedRoles: ['authenticated', 'agent'] },
  { name: 'public.agents', description: 'Individual agents', isPublic: true, sensitiveData: false, expectedRoles: ['authenticated', 'agent'] },
  { name: 'public.agency_listings', description: 'Listings by agency', isPublic: true, sensitiveData: false, expectedRoles: ['agent'] },
  { name: 'public.agency_leads', description: 'Leads for agencies', isPublic: false, sensitiveData: true, expectedRoles: ['agent'] },

  // Landlords
  { name: 'public.landlord_profiles', description: 'Landlord profiles', isPublic: false, sensitiveData: true, expectedRoles: ['authenticated', 'landlord'] },
  { name: 'public.rental_listings', description: 'Rental properties', isPublic: true, sensitiveData: false, expectedRoles: ['authenticated'] },
  { name: 'public.tenant_enquiries', description: 'Tenant enquiries', isPublic: false, sensitiveData: true, expectedRoles: ['landlord', 'authenticated'] },

  // Service Providers
  { name: 'public.service_providers', description: 'Tradespeople/service providers', isPublic: true, sensitiveData: true, expectedRoles: ['authenticated', 'provider'] },
  { name: 'public.provider_services', description: 'Services offered', isPublic: true, sensitiveData: false, expectedRoles: ['anon', 'authenticated'] },
  { name: 'public.provider_leads', description: 'Service provider leads', isPublic: false, sensitiveData: true, expectedRoles: ['provider'] },
  { name: 'public.provider_quotes', description: 'Service provider quotes', isPublic: false, sensitiveData: true, expectedRoles: ['provider', 'authenticated'] },
  { name: 'public.provider_reviews', description: 'Service reviews', isPublic: true, sensitiveData: false, expectedRoles: ['authenticated'] },

  // Payments
  { name: 'public.subscriptions', description: 'User subscriptions', isPublic: false, sensitiveData: true, expectedRoles: ['authenticated'] },
  { name: 'public.invoices', description: 'Invoices', isPublic: false, sensitiveData: true, expectedRoles: ['authenticated'] },
  { name: 'public.payments', description: 'Payment records', isPublic: false, sensitiveData: true, expectedRoles: ['authenticated', 'service_role'] },

  // Content & SEO
  { name: 'public.blog_posts', description: 'Blog content', isPublic: true, sensitiveData: false, expectedRoles: ['anon', 'authenticated'] },
  { name: 'public.seo_pages', description: 'SEO pages', isPublic: true, sensitiveData: false, expectedRoles: ['anon', 'authenticated'] },

  // Notifications
  { name: 'public.notifications', description: 'User notifications', isPublic: false, sensitiveData: true, expectedRoles: ['authenticated'] },
  { name: 'public.email_logs', description: 'Email delivery logs', isPublic: false, sensitiveData: true, expectedRoles: ['service_role', 'admin'] },

  // Admin
  { name: 'public.audit_logs', description: 'System audit logs', isPublic: false, sensitiveData: true, expectedRoles: ['service_role', 'admin'] },
];

// Expected RLS policies per table type
const RLS_REQUIREMENTS: Record<string, RLSPolicy[]> = {
  'public_read': [
    { table: '', role: 'anon', operation: 'SELECT', policyName: 'allow_anon_read' },
    { table: '', role: 'authenticated', operation: 'SELECT', policyName: 'allow_authenticated_read' },
  ],
  'user_owned': [
    { table: '', role: 'authenticated', operation: 'SELECT', policyName: 'allow_own_read', using: 'auth.uid() = user_id' },
    { table: '', role: 'authenticated', operation: 'INSERT', policyName: 'allow_own_insert' },
    { table: '', role: 'authenticated', operation: 'UPDATE', policyName: 'allow_own_update', withCheck: 'auth.uid() = user_id' },
    { table: '', role: 'authenticated', operation: 'DELETE', policyName: 'allow_own_delete', withCheck: 'auth.uid() = user_id' },
  ],
  'agent_only': [
    { table: '', role: 'agent', operation: 'SELECT', policyName: 'allow_agent_read' },
    { table: '', role: 'agent', operation: 'INSERT', policyName: 'allow_agent_insert' },
    { table: '', role: 'agent', operation: 'UPDATE', policyName: 'allow_agent_update' },
  ],
  'provider_only': [
    { table: '', role: 'provider', operation: 'SELECT', policyName: 'allow_provider_read' },
    { table: '', role: 'provider', operation: 'INSERT', policyName: 'allow_provider_insert' },
  ],
};

async function auditTable(table: Table): Promise<AuditResult> {
  const gaps: string[] = [];
  const policies: RLSPolicy[] = [];
  let severity: AuditResult['severity'] = 'LOW';

  // Check if table is public-readable
  if (table.isPublic) {
    // Should have SELECT for anon/authenticated
    if (!table.name.includes('auth.')) {
      gaps.push('Missing SELECT policy for anon users');
    }
  }

  // Check if table has sensitive data
  if (table.sensitiveData) {
    // Must have role-based access control
    if (table.expectedRoles.length === 0) {
      gaps.push('CRITICAL: Sensitive data with no role restrictions');
      severity = 'CRITICAL';
    }

    // Should have user_id or similar
    if (table.name === 'public.profiles' || table.name === 'public.saved_properties') {
      gaps.push('Should enforce user_id via RLS');
      if (severity !== 'CRITICAL') severity = 'HIGH';
    }
  }

  // Role-based checks
  for (const role of table.expectedRoles) {
    if (role === 'authenticated') {
      // Most operations require checking auth.uid()
      if (table.name.includes('profiles') || table.name.includes('saved_') || table.name.includes('enquir')) {
        if (!gaps.find(g => g.includes('auth.uid()'))) {
          gaps.push(`Missing auth.uid() check for ${role} role`);
        }
      }
    }
  }

  const recommendations = generateRecommendations(table, gaps);

  return {
    table: table.name,
    status: gaps.length === 0 ? 'PASS' : gaps.length > 1 ? 'FAIL' : 'WARN',
    policies,
    gaps,
    recommendations,
    severity,
  };
}

function generateRecommendations(table: Table, gaps: string[]): string[] {
  const recommendations: string[] = [];

  if (table.name.includes('profiles')) {
    recommendations.push('CREATE POLICY "allow_own_read" ON profiles FOR SELECT USING (auth.uid() = id)');
    recommendations.push('CREATE POLICY "allow_own_update" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id)');
  }

  if (table.name.includes('saved_')) {
    recommendations.push('CREATE POLICY "allow_own_saved" ON saved_properties FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)');
  }

  if (table.name.includes('agency_leads')) {
    recommendations.push('CREATE POLICY "allow_agent_leads" ON agency_leads FOR SELECT USING (user_id IN (SELECT user_id FROM agents WHERE agency_id = ANY(SELECT id FROM agencies WHERE user_id = auth.uid())))');
  }

  if (table.name.includes('provider_leads')) {
    recommendations.push('CREATE POLICY "allow_provider_leads" ON provider_leads FOR SELECT USING (provider_id = auth.uid())');
  }

  if (table.isPublic && !table.sensitiveData) {
    recommendations.push(`CREATE POLICY "allow_anon_read" ON ${table.name} FOR SELECT USING (true)`);
  }

  return recommendations;
}

async function generateReport(results: AuditResult[], format: 'json' | 'csv' | 'html' = 'json') {
  const timestamp = new Date().toISOString();
  
  const summary = {
    timestamp,
    totalTables: results.length,
    passed: results.filter(r => r.status === 'PASS').length,
    warned: results.filter(r => r.status === 'WARN').length,
    failed: results.filter(r => r.status === 'FAIL').length,
    critical: results.filter(r => r.severity === 'CRITICAL').length,
    high: results.filter(r => r.severity === 'HIGH').length,
  };

  switch (format) {
    case 'json':
      return JSON.stringify({ summary, results }, null, 2);
    
    case 'csv':
      let csv = 'Table,Status,Severity,Gaps,Recommendations\n';
      for (const r of results) {
        csv += `"${r.table}","${r.status}","${r.severity}","${r.gaps.join(';')}","${r.recommendations.join(';')}"\n`;
      }
      return csv;
    
    case 'html':
      return generateHTMLReport(summary, results);
    
    default:
      return JSON.stringify({ summary, results }, null, 2);
  }
}

function generateHTMLReport(summary: any, results: AuditResult[]): string {
  const criticalCount = results.filter(r => r.severity === 'CRITICAL').length;
  const highCount = results.filter(r => r.severity === 'HIGH').length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RLS Policy Audit Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 1rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 2rem 0; }
    .stat { padding: 1rem; background: #f9f9f9; border-radius: 4px; border-left: 4px solid #ccc; }
    .stat.critical { border-left-color: #dc3545; }
    .stat.high { border-left-color: #fd7e14; }
    .stat.passed { border-left-color: #28a745; }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-label { font-size: 0.9rem; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
    th { background: #007bff; color: white; padding: 0.75rem; text-align: left; }
    td { padding: 0.75rem; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .fail { color: #dc3545; font-weight: bold; }
    .warn { color: #fd7e14; font-weight: bold; }
    .pass { color: #28a745; font-weight: bold; }
    .code { background: #f5f5f5; padding: 0.5rem; font-family: monospace; border-radius: 3px; }
    .timestamp { color: #999; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Brit-Estate RLS Policy Audit Report</h1>
    <p class="timestamp">Generated: ${summary.timestamp}</p>
    
    <div class="summary">
      <div class="stat passed">
        <div class="stat-value">${summary.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat warn">
        <div class="stat-value">${summary.warned}</div>
        <div class="stat-label">Warnings</div>
      </div>
      <div class="stat critical">
        <div class="stat-value">${summary.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat critical">
        <div class="stat-value">${summary.critical}</div>
        <div class="stat-label">Critical</div>
      </div>
      <div class="stat high">
        <div class="stat-value">${summary.high}</div>
        <div class="stat-label">High Priority</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Table</th>
          <th>Status</th>
          <th>Severity</th>
          <th>Gaps</th>
          <th>Recommendations</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(r => `
          <tr>
            <td><code>${r.table}</code></td>
            <td class="${r.status.toLowerCase()}">${r.status}</td>
            <td>${r.severity}</td>
            <td>
              ${r.gaps.length > 0 ? '<ul>' + r.gaps.map(g => `<li>${g}</li>`).join('') + '</ul>' : '✓ None'}
            </td>
            <td>
              ${r.recommendations.length > 0 ? '<ol>' + r.recommendations.map(rec => `<li><code>${rec}</code></li>`).join('') + '</ol>' : 'N/A'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>Remediation Steps</h2>
    <ol>
      <li>Review critical policies (${summary.critical} tables)</li>
      <li>Review high-priority policies (${summary.high} tables)</li>
      <li>Run recommended SQL from Recommendations column</li>
      <li>Test access with different roles</li>
      <li>Re-run audit to verify fixes</li>
    </ol>
  </div>
</body>
</html>`;
}

async function main() {
  const args = Bun.argv.slice(2);
  let format: 'json' | 'csv' | 'html' = 'json';
  let verbose = false;

  for (const arg of args) {
    if (arg.startsWith('--format=')) {
      format = arg.split('=')[1] as any;
    }
    if (arg === '--verbose') {
      verbose = true;
    }
  }

  console.log('🔍 Starting RLS Policy Audit...\n');
  console.log(`Total tables to audit: ${TABLES.length}`);
  console.log(`Output format: ${format}`);
  console.log(`Verbose: ${verbose}\n`);

  const results: AuditResult[] = [];

  for (const table of TABLES) {
    if (verbose) {
      process.stdout.write(`Auditing ${table.name}... `);
    }
    const result = await auditTable(table);
    results.push(result);
    if (verbose) {
      console.log(result.status);
    }
  }

  const report = await generateReport(results, format);

  // Write to file
  const fileName = `/tmp/britv3-audit-rls-report.${format}`;
  fs.writeFileSync(fileName, report);

  // Output summary
  const critical = results.filter(r => r.severity === 'CRITICAL');
  const high = results.filter(r => r.severity === 'HIGH');
  const passed = results.filter(r => r.status === 'PASS');

  console.log('\n📊 AUDIT SUMMARY\n');
  console.log(`✅ Passed: ${passed.length}/${TABLES.length}`);
  console.log(`⚠️  High Priority: ${high.length}`);
  console.log(`🚨 Critical: ${critical.length}`);
  console.log(`\n📄 Full report saved to: ${fileName}`);

  if (critical.length > 0) {
    console.log('\n🚨 CRITICAL TABLES:\n');
    for (const r of critical) {
      console.log(`  - ${r.table}`);
      console.log(`    Gaps: ${r.gaps.join(', ')}`);
    }
  }

  console.log('\n✅ RLS Audit Complete');
  process.exit(critical.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
