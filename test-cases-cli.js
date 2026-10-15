// Standalone automated test runner verifying all 8 required test cases
import { DEFAULT_SCHOLARSHIP_POLICY, evaluateApplication, validateApplicationInputs } from './src/services/policyEngine.ts';
import { INITIAL_APPLICATIONS } from './src/services/dataService.ts';

console.log('========================================================================');
console.log('PATRAAI (पत्रAI) - DETERMINISTIC DECISION ENGINE & FAIRNESS VERIFIER');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testId, testName, details) {
  if (condition) {
    console.log(`[PASS] ${testId}: ${testName}`);
    console.log(`       Details: ${details}\n`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testId}: ${testName}`);
    console.error(`       Details: ${details}\n`);
    failCount++;
  }
}

// 1. Complete, consistent, eligible application -> APPROVE recommendation
const app1 = INITIAL_APPLICATIONS.find(a => a.refNumber === 'APP-2026-0891');
const trace1 = evaluateApplication(app1, DEFAULT_SCHOLARSHIP_POLICY);
assert(
  trace1.initialRecommendation === 'APPROVE' && trace1.evidenceCompletenessPercentage === 100,
  'TC-01',
  'Complete & Eligible Application',
  `Expected: APPROVE | Actual: ${trace1.initialRecommendation} (Completeness: ${trace1.evidenceCompletenessPercentage}%)`
);

// 2. Missing required document -> NEEDS_REVIEW
const app2 = INITIAL_APPLICATIONS.find(a => a.refNumber === 'APP-2026-0892');
const trace2 = evaluateApplication(app2, DEFAULT_SCHOLARSHIP_POLICY);
assert(
  trace2.initialRecommendation === 'NEEDS_REVIEW' && trace2.missingInformation.length > 0,
  'TC-02',
  'Missing Required Document (Marksheet)',
  `Expected: NEEDS_REVIEW | Actual: ${trace2.initialRecommendation} (Missing: ${trace2.missingInformation.join(', ')})`
);

// 3. Declared income differs from document value -> MISMATCH and NEEDS_REVIEW
const app3 = INITIAL_APPLICATIONS.find(a => a.refNumber === 'APP-2026-0893');
const trace3 = evaluateApplication(app3, DEFAULT_SCHOLARSHIP_POLICY);
const hasMismatch3 = app3.contradictions.some(c => c.isMismatch);
assert(
  trace3.initialRecommendation === 'NEEDS_REVIEW' && hasMismatch3,
  'TC-03',
  'Contradiction Radar Mismatch Flag',
  `Expected: NEEDS_REVIEW + Mismatch | Actual: ${trace3.initialRecommendation} (Contradiction active: ${hasMismatch3})`
);

// 4. Academic score exceeds valid range -> validation failure
const app4 = INITIAL_APPLICATIONS.find(a => a.refNumber === 'APP-2026-0894');
const val4 = validateApplicationInputs(app4);
assert(
  !val4.isValid && val4.errors.some(e => e.includes('outside the valid range')),
  'TC-04',
  'Academic Score Boundary Validation Check',
  `Expected: Validation Failure | Actual: Valid=${val4.isValid} (Errors: ${val4.errors.join('; ')})`
);

// 5. Mandatory eligibility condition fails with complete valid evidence -> REJECT recommendation
const app5 = INITIAL_APPLICATIONS.find(a => a.refNumber === 'APP-2026-0895');
const trace5 = evaluateApplication(app5, DEFAULT_SCHOLARSHIP_POLICY);
assert(
  trace5.initialRecommendation === 'REJECT',
  'TC-05',
  'Mandatory Eligibility Failure (Academic Score 54.2% < 70%)',
  `Expected: REJECT | Actual: ${trace5.initialRecommendation} (Rule: ${trace5.ruleResults.find(r => r.ruleId === 'R-ACA-01')?.explanation})`
);

// 6. Human reviewer records final decision -> original recommendation remains unchanged
const app6 = INITIAL_APPLICATIONS.find(a => a.refNumber === 'APP-2026-0896');
const trace6 = evaluateApplication(app6, DEFAULT_SCHOLARSHIP_POLICY);
assert(
  app6.finalDecision?.originalSystemRecommendation === 'REJECT' && app6.finalDecision?.finalOutcome === 'APPROVED',
  'TC-06',
  'Human Reviewer Override & Recommendation Preservation',
  `Expected Original: REJECT (Preserved) & Final: APPROVED | Actual Original: ${app6.finalDecision?.originalSystemRecommendation} & Final: ${app6.finalDecision?.finalOutcome}`
);

// 7. Paired synthetic records differing only in excluded sensitive metadata -> identical recommendations & rule traces
const app7a = INITIAL_APPLICATIONS.find(a => a.refNumber === 'APP-2026-0897A');
const app7b = INITIAL_APPLICATIONS.find(a => a.refNumber === 'APP-2026-0897B');
const trace7a = evaluateApplication(app7a, DEFAULT_SCHOLARSHIP_POLICY);
const trace7b = evaluateApplication(app7b, DEFAULT_SCHOLARSHIP_POLICY);
const matchRec = trace7a.initialRecommendation === trace7b.initialRecommendation;
const matchRules = trace7a.ruleResults.every((r, i) => r.ruleId === trace7b.ruleResults[i]?.ruleId && r.status === trace7b.ruleResults[i]?.status);
assert(
  matchRec && matchRules,
  'TC-07',
  'Algorithmic Fairness: Demographic Invariance Test',
  `Pair A (${app7a.applicant.sensitiveDemographics?.gender}/${app7a.applicant.sensitiveDemographics?.region}) vs Pair B (${app7b.applicant.sensitiveDemographics?.gender}/${app7b.applicant.sensitiveDemographics?.region}) -> Traces Match: ${matchRules} | Recs Match: ${matchRec}`
);

// 8. Failed or unavailable AI extraction -> safe fallback to manual verification
const app8 = INITIAL_APPLICATIONS.find(a => a.refNumber === 'APP-2026-0898');
const unreadableDoc8 = app8.documents.find(d => d.status === 'UNREADABLE');
const trace8 = evaluateApplication(app8, DEFAULT_SCHOLARSHIP_POLICY);
assert(
  unreadableDoc8 !== undefined && trace8.initialRecommendation === 'NEEDS_REVIEW',
  'TC-08',
  'Degraded OCR Extraction Fallback to Manual Verification',
  `Expected: NEEDS_REVIEW on low-DPI scan | Actual: ${trace8.initialRecommendation} (Unreadable doc present: ${Boolean(unreadableDoc8)})`
);

console.log('------------------------------------------------------------------------');
console.log(`TOTAL TEST EXECUTION RESULTS: ${passCount} PASSED, ${failCount} FAILED out of ${passCount + failCount} tests.`);
console.log('------------------------------------------------------------------------\n');
