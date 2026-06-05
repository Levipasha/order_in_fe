import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, Scale, HelpCircle, ArrowLeft } from 'lucide-react';

export default function TermsConditionsPage({ setCurrentView }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto pb-16 text-slate-700 space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 bg-red-50/80 border border-red-200 text-red-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase">
          <Scale className="w-4 h-4 text-red-500" />
          Legal Agreement
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Terms & Conditions
        </h1>
        <p className="text-xs text-slate-400">
          Effective Date: May 19, 2026 • SkyWeb IT Solutions Private Limited
        </p>
      </motion.div>

      {/* Main Document Box */}
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm space-y-8 text-xs md:text-sm leading-relaxed">
        
        {/* Intro */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using the SaaS marketplace applications, QR dine-in portals, and payment settlement infrastructure (collectively, the "Platform") owned and operated by <strong>SkyWeb IT Solutions Private Limited</strong> ("SkyWeb", "we", "us", or "our"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, do not access or use the Platform.
          </p>
        </section>

        {/* SaaS Platform Usage */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
            2. SaaS Platform License & Usage
          </h2>
          <p>
            SkyWeb grants Vendors (merchants) and Users a non-transferable, non-exclusive, revocable, limited license to access our digital POS software, customer menus, order routing screens, and admin panel solely for their commercial and retail operations.
          </p>
          <p>
            We strive to maintain 99.9% platform uptime; however, SkyWeb is not responsible for interruptions caused by network failure, cloud hosting downtime, or bank payment gateway failures.
          </p>
        </section>

        {/* Vendor Onboarding */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-5 h-5 text-red-500 shrink-0" />
            3. Vendor Onboarding & Verification (KYC)
          </h2>
          <p>
            To onboard as a store or restaurant on our marketplace, Vendors must complete the verification process (Know Your Customer/KYC):
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Vendors must provide valid credentials, including business entity registration, GSTIN, PAN, and active FSSAI certifications (for food joints).</li>
            <li>Vendors are solely responsible for the authenticity of the verification documents submitted.</li>
            <li>SkyWeb reserves the right to suspend or block any vendor whose documents fail verification audits by our payment partners (Cashfree/Razorpay).</li>
          </ul>
        </section>

        {/* Marketplace Transactions */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
            4. Marketplace Transactions & Payout Settlements
          </h2>
          <p>
            Our Platform facilitates transactions between End Users (customers) and onboarded Vendors.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>SkyWeb acts as a technology facilitator and does not directly sell products or cook food. The contract for sale is strictly between the End User and the Vendor.</li>
            <li><strong>Platform Fees:</strong> We collect SaaS subscription billing fees as detailed in selected plans. For marketplace payments, transaction routing fees or commissions may apply.</li>
            <li><strong>Settlement Splits:</strong> Vendor payouts are settled directly into the linked bank account through payment gateway APIs, usually in T+1 or T+2 business days depending on banking protocols.</li>
          </ul>
        </section>

        {/* Payment Processing */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-5 h-5 text-red-500 shrink-0" />
            5. Payment Gateways & Processing
          </h2>
          <p>
            Online checkout transactions are processed by third-party aggregators such as <strong>Cashfree</strong> or <strong>Razorpay</strong>. Customers and Vendors are bound by the terms and conditions of these third-party integrations. SkyWeb is not responsible for failed transactions, delayed refunds from banks, or double debits, though our Hyderabad support desk will assist in resolving conflicts.
          </p>
        </section>

        {/* Prohibited Activities */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
            6. Prohibited Activities
          </h2>
          <p>
            Users and Vendors are prohibited from:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Submitting false orders or initiating fraudulent chargeback requests.</li>
            <li>Injecting viruses, cross-site scripts (XSS), SQL injections, or attempting hacking attacks on the database.</li>
            <li>Listing contraband, illegal goods, or weapons on the online storefront.</li>
            <li>Attempting to copy or reverse-engineer the source code or design layout of Orderin / SkyWeb products.</li>
          </ul>
        </section>

        {/* Suspension */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-5 h-5 text-red-500 shrink-0" />
            7. Account Suspension & Termination
          </h2>
          <p>
            SkyWeb reserves the right, without liability, to suspend or terminate accounts (both Vendor and Admin) if there is:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Failure to pay SaaS subscription fees on time.</li>
            <li>Violation of any clauses of these terms or Indian trade guidelines.</li>
            <li>Repeated customer complaints regarding food quality or unfulfilled prepaid orders.</li>
          </ul>
        </section>

        {/* Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
            8. Intellectual Property Rights
          </h2>
          <p>
            All content, graphics, source code, designs, database schemas, logo designs, and system architectures are the exclusive property of <strong>SkyWeb IT Solutions Private Limited</strong>. No unauthorized reproduction or redistribution is permitted.
          </p>
        </section>

        {/* Liability Limitations */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-5 h-5 text-red-500 shrink-0" />
            9. Limitation of Liability
          </h2>
          <p>
            In no event shall SkyWeb, its directors, employees, or tech partners be liable for any indirect, incidental, special, or consequential damages arising out of the use of our services, including lost profits, food poisoning disputes, or service delay losses, even if advised of the possibility.
          </p>
        </section>

        {/* Indian Laws & Jurisdiction */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Scale className="w-5 h-5 text-red-500 shrink-0" />
            10. Governing Law & Jurisdiction
          </h2>
          <p>
            These terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of these terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Hyderabad, Telangana, India</strong>.
          </p>
        </section>

        {/* Contact Info */}
        <section className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-2">
          <h3 className="font-bold text-slate-950 flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-slate-500" /> Need Help with our Terms?</h3>
          <p className="text-slate-500">
            Please direct all legal questions to:
          </p>
          <div className="space-y-0.5 text-slate-800 text-xs">
            <p className="font-bold">Legal Compliance Department</p>
            <p>SkyWeb IT Solutions Private Limited</p>
            <p>Geetha Nagar, Malkajgiri, Hyderabad, Telangana, 500047, India</p>
            <p>Email: <a href="mailto:support@orderin.in" className="text-red-500 font-bold hover:underline">support@orderin.in</a></p>
          </div>
        </section>
      </motion.div>

      {/* Back Button */}
      <motion.div variants={itemVariants} className="text-center">
        <button
          onClick={() => setCurrentView('landing')}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Homepage
        </button>
      </motion.div>
    </motion.div>
  );
}
