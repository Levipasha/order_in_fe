import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, HelpCircle, FileText, ArrowLeft, Mail, Clock, AlertTriangle } from 'lucide-react';

export default function RefundPolicyPage({ setCurrentView }) {
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
          <RefreshCw className="w-4 h-4 text-red-500 animate-spin-slow" />
          Cancellation & Refund Policy
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Refund Policy
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
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
            1. Overview
          </h2>
          <p>
            At <strong>SkyWeb IT Solutions Private Limited</strong>, we design state-of-the-art SaaS billing, ordering, and marketplace infrastructure. We want to ensure a transparent, fair, and seamless experience for all parties (Customers, Vendors, and Platform).
          </p>
          <p>
            This policy outlines the guidelines governing cancellation requests and refund approvals for transactions executed on our Platform.
          </p>
        </section>

        {/* Cancellation Handling */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            2. Cancellation Policy
          </h2>
          <p className="font-semibold text-slate-800">A. Customer Cancellations:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Dine-In/Table QR Orders:</strong> Since food preparation begins immediately after kitchen display verification, customers cannot cancel orders once accepted by the restaurant kitchen.</li>
            <li><strong>Home Delivery / Takeaway:</strong> Cancellations are permitted only within 60 seconds of placing the order, provided the Vendor has not accepted/started preparing the items.</li>
          </ul>

          <p className="font-semibold text-slate-800 mt-3">B. Merchant/Vendor Cancellations:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>A Vendor may cancel an order due to stock out, kitchen capacity limitations, or active store closing hours. In such cases of merchant-side cancellation, a <strong>100% immediate refund</strong> is triggered for prepaid orders.</li>
          </ul>
        </section>

        {/* Refund Eligibility */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
            3. Refund Eligibility & Rules
          </h2>
          <p>
            Customers are eligible for refunds under the following circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Order Rejected:</strong> The Vendor cancels or rejects the order.</li>
            <li><strong>Missing Items:</strong> Items paid for were not served or delivered by the Vendor (verified with the vendor's digital POS logs).</li>
            <li><strong>Defective/Wrong Items:</strong> Vendor serves completely wrong items, or items containing hygiene concerns (requires photographic proof submitted to the merchant dashboard).</li>
          </ul>
        </section>

        {/* Failed Transactions */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-5 h-5 text-red-500 shrink-0" />
            4. Failed Web/App Transactions
          </h2>
          <p>
            Sometimes, money is debited from a customer's bank account/UPI wallet, but the order fails to register on our SaaS servers due to network disruption or API time-outs:
          </p>
          <div className="bg-amber-50 border border-amber-200/60 text-slate-700 rounded-2xl p-4 my-2 font-medium">
            ⚠️ <strong>Auto-Reversal:</strong> If an order is not successfully registered, the payment gateway (Cashfree/Razorpay) will automatically initiate a charge reversal. The amount is returned back to the source account without platform intervention.
          </div>
        </section>

        {/* Processing Timelines */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-5 h-5 text-red-500 shrink-0" />
            5. Processing Timelines
          </h2>
          <p>
            Once a refund is approved by the Vendor or initiated due to a failed transaction:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>The refund command is sent to Cashfree/Razorpay routing nodes instantly.</li>
            <li>
              <strong>Timeline:</strong> It generally takes <strong>5 to 7 working days</strong> for the refunded amount to reflect in the customer's original payment source (bank account, credit card, or UPI wallet). This duration is subject to standard interbank clearing cycles.
            </li>
          </ul>
        </section>

        {/* Non-Refundable Cases */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            6. Non-Refundable Scenarios
          </h2>
          <p>
            No refunds will be issued in the following instances:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Wrong delivery address or incorrect phone number entered during customer check-in.</li>
            <li>Customer orders items by mistake and fails to notify the kitchen within 60 seconds.</li>
            <li>Slight variations in food taste, spice levels, or packaging style.</li>
          </ul>
        </section>

        {/* Contact Support Process */}
        <section className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-slate-950 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-slate-500" /> How to Claim a Refund</h3>
          <p className="text-slate-500 text-xs">
            If you have an eligible refund claim, please email our Hyderabad helpdesk with the following details:
          </p>
          <ul className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
            <li>Customer Name and Phone Number</li>
            <li>Date and Time of Transaction</li>
            <li>Order ID & Vendor/Restaurant Name</li>
            <li>Transaction ID (from Cashfree/Razorpay receipt/SMS)</li>
            <li>Brief description of the issue (with images if applicable)</li>
          </ul>
          <p className="text-xs text-slate-800 pt-1 font-semibold flex items-center gap-1">
            <Mail className="w-4 h-4 text-slate-500" /> Email: <a href="mailto:support@orderin.in" className="text-red-500 hover:underline">support@orderin.in</a>
          </p>
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
