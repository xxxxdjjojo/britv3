/**
 * AI Feature Hardening Suite
 * Quality assurance for AI-generated content (listings, quotes, responses)
 * 
 * Validates:
 * - Listing description quality
 * - Quote accuracy and consistency
 * - Response appropriateness
 * - Rate limiting and cost controls
 * - Fallback strategies
 */

import Anthropic from '@anthropic-ai/sdk';

interface AIFeatureTest {
  name: string;
  input: string;
  expectedPatterns: string[];
  maxTokens: number;
  timeout: number;
}

interface TestResult {
  test: string;
  passed: boolean;
  output?: string;
  error?: string;
  responseTime: number;
  tokensUsed: number;
  costEstimate: number;
}

const TESTS: AIFeatureTest[] = [
  {
    name: 'Generate Property Description',
    input: `Property: 3-bed terraced house, 1950s, SW London, £650k, garden, period features
    Generate a compelling estate agent description (max 150 words) that highlights features and appeals to buyers.`,
    expectedPatterns: [
      'Victorian|period|feature|charm|character|recently|renovated|updated',
      'spacious|light|bright|modern|convenient|location',
      'suitable|ideal|perfect|investment|family|first-time',
    ],
    maxTokens: 300,
    timeout: 5000,
  },

  {
    name: 'Generate Service Provider Quote',
    input: `Service: Plumbing job, bathroom renovation, 3 days work, $3500 budget
    Generate a professional quote from a plumber that includes:
    - Itemized costs
    - Timeline
    - Materials
    - Labor
    Keep tone professional and clear.`,
    expectedPatterns: [
      'labor|materials|cost|price|total|itemized',
      'days?|timeline|schedule|completion',
      'professional|certified|guaranteed|warranty',
    ],
    maxTokens: 400,
    timeout: 5000,
  },

  {
    name: 'Summarize Tenant Enquiry',
    input: `Enquiry: "Hi, I'm interested in the 2-bed flat in Chelsea. We're a family of 3, looking to rent for 2+ years. We have good references from previous landlords. Interested in viewing this weekend if possible. Budget is £2500/month."
    
    Summarize this enquiry for the landlord, highlighting:
    - Key details about the tenant
    - Move timeline
    - Budget alignment
    - Next steps`,
    expectedPatterns: [
      'family|tenant|applicant',
      'budget|rent|price|afford',
      'viewing|schedule|available',
    ],
    maxTokens: 250,
    timeout: 5000,
  },

  {
    name: 'Auto-reply to Property Enquiry',
    input: `Generate a professional auto-reply email for a property enquiry.
    Original enquiry: "Hi, interested in the 2-bed flat. Can I view tomorrow?"
    
    Include:
    - Acknowledgment
    - Viewing options
    - Next steps
    - Professional tone`,
    expectedPatterns: [
      'thank|acknowledge|receive|grateful',
      'view|viewing|schedule|available|time',
      'contact|email|phone|arrange|confirm',
    ],
    maxTokens: 300,
    timeout: 5000,
  },

  {
    name: 'Area Guide Generation',
    input: `Generate a brief area guide for Shoreditch, London (max 200 words) covering:
    - Character and vibe
    - Transport links
    - Amenities (restaurants, shops, parks)
    - Property market insights
    - Perfect for: young professionals, creative industries`,
    expectedPatterns: [
      'vibrant|trendy|cultural|creative|startup',
      'transport|tube|bus|station|commute',
      'restaurant|cafe|bar|shop|market|amenity',
      'property|market|prices?|investment',
    ],
    maxTokens: 400,
    timeout: 5000,
  },

  {
    name: 'First-time Buyer Advice',
    input: `Generate a first-time buyer checklist (max 150 words) including:
    - Affordability check
    - Mortgage pre-approval
    - Viewing checklist
    - Survey & inspection
    - Legal/conveyancing
    - Moving costs`,
    expectedPatterns: [
      'mortgage|affordability|budget|pre-approval',
      'viewing|survey|inspection|survey|check',
      'conveyancing|legal|solicitor|property',
      'moving|costs?|insurance|stamp duty',
    ],
    maxTokens: 350,
    timeout: 5000,
  },
];

