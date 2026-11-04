import React from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  History,
  Search,
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowRight,
  Eye,
  Users,
  Sparkles,
} from '../components/icons';

interface HomePageProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onNavigateDemo: () => void;
  onExploreFeatures: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateLogin,
  onNavigateRegister,
  onNavigateDemo,
  onExploreFeatures,
}) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-sky-100 selection:text-sky-900">
      
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-pink-500 flex items-center justify-center shadow-md shadow-sky-500/20 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-slate-900 via-sky-950 to-slate-800 bg-clip-text text-transparent">
                  TrustVault
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-sky-100 to-pink-100 text-sky-800 border border-sky-200/80 rounded-full">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Zero-Trust Document Sharing & Cryptographic Audit
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#hero" className="hover:text-sky-600 transition">Home</a>
            <a href="#features" className="hover:text-sky-600 transition">Features</a>
            <a href="#security" className="hover:text-sky-600 transition">Security</a>
            <a href="#how-it-works" className="hover:text-sky-600 transition">How It Works</a>
            <a href="#about" className="hover:text-sky-600 transition">About Us</a>
            <a href="#contact" className="hover:text-sky-600 transition">Contact</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateLogin}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Log In
            </button>
            <button
              onClick={onNavigateDemo}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Explore Platform</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="hero" className="relative pt-16 pb-24 overflow-hidden bg-gradient-to-b from-sky-50/40 via-white to-pink-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-100/80 via-white to-pink-100/80 border border-sky-200 text-xs font-semibold text-slate-800 shadow-2xs">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Zero-Trust Enterprise Document Governance</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Your Documents.{' '}
                <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  Your Control.
                </span>{' '}
                <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                  Your Trust.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                Securely manage, share, and monitor confidential documents with intelligent access control, instant revocation, and an evidentiary, tamper-proof audit trail.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onNavigateDemo}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition cursor-pointer flex items-center gap-2"
                >
                  <span>Get Started Now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <a
                  href="#features"
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm shadow-2xs transition cursor-pointer"
                >
                  Explore Features
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-xl font-black text-slate-900">0 ms</div>
                  <div className="text-xs text-slate-500 font-medium">Instant Revocation</div>
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900">SHA-256</div>
                  <div className="text-xs text-slate-500 font-medium">Tamper-Proof Audit</div>
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900">AES-256-GCM</div>
                  <div className="text-xs text-slate-500 font-medium">Encrypted at Rest</div>
                </div>
              </div>
            </div>

            {/* Right Hero Illustration / Card Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto w-full max-w-md rounded-3xl bg-white border border-slate-200/80 shadow-2xl shadow-sky-500/10 p-6 space-y-4">
                
                {/* Live Vault Security Card */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-100 to-pink-100 flex items-center justify-center text-sky-700 font-bold text-xs border border-sky-200">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Executive Salary Matrix 2026.pdf</div>
                      <div className="text-[10px] text-slate-400">Classified: Restricted (Highest)</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Protected
                  </span>
                </div>

                {/* Simulated Server Security Check */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span>Server Zero-Trust Evaluation</span>
                    <span className="text-emerald-700 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      Passed
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Requester:</span>
                      <span className="text-slate-800">alice@trustvault.corp</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Permission:</span>
                      <span className="text-emerald-700 font-bold">DOCUMENT OWNER (FULL)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SHA-256 Checksum:</span>
                      <span className="text-sky-700">9356d04f42d0...</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Blocked Attacker */}
                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-rose-800 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-rose-600" />
                      Unauthorized Probe Repelled
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-900 font-mono">
                      403 Forbidden
                    </span>
                  </div>
                  <p className="text-[10px] text-rose-700 leading-snug">
                    Eve Adams attempted direct download without explicit grant. Request was blocked on the server and permanently logged.
                  </p>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[11px] font-medium text-slate-500">
                    Every access is checked on the server · Zero client-side trust
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Six Layers of Enterprise Defense
            </h2>
            <p className="text-sm text-slate-500">
              Designed for companies that share salary letters, contracts, blueprints, and regulatory audit papers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md transition space-y-3">
              <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Secure Document Storage</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All uploaded files are envelope-encrypted at rest with AES-256-GCM. Plaintext is never written to disk, and filenames are fully sanitized against path traversal.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md transition space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Role-Based Authentication</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Three clean roles: Administrator, Document Owner, and Viewer. Admins audit compliance without automatic rights to read confidential documents.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md transition space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                <KeyRound className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Document-Level Permissions</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Grants are strictly per-document (READ or EDIT) given to named individuals. No accidental folder leaks where granting one file exposes forty.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md transition space-y-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Real-Time Access Revocation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Taking access away works in 0 milliseconds. The server evaluates database permissions on every stream request. Pre-issued links stop immediately.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md transition space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <History className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Complete Audit Trail</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cryptographic SHA-256 hash chaining records every upload, view, download, permission change, and blocked unauthorized attempt permanently.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md transition space-y-3">
              <div className="h-10 w-10 rounded-xl bg-pink-50 text-pink-600 border border-pink-200 flex items-center justify-center">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Authorized Document Search</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fast search by title, department, sensitivity, and upload date. Results strictly filter out any documents the user lacks permission to access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Security Section */}
      <section id="security" className="py-20 bg-gradient-to-b from-sky-50/30 to-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Security Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built to Withstand Practical Security Audits
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We assume the adversary has direct network access, guesses document UUIDs, and attempts to bypass UI restrictions. The server enforces security every single time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">1</span>
                <span>Server Decides, Every Time</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Not "the button is hidden". Not "the page checks". Direct IDOR manipulation on endpoints immediately triggers 403 Forbidden and writes a permanent refusal record.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">2</span>
                <span>Evidentiary Audit Trail</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                When a document leaks, the first question is who opened it and when. Our ledger uses SHA-256 hash chaining so even database insiders cannot alter past records.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">3</span>
                <span>Human-in-the-Loop AI</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our AI Assistant provides sensitivity advice and recipient suggestions. The machine can never widen access on its own — a human owner must confirm every grant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How TrustVault Works
            </h2>
            <p className="text-sm text-slate-500">
              Four straightforward steps to secure document sharing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative">
              <span className="text-3xl font-black text-sky-600/30">01</span>
              <h4 className="font-bold text-sm text-slate-900">Upload Documents</h4>
              <p className="text-xs text-slate-600">
                Upload PDFs, Word docs, spreadsheets, or images. Magic bytes are validated to reject malware.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative">
              <span className="text-3xl font-black text-blue-600/30">02</span>
              <h4 className="font-bold text-sm text-slate-900">Assign Permissions</h4>
              <p className="text-xs text-slate-600">
                Grant READ or EDIT access to named colleagues with optional expiry dates.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative">
              <span className="text-3xl font-black text-indigo-600/30">03</span>
              <h4 className="font-bold text-sm text-slate-900">Share Securely</h4>
              <p className="text-xs text-slate-600">
                Authorized users view and download decrypted files. Zero public links exist.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative">
              <span className="text-3xl font-black text-emerald-600/30">04</span>
              <h4 className="font-bold text-sm text-slate-900">Monitor Activities</h4>
              <p className="text-xs text-slate-600">
                Every download, view, and blocked attempt is verified in the tamper-proof ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. About & Contact Section */}
      <section id="about" className="py-20 bg-slate-50/60 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                About TrustVault
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Solving the Hardest Security Problem in File Sharing
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every company shares confidential files with employees, contractors, partners, and regulators. TrustVault eliminates the two most expensive risks: permission sprawl where someone sees 40 files instead of one, and audit amnesia where nobody knows who opened a leaked document.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={onNavigateDemo}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Test Demo Accounts
                </button>
              </div>
            </div>

            <div id="contact" className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
              <h3 className="font-bold text-base text-slate-900">Contact Security & Compliance</h3>
              <p className="text-xs text-slate-500">
                Have questions about enterprise deployment, key management, or audit readiness?
              </p>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Your Email</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Message</label>
                  <textarea
                    rows={3}
                    placeholder="Inquire about zero-trust document security..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => alert('Thank you for reaching out! A compliance advisor will respond within 24 hours.')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer"
                >
                  Send Inquiry
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-sky-500 to-pink-500 flex items-center justify-center text-white">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900">TrustVault Security Platform</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-slate-600">
            <a href="#hero" className="hover:text-slate-900">Privacy Policy</a>
            <a href="#hero" className="hover:text-slate-900">Terms of Service</a>
            <a href="#security" className="hover:text-slate-900">Security Architecture</a>
            <a href="#contact" className="hover:text-slate-900">Support</a>
          </div>

          <div className="text-slate-400">
            © 2026 TrustVault. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

