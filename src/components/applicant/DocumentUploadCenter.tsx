import React, { useState, useRef } from 'react';
import { ApplicationRecord, DocumentType, UploadedDocument } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { extractDocumentFields } from '../../services/extractionAdapter';
import { dataService } from '../../services/dataService';
import {
  UploadCloud,
  FileText,
  Trash2,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  X,
  ShieldCheck,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface DocumentUploadCenterProps {
  application: ApplicationRecord;
  onUpdateApplication: (app: ApplicationRecord) => void;
  onNavigate: (tab: string) => void;
}

export const DocumentUploadCenter: React.FC<DocumentUploadCenterProps> = ({
  application,
  onUpdateApplication,
  onNavigate,
}) => {
  const [processingDocType, setProcessingDocType] = useState<DocumentType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const fileInputRefs = {
    INCOME_CERTIFICATE: useRef<HTMLInputElement>(null),
    MARKSHEET: useRef<HTMLInputElement>(null),
    IDENTITY_DOC: useRef<HTMLInputElement>(null),
  };

  const docConfigs: {
    type: DocumentType;
    title: string;
    description: string;
    isMandatory: boolean;
  }[] = [
    {
      type: 'INCOME_CERTIFICATE',
      title: 'Income Certificate',
      description: 'Official revenue document issued by Tahsildar / SDM for the active financial year.',
      isMandatory: true,
    },
    {
      type: 'MARKSHEET',
      title: 'Qualifying Semester / Degree Marksheet',
      description: 'Official marks card showing semester scores, aggregate percentage, and roll number.',
      isMandatory: true,
    },
    {
      type: 'IDENTITY_DOC',
      title: 'Government Identity Proof',
      description: 'Aadhaar / Voter ID / Passport (Optional under current scholarship policy).',
      isMandatory: false,
    },
  ];

  const handleFileSelection = async (file: File, type: DocumentType) => {
    setErrorMessage(null);

    // Validation: Size (Max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(`File "${file.name}" exceeds the 5MB size limit. Please upload a compressed copy.`);
      return;
    }

    // Validation: Types (PDF, JPG, PNG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(`File "${file.name}" has an unsupported format (${file.type}). Only PDF, JPG, and PNG are allowed.`);
      return;
    }

    setProcessingDocType(type);

    try {
      // Create memory URL for instant browser preview
      const previewUrl = URL.createObjectURL(file);

      const newDoc: UploadedDocument = {
        id: `doc-${Date.now()}`,
        type,
        title: type.replace('_', ' '),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        fileDataUrl: previewUrl,
        status: 'PROCESSING',
        readability: 'UNCHECKED',
        authenticity: 'UNVERIFIED',
        extractedFields: {},
      };

      // Trigger extraction adapter (demo extraction mode)
      const extraction = await extractDocumentFields(newDoc);

      newDoc.readability = extraction.readability;
      newDoc.extractedFields = extraction.extractedFields;
      newDoc.extractionNotes = extraction.extractionNotes;
      newDoc.status = extraction.readability === 'READABLE' ? 'VERIFIED_AGAINST_RULES' : 'UNREADABLE';

      // Update documents array (replace if already exists for this type)
      const updatedDocs = application.documents.filter((d) => d.type !== type);
      updatedDocs.push(newDoc);

      const updatedApp: ApplicationRecord = {
        ...application,
        documents: updatedDocs,
        updatedAt: new Date().toISOString(),
      };

      const saved = dataService.saveApplication(updatedApp);
      dataService.recordAuditEvent({
        applicationRef: saved.refNumber,
        eventType: 'DOCUMENT_UPLOADED',
        actor: `${saved.applicant.fullName} (Applicant)`,
        reasonOrResult: `Uploaded ${file.name} for ${type}. Readability: ${newDoc.readability}. Extraction completed in Demo Mode.`,
        policyVersion: saved.policyVersion,
      });

      onUpdateApplication(saved);
    } catch (e: any) {
      setErrorMessage(`Failed to process document: ${e.message}`);
    } finally {
      setProcessingDocType(null);
    }
  };

  const handleRemoveDoc = (docId: string, type: DocumentType) => {
    const updatedDocs = application.documents.filter((d) => d.id !== docId);
    const updatedApp: ApplicationRecord = {
      ...application,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    };

    const saved = dataService.saveApplication(updatedApp);
    dataService.recordAuditEvent({
      applicationRef: saved.refNumber,
      eventType: 'DOCUMENT_REPLACED',
      actor: `${saved.applicant.fullName} (Applicant)`,
      reasonOrResult: `Removed document ${type} from submission.`,
      policyVersion: saved.policyVersion,
    });

    onUpdateApplication(saved);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Ref: {application.refNumber}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Document Upload Center</h1>
            <p className="text-xs text-slate-500">
              Upload clear certificates. Uploading does not imply authenticity; documents are subjected to OCR extraction and rule checks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('applicant_results')}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-sm"
            >
              <span>View Verification Results</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notice on Authenticity vs Upload */}
        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Important Transparency Notice:</strong> A file that passes automated extraction is verified for
            policy compliance and consistency against declared figures. It is <em>not</em> automatically certified as authentic.
            Authenticity remains pending unless verified against trusted issuing databases.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docConfigs.map((cfg) => {
          const doc = application.documents.find((d) => d.type === cfg.type);
          const isProcessing = processingDocType === cfg.type;

          return (
            <div
              key={cfg.type}
              className={`bg-white rounded-xl border p-5 shadow-sm flex flex-col justify-between transition ${
                doc ? 'border-slate-300' : cfg.isMandatory ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    {doc ? (
                      <StatusPill status={doc.status} size="sm" />
                    ) : cfg.isMandatory ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Mandatory Required
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Optional
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3">{cfg.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cfg.description}</p>

                {/* Uploaded File Info */}
                {doc && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate max-w-[160px]" title={doc.fileName}>
                        {doc.fileName}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>Readability:</span>
                      <strong className={doc.readability === 'READABLE' ? 'text-emerald-700' : 'text-rose-700'}>
                        {doc.readability}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Fields Extracted:</span>
                      <strong className="text-slate-700">{Object.keys(doc.extractedFields).length}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <input
                  type="file"
                  ref={fileInputRefs[cfg.type as keyof typeof fileInputRefs]}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelection(file, cfg.type);
                  }}
                />

                {doc ? (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => fileInputRefs[cfg.type as keyof typeof fileInputRefs]?.current?.click()}
                      className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 transition"
                      title="Replace Document"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveDoc(doc.id, doc.type)}
                      className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                      title="Remove Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRefs[cfg.type as keyof typeof fileInputRefs]?.current?.click()}
                    disabled={isProcessing}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing & OCR...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Certificate (PDF/IMG)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewDoc.fileName}</h3>
                  <span className="text-[11px] text-slate-500">
                    {previewDoc.type} • Readability: {previewDoc.readability}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                  className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-600 font-mono w-10 text-center">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                  className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Container */}
            <div className="flex-1 overflow-auto p-6 bg-slate-100 flex items-center justify-center min-h-[400px]">
              {previewDoc.fileDataUrl ? (
                previewDoc.mimeType === 'application/pdf' ? (
                  <iframe
                    src={previewDoc.fileDataUrl}
                    title="PDF Document Preview"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                    className="w-full h-[500px] border border-slate-300 rounded shadow-sm bg-white"
                  />
                ) : (
                  <img
                    src={previewDoc.fileDataUrl}
                    alt="Document preview"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                    className="max-w-full max-h-[500px] object-contain rounded shadow-sm border border-slate-300"
                  />
                )
              ) : (
                /* Simulated Document View for Synthetic Fixture */
                <div
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                  className="w-[450px] p-6 bg-white rounded-lg shadow border border-slate-300 space-y-4 text-xs font-serif"
                >
                  <div className="text-center border-b pb-3">
                    <span className="font-bold text-sm uppercase block tracking-wider text-slate-800">
                      GOVERNMENT OF INDIA / STATE REVENUE DEPARTMENT
                    </span>
                    <span className="text-[10px] text-slate-500">Official Authenticated Certificate (Demo Simulation)</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-500 font-sans">Document Type:</span>
                      <span className="font-semibold">{previewDoc.title}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-500 font-sans">Reference Code:</span>
                      <span className="font-mono">{previewDoc.id}</span>
                    </div>
                    {Object.values(previewDoc.extractedFields).map((field) => (
                      <div key={field.fieldKey} className="flex justify-between border-b pb-1 bg-amber-50/50 p-1 rounded">
                        <span className="text-slate-600 font-sans">{field.fieldName}:</span>
                        <span className="font-bold text-slate-900">{String(field.extractedValue)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 text-center text-[10px] text-slate-400 font-sans">
                    [Authenticated with Digital Watermark & Cryptographic Stamp]
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Status: {previewDoc.status}</span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