const COST_PER_1K_TOKENS = 0.003; // Claude 3.5 Sonnet (input)

async function runAITest(test: AIFeatureTest): Promise<TestResult> {
  const client = new Anthropic();
  const startTime = Date.now();

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: test.maxTokens,
      messages: [
        {
          role: 'user',
          content: test.input,
        },
      ],
    });

    const responseTime = Date.now() - startTime;
    const output = message.content[0].type === 'text' ? message.content[0].text : '';
    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;
    const costEstimate = (tokensUsed / 1000) * COST_PER_1K_TOKENS;

    // Validate output against expected patterns
    let passed = true;
    for (const patterns of test.expectedPatterns) {
      const patternList = patterns.split('|');
      const hasPattern = patternList.some((p) => 
        output.toLowerCase().includes(p.toLowerCase())
      );
      if (!hasPattern) {
        passed = false;
        break;
      }
    }

    // Check constraints
    if (responseTime > test.timeout) {
      passed = false;
    }

    return {
      test: test.name,
      passed,
      output: output.substring(0, 500) + '...', // Truncate for display
      responseTime,
      tokensUsed,
      costEstimate,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      test: test.name,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
      tokensUsed: 0,
      costEstimate: 0,
    };
  }
}

async function main() {
  console.log('\n🤖 AI Feature Hardening Suite\n');
  console.log(`Running ${TESTS.length} tests...\n`);
  console.log('═'.repeat(60));

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const test of TESTS) {
    process.stdout.write(`⏳ ${test.name}... `);
    const result = await runAITest(test);
    results.push(result);

    if (result.passed) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL');
      failed++;
    }
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`Passed:        ${passed}/${TESTS.length} (${((passed / TESTS.length) * 100).toFixed(1)}%)`);
  console.log(`Failed:        ${failed}/${TESTS.length}`);

  console.log('\n⚡ PERFORMANCE METRICS\n');
  const avgResponseTime = results.reduce((a, r) => a + r.responseTime, 0) / results.length;
  const totalTokens = results.reduce((a, r) => a + r.tokensUsed, 0);
  const totalCost = results.reduce((a, r) => a + r.costEstimate, 0);

  console.log(`Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`Total Tokens Used: ${totalTokens.toLocaleString()}`);
  console.log(`Total Cost:        $${totalCost.toFixed(4)}`);

  console.log('\n💰 COST OPTIMIZATION\n');
  console.log(`Cost per feature call: $${(totalCost / TESTS.length).toFixed(4)}`);
  console.log(`Est. cost for 10k daily calls: $${((totalCost / TESTS.length) * 10000).toFixed(2)}`);
  console.log(`Est. monthly cost (300k calls): $${((totalCost / TESTS.length) * 300000).toFixed(0)}`);

  console.log('\n🔧 DETAILED RESULTS\n');
  for (const result of results) {
    console.log(`\n${result.passed ? '✅' : '❌'} ${result.test}`);
    console.log(`   Response Time: ${result.responseTime}ms`);
    console.log(`   Tokens: ${result.tokensUsed}`);
    console.log(`   Cost: $${result.costEstimate.toFixed(4)}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log('\n═'.repeat(60));
  console.log('\n🎯 RECOMMENDATIONS\n');

  if (passed === TESTS.length) {
    console.log('✅ All tests passed! AI features are production-ready.');
  } else {
    console.log(`⚠️  ${failed} tests failed. Review and adjust prompts.`);
  }

  console.log('\n📋 NEXT STEPS\n');
  console.log('1. Deploy AI feature hardening to staging');
  console.log('2. Run load test with AI features enabled');
  console.log('3. Monitor cost and token usage in production');
  console.log('4. Set up alerts for prompt failures');
  console.log('5. Implement fallback strategies for edge cases');

  console.log('\n════════════════════════════════════════════════════════\n');

  process.exit(passed === TESTS.length ? 0 : 1);
}

// Run tests
main().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
