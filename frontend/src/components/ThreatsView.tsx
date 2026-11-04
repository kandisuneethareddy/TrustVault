import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Terminal, Lock, ChevronDown, ChevronUp } from './icons';

interface ThreatEntry {
  id: string;
  category: 'Spoofing' | 'Tampering' | 'Repudiation' | 'Information Disclosure' | 'Denial of Service' | 'Elevation of Privilege';
  title: string;
  attackVector: string;
  impact: string;
  status: 'MITIGATED' | 'ACCEPTED_RISK';
  mitigation: string;
  testCaseRef: string;
  acceptedRationale?: string;
}

const THREAT_CATALOG: ThreatEntry[] = [
  {
    id: 'TV-THR-01',
    category: 'Elevation of Privilege',
    title: 'Direct Object Reference (IDOR) & Unauthorized Document Download',
    attackVector: 'Attacker manipulates documentId UUID in GET /api/documents/:id/download to reach another user’s confidential documents.',
    impact: 'Catastrophic data breach (e.g., employee reads executive salary matrix or competitor contract).',
    status: 'MITIGATED',
    mitigation: 'Centralized Zero-Trust PermissionEngine evaluates live database grants on every stream request. If not document owner or granted named user, immediately returns 403 Forbidden and writes an ACCESS_REFUSED audit record.',
    testCaseRef: 'permission_negative.test.ts (SECURITY-03, SECURITY-04, SECURITY-05)',
  },
  {
    id: 'TV-THR-02',
    category: 'Repudiation',
    title: 'Quiet Alteration or Deletion of Audit Logs (Database Insider Threat)',
    attackVector: 'Privileged insider or attacker with SQL access executes UPDATE audit_logs SET user_id=... or DELETE to hide illicit access.',
    impact: 'Non-repudiation failure; company cannot legally prove who opened the file to regulators or courts.',
    status: 'MITIGATED',
    mitigation: 'Cryptographic SHA-256 Hash Chaining. Each log block embeds the previous block’s hash. Running verifyLedgerIntegrity() mathematically detects any modified row or severed chain link.',
    testCaseRef: 'audit_tamper.test.ts (AUDIT-01, AUDIT-02, AUDIT-03)',
  },
  {
    id: 'TV-THR-03',
    category: 'Elevation of Privilege',
    title: 'Stale JWT Authorization Token Window (Revocation Delay)',
    attackVector: 'Access is revoked from a departing employee, but their pre-issued JWT remains valid for hours, allowing them to keep downloading files.',
    impact: 'Departing employee exfiltrates corporate data after permission termination.',
    status: 'MITIGATED',
    mitigation: 'Server evaluates real-time permissions table on every resource request. When access is revoked, next request fails in 0 milliseconds. Furthermore, user-level session invalidation increments tokenVersion.',
    testCaseRef: 'instant_revocation.test.ts (REVOKE-01, REVOKE-02, REVOKE-04)',
  },
  {
    id: 'TV-THR-04',
    category: 'Tampering',
    title: 'Malicious Executable Upload Disguised via File Extension / MIME Spoofing',
    attackVector: 'Attacker renames malware.exe to contract.pdf or uses null-byte injection (report.txt\\0.exe) to bypass extension checks.',
    impact: 'Remote code execution or storage compromised.',
    status: 'MITIGATED',
    mitigation: 'FileValidator enforces binary magic byte inspection (%PDF-, PK\\x03\\x04, PNG header, etc.), blocks all executable extensions, strips null bytes, and prevents path traversal.',
    testCaseRef: 'file_validation.test.ts (FILE-01, FILE-02, FILE-03, FILE-04)',
  },
  {
    id: 'TV-THR-05',
    category: 'Information Disclosure',
    title: 'Physical Storage or Disk Snapshot Theft Exposing Plaintext Documents',
    attackVector: 'Adversary gains access to backend filesystem or backup snapshot and reads files directly from disk.',
    impact: 'Mass exfiltration bypassing application authentication.',
    status: 'MITIGATED',
    mitigation: 'Envelope encryption at rest using AES-256-GCM. Files are encrypted in memory before touching disk; filenames are randomized UUIDs; SHA-256 checksum verified upon decryption.',
    testCaseRef: 'StorageService.ts & seed.ts',
  },
  {
    id: 'TV-THR-06',
    category: 'Elevation of Privilege',
    title: 'Autonomous AI Permission Hallucination & Accidental Privilege Elevation',
    attackVector: 'AI recommendation model mistakenly suggests making confidential document public or granting unauthorized access, and applies it automatically.',
    impact: 'Unchecked machine-driven data leakage.',
    status: 'MITIGATED',
    mitigation: 'Human-in-the-Loop strict invariant. AI is advisory-only. The system refuses to apply permissions without explicit human owner confirmation. Both AI suggestion and human decision are audited.',
    testCaseRef: 'ai_human_in_loop.test.ts (AI-01, AI-02, AI-03)',
  },
  {
    id: 'TV-THR-07',
    category: 'Information Disclosure',
    title: 'Analog Hole: Authorized Viewer Takes Photograph or Screenshot of Displayed Document',
    attackVector: 'An authorized employee with legitimate READ access uses an external mobile camera to take a physical picture of the confidential screen.',
    impact: 'Confidentiality leak outside the computer boundary.',
    status: 'ACCEPTED_RISK',
    mitigation: 'Technical controls include detailed audit logging of who opened the document and when, ensuring that if a leak occurs, the suspect pool is deterministically known.',
    testCaseRef: 'Evidentiary Audit Logging (DOCUMENT_READ / DOCUMENT_PREVIEW)',
    acceptedRationale: 'Knowingly accepted. Physics dictates that any system rendering photons to human retinas can be photographed with external optical hardware. Mitigated through audit attribution and watermarking.',
  },
  {
    id: 'TV-THR-08',
    category: 'Denial of Service',
    title: 'Host-Level Kernel Panic or Power Cut during Concurrent Hash Chaining',
    attackVector: 'Power outage occurs mid-write while appending to audit log ledger.',
    impact: 'Unfinished file write.',
    status: 'ACCEPTED_RISK',
    mitigation: 'Wrapped inside atomic SQLite transactions. SQLite journal ensures atomic rollback if uncommitted.',
    testCaseRef: 'AuditLogService.ts immediate transactions',
    acceptedRationale: 'SQLite WAL mode provides crash-resilient ACID guarantees.',
  },
];

