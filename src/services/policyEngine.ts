import type {
  ApplicationRecord,
  ComparisonResult,
  ContradictionRecord,
  DecisionReplayStep,
  DecisionTrace,
  DocumentType,
  PolicyConfiguration,
  RuleEvaluationResult,
  RuleStatus,
} from '../types/index.ts';
import {
  normalizeAcademicScore,
  normalizeCurrency,
  normalizeText,
} from './extractionAdapter.ts';

/**
 * Configurable, versioned illustrative demo scholarship policy.
 * Max annual family income: ₹2,50,000.
 * Minimum academic marks: 60%.
 * Required documents: income certificate and marksheet.
 */
export const DEFAULT_SCHOLARSHIP_POLICY: PolicyConfiguration = {
  id: 'POL-SCH-2026-V1',
  name: 'National Merit-cum-Means Postsecondary Policy',
  schemeType: 'SCHOLARSHIP',
  version: '2026.1.4',
  effectiveDate: '2026-01-01',
  isActive: true,
  maxAnnualIncome: 250000, // Illustrative threshold: ₹2,50,000
  minAcademicPercentage: 60.0, // Illustrative threshold: 60.0%
  mandatoryDocumentTypes: ['INCOME_CERTIFICATE', 'MARKSHEET'],
  comparisonToleranceIncomePercent: 2.0, // 2% tolerance
  requireAuthenticityForApproval: false, // Default illustrative demo policy
  illustrativeNote:
    'Illustrative demo policy for hackathon demonstration. All sample thresholds are illustrative, not official financial or government regulations.',
  rules: [
    {
      id: 'R-INC-01',
      name: 'Family Annual Income Ceiling',
      field: 'income',
      operator: '<=',
      thresholdValue: 250000,
      isMandatory: true,
      failureAction: 'REJECT',
      description: 'Annual family gross income must not exceed ₹2,50,000 as certified by revenue authority.',
    },
    {
      id: 'R-ACA-01',
      name: 'Academic Merit Minimum Threshold',
      field: 'academicScore',
      operator: '>=',
      thresholdValue: 60.0,
      isMandatory: true,
      failureAction: 'REJECT',
      description: 'Candidate must have secured a minimum of 60.0% marks in qualifying academic examination.',
    },
    {
      id: 'R-DOC-01',
      name: 'Mandatory Income Certificate Completeness',
      field: 'document_INCOME_CERTIFICATE',
      operator: '==',
      thresholdValue: 'VERIFIED',
      isMandatory: true,
      failureAction: 'NEEDS_REVIEW',
      description: 'Official income certificate must be uploaded, readable, and free from critical mismatch.',
    },
    {
      id: 'R-DOC-02',
      name: 'Mandatory Marksheet Completeness',
      field: 'document_MARKSHEET',
      operator: '==',
      thresholdValue: 'VERIFIED',
      isMandatory: true,
      failureAction: 'NEEDS_REVIEW',
      description: 'Qualifying semester/annual marksheet must be uploaded, readable, and verified.',
    },
    {
      id: 'R-CON-01',
      name: 'Declared vs Extracted Income Consistency',
      field: 'income_consistency',
      operator: '==',
      thresholdValue: 'MATCH',
      isMandatory: true,
      failureAction: 'NEEDS_REVIEW',
      description: 'Declared income must match the value extracted from official income certificate within permissible tolerance.',
    },
  ],
};

export const DEFAULT_LOAN_POLICY: PolicyConfiguration = {
  id: 'POL-LOAN-2026-V1',
  name: 'Higher Education Concessional Student Credit Scheme',
  schemeType: 'LOAN',
  version: '2026.2.0',
  effectiveDate: '2026-02-01',
  isActive: true,
  maxAnnualIncome: 800000, // ₹8,00,000 for subsidized loan
  minAcademicPercentage: 55.0,
  mandatoryDocumentTypes: ['INCOME_CERTIFICATE', 'MARKSHEET', 'IDENTITY_DOC'],
  comparisonToleranceIncomePercent: 5.0,
  requireAuthenticityForApproval: false,
  illustrativeNote: 'Illustrative demo loan policy for hackathon demonstration. Not real banking regulations.',
  rules: [
    {
      id: 'R-LN-INC-01',
      name: 'Subsidized Loan Maximum Income Cap',
      field: 'income',
      operator: '<=',
      thresholdValue: 800000,
      isMandatory: true,
      failureAction: 'REJECT',
      description: 'Annual family gross income must not exceed ₹8,00,000 for interest subsidy qualification.',
    },
    {
      id: 'R-LN-ACA-01',
      name: 'Qualifying Admission Merit Score',
      field: 'academicScore',
      operator: '>=',
      thresholdValue: 55.0,
      isMandatory: true,
      failureAction: 'REJECT',
      description: 'Candidate must hold minimum 55.0% marks in the qualifying board/university examination.',
    },
  ],
};

