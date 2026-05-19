import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Mail, Phone, MapPin, Send, 
  MessageSquare, Globe, CheckCircle2, AlertCircle
} from 'lucide-react';

const TwitterIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function ContactPage({ setCurrentView }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: ''
      });
    }, 1200);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-12 pb-12 text-slate-800"
    >
      {/* Page Title */}
      <motion.div variants={itemVariants} className="text-center space-y-4 py-4">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase">
          <MessageSquare className="w-4 h-4 text-red-500" />
          Get In Touch
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          We'd Love to <span className="text-gradient">Hear From You</span>
        </h1>
        <p className="text-base text-slate-500 max-w-xl mx-auto font-light leading-relaxed">
          Have questions about onboarding, pricing plans, custom integrations, or settlements? Our team in Hyderabad is ready to help you.
        </p>
      </motion.div>

      {/* Grid: Details & Form */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Info Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">Corporate Details</h2>
            
            <div className="space-y-6">
              {/* Company Name */}
              <div className="flex gap-4">
                <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Name</h3>
                  <p className="text-sm font-semibold text-slate-800">SkyWeb IT Solutions Private Limited</p>
                  <p className="text-[10px] text-slate-400">CIN: U72200TG2023PTC170000 (SaaS Startup)</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4">
                <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</h3>
                  <a href="mailto:support@skywebit.com" className="text-sm font-semibold text-slate-800 hover:text-red-500 transition">
                    support@skywebit.com
                  </a>
                  <p className="text-[10px] text-slate-400">Response within 24 business hours</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4">
                <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Helpline</h3>
                  <a href="tel:+914049889988" className="text-sm font-semibold text-slate-800 hover:text-red-500 transition">
                    +91 40 4988 9988
                  </a>
                  <p className="text-[10px] text-slate-400">Mon - Sat, 9:00 AM to 6:00 PM IST</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-4">
                <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Office Location</h3>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    SkyWeb IT Solutions, 4th Floor, Tech Hub Towers, Madhapur, Hyderabad, Telangana, 500081, India.
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Integration Button */}
            <div className="pt-4 border-t border-slate-100">
              <a 
                href="https://wa.me/914049889988?text=Hello%20SkyWeb%20Support,%20I%20am%20interested%20in%20your%20SaaS%20marketplace%20solutions." 
                target="_blank" 
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow transition-all duration-300 hover:scale-[1.02]"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.335 4.975L2 22l5.233-1.371a9.957 9.957 0 0 0 4.777 1.21h.005c5.505 0 9.988-4.479 9.989-9.985-.001-2.67-1.042-5.18-2.93-7.071A9.92 9.92 0 0 0 12.012 2zm0 1.69c2.213 0 4.296.862 5.864 2.43a8.23 8.23 0 0 1 2.427 5.867c-.001 4.563-3.717 8.277-8.283 8.277h-.004a8.212 8.212 0 0 1-4.184-1.149l-.3-.178-3.111.816.83-3.033-.195-.311a8.218 8.218 0 0 1-1.258-4.242c0-4.563 3.717-8.277 8.283-8.277zm-1.895 3.01c-.26 0-.482.097-.68.324-.199.227-.76.744-.76 1.815s.777 2.103.885 2.249c.108.146 1.503 2.39 3.69 3.284 2.188.894 2.188.596 2.585.556.398-.04 1.282-.524 1.464-1.03.181-.506.181-.941.127-1.03-.054-.09-.199-.146-.416-.256-.217-.11-1.282-.633-1.481-.706-.199-.073-.344-.11-.482.098-.138.207-.534.67-.655.808-.12.138-.242.155-.459.046a5.79 5.79 0 0 1-1.7-1.05 6.376 6.376 0 0 1-1.176-1.467c-.12-.207-.013-.319.095-.426.098-.096.217-.256.326-.383.109-.128.145-.219.217-.365.073-.146.036-.274-.018-.383-.054-.11-.482-1.16-.66-1.59-.176-.425-.353-.367-.482-.373-.127-.006-.272-.007-.409-.007z"/>
                </svg>
                Chat on WhatsApp
              </a>
            </div>

            <div className="flex justify-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all">
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all">
                <LinkedinIcon className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all">
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Send Us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none transition-all text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone / Mobile (Optional)</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 99887 76655"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none transition-all text-slate-800"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Store Onboarding">Merchant/Store Onboarding</option>
                    <option value="Payment Settlements">Payment & Settlements</option>
                    <option value="Custom Technical Help">Technical Customization</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Message *</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows="4"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="How can we help your business digitize?"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none transition-all text-slate-800"
                ></textarea>
              </div>

              <AnimatePresence>
                {submitStatus === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Your inquiry was successfully sent! Our Hyderabad office will respond soon.</span>
                  </motion.div>
                )}
                {submitStatus === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>Please fill in all mandatory fields before sending.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending message...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Inquiry
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Google Maps Section Placeholder */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 text-center">Visit Our Head Office</h2>
        <div className="bg-slate-200 h-[300px] w-full rounded-3xl overflow-hidden border border-slate-200 relative shadow-sm">
          {/* Mock Google Map Visual */}
          <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-red-500 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">SkyWeb IT Solutions Private Limited</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">Madhapur, near HITEC City, Hyderabad, Telangana, 500081</p>
            </div>
            {/* Direct Link to Google Maps */}
            <a 
              href="https://maps.google.com/?q=Madhapur,Hyderabad,Telangana,India" 
              target="_blank" 
              rel="noreferrer"
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold px-4 py-2 rounded-xl shadow transition"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
