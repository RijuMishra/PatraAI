import type {
  ApplicationRecord,
  AuditEvent,
  AuthenticityStatus,
  ContradictionRecord,
  EvidencePassportCheck,
  NotificationItem,
  PolicyConfiguration,
  UploadedDocument,
} from '../types/index.ts';
import {
  DEFAULT_LOAN_POLICY,
  DEFAULT_SCHOLARSHIP_POLICY,
  evaluateApplication,
  generateDecisionReplay,
  runContradictionRadar,
} from './policyEngine.ts';

const STORAGE_KEY_APPLICATIONS = 'patra_ai_applications_v2';
const STORAGE_KEY_AUDIT_LOG = 'patra_ai_audit_events_v2';
const STORAGE_KEY_NOTIFICATIONS = 'patra_ai_notifications_v2';
const STORAGE_KEY_POLICIES = 'patra_ai_policies_v2';

// Rich initial synthetic applications covering all 11 test cases and workflow states
export const INITIAL_APPLICATIONS: ApplicationRecord[] = [
  // 1. Complete, consistent, eligible application -> APPROVE
  {
    id: 'app-001',
    refNumber: 'APP-2026-0891',
    schemeType: 'SCHOLARSHIP',
    schemeName: 'National Merit-cum-Means Postsecondary Policy',
    status: 'SUBMITTED',
    createdAt: '2026-02-10T09:30:00.000Z',
    submittedAt: '2026-02-10T10:15:00.000Z',
    updatedAt: '2026-02-10T10:15:00.000Z',
    policyVersion: '2026.1.4',
    applicant: {
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@example.edu.in',
      phone: '+91 98765 43210',
      institution: 'Delhi Technological University',
      course: 'B.Tech Computer Science & Engineering',
      academicYear: '2nd Year (Semester 4)',
      marksObtained: 885,
      maxScore: 1000,
      academicScore: 88.5,
      declaredAnnualIncome: 240000, // Eligible <= ₹2,50,000
      familyMembersCount: 4,
      sensitiveDemographics: {
        gender: 'Male',
        casteCategory: 'General',
        region: 'North',
      },
    },
    documents: [
      {
        id: 'doc-001-inc',
        type: 'INCOME_CERTIFICATE',
        title: 'Tahsildar Income Certificate',
        fileName: 'Income_Certificate_Aarav.pdf',
        fileSize: 342100,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-10T09:45:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        technicalValidation: {
          isValidFormat: true,
          isWithinSizeLimit: true,
          canBeProcessed: true,
          contentReadability: 'READABLE',
          fileSizeBytes: 342100,
          mimeType: 'application/pdf',
          validationErrors: [],
          disclaimer:
            'Technical validation confirms file format and byte integrity only. Passing technical validation does NOT establish document authenticity.',
          checkedAt: '2026-02-10T09:45:00.000Z',
        },
        extractedFields: {
          annualIncome: {
            fieldKey: 'annualIncome',
            fieldName: 'Certified Gross Annual Income',
            extractedValue: '₹2,40,000',
            sourceDocument: 'Income_Certificate_Aarav.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.96,
            page: 1,
            boundingBoxHint: 'Income Block [x: 30%, y: 55%]',
          },
          issuingAuthority: {
            fieldKey: 'issuingAuthority',
            fieldName: 'Issuing Authority',
            extractedValue: 'Office of the Tahsildar, District Revenue Office',
            sourceDocument: 'Income_Certificate_Aarav.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.94,
            page: 1,
          },
        },
        extractionNotes: 'Document clear; values consistent with declaration.',
        verifiedBy: 'AI Extraction Engine & Auto-Matcher',
        verifiedAt: '2026-02-10T10:16:00.000Z',
      },
      {
        id: 'doc-001-mark',
        type: 'MARKSHEET',
        title: 'Official Semester Marksheet',
        fileName: 'Semester_3_Marksheet.pdf',
        fileSize: 512000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-10T09:50:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        technicalValidation: {
          isValidFormat: true,
          isWithinSizeLimit: true,
          canBeProcessed: true,
          contentReadability: 'READABLE',
          fileSizeBytes: 512000,
          mimeType: 'application/pdf',
          validationErrors: [],
          disclaimer:
            'Technical validation confirms file format and byte integrity only. Passing technical validation does NOT establish document authenticity.',
          checkedAt: '2026-02-10T09:50:00.000Z',
        },
        extractedFields: {
          totalMarksObtained: {
            fieldKey: 'totalMarksObtained',
            fieldName: 'Aggregate Percentage',
            extractedValue: '88.5%',
            sourceDocument: 'Semester_3_Marksheet.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.98,
            page: 1,
            boundingBoxHint: 'Marks Summary Table [Row 8, Col 5]',
          },
          candidateName: {
            fieldKey: 'candidateName',
            fieldName: 'Candidate Name',
            extractedValue: 'Aarav Sharma',
            sourceDocument: 'Semester_3_Marksheet.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.95,
            page: 1,
          },
        },
        extractionNotes: 'Marksheet verified against university schema.',
        verifiedBy: 'AI Extraction Engine',
        verifiedAt: '2026-02-10T10:16:00.000Z',
      },
    ],
    contradictions: [],
    evidencePassport: [],
    reviewNotes: ['Automated verification completed with 0 errors.'],
  },

  // 2. Income Mismatch -> MISMATCH & NEEDS_REVIEW
  {
    id: 'app-003',
    refNumber: 'APP-2026-0893',
    schemeType: 'SCHOLARSHIP',
    schemeName: 'National Merit-cum-Means Postsecondary Policy',
    status: 'UNDER_REVIEW',
    createdAt: '2026-02-12T08:00:00.000Z',
    submittedAt: '2026-02-12T08:30:00.000Z',
    updatedAt: '2026-02-12T09:00:00.000Z',
    policyVersion: '2026.1.4',
    applicant: {
      fullName: 'Priya Patel',
      email: 'priya.patel@gujaratuni.edu',
      phone: '+91 96543 21098',
      institution: 'Gujarat National University',
      course: 'B.Com Accounting & Finance',
      academicYear: '3rd Year',
      marksObtained: 840,
      maxScore: 1000,
      academicScore: 84.0,
      declaredAnnualIncome: 240000, // Declared: 2.4L
      familyMembersCount: 5,
    },
    documents: [
      {
        id: 'doc-003-inc',
        type: 'INCOME_CERTIFICATE',
        title: 'District Revenue Income Certificate',
        fileName: 'Income_Cert_Priya.pdf',
        fileSize: 412000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-12T08:15:00.000Z',
        status: 'MISMATCH',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          annualIncome: {
            fieldKey: 'annualIncome',
            fieldName: 'Certified Gross Annual Income',
            extractedValue: '₹4,20,000', // Extracted: 4.2L -> Mismatch!
            sourceDocument: 'Income_Cert_Priya.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.97,
            page: 1,
            boundingBoxHint: 'Income Row 4 [y: 52%]',
          },
        },
        extractionNotes: 'Discrepancy detected between declared (₹2,40,000) and extracted (₹4,20,000).',
      },
      {
        id: 'doc-003-mark',
        type: 'MARKSHEET',
        title: 'Semester Marksheet',
        fileName: 'Priya_Semester_Marks.pdf',
        fileSize: 390000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-12T08:20:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          totalMarksObtained: {
            fieldKey: 'totalMarksObtained',
            fieldName: 'Aggregate Percentage',
            extractedValue: '84.0%',
            sourceDocument: 'Priya_Semester_Marks.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.95,
            page: 1,
          },
        },
      },
    ],
    contradictions: [],
    evidencePassport: [],
    reviewNotes: ['Approval automatically locked due to active income discrepancy.'],
  },

  // 3. Missing Income Certificate -> NEEDS_REVIEW
  {
    id: 'app-002',
    refNumber: 'APP-2026-0892',
    schemeType: 'SCHOLARSHIP',
    schemeName: 'National Merit-cum-Means Postsecondary Policy',
    status: 'ACTION_REQUIRED',
    createdAt: '2026-02-11T11:00:00.000Z',
    submittedAt: '2026-02-11T11:20:00.000Z',
    updatedAt: '2026-02-11T11:25:00.000Z',
    policyVersion: '2026.1.4',
    applicant: {
      fullName: 'Ananya Sen',
      email: 'ananya.sen@example.ac.in',
      phone: '+91 97654 32109',
      institution: 'Jadavpur University',
      course: 'B.Sc Economics (Hons)',
      academicYear: '1st Year',
      marksObtained: 780,
      maxScore: 1000,
      academicScore: 78.0,
      declaredAnnualIncome: 180000,
      familyMembersCount: 3,
    },
    documents: [
      // Income certificate is omitted! Only Marksheet present.
      {
        id: 'doc-002-mark',
        type: 'MARKSHEET',
        title: 'Qualifying Marksheet',
        fileName: 'Ananya_Marks.pdf',
        fileSize: 310000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-11T11:15:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          totalMarksObtained: {
            fieldKey: 'totalMarksObtained',
            fieldName: 'Aggregate Percentage',
            extractedValue: '78.0%',
            sourceDocument: 'Ananya_Marks.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.96,
            page: 1,
          },
        },
      },
    ],
    contradictions: [],
    evidencePassport: [],
    reviewNotes: ['Mandatory Income Certificate missing from submission payload.'],
  },

  // 4. Unreadable Document -> NEEDS_REVIEW
  {
    id: 'app-008',
    refNumber: 'APP-2026-0898',
    schemeType: 'SCHOLARSHIP',
    schemeName: 'National Merit-cum-Means Postsecondary Policy',
    status: 'UNDER_REVIEW',
    createdAt: '2026-02-15T07:30:00.000Z',
    submittedAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-02-15T08:15:00.000Z',
    policyVersion: '2026.1.4',
    applicant: {
      fullName: 'Vikram Singh',
      email: 'vikram.singh@rajasthanuni.edu',
      phone: '+91 90123 45678',
      institution: 'University of Rajasthan',
      course: 'B.Sc Agriculture',
      academicYear: '1st Year',
      marksObtained: 720,
      maxScore: 1000,
      academicScore: 72.0,
      declaredAnnualIncome: 210000,
      familyMembersCount: 5,
    },
    documents: [
      {
        id: 'doc-008-inc',
        type: 'INCOME_CERTIFICATE',
        title: 'Revenue Certificate (Low Resolution Scan)',
        fileName: 'Vikram_Income_Scan_LowDPI.jpg',
        fileSize: 185000,
        mimeType: 'image/jpeg',
        uploadedAt: '2026-02-15T07:45:00.000Z',
        status: 'UNREADABLE',
        readability: 'UNREADABLE',
        authenticity: 'NOT_CHECKED',
        technicalValidation: {
          isValidFormat: true,
          isWithinSizeLimit: true,
          canBeProcessed: false,
          contentReadability: 'UNREADABLE',
          fileSizeBytes: 185000,
          mimeType: 'image/jpeg',
          validationErrors: ['Severe blur and compression artifacts; OCR confidence < 0.20.'],
          disclaimer:
            'Technical validation confirms file format only; does NOT establish document authenticity.',
          checkedAt: '2026-02-15T07:45:00.000Z',
        },
        extractedFields: {},
        readabilityErrorReason: 'Severe blur and compression artifacts; OCR confidence < 0.20.',
      },
      {
        id: 'doc-008-mark',
        type: 'MARKSHEET',
        title: 'Academic Marksheet',
        fileName: 'Vikram_Marksheet.pdf',
        fileSize: 420000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-15T07:50:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          totalMarksObtained: {
            fieldKey: 'totalMarksObtained',
            fieldName: 'Aggregate Score',
            extractedValue: '72.0%',
            sourceDocument: 'Vikram_Marksheet.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.94,
            page: 1,
          },
        },
      },
    ],
    contradictions: [],
    evidencePassport: [],
    reviewNotes: ['Optical extraction failed on Income Certificate; routed to Manual Workspace.'],
  },

  // 5. Invalid marks greater than maximum marks -> VALIDATION_ERROR
  {
    id: 'app-004',
    refNumber: 'APP-2026-0894',
    schemeType: 'SCHOLARSHIP',
    schemeName: 'National Merit-cum-Means Postsecondary Policy',
    status: 'ACTION_REQUIRED',
    createdAt: '2026-02-12T10:00:00.000Z',
    submittedAt: '2026-02-12T10:10:00.000Z',
    updatedAt: '2026-02-12T10:10:00.000Z',
    policyVersion: '2026.1.4',
    applicant: {
      fullName: 'Kabir Mehta',
      email: 'kabir.mehta@example.org',
      phone: '+91 95432 10987',
      institution: 'St. Xavier College',
      course: 'B.Sc Physics',
      academicYear: '2nd Year',
      marksObtained: 1050, // Invalid: 1050 > 1000!
      maxScore: 1000,
      academicScore: 105.0,
      declaredAnnualIncome: 200000,
      familyMembersCount: 4,
    },
    documents: [],
    contradictions: [],
    evidencePassport: [],
    reviewNotes: ['Validation Failure: Marks obtained exceed maximum marks.'],
  },

  // 6. Confirmed income threshold failure -> REJECT recommendation
  {
    id: 'app-005',
    refNumber: 'APP-2026-0895',
    schemeType: 'SCHOLARSHIP',
    schemeName: 'National Merit-cum-Means Postsecondary Policy',
    status: 'PROCESSING',
    createdAt: '2026-02-13T12:00:00.000Z',
    submittedAt: '2026-02-13T12:20:00.000Z',
    updatedAt: '2026-02-13T12:25:00.000Z',
    policyVersion: '2026.1.4',
    applicant: {
      fullName: 'Rohan Verma',
      email: 'rohan.verma@demo.ac.in',
      phone: '+91 94321 09876',
      institution: 'City Engineering College',
      course: 'Diploma in Civil Engg',
      academicYear: 'Final Year',
      marksObtained: 720,
      maxScore: 1000,
      academicScore: 72.0, // Marks are eligible (72% >= 60%)
      declaredAnnualIncome: 320000, // FAILS demo ceiling of ₹2,50,000!
      familyMembersCount: 4,
    },
    documents: [
      {
        id: 'doc-005-inc',
        type: 'INCOME_CERTIFICATE',
        title: 'Tehsildar Certificate',
        fileName: 'Rohan_Income_Cert.pdf',
        fileSize: 310000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-13T12:10:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          annualIncome: {
            fieldKey: 'annualIncome',
            fieldName: 'Certified Annual Income',
            extractedValue: '₹3,20,000',
            sourceDocument: 'Rohan_Income_Cert.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.97,
            page: 1,
          },
        },
      },
      {
        id: 'doc-005-mark',
        type: 'MARKSHEET',
        title: 'Marksheet',
        fileName: 'Rohan_Diploma_Marks.pdf',
        fileSize: 450000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-13T12:15:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          totalMarksObtained: {
            fieldKey: 'totalMarksObtained',
            fieldName: 'Aggregate Score',
            extractedValue: '72.0%',
            sourceDocument: 'Rohan_Diploma_Marks.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.96,
            page: 1,
          },
        },
      },
    ],
    contradictions: [],
    evidencePassport: [],
    reviewNotes: ['Complete valid evidence present; annual income ₹3,20,000 exceeds ₹2,50,000 ceiling.'],
  },

  // 7. Authenticity Verification Unavailable
  {
    id: 'app-009',
    refNumber: 'APP-2026-0899',
    schemeType: 'SCHOLARSHIP',
    schemeName: 'National Merit-cum-Means Postsecondary Policy',
    status: 'UNDER_REVIEW',
    createdAt: '2026-02-16T08:00:00.000Z',
    submittedAt: '2026-02-16T08:30:00.000Z',
    updatedAt: '2026-02-16T08:30:00.000Z',
    policyVersion: '2026.1.4',
    applicant: {
      fullName: 'Devika Krishnan',
      email: 'devika.krishnan@college.edu',
      phone: '+91 93456 78901',
      institution: 'Madras Christian College',
      course: 'B.A English Literature',
      academicYear: '1st Year',
      marksObtained: 810,
      maxScore: 1000,
      academicScore: 81.0,
      declaredAnnualIncome: 190000,
      familyMembersCount: 3,
    },
    documents: [
      {
        id: 'doc-009-inc',
        type: 'INCOME_CERTIFICATE',
        title: 'Tahsildar Income Proof',
        fileName: 'Devika_Income.pdf',
        fileSize: 320000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-16T08:15:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'VERIFICATION_UNAVAILABLE', // Explicitly unavailable
        extractedFields: {
          annualIncome: {
            fieldKey: 'annualIncome',
            fieldName: 'Annual Income',
            extractedValue: '₹1,90,000',
            sourceDocument: 'Devika_Income.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.95,
            page: 1,
          },
        },
        extractionNotes: 'Trusted issuing authority registry endpoint not configured. Authenticity status: VERIFICATION_UNAVAILABLE.',
      },
      {
        id: 'doc-009-mark',
        type: 'MARKSHEET',
        title: 'HSC Marksheet',
        fileName: 'Devika_HSC.pdf',
        fileSize: 410000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-16T08:20:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'VERIFICATION_UNAVAILABLE',
        extractedFields: {
          totalMarksObtained: {
            fieldKey: 'totalMarksObtained',
            fieldName: 'Aggregate Score',
            extractedValue: '81.0%',
            sourceDocument: 'Devika_HSC.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.96,
            page: 1,
          },
        },
      },
    ],
    contradictions: [],
    evidencePassport: [],
    reviewNotes: ['Official verification registry API unavailable. Manual review required.'],
  },

  // 8. AI Extraction Failure and Manual Fallback
  {
    id: 'app-010',
    refNumber: 'APP-2026-0900',
    schemeType: 'SCHOLARSHIP',
    schemeName: 'National Merit-cum-Means Postsecondary Policy',
    status: 'UNDER_REVIEW',
    createdAt: '2026-02-17T09:00:00.000Z',
    submittedAt: '2026-02-17T09:30:00.000Z',
    updatedAt: '2026-02-17T10:00:00.000Z',
    policyVersion: '2026.1.4',
    applicant: {
      fullName: 'Nikhil Bannerjee',
      email: 'nikhil.b@univ.edu',
      phone: '+91 94567 89012',
      institution: 'Calcutta Technical Institute',
      course: 'B.Tech IT',
      academicYear: '1st Year',
      marksObtained: 750,
      maxScore: 1000,
      academicScore: 75.0,
      declaredAnnualIncome: 200000,
      familyMembersCount: 4,
    },
    documents: [
      {
        id: 'doc-010-inc',
        type: 'INCOME_CERTIFICATE',
        title: 'Non-Standard Income Slip',
        fileName: 'Nikhil_Income_Unmapped.pdf',
        fileSize: 280000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-17T09:15:00.000Z',
        status: 'NEEDS_HUMAN_REVIEW',
        readability: 'DEGRADED',
        authenticity: 'MANUAL_REVIEW_REQUIRED',
        extractedFields: {
          incomeField: {
            fieldKey: 'incomeField',
            fieldName: 'Annual Gross Income',
            extractedValue: null, // AI failed to extract
            sourceDocument: 'Nikhil_Income_Unmapped.pdf',
            extractionMethod: 'AI_EXTRACTION',
            extractionStatus: 'UNCERTAIN',
            confidence: 0.2,
            uncertaintyReason: 'Non-standard layout. Officer manual entry fallback required.',
          },
        },
        extractionNotes: 'AI extraction failed. Officer manual inspection workspace fallback engaged.',
      },
      {
        id: 'doc-010-mark',
        type: 'MARKSHEET',
        title: 'Semester Marksheet',
        fileName: 'Nikhil_Marks.pdf',
        fileSize: 390000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-17T09:20:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          totalMarksObtained: {
            fieldKey: 'totalMarksObtained',
            fieldName: 'Aggregate Score',
            extractedValue: '75.0%',
            sourceDocument: 'Nikhil_Marks.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.95,
            page: 1,
          },
        },
      },
    ],
    contradictions: [],
    evidencePassport: [],
    reviewNotes: ['AI extraction failed on income slip; manual entry fallback enabled for officer.'],
  },

  // 9. Officer Override Preserving Original System Recommendation
  {
    id: 'app-006',
    refNumber: 'APP-2026-0896',
    schemeType: 'SCHOLARSHIP',
    schemeName: 'National Merit-cum-Means Postsecondary Policy',
    status: 'APPROVED',
    createdAt: '2026-02-08T09:00:00.000Z',
    submittedAt: '2026-02-08T09:30:00.000Z',
    updatedAt: '2026-02-09T14:30:00.000Z',
    policyVersion: '2026.1.4',
    applicant: {
      fullName: 'Meera Nair',
      email: 'meera.nair@keralauniv.ac.in',
      phone: '+91 93210 98765',
      institution: 'University of Kerala',
      course: 'B.Sc Mathematics',
      academicYear: '2nd Year',
      marksObtained: 580,
      maxScore: 1000,
      academicScore: 58.0, // Below 60% threshold -> Triggers REJECT recommendation
      declaredAnnualIncome: 120000,
      familyMembersCount: 3,
    },
    documents: [
      {
        id: 'doc-006-inc',
        type: 'INCOME_CERTIFICATE',
        title: 'Revenue Income Certificate',
        fileName: 'Meera_Income.pdf',
        fileSize: 320000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-08T09:15:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          annualIncome: {
            fieldKey: 'annualIncome',
            fieldName: 'Annual Income',
            extractedValue: '₹1,20,000',
            sourceDocument: 'Meera_Income.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.97,
            page: 1,
          },
        },
      },
      {
        id: 'doc-006-mark',
        type: 'MARKSHEET',
        title: 'University Grade Sheet',
        fileName: 'Meera_MarkSheet.pdf',
        fileSize: 410000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-08T09:20:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          totalMarksObtained: {
            fieldKey: 'totalMarksObtained',
            fieldName: 'Aggregate Score',
            extractedValue: '58.0%',
            sourceDocument: 'Meera_MarkSheet.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.95,
            page: 1,
          },
        },
      },
    ],
    contradictions: [],
    evidencePassport: [],
    reviewNotes: [
      'Authorized hardship exception applied under Section 4.2 (Natural calamity affected student).',
    ],
    finalDecision: {
      officerRecommendation: 'APPROVE',
      finalOutcome: 'APPROVED',
      decisionReason:
        'Authorized discretionary waiver granted per Clause 4.2. Candidate presented certified regional flood relief affidavit. System recommendation of REJECT preserved.',
      originalSystemRecommendation: 'REJECT',
      decidedBy: 'Officer S. Kulkarni (VO-402)',
      decidedAt: '2026-02-09T14:30:00.000Z',
      authorizedExceptionRecorded: true,
      exceptionNotes: 'Relief affidavit REF-DRM-2025-081 verified on district portal.',
    },
  },

  // 10. Paired Fairness Cases (Case A: Female / Rural-Bihar)
  {
    id: 'app-007a',
    refNumber: 'APP-2026-0897A',
    schemeType: 'SCHOLARSHIP',
    schemeName: 'National Merit-cum-Means Postsecondary Policy',
    status: 'SUBMITTED',
    createdAt: '2026-02-14T10:00:00.000Z',
    submittedAt: '2026-02-14T10:15:00.000Z',
    updatedAt: '2026-02-14T10:15:00.000Z',
    policyVersion: '2026.1.4',
    applicant: {
      fullName: 'Sunita Devi',
      email: 'sunita.devi@univ.org',
      phone: '+91 92109 87654',
      institution: 'State Polytechnic Institute',
      course: 'Electronics & Comm',
      academicYear: '1st Year',
      marksObtained: 765,
      maxScore: 1000,
      academicScore: 76.5,
      declaredAnnualIncome: 195000,
      familyMembersCount: 4,
      sensitiveDemographics: {
        gender: 'Female',
        casteCategory: 'OBC',
        region: 'Rural-Bihar',
      },
    },
    documents: [
      {
        id: 'doc-007a-inc',
        type: 'INCOME_CERTIFICATE',
        title: 'Income Certificate',
        fileName: 'Sunita_Income.pdf',
        fileSize: 310000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-14T10:05:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          annualIncome: {
            fieldKey: 'annualIncome',
            fieldName: 'Annual Income',
            extractedValue: '₹1,95,000',
            sourceDocument: 'Sunita_Income.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.95,
            page: 1,
          },
        },
      },
      {
        id: 'doc-007a-mark',
        type: 'MARKSHEET',
        title: 'Marksheet',
        fileName: 'Sunita_Marksheet.pdf',
        fileSize: 380000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-14T10:10:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          totalMarksObtained: {
            fieldKey: 'totalMarksObtained',
            fieldName: 'Aggregate Score',
            extractedValue: '76.5%',
            sourceDocument: 'Sunita_Marksheet.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.96,
            page: 1,
          },
        },
      },
    ],
    contradictions: [],
    evidencePassport: [],
    reviewNotes: ['Paired Fairness Test Case A'],
  },

  // 10. Paired Fairness Cases (Case B: Male / Urban-Maharashtra, identical relevant metrics)
  {
    id: 'app-007b',
    refNumber: 'APP-2026-0897B',
    schemeType: 'SCHOLARSHIP',
    schemeName: 'National Merit-cum-Means Postsecondary Policy',
    status: 'SUBMITTED',
    createdAt: '2026-02-14T10:00:00.000Z',
    submittedAt: '2026-02-14T10:15:00.000Z',
    updatedAt: '2026-02-14T10:15:00.000Z',
    policyVersion: '2026.1.4',
    applicant: {
      fullName: 'Sameer Sen',
      email: 'sameer.sen@univ.org',
      phone: '+91 91098 76543',
      institution: 'State Polytechnic Institute',
      course: 'Electronics & Comm',
      academicYear: '1st Year',
      marksObtained: 765, // EXACT SAME
      maxScore: 1000,
      academicScore: 76.5, // EXACT SAME
      declaredAnnualIncome: 195000, // EXACT SAME
      familyMembersCount: 4,
      sensitiveDemographics: {
        gender: 'Male',
        casteCategory: 'General',
        region: 'Urban-Maharashtra',
      },
    },
    documents: [
      {
        id: 'doc-007b-inc',
        type: 'INCOME_CERTIFICATE',
        title: 'Income Certificate',
        fileName: 'Sameer_Income.pdf',
        fileSize: 310000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-14T10:05:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          annualIncome: {
            fieldKey: 'annualIncome',
            fieldName: 'Annual Income',
            extractedValue: '₹1,95,000',
            sourceDocument: 'Sameer_Income.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.95,
            page: 1,
          },
        },
      },
      {
        id: 'doc-007b-mark',
        type: 'MARKSHEET',
        title: 'Marksheet',
        fileName: 'Sameer_Marksheet.pdf',
        fileSize: 380000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-14T10:10:00.000Z',
        status: 'VERIFIED_AGAINST_RULES',
        readability: 'READABLE',
        authenticity: 'NOT_CHECKED',
        extractedFields: {
          totalMarksObtained: {
            fieldKey: 'totalMarksObtained',
            fieldName: 'Aggregate Score',
            extractedValue: '76.5%',
            sourceDocument: 'Sameer_Marksheet.pdf',
            extractionMethod: 'SYNTHETIC_DEMO',
            extractionStatus: 'EXTRACTED',
            confidence: 0.96,
            page: 1,
          },
        },
      },
    ],
    contradictions: [],
    evidencePassport: [],
    reviewNotes: ['Paired Fairness Test Case B'],
  },
];