/**
 * Validate input values for boundaries and arithmetic consistency
 */
export function validateApplicationInputs(app: ApplicationRecord): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!app.applicant.fullName || app.applicant.fullName.trim().length < 2) {
    errors.push('Applicant full name is required (minimum 2 characters).');
  }

  if (app.applicant.declaredAnnualIncome < 0) {
    errors.push('Declared annual income cannot be negative.');
  }

  // Arithmetic consistency for marks:
  // Validate that marks obtained are non-negative and do not exceed maximum marks
  if (app.applicant.maxScore <= 0) {
    errors.push('Maximum marks must be greater than zero.');
  } else if (app.applicant.marksObtained < 0) {
    errors.push('Marks obtained cannot be negative.');
  } else if (app.applicant.marksObtained > app.applicant.maxScore) {
    errors.push(
      `Marks obtained (${app.applicant.marksObtained}) exceeds maximum marks (${app.applicant.maxScore}). Arithmetic bound violation.`
    );
  }

  if (app.applicant.academicScore < 0 || app.applicant.academicScore > 100) {
    errors.push(
      `Academic percentage score (${app.applicant.academicScore}%) is outside the valid range of 0% to 100%.`
    );
  }

  if (!app.applicant.institution || app.applicant.institution.trim().length < 2) {
    errors.push('Educational institution name is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Contradiction Radar Engine (Layer 3)
 * Compares applicant-declared information with extracted document fields.
 * Uses exact statuses: MATCH, MISMATCH, NOT_FOUND, INVALID_INPUT, NEEDS_REVIEW.
 * Normalizes currency, dates, whitespace, and percentage formats before comparison.
 * Does not treat missing data as a match. Validates bounds & arithmetic consistency.
 */
export function runContradictionRadar(
  app: ApplicationRecord,
  policy: PolicyConfiguration = DEFAULT_SCHOLARSHIP_POLICY
): ContradictionRecord[] {
  const records: ContradictionRecord[] = [];

  // 1. Income Comparison
  const incDoc = app.documents.find((d) => d.type === 'INCOME_CERTIFICATE');
  const declaredIncome = app.applicant.declaredAnnualIncome;
  const rawExtractedIncome = incDoc?.extractedFields?.annualIncome?.extractedValue;

  const normDeclaredIncome = normalizeCurrency(declaredIncome).normalized;
  const normExtractedIncome = normalizeCurrency(rawExtractedIncome).normalized;

  let incomeResult: ComparisonResult = 'NEEDS_REVIEW';
  let incomeExplanation = '';
  let incomeNextAction = '';

  if (declaredIncome < 0) {
    incomeResult = 'INVALID_INPUT';
    incomeExplanation = 'Declared income is negative; input outside sensible bounds.';
    incomeNextAction = 'Applicant must correct declared income in form.';
  } else if (!incDoc) {
    incomeResult = 'NOT_FOUND';
    incomeExplanation = 'Income certificate document is missing from submission.';
    incomeNextAction = 'Upload official income certificate.';
  } else if (incDoc.readability === 'UNREADABLE' || incDoc.status === 'UNREADABLE') {
    incomeResult = 'NEEDS_REVIEW';
    incomeExplanation = 'Income certificate is unreadable due to optical scan defects.';
    incomeNextAction = 'Upload clear, higher resolution copy of income certificate.';
  } else if (normExtractedIncome === null) {
    incomeResult = 'NOT_FOUND';
    incomeExplanation = 'Certified income field could not be found or extracted from the uploaded document.';
    incomeNextAction = 'Officer must inspect physical scan or applicant must re-upload document with clear income box.';
  } else {
    // Normalization check with policy tolerance
    const diff = Math.abs(normDeclaredIncome! - normExtractedIncome);
    const maxAllowedDiff = normDeclaredIncome! * (policy.comparisonToleranceIncomePercent / 100);

    if (diff <= maxAllowedDiff) {
      incomeResult = 'MATCH';
      incomeExplanation = `Declared income (₹${normDeclaredIncome?.toLocaleString(
        'en-IN'
      )}) matches certified document income (₹${normExtractedIncome.toLocaleString(
        'en-IN'
      )}) within ${policy.comparisonToleranceIncomePercent}% tolerance.`;
      incomeNextAction = 'Proceed to income ceiling eligibility evaluation.';
    } else {
      incomeResult = 'MISMATCH';
      incomeExplanation = `Variance detected: Declared income (₹${normDeclaredIncome?.toLocaleString(
        'en-IN'
      )}) differs from certified certificate income (₹${normExtractedIncome.toLocaleString(
        'en-IN'
      )}) by ₹${diff.toLocaleString('en-IN')}. Note: Discrepancy is not proof of fraud.`;
      incomeNextAction = 'Officer must verify cause of variance or request clarification from applicant.';
    }
  }

  records.push({
    id: `cntr-inc-${app.refNumber}`,
    documentType: 'INCOME_CERTIFICATE',
    fieldName: 'Annual Family Income',
    declaredValue: `₹${declaredIncome.toLocaleString('en-IN')}`,
    extractedValue: rawExtractedIncome ? String(rawExtractedIncome) : null,
    sourceDocument: incDoc?.fileName || 'Income Certificate (Missing)',
    comparisonResult: incomeResult,
    explanation: incomeExplanation,
    recommendedNextAction: incomeNextAction,
    normalizedDeclared: normDeclaredIncome,
    normalizedExtracted: normExtractedIncome,
    isMismatch: incomeResult === 'MISMATCH',
    detectedAt: new Date().toISOString(),
  });

  // 2. Academic Score Comparison
  const markDoc = app.documents.find((d) => d.type === 'MARKSHEET');
  const declaredScore = app.applicant.academicScore;
  const rawExtractedMarks = markDoc?.extractedFields?.totalMarksObtained?.extractedValue;

  const normDeclaredScore = normalizeAcademicScore(declaredScore).normalized;
  const normExtractedScore = normalizeAcademicScore(rawExtractedMarks).normalized;

  let scoreResult: ComparisonResult = 'NEEDS_REVIEW';
  let scoreExplanation = '';
  let scoreNextAction = '';

  if (app.applicant.marksObtained > app.applicant.maxScore || declaredScore < 0 || declaredScore > 100) {
    scoreResult = 'INVALID_INPUT';
    scoreExplanation = `Declared marks (${app.applicant.marksObtained}) exceed maximum allowable score (${app.applicant.maxScore}) or percentage outside [0, 100]%.`;
    scoreNextAction = 'Applicant must correct marks secured to fall within valid range.';
  } else if (!markDoc) {
    scoreResult = 'NOT_FOUND';
    scoreExplanation = 'Marksheet document is missing from submission.';
    scoreNextAction = 'Upload qualifying semester/degree marksheet.';
  } else if (markDoc.readability === 'UNREADABLE' || markDoc.status === 'UNREADABLE') {
    scoreResult = 'NEEDS_REVIEW';
    scoreExplanation = 'Marksheet is unreadable due to optical scan defects.';
    scoreNextAction = 'Upload clear, higher resolution copy of marksheet.';
  } else if (normExtractedScore === null) {
    scoreResult = 'NOT_FOUND';
    scoreExplanation = 'Marks score could not be found or extracted from the uploaded marksheet.';
    scoreNextAction = 'Officer must inspect mark summary table manually.';
  } else {
    const scoreDiff = Math.abs(normDeclaredScore! - normExtractedScore);
    if (scoreDiff <= 1.0) {
      scoreResult = 'MATCH';
      scoreExplanation = `Declared percentage (${normDeclaredScore}%) matches certified marksheet (${normExtractedScore}%).`;
      scoreNextAction = 'Proceed to merit threshold evaluation.';
    } else {
      scoreResult = 'MISMATCH';
      scoreExplanation = `Marksheet percentage (${normExtractedScore}%) differs from declared percentage (${normDeclaredScore}%). Note: Discrepancy is not proof of fraud.`;
      scoreNextAction = 'Officer must verify grading scale or request clarification.';
    }
  }

  records.push({
    id: `cntr-mark-${app.refNumber}`,
    documentType: 'MARKSHEET',
    fieldName: 'Academic Exam Score',
    declaredValue: `${declaredScore}%`,
    extractedValue: rawExtractedMarks ? String(rawExtractedMarks) : null,
    sourceDocument: markDoc?.fileName || 'Marksheet (Missing)',
    comparisonResult: scoreResult,
    explanation: scoreExplanation,
    recommendedNextAction: scoreNextAction,
    normalizedDeclared: normDeclaredScore,
    normalizedExtracted: normExtractedScore,
    isMismatch: scoreResult === 'MISMATCH',
    detectedAt: new Date().toISOString(),
  });

  return records;
}

/**
 * Deterministic Decision Evaluation Engine
 * Precedence Order:
 * 1. Invalid inputs or incomplete evidence -> NEEDS_REVIEW or validation error.
 * 2. Missing documents, unresolved mismatches, uncertain extraction, or unavailable evidence -> NEEDS_REVIEW.
 * 3. Confirmed mandatory eligibility failure, based on complete and valid evidence -> REJECT recommendation.
 * 4. Authenticity check: if required by policy and unverified -> NEEDS_REVIEW.
 * 5. APPROVE recommendation only when all mandatory rules pass and all evidence is complete and consistent.
 */
export function evaluateApplication(
  app: ApplicationRecord,
  policy: PolicyConfiguration = DEFAULT_SCHOLARSHIP_POLICY
): DecisionTrace {
  const inputValidation = validateApplicationInputs(app);
  const ruleResults: RuleEvaluationResult[] = [];
  const reasonsForEscalation: string[] = [];
  const missingInformation: string[] = [];
  const unresolvedIssues: string[] = [];

  // Step 1: Input Validation Precedence
  if (!inputValidation.isValid) {
    return {
      applicationRef: app.refNumber,
      policyId: policy.id,
      policyName: policy.name,
      policyVersion: policy.version,
      evaluatedAt: new Date().toISOString(),
      initialRecommendation: 'NEEDS_REVIEW',
      evidenceCompletenessPercentage: 0,
      ruleResults: [
        {
          ruleId: 'VAL-001',
          ruleName: 'Input Range and Schema Integrity',
          policyVersion: policy.version,
          category: 'CONSISTENCY',
          isMandatory: true,
          actualInputValue: inputValidation.errors.join('; '),
          thresholdCondition: 'Valid inputs within numeric and structural bounds (marks <= maxMarks)',
          status: 'FAIL',
          evidenceReference: 'Applicant Declarations',
          reasonCode: 'ERR_INVALID_INPUT_BOUNDS',
          explanation: `Application data failed baseline validation: ${inputValidation.errors.join('; ')}`,
        },
      ],
      reasonsForEscalation: inputValidation.errors,
      missingInformation: ['Correct declared values within valid bounds.'],
      unresolvedIssues: inputValidation.errors,
      authenticityStatusSummary: 'NOT_CHECKED',
      recommendedNextAction: 'Review declared values; correct invalid numeric fields (e.g. marks secured).',
      confidenceScore: 0.1,
    };
  }

  // Step 2: Document Completeness & Readability
  let mandatoryDocsPresentCount = 0;
  for (const docType of policy.mandatoryDocumentTypes) {
    const doc = app.documents.find((d) => d.type === docType);
    if (!doc) {
      missingInformation.push(`Mandatory document missing: ${docType.replace('_', ' ')}`);
      unresolvedIssues.push(`Missing mandatory evidence: ${docType}`);
      ruleResults.push({
        ruleId: `DOC-REQ-${docType}`,
        ruleName: `Mandatory Document: ${docType.replace('_', ' ')}`,
        policyVersion: policy.version,
        category: 'DOCUMENTATION',
        isMandatory: true,
        actualInputValue: 'MISSING',
        thresholdCondition: 'Document must be uploaded and verified',
        status: 'FAIL',
        evidenceReference: 'Uploaded Documents Registry',
        reasonCode: 'DOC_MISSING',
        explanation: `Required ${docType.replace('_', ' ')} has not been provided by applicant.`,
      });
    } else {
      mandatoryDocsPresentCount++;
      if (doc.readability === 'UNREADABLE' || doc.status === 'UNREADABLE') {
        reasonsForEscalation.push(
          `${doc.title} is unreadable: ${doc.readabilityErrorReason || 'Optical text recognition failed'}`
        );
        unresolvedIssues.push(`Unreadable document scan: ${doc.fileName}`);
        ruleResults.push({
          ruleId: `DOC-READ-${docType}`,
          ruleName: `Readability Check: ${doc.title}`,
          policyVersion: policy.version,
          category: 'DOCUMENTATION',
          isMandatory: true,
          actualInputValue: doc.readability,
          thresholdCondition: 'Must be READABLE',
          status: 'FAIL',
          evidenceReference: `${doc.fileName} (${doc.id})`,
          reasonCode: 'DOC_UNREADABLE',
          explanation: `Document quality failed readability threshold: ${
            doc.readabilityErrorReason || 'Blurry or low DPI scan'
          }.`,
        });
      } else {
        ruleResults.push({
          ruleId: `DOC-READ-${docType}`,
          ruleName: `Readability Check: ${doc.title}`,
          policyVersion: policy.version,
          category: 'DOCUMENTATION',
          isMandatory: true,
          actualInputValue: doc.readability,
          thresholdCondition: 'Must be READABLE',
          status: 'PASS',
          evidenceReference: `${doc.fileName} (${doc.id})`,
          reasonCode: 'DOC_READABLE_PASS',
          explanation: 'Document is clear and suitable for verification.',
        });
      }
    }
  }

  const evidenceCompletenessPercentage = Math.round(
    (mandatoryDocsPresentCount / policy.mandatoryDocumentTypes.length) * 100
  );

  // Step 3: Run Contradiction Radar
  const contradictions = runContradictionRadar(app, policy);
  const activeMismatches = contradictions.filter(
    (c) => c.comparisonResult === 'MISMATCH' && c.reviewerResolution !== 'RESOLVED' && c.reviewerResolution !== 'DISMISSED_TYPO'
  );
  const notFoundFields = contradictions.filter((c) => c.comparisonResult === 'NOT_FOUND');

  for (const c of contradictions) {
    if (c.comparisonResult === 'MISMATCH') {
      reasonsForEscalation.push(
        `Discrepancy detected in ${c.fieldName}: Declared [${c.declaredValue}] vs Extracted [${c.extractedValue}]`
      );
      unresolvedIssues.push(`Contradiction in ${c.fieldName}`);
      ruleResults.push({
        ruleId: `CONTRAD-${c.fieldName.toUpperCase().replace(/\s+/g, '_')}`,
        ruleName: `Consistency Check: ${c.fieldName}`,
        policyVersion: policy.version,
        category: 'CONSISTENCY',
        isMandatory: true,
        actualInputValue: `Declared: ${c.declaredValue} vs Extracted: ${c.extractedValue}`,
        thresholdCondition: 'Declared value matches verified document within permissible tolerance',
        status: 'FAIL',
        evidenceReference: `${c.sourceDocument}`,
        reasonCode: 'VALUE_CONTRADICTION',
        explanation: c.explanation,
      });
    } else if (c.comparisonResult === 'MATCH') {
      ruleResults.push({
        ruleId: `CONTRAD-${c.fieldName.toUpperCase().replace(/\s+/g, '_')}`,
        ruleName: `Consistency Check: ${c.fieldName}`,
        policyVersion: policy.version,
        category: 'CONSISTENCY',
        isMandatory: true,
        actualInputValue: `${c.declaredValue}`,
        thresholdCondition: 'Declared value matches verified document',
        status: 'PASS',
        evidenceReference: `${c.sourceDocument}`,
        reasonCode: 'VALUE_CONSISTENT',
        explanation: c.explanation,
      });
    }
  }

  // Step 4: Deterministic Policy Eligibility Rules Evaluation
  // Income Ceiling Rule
  const effectiveIncome = app.applicant.declaredAnnualIncome;
  const isIncomeEligible = effectiveIncome <= policy.maxAnnualIncome;

  ruleResults.push({
    ruleId: 'R-INC-01',
    ruleName: 'Family Annual Income Ceiling',
    policyVersion: policy.version,
    category: 'ELIGIBILITY',
    isMandatory: true,
    actualInputValue: `₹${effectiveIncome.toLocaleString('en-IN')}`,
    thresholdCondition: `<= ₹${policy.maxAnnualIncome.toLocaleString('en-IN')}`,
    status: isIncomeEligible ? 'PASS' : 'FAIL',
    evidenceReference: 'Income Certificate & Declared Income',
    reasonCode: isIncomeEligible ? 'INCOME_PASS' : 'INCOME_EXCEEDS_CEILING',
    explanation: isIncomeEligible
      ? `Annual income of ₹${effectiveIncome.toLocaleString('en-IN')} satisfies ceiling of ₹${policy.maxAnnualIncome.toLocaleString('en-IN')}.`
      : `Annual income of ₹${effectiveIncome.toLocaleString('en-IN')} exceeds allowable threshold of ₹${policy.maxAnnualIncome.toLocaleString('en-IN')}.`,
  });

  // Academic Merit Rule
  const effectiveScore = app.applicant.academicScore;
  const isScoreEligible = effectiveScore >= policy.minAcademicPercentage;

  ruleResults.push({
    ruleId: 'R-ACA-01',
    ruleName: 'Academic Merit Minimum Threshold',
    policyVersion: policy.version,
    category: 'ELIGIBILITY',
    isMandatory: true,
    actualInputValue: `${effectiveScore}%`,
    thresholdCondition: `>= ${policy.minAcademicPercentage}%`,
    status: isScoreEligible ? 'PASS' : 'FAIL',
    evidenceReference: 'Semester Marksheet & Declared Marks',
    reasonCode: isScoreEligible ? 'ACADEMIC_PASS' : 'ACADEMIC_BELOW_MINIMUM',
    explanation: isScoreEligible
      ? `Academic score of ${effectiveScore}% meets minimum requirement of ${policy.minAcademicPercentage}%.`
      : `Academic score of ${effectiveScore}% falls short of required ${policy.minAcademicPercentage}%.`,
  });

  // Step 5: Authenticity Status Check
  let overallAuthenticity: import('../types/index.ts').AuthenticityStatus = 'NOT_CHECKED';
  const hasTrustedAuth = app.documents.some((d) => d.authenticity === 'VERIFIED_BY_TRUSTED_SOURCE');
  const hasFailedAuth = app.documents.some((d) => d.authenticity === 'VERIFICATION_FAILED');
  const hasUnavailAuth = app.documents.some((d) => d.authenticity === 'VERIFICATION_UNAVAILABLE');

  if (hasFailedAuth) overallAuthenticity = 'VERIFICATION_FAILED';
  else if (hasTrustedAuth) overallAuthenticity = 'VERIFIED_BY_TRUSTED_SOURCE';
  else if (hasUnavailAuth) overallAuthenticity = 'VERIFICATION_UNAVAILABLE';
  else overallAuthenticity = 'NOT_CHECKED';

  // Step 6: Hierarchical Decision Precedence Resolution
  let initialRecommendation: 'APPROVE' | 'REJECT' | 'NEEDS_REVIEW' = 'NEEDS_REVIEW';
  let recommendedNextAction = '';

  const hasMissingDocs = missingInformation.length > 0;
  const hasActiveMismatches = activeMismatches.length > 0;
  const hasUnreadableDocs = app.documents.some(
    (d) => policy.mandatoryDocumentTypes.includes(d.type) && d.readability === 'UNREADABLE'
  );
  const mandatoryEligibilityFails = ruleResults.filter(
    (r) => r.category === 'ELIGIBILITY' && r.isMandatory && r.status === 'FAIL'
  );

  // Confidence calculation
  let totalConf = 0;
  let countConf = 0;
  for (const doc of app.documents) {
    for (const f of Object.values(doc.extractedFields)) {
      if (typeof f.confidence === 'number') {
        totalConf += f.confidence;
        countConf++;
      }
    }
  }
  const avgConf = countConf > 0 ? totalConf / countConf : 0.8;
  const confidenceScore = Math.min(
    1,
    Math.max(0.1, Number(((evidenceCompletenessPercentage / 100) * 0.5 + avgConf * 0.5).toFixed(2)))
  );

  // Precedence 1 & 2: Missing docs, unreadable docs, active contradictions, or missing required fields -> NEEDS_REVIEW
  if (hasMissingDocs || hasUnreadableDocs || hasActiveMismatches || notFoundFields.length > 0) {
    initialRecommendation = 'NEEDS_REVIEW';
    if (hasMissingDocs) {
      recommendedNextAction = `Mandatory document missing (${missingInformation.join(
        ', '
      )}). Case cannot proceed to approval.`;
    } else if (hasActiveMismatches) {
      recommendedNextAction =
        'Contradiction Radar flagged active discrepancy between declared and certified document data. Officer review required.';
    } else if (hasUnreadableDocs) {
      recommendedNextAction = 'Applicant must re-upload a clear, readable copy of the unreadable document.';
    } else {
      recommendedNextAction = 'Required fields missing from extracted document. Officer manual inspection required.';
    }
  }
  // Precedence 3: Confirmed mandatory eligibility failure with complete and valid evidence -> REJECT recommendation
  else if (mandatoryEligibilityFails.length > 0) {
    initialRecommendation = 'REJECT';
    const failReasons = mandatoryEligibilityFails.map((f) => `${f.ruleName} (${f.thresholdCondition})`).join('; ');
    recommendedNextAction = `Mandatory eligibility condition failed: ${failReasons}. Adverse recommendation recorded per Policy ${policy.version}.`;
  }
  // Precedence 4: If policy mandates verified authenticity but authenticity remains unverified -> do not approve automatically
  else if (policy.requireAuthenticityForApproval && overallAuthenticity !== 'VERIFIED_BY_TRUSTED_SOURCE') {
    initialRecommendation = 'NEEDS_REVIEW';
    recommendedNextAction =
      'Authenticity verification is mandated by policy but remains unverified. Officer manual verification workflow required.';
  }
  // Precedence 5: All mandatory rules pass with complete and consistent evidence -> APPROVE recommendation
  else if (evidenceCompletenessPercentage === 100 && activeMismatches.length === 0) {
    initialRecommendation = 'APPROVE';
    recommendedNextAction =
      'All document checks passed and eligibility criteria fully met. Ready for final officer review and confirmation.';
  } else {
    initialRecommendation = 'NEEDS_REVIEW';
    recommendedNextAction = 'Case has unresolved items requiring human reviewer appraisal.';
  }

  return {
    applicationRef: app.refNumber,
    policyId: policy.id,
    policyName: policy.name,
    policyVersion: policy.version,
    evaluatedAt: new Date().toISOString(),
    initialRecommendation,
    evidenceCompletenessPercentage,
    ruleResults,
    reasonsForEscalation,
    missingInformation,
    unresolvedIssues,
    authenticityStatusSummary: overallAuthenticity,
    recommendedNextAction,
    confidenceScore,
  };
}

/**
 * Generates an interactive, step-by-step Decision Replay trace (Layer 8 distinctive feature)
 */
export function generateDecisionReplay(
  app: ApplicationRecord,
  policy: PolicyConfiguration,
  trace: DecisionTrace
): DecisionReplayStep[] {
  const steps: DecisionReplayStep[] = [];
  const now = new Date().toISOString();

  // Step 1: Technical Document Validation
  const hasUnreadable = app.documents.some((d) => d.readability === 'UNREADABLE');
  steps.push({
    stepIndex: 1,
    stepTitle: 'Technical Document Validation',
    layer: 'TECHNICAL_VALIDATION',
    summary: hasUnreadable
      ? 'One or more documents failed optical readability bounds.'
      : `${app.documents.length} document(s) passed format and size validation.`,
    status: hasUnreadable ? 'FAIL' : 'PASS',
    details: {
      documentCount: app.documents.length,
      formats: app.documents.map((d) => `${d.fileName} (${d.mimeType})`),
      disclaimer: 'Technical validation confirms byte integrity only; does NOT prove authenticity.',
    },
    timestamp: now,
  });

  // Step 2: Data Extraction
  const totalExtracted = app.documents.reduce((acc, d) => acc + Object.keys(d.extractedFields).length, 0);
  steps.push({
    stepIndex: 2,
    stepTitle: 'AI-Assisted Field Extraction',
    layer: 'DATA_EXTRACTION',
    summary: `Extracted ${totalExtracted} structured fields with confidence averaging ${(
      trace.confidenceScore * 100
    ).toFixed(0)}%.`,
    status: totalExtracted > 0 ? 'PASS' : 'REVIEW',
    details: {
      totalFields: totalExtracted,
      extractionMode: 'Demo Extraction Mode (Synthetic Fixtures)',
    },
    timestamp: now,
  });

  // Step 3: Contradiction Radar
  const activeMismatches = app.contradictions.filter((c) => c.isMismatch);
  steps.push({
    stepIndex: 3,
    stepTitle: 'Contradiction Radar Cross-Check',
    layer: 'CONTRADICTION_RADAR',
    summary:
      activeMismatches.length > 0
        ? `Flagged ${activeMismatches.length} data discrepancy between declarations and certified documents.`
        : 'All declared fields consistent with extracted documents.',
    status: activeMismatches.length > 0 ? 'FAIL' : 'PASS',
    details: {
      contradictionsCount: app.contradictions.length,
      activeMismatchesCount: activeMismatches.length,
      fraudNotice: 'Discrepancy is not treated as proof of fraud.',
    },
    timestamp: now,
  });

  // Step 4: Authenticity Verification
  steps.push({
    stepIndex: 4,
    stepTitle: 'Authenticity Verification Check',
    layer: 'AUTHENTICITY_VERIFICATION',
    summary: `Current Authenticity Status: ${trace.authenticityStatusSummary}`,
    status: trace.authenticityStatusSummary === 'VERIFIED_BY_TRUSTED_SOURCE' ? 'PASS' : 'REVIEW',
    details: {
      authenticityStatus: trace.authenticityStatusSummary,
      notice: 'OCR and QR presence do not prove authenticity without trusted-source confirmation.',
    },
    timestamp: now,
  });

  // Step 5: Eligibility Rules Execution
  const failedRules = trace.ruleResults.filter((r) => r.status === 'FAIL');
  steps.push({
    stepIndex: 5,
    stepTitle: `Policy Rules Evaluation (${policy.version})`,
    layer: 'ELIGIBILITY_RULES',
    summary:
      failedRules.length > 0
        ? `${failedRules.length} rule condition(s) failed or unresolved.`
        : 'All evaluated mandatory policy rules passed.',
    status: failedRules.length > 0 ? 'FAIL' : 'PASS',
    details: {
      rulesCount: trace.ruleResults.length,
      failedRulesCount: failedRules.length,
      maxIncome: `₹${policy.maxAnnualIncome.toLocaleString('en-IN')}`,
      minScore: `${policy.minAcademicPercentage}%`,
    },
    timestamp: now,
  });

  // Step 6: Final Decision Recommendation
  steps.push({
    stepIndex: 6,
    stepTitle: 'Automated Recommendation Synthesis',
    layer: 'FINAL_SYNTHESIS',
    summary: `System Recommendation: ${trace.initialRecommendation}. Next Step: ${trace.recommendedNextAction}`,
    status: trace.initialRecommendation === 'APPROVE' ? 'PASS' : trace.initialRecommendation === 'REJECT' ? 'FAIL' : 'REVIEW',
    details: {
      initialRecommendation: trace.initialRecommendation,
      evidenceCompleteness: `${trace.evidenceCompletenessPercentage}%`,
      preservationNotice: 'Original system recommendation preserved independently of human override.',
    },
    timestamp: now,
  });

  return steps;
}
