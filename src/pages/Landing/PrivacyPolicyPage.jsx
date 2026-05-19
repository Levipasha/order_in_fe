import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, FileText, ArrowLeft, Mail, MapPin } from 'lucide-react';

export default function PrivacyPolicyPage({ setCurrentView }) {
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
      {/* Top Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 bg-red-50/80 border border-red-200 text-red-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase">
          <Shield className="w-4 h-4 text-red-500" />
          Legal Compliance
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-400">
          Last Updated: May 19, 2026 • SkyWeb IT Solutions Private Limited
        </p>
      </motion.div>

      {/* Main Document Box */}
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm space-y-8 text-xs md:text-sm leading-relaxed">
        
        {/* Intro */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Eye className="w-5 h-5 text-red-500 shrink-0" />
            1. Introduction
          </h2>
          <p>
            Welcome to the SaaS marketplace platform owned and operated by <strong>SkyWeb IT Solutions Private Limited</strong> ("we", "us", or "our"), a startup incorporated in Hyderabad, Telangana, India. We are committed to protecting the privacy of our merchants ("Vendors"), their customers ("End Users"), and visitors.
          </p>
          <p>
            This Privacy Policy describes how we collect, use, process, and disclose your information, including personal data, in conjunction with your access to and use of our SaaS platform, mobile websites, ordering applications, and payment systems.
          </p>
        </section>

        {/* Data Collection */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
            2. Data We Collect
          </h2>
          <p className="font-semibold text-slate-800">A. Personal Data Provided Directly by You:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Account Details:</strong> When you register as a vendor, admin, or user, we collect names, email addresses, phone numbers, and login credentials.</li>
            <li><strong>Vendor Verification Details:</strong> To comply with Indian financial regulations, we collect business registration certificates, GSTIN, PAN cards, FSSAI licenses (for restaurants), bank account details, and corporate addresses.</li>
            <li><strong>Customer Ordering Data:</strong> For processing tableside or online orders, we collect the customer's phone number, name, table number, and item preferences.</li>
          </ul>

          <p className="font-semibold text-slate-800 mt-3">B. Automatically Collected Data:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Device Information:</strong> IP address, browser type, operating system version, and unique device identifiers.</li>
            <li><strong>Usage Logs:</strong> Session durations, pages viewed, buttons clicked, and navigation paths.</li>
          </ul>
        </section>

        {/* Payment Processing */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Lock className="w-5 h-5 text-red-500 shrink-0" />
            3. Payment Processing & Security
          </h2>
          <p>
            For online checkouts, subscription plans, and tableside QR orders, all payment transaction processing is handled securely through industry-leading, PCI-DSS compliant third-party payment aggregators:
          </p>
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 my-2 text-slate-600 font-medium">
            🛡️ <strong>Note on Payment Partners:</strong> Payments may be routed through gateway aggregators like <strong>Cashfree Payments</strong> and/or <strong>Razorpay</strong>.
          </div>
          <p>
            We do <strong>not</strong> collect or store credit/debit card numbers, CVVs, UPI PINs, or bank passwords on our servers. All sensitive financial details are encrypted and passed directly to our banking and payment partners.
          </p>
        </section>

        {/* Vendor Onboarding & Settlements */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
            4. Vendor Settlements & Marketplace Splits
          </h2>
          <p>
            Our platform supports split payments and automated payouts. To facilitate direct vendor bank payouts:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>We share vendor-settlement bank details (IFS code, account number, beneficiary name) with Cashfree/Razorpay routing APIs.</li>
            <li>Settlement reports, transaction logs, and platform commissions are tracked to maintain ledger transparency.</li>
          </ul>
        </section>

        {/* Cookies */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
            5. Cookies and Tracking Technologies
          </h2>
          <p>
            We use essential session cookies to remember items in your cart, active table login sessions, and dashboard navigation states. You can control cookie preferences within your browser settings; however, disabling them may impact some ordering workflows.
          </p>
        </section>

        {/* Security Practices */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Lock className="w-5 h-5 text-red-500 shrink-0" />
            6. Security Practices & Protocols
          </h2>
          <p>
            SkyWeb employs industry-standard security safeguards. All database access uses SSL encryption (HTTPS) in transit and AES encryption at rest. Regular firewalls, rate limiters, and code audits are implemented to prevent unauthorized access or data leaks.
          </p>
        </section>

        {/* User Rights */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
            7. User Rights & Data Deletion
          </h2>
          <p>
            You have the right to request access to the personal data we hold about you, request corrections to out-of-date records, or request complete deletion of your account. To raise a data removal request, please email our Hyderabad office at <a href="mailto:support@skywebit.com" className="text-red-500 font-bold hover:underline">support@skywebit.com</a>.
          </p>
        </section>

        {/* Compliance with Indian Law */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-5 h-5 text-red-500 shrink-0" />
            8. Compliance with Indian Digital Policies
          </h2>
          <p>
            This Privacy Policy is compiled in compliance with <strong>Section 43A of the Information Technology Act, 2000</strong> and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong> of India.
          </p>
        </section>

        {/* Contact Info */}
        <section className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-slate-950">Grievance & Support Desk</h3>
          <p className="text-slate-500">
            If you have questions, complaints, or grievance requests, please write to:
          </p>
          <div className="space-y-1.5 text-slate-800">
            <p className="font-bold">SkyWeb IT Solutions Private Limited</p>
            <p className="flex items-center gap-1.5 text-xs"><MapPin className="w-3.5 h-3.5 text-slate-500" /> Madhapur, Hyderabad, Telangana, 500081, India</p>
            <p className="flex items-center gap-1.5 text-xs"><Mail className="w-3.5 h-3.5 text-slate-500" /> support@skywebit.com</p>
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