export const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    eventId: 'EVT-1001',
    timestamp: '2026-02-10T09:30:00.000Z',
    applicationRef: 'APP-2026-0891',
    eventType: 'APPLICATION_CREATED',
    actor: 'Aarav Sharma (Applicant)',
    reasonOrResult: 'Draft application initialized with synthetic profile.',
    policyVersion: '2026.1.4',
  },
  {
    eventId: 'EVT-1002',
    timestamp: '2026-02-10T10:15:00.000Z',
    applicationRef: 'APP-2026-0891',
    eventType: 'APPLICATION_SUBMITTED',
    actor: 'Aarav Sharma (Applicant)',
    reasonOrResult: 'Formal scholarship application submitted with 2 documents.',
    policyVersion: '2026.1.4',
  },
  {
    eventId: 'EVT-1003',
    timestamp: '2026-02-10T10:16:00.000Z',
    applicationRef: 'APP-2026-0891',
    eventType: 'EXTRACTION_COMPLETED',
    actor: 'PatraAI Extraction Adapter',
    reasonOrResult: 'Extracted structured fields from Income Certificate & Marksheet. Schema validated.',
    policyVersion: '2026.1.4',
  },
  {
    eventId: 'EVT-1004',
    timestamp: '2026-02-10T10:16:05.000Z',
    applicationRef: 'APP-2026-0891',
    eventType: 'DECISION_EVALUATED',
    actor: 'PatraAI Deterministic Policy Engine',
    reasonOrResult: 'Evaluated against Policy 2026.1.4: Recommendation APPROVE (All rules passed).',
    policyVersion: '2026.1.4',
  },
  {
    eventId: 'EVT-1005',
    timestamp: '2026-02-12T08:35:00.000Z',
    applicationRef: 'APP-2026-0893',
    eventType: 'MISMATCH_DETECTED',
    actor: 'Contradiction Radar Engine',
    reasonOrResult: 'Mismatch in Annual Income: Declared ₹2,40,000 vs Certified ₹4,20,000 (+75% variance). Approval paused.',
    policyVersion: '2026.1.4',
  },
  {
    eventId: 'EVT-1006',
    timestamp: '2026-02-09T14:30:00.000Z',
    applicationRef: 'APP-2026-0896',
    eventType: 'HUMAN_OVERRIDE_RECORDED',
    actor: 'Officer S. Kulkarni (VO-402)',
    reasonOrResult: 'Hardship exemption recorded under Section 4.2. Overrode system REJECT recommendation to APPROVE.',
    policyVersion: '2026.1.4',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-001',
    applicationRef: 'APP-2026-0891',
    type: 'DECISION_READY',
    title: 'Verification Complete — Recommendation Ready',
    message: 'Your scholarship application APP-2026-0891 has passed all document and eligibility checks.',
    createdAt: '2026-02-10T10:17:00.000Z',
    isRead: false,
  },
  {
    id: 'notif-002',
    applicationRef: 'APP-2026-0892',
    type: 'ACTION_REQUIRED',
    title: 'Action Required: Missing Mandatory Marksheet',
    message: 'Your application APP-2026-0892 is currently incomplete. Please upload your qualifying Semester Marksheet in the Document Center.',
    actionUrl: '#upload',
    createdAt: '2026-02-11T11:26:00.000Z',
    isRead: false,
  },
  {
    id: 'notif-003',
    applicationRef: 'APP-2026-0893',
    type: 'MISMATCH_ALERT',
    title: 'Verification Notice: Income Clarification Needed',
    message: 'Your application requires additional verification because the income amount entered (₹2,40,000) differs from the amount extracted from your uploaded document (₹4,20,000).',
    createdAt: '2026-02-12T08:36:00.000Z',
    isRead: false,
  },
];

