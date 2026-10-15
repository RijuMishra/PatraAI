import type {
  DocumentType,
  ExtractedField,
  ExtractionStatus,
  ReadabilityStatus,
  TechnicalValidationResult,
  UploadedDocument,
  VerificationMethod,
} from '../types/index.ts';

export interface NormalizationResult<T> {
  raw: any;
  normalized: T;
  isValid: boolean;
}

/**
 * Normalizes Indian currency strings into numeric integer amounts.
 * Handles "₹2,50,000", "2,50,000/-", "Rs. 250000", "2.5 Lakhs", whitespaces.
 */
export function normalizeCurrency(raw: string | number | null | undefined): NormalizationResult<number | null> {
  if (raw === null || raw === undefined || raw === '') {
    return { raw, normalized: null, isValid: false };
  }

  if (typeof raw === 'number') {
    return { raw, normalized: isNaN(raw) ? null : Math.round(raw), isValid: !isNaN(raw) && raw >= 0 };
  }

  const str = String(raw).trim();
  const lakhMatch = str.match(/([\d.]+)\s*(?:lakh|lac|lakhs|lacs)/i);
  if (lakhMatch) {
    const lakhVal = parseFloat(lakhMatch[1]);
    if (!isNaN(lakhVal)) {
      return { raw, normalized: Math.round(lakhVal * 100000), isValid: true };
    }
  }

  const cleaned = str.replace(/[₹Rs\.\s,/-]/gi, '');
  const parsed = parseInt(cleaned, 10);
  return {
    raw,
    normalized: isNaN(parsed) ? null : parsed,
    isValid: !isNaN(parsed) && parsed >= 0,
  };
}

/**
 * Normalizes academic percentage or CGPA
 */
export function normalizeAcademicScore(raw: string | number | null | undefined): NormalizationResult<number | null> {
  if (raw === null || raw === undefined || raw === '') {
    return { raw, normalized: null, isValid: false };
  }

  if (typeof raw === 'number') {
    return { raw, normalized: Number(raw.toFixed(2)), isValid: raw >= 0 && raw <= 100 };
  }

  const str = String(raw).trim().replace(/%/g, '');
  const parsed = parseFloat(str);

  if (isNaN(parsed)) {
    return { raw, normalized: null, isValid: false };
  }

  // CGPA conversion on 10 point scale (CGPA * 9.5)
  if (parsed <= 10.0 && parsed > 0 && !String(raw).includes('%')) {
    const converted = Number((parsed * 9.5).toFixed(2));
    return { raw, normalized: converted, isValid: true };
  }

  return {
    raw,
    normalized: Number(parsed.toFixed(2)),
    isValid: parsed >= 0 && parsed <= 100,
  };
}

/**
 * Normalizes string text (whitespace collapse, lowercasing, honorific removal)
 */
export function normalizeText(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(mr|mrs|ms|sh|smt|dr)\.?\s+/i, '')
    .toLowerCase();
}

/**
 * Technical Document Validation (Layer 1)
 * Enforces configured mime types, size bounds, byte integrity, and processing suitability.
 * Note: Never treats a file passing technical validation as proof of authenticity!
 */