export const ThreatsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'matrix'>('faq');
  const [expandedId, setExpandedId] = useState<string | null>('TV-THR-01');

  const faqItems = [
    {
      q: 'Can someone open a document if they guess or copy the link?',
      a: 'No. TrustVault never exposes direct static links to files. Every single attempt to view or download a file is checked by the server against the database. If you are not an authorized viewer or owner, the server immediately denies access and logs the blocked attempt.',
      badge: 'Zero-Trust Check',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      q: 'What happens when someone leaves the company or their access is taken away?',
      a: 'Access stops working in 0 milliseconds. The moment an owner clicks "Revoke Access", that person is blocked on the spot. Even if they had an open browser tab or an active session token, the very next request will fail instantly.',
      badge: 'Instant Revocation',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      q: 'Can someone secretly alter or erase the activity log to hide what they did?',
      a: 'No. The activity log is mathematically chained using SHA-256 cryptographic hashes. Each entry includes the fingerprint of the previous entry. If someone tries to edit or delete any past entry in the database, the chain breaks immediately and an alert is raised.',
      badge: 'Tamper-Proof',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      q: 'Can an attacker upload a harmful file or virus disguised as a PDF?',
      a: 'No. TrustVault inspects the actual binary bytes ("magic bytes") inside the file, not just the file extension. Renaming an .exe file to .pdf is caught and rejected immediately before it can be stored.',
      badge: 'File Safety Check',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      q: 'Can the AI grant access to anyone without human approval?',
      a: 'Never. The AI is strictly advisory. It only suggests who might need access and highlights sensitivity. A human document owner must explicitly review and click approve. The machine cannot widen permissions autonomously.',
      badge: 'Human in Control',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      q: 'Can someone read files if they steal the physical hard drive or server backup?',
      a: 'No. All documents are encrypted before they touch the disk using AES-256-GCM encryption with unique keys and initialization vectors. An attacker with raw disk access will only see scrambled ciphertext.',
      badge: 'Encrypted at Rest',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      q: 'What happens if someone takes a photo of their screen with a mobile phone? (The Analog Hole)',
      a: 'Physics dictates that any screen visible to human eyes can be photographed with an external camera. TrustVault mitigates this by keeping an exact audit trail of everyone who opened the file and when. If a document leaks, the company knows exactly who viewed it.',
      badge: 'Accepted Risk & Attribution',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-purple-600" />
            Security & Threat Protection Guide
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Learn how TrustVault stops document leaks, blocks attacks, and guarantees tamper-proof records.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Simple Explainer (Q&A)
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Technical STRIDE Matrix
          </button>
        </div>
      </div>

      {/* Tab 1: Simple Q&A Explainer */}
      {activeTab === 'faq' && (
        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-sky-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{item.q}</span>
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Technical STRIDE Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>Threat Model: 6 Mitigated Vectors · 2 Accepted Residual Risks</span>
            <span>Covered by automated test suites in backend/tests/</span>
          </div>

          {THREAT_CATALOG.map(threat => {
            const isExpanded = expandedId === threat.id;
            const isMitigated = threat.status === 'MITIGATED';

            return (
              <div
                key={threat.id}
                className={`rounded-2xl border transition overflow-hidden bg-white shadow-2xs ${
                  isExpanded ? 'border-sky-300' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : threat.id)}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500">{threat.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        isMitigated
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {threat.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {threat.category}
                    </span>
                    <span className="font-bold text-xs text-slate-900">{threat.title}</span>
                  </div>

                  <div className="text-slate-400 shrink-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3 text-xs border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="font-semibold text-rose-700 text-[11px] uppercase tracking-wider">
                          Attack Vector & Potential Impact
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed">{threat.attackVector}</p>
                        <div className="text-[10px] text-slate-500 mt-1">Impact: {threat.impact}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="font-semibold text-emerald-700 text-[11px] uppercase tracking-wider">
                          Technical Defense Implemented
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed">{threat.mitigation}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-sky-700 font-mono mt-1">
                          <Terminal className="h-3 w-3" />
                          <span>Automated Test: {threat.testCaseRef}</span>
                        </div>
                      </div>
                    </div>

                    {threat.acceptedRationale && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                        <strong className="text-amber-800">Accepted Risk Rationale:</strong> {threat.acceptedRationale}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
