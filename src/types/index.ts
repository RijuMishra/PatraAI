export type Role = 'applicant' | 'officer' | 'admin';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'ACTION_REQUIRED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type DocumentType =
  | 'INCOME_CERTIFICATE'
  | 'MARKSHEET'
  | 'IDENTITY_DOC'
  | 'DOMICILE_CERTIFICATE';

export type DocumentStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'VERIFIED_AGAINST_RULES'
  | 'INCOMPLETE'
  | 'UNREADABLE'
  | 'MISMATCH'
  | 'NEEDS_HUMAN_REVIEW'
  | 'FAILED_VALIDATION';

export type ReadabilityStatus = 'READABLE' | 'DEGRADED' | 'UNREADABLE' | 'UNCHECKED';

// Exact separate authenticity statuses as required by specification
export type AuthenticityStatus =
  | 'NOT_CHECKED'
  | 'VERIFIED_BY_TRUSTED_SOURCE'
  | 'VERIFICATION_UNAVAILABLE'
  | 'VERIFICATION_FAILED'
  | 'MANUAL_REVIEW_REQUIRED';

// Exact comparison result statuses for Contradiction Radar
export type ComparisonResult =
  | 'MATCH'
  | 'MISMATCH'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'NEEDS_REVIEW';

export type VerificationMethod =
  | 'AI_EXTRACTION'
  | 'MANUAL_ENTRY'
  | 'SYNTHETIC_DEMO'
  | 'DETERMINISTIC_RULE';

export type ExtractionStatus =
  | 'EXTRACTED'
  | 'UNREADABLE'
  | 'MISSING'
  | 'UNCERTAIN';

export type RuleStatus = 'PASS' | 'FAIL' | 'UNKNOWN';

export interface ExtractedField {
  fieldKey: string;
  fieldName: string;
  extractedValue: string | number | null;
  sourceDocument: string;
  extractionMethod: VerificationMethod;
  extractionStatus: ExtractionStatus;
  confidence: number; // 0 to 1
  page?: number;
  boundingBoxHint?: string;
  uncertaintyReason?: string;
}

export interface TechnicalValidationResult {
  isValidFormat: boolean;
  isWithinSizeLimit: boolean;
  canBeProcessed: boolean;
  contentReadability: ReadabilityStatus;
  fileSizeBytes: number;
  mimeType: string;
  validationErrors: string[];
  disclaimer: string;
  checkedAt: string;
}

export interface UploadedDocument {
  id: string;
  type: DocumentType;
  title: string;
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  uploadedAt: string;
  fileDataUrl?: string; // in-memory preview URL
  status: DocumentStatus;
  readability: ReadabilityStatus;
  authenticity: AuthenticityStatus;
  technicalValidation?: TechnicalValidationResult;
  extractedFields: Record<string, ExtractedField>;
  extractionNotes?: string;
  manualVerificationNotes?: string;
  manualAuthenticityReference?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  readabilityErrorReason?: string;
}

export interface ContradictionRecord {
  id: string;
  documentType: DocumentType;
  fieldName: string;
  declaredValue: string | number | null;
  extractedValue: string | number | null;
  sourceDocument: string;
  comparisonResult: ComparisonResult;
  explanation: string;
  recommendedNextAction: string;
  normalizedDeclared: string | number | null;
  normalizedExtracted: string | number | null;
  isMismatch: boolean;
  detectedAt: string;
  reviewerResolution?: string;
}

export interface EvidencePassportCheck {
  checkId: string;
  documentRef: string;
  documentType: DocumentType;
  fieldChecked: string;
  source: 'DECLARED_INPUT' | 'AI_OCR_EXTRACTION' | 'OFFICER_MANUAL_ENTRY' | 'POLICY_ENGINE';
  expectedCondition: string;
  actualResult: string;
  status: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
  timestamp: string;
  method: VerificationMethod;
  actor: string;
  explanation: string;
  nextAction: string;
  distinctDimension: {
    isReadable: boolean;
    isExtracted: boolean;
    isConsistentWithApp: boolean;
    satisfiesPolicyRule: boolean;
    isExternalVerified: boolean;
    authenticityEstablished: boolean;
  };
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  policyVersion: string;
  category: 'ELIGIBILITY' | 'DOCUMENTATION' | 'CONSISTENCY' | 'AUTHENTICITY';
  isMandatory: boolean;
  actualInputValue: any;
  thresholdCondition: string;
  status: RuleStatus;
  evidenceReference: string;
  reasonCode: string;
  explanation: string;
}

export interface DecisionTrace {
  applicationRef: string;
  policyId: string;
  policyName: string;
  policyVersion: string;
  evaluatedAt: string;
  initialRecommendation: 'APPROVE' | 'REJECT' | 'NEEDS_REVIEW';
  evidenceCompletenessPercentage: number;
  ruleResults: RuleEvaluationResult[];
  reasonsForEscalation: string[];
  missingInformation: string[];
  unresolvedIssues: string[];
  authenticityStatusSummary: AuthenticityStatus;
  recommendedNextAction: string;
  confidenceScore: number;
}