class DataService {
  private applications: ApplicationRecord[] = [];
  private auditEvents: AuditEvent[] = [];
  private notifications: NotificationItem[] = [];
  private policies: PolicyConfiguration[] = [DEFAULT_SCHOLARSHIP_POLICY, DEFAULT_LOAN_POLICY];

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedApps = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
        if (storedApps) {
          this.applications = JSON.parse(storedApps);
        } else {
          this.applications = INITIAL_APPLICATIONS.map((app) => this.hydrateApp(app));
          this.persistApps();
        }

        const storedAudit = localStorage.getItem(STORAGE_KEY_AUDIT_LOG);
        if (storedAudit) {
          this.auditEvents = JSON.parse(storedAudit);
        } else {
          this.auditEvents = [...INITIAL_AUDIT_EVENTS];
          this.persistAudit();
        }

        const storedNotifs = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
        if (storedNotifs) {
          this.notifications = JSON.parse(storedNotifs);
        } else {
          this.notifications = [...INITIAL_NOTIFICATIONS];
          this.persistNotifs();
        }

        const storedPolicies = localStorage.getItem(STORAGE_KEY_POLICIES);
        if (storedPolicies) {
          this.policies = JSON.parse(storedPolicies);
        } else {
          this.persistPolicies();
        }
        return;
      }
    } catch (e) {
      console.warn('LocalStorage unavailable or quota exceeded; defaulting to in-memory store', e);
    }

    // Fallback in-memory
    this.applications = INITIAL_APPLICATIONS.map((app) => this.hydrateApp(app));
    this.auditEvents = [...INITIAL_AUDIT_EVENTS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
  }

  private hydrateApp(app: ApplicationRecord): ApplicationRecord {
    const policy = this.getActivePolicy(app.schemeType);
    const contradictions = runContradictionRadar(app, policy);
    const appWithContradictions = {
      ...app,
      contradictions,
    };
    const trace = evaluateApplication(appWithContradictions, policy);
    const replay = generateDecisionReplay(appWithContradictions, policy, trace);
    return {
      ...appWithContradictions,
      decisionTrace: trace,
      decisionReplay: replay,
    };
  }

  private persistApps() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(this.applications));
      }
    } catch (e) {}
  }

  private persistAudit() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_AUDIT_LOG, JSON.stringify(this.auditEvents));
      }
    } catch (e) {}
  }

  private persistNotifs() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(this.notifications));
      }
    } catch (e) {}
  }

  private persistPolicies() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_POLICIES, JSON.stringify(this.policies));
      }
    } catch (e) {}
  }

  public getApplications(): ApplicationRecord[] {
    return [...this.applications];
  }

  public getApplicationById(id: string): ApplicationRecord | undefined {
    return this.applications.find((a) => a.id === id || a.refNumber === id);
  }

  public saveApplication(app: ApplicationRecord): ApplicationRecord {
    const hydrated = this.hydrateApp(app);
    hydrated.updatedAt = new Date().toISOString();

    const index = this.applications.findIndex((a) => a.id === app.id);
    if (index >= 0) {
      this.applications[index] = hydrated;
    } else {
      this.applications.unshift(hydrated);
    }
    this.persistApps();
    return hydrated;
  }

  public recordManualAuthenticity(
    appId: string,
    docId: string,
    authenticity: AuthenticityStatus,
    referenceNumber: string,
    notes: string,
    officerActor: string = 'Officer V. Deshmukh (VO-Central)'
  ): ApplicationRecord | undefined {
    const app = this.getApplicationById(appId);
    if (!app) return undefined;

    const updatedDocs = app.documents.map((d) => {
      if (d.id === docId) {
        return {
          ...d,
          authenticity,
          manualAuthenticityReference: referenceNumber,
          manualVerificationNotes: notes,
          verifiedBy: officerActor,
          verifiedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    const updatedApp: ApplicationRecord = {
      ...app,
      documents: updatedDocs,
      reviewNotes: [
        ...app.reviewNotes,
        `[Authenticity Update] Doc ${docId} set to ${authenticity} by ${officerActor} (Ref: ${referenceNumber})`,
      ],
    };

    const saved = this.saveApplication(updatedApp);

    this.recordAuditEvent({
      applicationRef: saved.refNumber,
      eventType: 'AUTHENTICITY_STATUS_UPDATED',
      actor: officerActor,
      reasonOrResult: `Document authenticity updated to ${authenticity}. Reference: ${referenceNumber}. Notes: ${notes}`,
      policyVersion: saved.policyVersion,
    });

    return saved;
  }

  public createNewApplication(data: Partial<ApplicationRecord>): ApplicationRecord {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const refNumber = `APP-2026-${randomDigits}`;
    const newApp: ApplicationRecord = {
      id: `app-${Date.now()}`,
      refNumber,
      schemeType: data.schemeType || 'SCHOLARSHIP',
      schemeName: data.schemeName || 'National Merit-cum-Means Postsecondary Policy',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      policyVersion: '2026.1.4',
      applicant: data.applicant || {
        fullName: '',
        email: '',
        phone: '',
        institution: '',
        course: '',
        academicYear: '1st Year',
        marksObtained: 0,
        maxScore: 100,
        academicScore: 0,
        declaredAnnualIncome: 0,
        familyMembersCount: 1,
      },
      documents: [],
      contradictions: [],
      evidencePassport: [],
      reviewNotes: [],
    };

    const saved = this.saveApplication(newApp);

    this.recordAuditEvent({
      applicationRef: refNumber,
      eventType: 'APPLICATION_CREATED',
      actor: saved.applicant.fullName || 'Student Applicant',
      reasonOrResult: 'Draft scholarship application initialized.',
      policyVersion: saved.policyVersion,
    });

    return saved;
  }

  public getAuditEvents(): AuditEvent[] {
    return [...this.auditEvents];
  }

  public recordAuditEvent(eventData: Omit<AuditEvent, 'eventId' | 'timestamp'>): AuditEvent {
    const event: AuditEvent = {
      ...eventData,
      eventId: `EVT-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditEvents.unshift(event);
    this.persistAudit();
    return event;
  }

  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public markNotificationAsRead(id: string) {
    const n = this.notifications.find((item) => item.id === id);
    if (n) {
      n.isRead = true;
      this.persistNotifs();
    }
  }

  public addNotification(notification: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>) {
    const item: NotificationItem = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    this.notifications.unshift(item);
    this.persistNotifs();
  }

  public getPolicies(): PolicyConfiguration[] {
    return [...this.policies];
  }

  public getActivePolicy(schemeType: 'SCHOLARSHIP' | 'LOAN' = 'SCHOLARSHIP'): PolicyConfiguration {
    return (
      this.policies.find((p) => p.schemeType === schemeType && p.isActive) ||
      (schemeType === 'SCHOLARSHIP' ? DEFAULT_SCHOLARSHIP_POLICY : DEFAULT_LOAN_POLICY)
    );
  }

  public updatePolicy(updated: PolicyConfiguration) {
    const idx = this.policies.findIndex((p) => p.id === updated.id);
    if (idx >= 0) {
      this.policies[idx] = updated;
    } else {
      this.policies.push(updated);
    }
    this.persistPolicies();

    this.recordAuditEvent({
      applicationRef: 'SYSTEM_GLOBAL',
      eventType: 'POLICY_UPDATED',
      actor: 'System Administrator',
      reasonOrResult: `Policy ${updated.name} (v${updated.version}) updated. Thresholds: Income Max ₹${updated.maxAnnualIncome.toLocaleString(
        'en-IN'
      )}, Min Merit ${updated.minAcademicPercentage}%.`,
      policyVersion: updated.version,
    });

    // Re-evaluate all applications with new policy
    this.applications = this.applications.map((app) => this.hydrateApp(app));
    this.persistApps();
  }

  public resetToFactoryDefaults() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY_APPLICATIONS);
      localStorage.removeItem(STORAGE_KEY_AUDIT_LOG);
      localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEY_POLICIES);
    }
    this.init();
  }
}

export const dataService = new DataService();