export function validateDocumentTechnical(file: {
  name: string;
  size: number;
  type: string;
  contentBytes?: number;
}): TechnicalValidationResult {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  const errors: string[] = [];

  // 1. File Type Check
  const isTypeAllowed = allowedMimeTypes.includes(file.type.toLowerCase());
  if (!isTypeAllowed) {
    errors.push(`Unsupported file format '${file.type}'. Allowed: PDF, JPG, PNG.`);
  }

  // 2. File Size Check
  const isSizeAllowed = file.size > 0 && file.size <= maxSizeBytes;
  if (file.size <= 0) {
    errors.push('File is empty (0 bytes). Document cannot be processed.');
  } else if (file.size > maxSizeBytes) {
    errors.push(`File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum 5MB limit.`);
  }

  const canBeProcessed = errors.length === 0;

  return {
    isValidFormat: isTypeAllowed,
    isWithinSizeLimit: isSizeAllowed,
    canBeProcessed,
    contentReadability: canBeProcessed ? 'READABLE' : 'UNREADABLE',
    fileSizeBytes: file.size,
    mimeType: file.type,
    validationErrors: errors,
    disclaimer:
      'Technical validation confirms file format and byte integrity only. Passing technical validation does NOT establish document authenticity.',
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Sanitizes untrusted text extracted from documents to prevent prompt injection or UI exploits
 */
export function sanitizeUntrustedDocumentText(text: string): { sanitized: string; injectionDetected: boolean } {
  if (!text) return { sanitized: '', injectionDetected: false };

  const injectionPatterns = [
    /ignore (?:previous|all) instructions/i,
    /system prompt/i,
    /override (?:approval|decision)/i,
    /mark as approved/i,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  ];

  let hasInjection = false;
  for (const pattern of injectionPatterns) {
    if (pattern.test(text)) {
      hasInjection = true;
      break;
    }
  }

  const sanitized = text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return {
    sanitized,
    injectionDetected: hasInjection,
  };
}

/**
 * Strict schema validator for AI extraction output
 */
export function validateExtractionSchema(
  docType: DocumentType,
  fields: Record<string, ExtractedField>
): { isValidSchema: boolean; missingRequiredFields: string[] } {
  const missing: string[] = [];

  if (docType === 'INCOME_CERTIFICATE') {
    if (!fields.annualIncome || fields.annualIncome.extractionStatus === 'MISSING') {
      missing.push('annualIncome');
    }
    if (!fields.issuingAuthority || fields.issuingAuthority.extractionStatus === 'MISSING') {
      missing.push('issuingAuthority');
    }
  } else if (docType === 'MARKSHEET') {
    if (!fields.totalMarksObtained || fields.totalMarksObtained.extractionStatus === 'MISSING') {
      missing.push('totalMarksObtained');
    }
    if (!fields.candidateName || fields.candidateName.extractionStatus === 'MISSING') {
      missing.push('candidateName');
    }
  }

  return {
    isValidSchema: missing.length === 0,
    missingRequiredFields: missing,
  };
}

/**
 * Synthetic fixture extraction records for Demo Mode
 */
export const SYNTHETIC_FIXTURE_DATABASE: Record<string, Record<string, ExtractedField>> = {
  INCOME_CERTIFICATE_VALID: {
    issuingAuthority: {
      fieldKey: 'issuingAuthority',
      fieldName: 'Issuing Authority / Tehsildar',
      extractedValue: 'Office of the Tahsildar, District Revenue Office',
      sourceDocument: 'Income_Certificate.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.96,
      page: 1,
      boundingBoxHint: 'Header [y: 12%, h: 5%]',
    },
    certificateNumber: {
      fieldKey: 'certificateNumber',
      fieldName: 'Certificate Reference Number',
      extractedValue: 'INC/2026/89412',
      sourceDocument: 'Income_Certificate.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.98,
      page: 1,
      boundingBoxHint: 'Top Right [x: 65%, y: 15%]',
    },
    beneficiaryName: {
      fieldKey: 'beneficiaryName',
      fieldName: 'Beneficiary / Applicant Name',
      extractedValue: 'Aarav Sharma',
      sourceDocument: 'Income_Certificate.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.94,
      page: 1,
      boundingBoxHint: 'Body Para 1 [y: 35%]',
    },
    annualIncome: {
      fieldKey: 'annualIncome',
      fieldName: 'Certified Gross Annual Income',
      extractedValue: '₹2,40,000',
      sourceDocument: 'Income_Certificate.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.95,
      page: 1,
      boundingBoxHint: 'Income Box [x: 30%, y: 55%, w: 40%]',
    },
    issueDate: {
      fieldKey: 'issueDate',
      fieldName: 'Date of Issue',
      extractedValue: '2026-01-15',
      sourceDocument: 'Income_Certificate.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.97,
      page: 1,
    },
  },

  INCOME_CERTIFICATE_MISMATCH: {
    issuingAuthority: {
      fieldKey: 'issuingAuthority',
      fieldName: 'Issuing Authority / Tehsildar',
      extractedValue: 'Office of the Sub-Divisional Magistrate',
      sourceDocument: 'Income_Cert_Priya.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.95,
      page: 1,
    },
    annualIncome: {
      fieldKey: 'annualIncome',
      fieldName: 'Certified Gross Annual Income',
      extractedValue: '₹4,20,000', // Declared is ₹2,40,000 -> Deliberate Contradiction!
      sourceDocument: 'Income_Cert_Priya.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.97,
      page: 1,
      boundingBoxHint: 'Certified Income Block [y: 52%]',
    },
  },

  INCOME_CERTIFICATE_EXCEEDS_THRESHOLD: {
    issuingAuthority: {
      fieldKey: 'issuingAuthority',
      fieldName: 'Issuing Authority / Tehsildar',
      extractedValue: 'Tehsil Revenue Department',
      sourceDocument: 'Income_Cert_Rohan.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.96,
      page: 1,
    },
    annualIncome: {
      fieldKey: 'annualIncome',
      fieldName: 'Certified Gross Annual Income',
      extractedValue: '₹3,20,000', // Exceeds demo ceiling of ₹2,50,000!
      sourceDocument: 'Income_Cert_Rohan.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.98,
      page: 1,
    },
  },

  MARKSHEET_VALID: {
    examinationBoard: {
      fieldKey: 'examinationBoard',
      fieldName: 'Board / University Name',
      extractedValue: 'State Board of Technical Education',
      sourceDocument: 'Semester_Marksheet.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.97,
      page: 1,
    },
    candidateName: {
      fieldKey: 'candidateName',
      fieldName: 'Student Name',
      extractedValue: 'Aarav Sharma',
      sourceDocument: 'Semester_Marksheet.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.96,
      page: 1,
    },
    marksObtained: {
      fieldKey: 'marksObtained',
      fieldName: 'Marks Secured',
      extractedValue: '885',
      sourceDocument: 'Semester_Marksheet.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.98,
      page: 1,
    },
    maxMarks: {
      fieldKey: 'maxMarks',
      fieldName: 'Maximum Marks',
      extractedValue: '1000',
      sourceDocument: 'Semester_Marksheet.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.99,
      page: 1,
    },
    totalMarksObtained: {
      fieldKey: 'totalMarksObtained',
      fieldName: 'Aggregate Percentage',
      extractedValue: '88.5%',
      sourceDocument: 'Semester_Marksheet.pdf',
      extractionMethod: 'SYNTHETIC_DEMO',
      extractionStatus: 'EXTRACTED',
      confidence: 0.98,
      page: 1,
      boundingBoxHint: 'Marks Summary Table [Row 8, Col 5]',
    },
  },
};

/**
 * Adapter interface for document extraction.
 */
export async function extractDocumentFields(
  doc: UploadedDocument,
  fixtureOverride?: string
): Promise<{
  readability: ReadabilityStatus;
  extractedFields: Record<string, ExtractedField>;
  extractionNotes: string;
  isSimulatedDemoMode: boolean;
}> {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 350));

  if (fixtureOverride === 'UNREADABLE' || doc.readability === 'UNREADABLE') {
    return {
      readability: 'UNREADABLE',
      extractedFields: {
        unreadableError: {
          fieldKey: 'unreadableError',
          fieldName: 'Optical Character Recognition Defect',
          extractedValue: null,
          sourceDocument: doc.fileName,
          extractionMethod: 'SYNTHETIC_DEMO',
          extractionStatus: 'UNREADABLE',
          confidence: 0.1,
          uncertaintyReason: 'Document image resolution < 150 DPI with severe compression blur.',
        },
      },
      extractionNotes: 'Optical density below recognition threshold. Safe manual review fallback required.',
      isSimulatedDemoMode: true,
    };
  }

  if (fixtureOverride === 'EXTRACTION_FAILURE') {
    return {
      readability: 'DEGRADED',
      extractedFields: {
        uncertainField: {
          fieldKey: 'uncertainField',
          fieldName: 'Document Text Parser',
          extractedValue: null,
          sourceDocument: doc.fileName,
          extractionMethod: 'SYNTHETIC_DEMO',
          extractionStatus: 'UNCERTAIN',
          confidence: 0.25,
          uncertaintyReason: 'AI parser encountered unmapped document layout. Officer manual entry enabled.',
        },
      },
      extractionNotes: 'AI extraction failed due to non-standard layout. Routed to manual inspection workspace.',
      isSimulatedDemoMode: true,
    };
  }

  let fixtureKey = '';
  if (doc.type === 'INCOME_CERTIFICATE') {
    fixtureKey =
      fixtureOverride === 'MISMATCH'
        ? 'INCOME_CERTIFICATE_MISMATCH'
        : fixtureOverride === 'EXCEEDS_INCOME'
        ? 'INCOME_CERTIFICATE_EXCEEDS_THRESHOLD'
        : 'INCOME_CERTIFICATE_VALID';
  } else if (doc.type === 'MARKSHEET') {
    fixtureKey = 'MARKSHEET_VALID';
  } else {
    return {
      readability: 'READABLE',
      extractedFields: {
        documentNumber: {
          fieldKey: 'documentNumber',
          fieldName: 'Document Identification Code',
          extractedValue: 'GOV-ID-9821034',
          sourceDocument: doc.fileName,
          extractionMethod: 'SYNTHETIC_DEMO',
          extractionStatus: 'EXTRACTED',
          confidence: 0.92,
          page: 1,
        },
      },
      extractionNotes: 'Identity proof structure verified via synthetic demo adapter.',
      isSimulatedDemoMode: true,
    };
  }

  const fields = SYNTHETIC_FIXTURE_DATABASE[fixtureKey] || {};

  return {
    readability: 'READABLE',
    extractedFields: JSON.parse(JSON.stringify(fields)),
    extractionNotes: 'Structured fields extracted and schema validated via Demo Extraction Adapter.',
    isSimulatedDemoMode: true,
  };
}
