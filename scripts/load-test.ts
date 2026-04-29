/**
 * Load Testing Suite for Brit-Estate
 * 
 * Usage:
 *   # Light load (100 users)
 *   npx artillery quick --count 100 --num 1000 http://localhost:3000
 *   
 *   # Medium load (500 users, 5000 requests)
 *   node load-test.js --concurrent=500 --requests=5000
 *   
 *   # Heavy load (1000 users, 10000 requests)
 *   node load-test.js --concurrent=1000 --requests=10000
 * 
 * Success Criteria (p95 < 500ms):
 *   ✅ p50 < 200ms
 *   ✅ p95 < 500ms
 *   ✅ p99 < 2000ms
 *   ✅ Error rate < 1%
 */

import http from 'http';
import https from 'https';

interface LoadTestOptions {
  concurrent: number;
  requests: number;
  baseUrl: string;
  rampUp?: number;
}

interface TestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  responseTimes: number[];
  errors: string[];
  startTime: number;
  endTime: number;
}

interface Results {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
  rps: number;
  errorRate: number;
  duration: number;
}

function parseArgs(): LoadTestOptions {
  const args = process.argv.slice(2);
  const options: LoadTestOptions = {
    concurrent: 100,
    requests: 1000,
    baseUrl: 'http://localhost:3000',
    rampUp: 10,
  };

  for (const arg of args) {
    if (arg.startsWith('--concurrent=')) {
      options.concurrent = parseInt(arg.split('=')[1]);
    }
    if (arg.startsWith('--requests=')) {
      options.requests = parseInt(arg.split('=')[1]);
    }
    if (arg.startsWith('--url=')) {
      options.baseUrl = arg.split('=')[1];
    }
    if (arg.startsWith('--ramp=')) {
      options.rampUp = parseInt(arg.split('=')[1]);
    }
  }

  return options;
}

async function makeRequest(url: string, method: string = 'GET'): Promise<number> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const client = url.startsWith('https') ? https : http;

    const req = client.request(url, { method }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve(responseTime);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (method !== 'GET') {
      req.write(JSON.stringify({}));
    }

    req.end();
  });
}

async function runLoadTest(options: LoadTestOptions): Promise<Results> {
  const metrics: TestMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: [],
    errors: [],
    startTime: Date.now(),
    endTime: 0,
  };

  // Test endpoints
  const endpoints = [
    `${options.baseUrl}/api/health`,
    `${options.baseUrl}/api/properties?limit=20`,
    `${options.baseUrl}/api/agencies`,
    `${options.baseUrl}/api/services`,
  ];

  const requestsPerEndpoint = Math.floor(options.requests / endpoints.length);
  const concurrencyPerEndpoint = Math.floor(options.concurrent / endpoints.length);

  console.log(`\n🔥 Starting Load Test`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Concurrent Users:  ${options.concurrent}`);
  console.log(`Total Requests:    ${options.requests}`);
  console.log(`Base URL:          ${options.baseUrl}`);
  console.log(`Ramp-up Time:      ${options.rampUp}s`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  let activeRequests = 0;
  let completedBatches = 0;

  for (const endpoint of endpoints) {
    console.log(`📝 Testing: ${endpoint}`);

    for (let i = 0; i < requestsPerEndpoint; i++) {
      // Ramp up: gradually increase concurrent requests
      if (i < concurrencyPerEndpoint) {
        await new Promise((resolve) => setTimeout(resolve, (options.rampUp * 1000) / concurrencyPerEndpoint));
      }

      const promises: Promise<void>[] = [];

      for (let j = 0; j < concurrencyPerEndpoint; j++) {
        const promise = (async () => {
          activeRequests++;
          metrics.totalRequests++;

          try {
            const responseTime = await makeRequest(endpoint);
            metrics.responseTimes.push(responseTime);
            metrics.successfulRequests++;

            // Progress indicator
            if (metrics.totalRequests % 100 === 0) {
              process.stdout.write(`.`);
            }
          } catch (err) {
            metrics.failedRequests++;
            metrics.errors.push(String(err));
            process.stdout.write(`✗`);
          }

          activeRequests--;
        })();

        promises.push(promise);
      }

      await Promise.all(promises);
    }

    completedBatches++;
    console.log(` ✅ Completed\n`);
  }

  metrics.endTime = Date.now();

  // Calculate results
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const sorted = metrics.responseTimes.sort((a, b) => a - b);
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);

  const results: Results = {
    p50: sorted[p50Index] || 0,
    p95: sorted[p95Index] || 0,
    p99: sorted[p99Index] || 0,
    avg: metrics.responseTimes.length > 0 
      ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
      : 0,
    min: Math.min(...metrics.responseTimes, Infinity),
    max: Math.max(...metrics.responseTimes, -Infinity),
    rps: metrics.totalRequests / duration,
    errorRate: (metrics.failedRequests / metrics.totalRequests) * 100,
    duration,
  };

  // Print report
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📊 LOAD TEST RESULTS`);
  console.log(`═`.repeat(50));
  console.log(`\nDuration:           ${results.duration.toFixed(2)}s`);
  console.log(`Total Requests:     ${metrics.totalRequests}`);
  console.log(`Successful:         ${metrics.successfulRequests} ✅`);
  console.log(`Failed:             ${metrics.failedRequests} ❌`);
  console.log(`Error Rate:         ${results.errorRate.toFixed(2)}%`);
  console.log(`\n⚡ Performance Metrics:`);
  console.log(`  p50 (median):     ${results.p50.toFixed(2)}ms ${results.p50 < 200 ? '✅' : '⚠️'}`);
  console.log(`  p95:              ${results.p95.toFixed(2)}ms ${results.p95 < 500 ? '✅' : '⚠️'}`);
  console.log(`  p99:              ${results.p99.toFixed(2)}ms ${results.p99 < 2000 ? '✅' : '⚠️'}`);
  console.log(`  Average:          ${results.avg.toFixed(2)}ms`);
  console.log(`  Min:              ${results.min.toFixed(2)}ms`);
  console.log(`  Max:              ${results.max.toFixed(2)}ms`);
  console.log(`\n🚀 Throughput:`);
  console.log(`  Requests/sec:     ${results.rps.toFixed(2)} RPS`);
  console.log(`${`═`.repeat(50)}\n`);

  // Success criteria
  console.log(`✅ SUCCESS CRITERIA:`);
  console.log(`  p50 < 200ms?      ${results.p50 < 200 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  p95 < 500ms?      ${results.p95 < 500 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  p99 < 2000ms?     ${results.p99 < 2000 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Error rate < 1%?  ${results.errorRate < 1 ? '✅ PASS' : '❌ FAIL'}`);

  const passed =
    results.p50 < 200 &&
    results.p95 < 500 &&
    results.p99 < 2000 &&
    results.errorRate < 1;

  console.log(`\n🎯 Overall Result:  ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    options,
    metrics: {
      totalRequests: metrics.totalRequests,
      successful: metrics.successfulRequests,
      failed: metrics.failedRequests,
    },
    results,
    passed,
  };

  import('fs').then((fs) => {
    fs.writeFileSync('/tmp/britv3-load-test-report.json', JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: /tmp/britv3-load-test-report.json\n`);
  });

  return results;
}

// Main
(async () => {
  const options = parseArgs();

  try {
    const results = await runLoadTest(options);
    process.exit(results.p95 < 500 && results.errorRate < 1 ? 0 : 1);
  } catch (err) {
    console.error('❌ Load test failed:', err);
    process.exit(1);
  }
})();