export interface FinalDecisionRecord {
  officerRecommendation: 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO' | 'ESCALATE';
  finalOutcome: 'APPROVED' | 'REJECTED' | 'ACTION_REQUIRED' | 'UNDER_REVIEW';
  decisionReason: string;
  originalSystemRecommendation: 'APPROVE' | 'REJECT' | 'NEEDS_REVIEW';
  decidedBy: string;
  decidedAt: string;
  authorizedExceptionRecorded?: boolean;
  exceptionNotes?: string;
  authenticityVerifiedRef?: string;
}

export interface DecisionReplayStep {
  stepIndex: number;
  stepTitle: string;
  layer:
    | 'TECHNICAL_VALIDATION'
    | 'DATA_EXTRACTION'
    | 'CONTRADICTION_RADAR'
    | 'AUTHENTICITY_VERIFICATION'
    | 'ELIGIBILITY_RULES'
    | 'FINAL_SYNTHESIS';
  summary: string;
  status: 'PASS' | 'FAIL' | 'REVIEW' | 'INFO';
  details: any;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  applicationRef: string;
  type: 'INFO' | 'ACTION_REQUIRED' | 'MISMATCH_ALERT' | 'DECISION_READY';
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: string;
  isRead: boolean;
}

export interface AuditEvent {
  eventId: string;
  timestamp: string;
  applicationRef: string;
  eventType:
    | 'APPLICATION_CREATED'
    | 'APPLICATION_SUBMITTED'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_REPLACED'
    | 'TECHNICAL_VALIDATION_PERFORMED'
    | 'EXTRACTION_COMPLETED'
    | 'CONTRADICTION_RADAR_EVALUATED'
    | 'AUTHENTICITY_STATUS_UPDATED'
    | 'MANUAL_VERIFICATION_PERFORMED'
    | 'FIELD_CORRECTION_RECORDED'
    | 'DECISION_EVALUATED'
    | 'HUMAN_OVERRIDE_RECORDED'
    | 'FINAL_DECISION_ISSUED'
    | 'POLICY_UPDATED'
    | 'NOTIFICATION_DISPATCHED'
    | 'RFI_DISPATCHED';
  actor: string;
  reasonOrResult: string;
  policyVersion: string;
  metadata?: Record<string, any>;
}

export interface ApplicationRecord {
  id: string;
  refNumber: string;
  schemeType: 'SCHOLARSHIP' | 'LOAN';
  schemeName: string;
  status: ApplicationStatus;
  createdAt: string;
  submittedAt?: string;
  updatedAt: string;
  policyVersion: string;

  // Applicant Data
  applicant: {
    fullName: string;
    email: string;
    phone: string;
    institution: string;
    course: string;
    academicYear: string;
    marksObtained: number; // e.g. 885
    maxScore: number; // e.g. 1000
    academicScore: number; // calculated e.g. 88.5%
    declaredAnnualIncome: number; // e.g. 240000
    familyMembersCount: number;
    // Excluded sensitive demographic attributes (captured solely for fairness audit testing, NEVER fed to decision engine)
    sensitiveDemographics?: {
      gender?: string;
      casteCategory?: string;
      region?: string;
    };
  };

  documents: UploadedDocument[];
  contradictions: ContradictionRecord[];
  evidencePassport: EvidencePassportCheck[];
  decisionTrace?: DecisionTrace;
  decisionReplay?: DecisionReplayStep[];
  finalDecision?: FinalDecisionRecord;
  reviewNotes: string[];
}

export interface PolicyRule {
  id: string;
  name: string;
  field: string;
  operator: '<=' | '>=' | '==' | 'IN_LIST' | 'CONTAINS';
  thresholdValue: any;
  isMandatory: boolean;
  failureAction: 'REJECT' | 'NEEDS_REVIEW';
  description: string;
}

export interface PolicyConfiguration {
  id: string;
  name: string;
  schemeType: 'SCHOLARSHIP' | 'LOAN';
  version: string;
  effectiveDate: string;
  isActive: boolean;
  maxAnnualIncome: number; // Demo default: ₹2,50,000
  minAcademicPercentage: number; // Demo default: 60.0%
  mandatoryDocumentTypes: DocumentType[];
  comparisonToleranceIncomePercent: number;
  requireAuthenticityForApproval: boolean;
  rules: PolicyRule[];
  illustrativeNote: string;
}

export interface TestCaseRunnerResult {
  testId: string;
  name: string;
  scenarioDescription: string;
  expectedRecommendation: 'APPROVE' | 'REJECT' | 'NEEDS_REVIEW' | 'VALIDATION_ERROR';
  actualRecommendation: string;
  passed: boolean;
  ruleTraceSummary: string;
  executionDurationMs: number;
  sensitiveAttributeIgnoredCheck?: boolean;
}
