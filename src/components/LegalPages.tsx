import React from 'react'
import { ShieldCheck, FileText, Phone, MapPin, Mail, Landmark, CreditCard } from 'lucide-react'

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">Privacy Policy</h1>
      </div>

      <div className="prose dark:prose-invert prose-blue max-w-none text-gray-600 dark:text-slate-300">
        <p className="text-lg mb-6">Last updated: April 2026</p>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Information We Collect</h2>
        <p>We collect information that you provide directly to us when you use our services, create an account, or communicate with us. This may include personal information such as your name, email address, phone number, and any documents you submit for processing.</p>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, to process your transactions, to send you related information, and to communicate with you about products, services, and offers.</p>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Data Security</h2>
        <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. However, no internet or email transmission is ever fully secure or error-free.</p>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. Sharing of Information</h2>
        <p>We may share information about you as follows: with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf; in response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law, regulation, or legal process.</p>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">5. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us via our Contact Page.</p>
      </div>
    </div>
  )
}

export const TermsConditionsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <h1 className="text-2xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">Terms & Conditions</h1>
      </div>

      <div className="prose dark:prose-invert prose-indigo max-w-none text-gray-600 dark:text-slate-300">
        <p className="text-lg mb-6">Last updated: April 2026</p>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>By accessing and using Gazi Online, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. Description of Service</h2>
        <p>Gazi Online provides users with access to a rich collection of resources, including various online tools, document processing services, and digital products. You understand and agree that the service may include advertisements and that these are necessary for Gazi Online to provide the service.</p>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. User Conduct</h2>
        <p>You agree to not use the service to: upload, post, email, transmit or otherwise make available any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy.</p>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. Modifications to Service</h2>
        <p>Gazi Online reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice.</p>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">5. Payments and Refunds</h2>
        <p>All payments made on Gazi Online are secure. We offer a strict no-refund policy unless the service was not delivered as described due to a fault on our end. Please review your orders carefully before confirming.</p>
      </div>
    </div>
  )
}

import { supabase } from '../lib/supabase'

export const ContactPage: React.FC = () => {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle')

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{ name, email, message }]);

      if (error) throw error;

      setSubmitStatus('success');
      setName('');
      setEmail('');
      setMessage('');
      
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-3xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Contact Us</h1>
        <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
          We're here to help and answer any question you might have. We look forward to hearing from you.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Contact Info & Business Details */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-[28px] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-slate-700/50">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Phone className="text-blue-500" /> Get in Touch
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Office Address</p>
                  <p className="text-gray-500 dark:text-slate-400">Near Modern Academy, Sewatpur, Basirhat, Shwetpur, West Bengal, 743422</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Email Us</p>
                  <a href="mailto:support.gopifa@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">support.gopifa@gmail.com</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Call Us</p>
                  <p className="text-gray-500 dark:text-slate-400">+91 6295051584</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-[28px] p-6 lg:p-8 shadow-sm border border-blue-100 dark:border-slate-700/50">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Business Details</h2>
            <div className="space-y-5">
              <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                <CreditCard className="w-8 h-8 text-blue-500 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">PAN Card</p>
                  <p className="font-bold text-gray-900 dark:text-white tracking-wide">DABPG8031F</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                <Landmark className="w-8 h-8 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Bank Account</p>
                  <p className="font-bold text-gray-900 dark:text-white">A/C: 186295051584</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">IFSC: INDB0000029</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-slate-800 rounded-[28px] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h2>
          <form className="space-y-4" onSubmit={handleSendMessage}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Message</label>
              <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="How can we help you?"></textarea>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full font-bold py-3 px-4 rounded-xl transition-all duration-300 tap-scale flex items-center justify-center gap-2 ${
                submitStatus === 'success' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : submitStatus === 'error'
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : submitStatus === 'success' ? (
                'Message Sent Successfully!'
              ) : submitStatus === 'error' ? (
                'Failed to send. Try again.'
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
