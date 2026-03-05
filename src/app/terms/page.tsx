import Link from 'next/link'
import { MessageSquareText, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms & Conditions — ReviewFlow',
  description: 'Terms and Conditions for ReviewFlow AI-powered review management service.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <MessageSquareText className="h-6 w-6 text-emerald-500" />
            <span className="text-lg font-bold text-gray-900">ReviewFlow</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
          Terms &amp; Conditions
        </h1>
        <p className="mb-10 text-sm text-gray-500">
          Last updated: 5 March 2026
        </p>

        <div className="prose prose-gray max-w-none text-gray-700 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1">

          <h2>1. Introduction</h2>
          <p>
            Welcome to ReviewFlow (&quot;the Service&quot;), operated by <strong>Obvitech Pty Ltd</strong> (ABN forthcoming), a company registered in New South Wales, Australia (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By accessing or using ReviewFlow, you agree to be bound by these Terms &amp; Conditions (&quot;Terms&quot;). If you do not agree, please do not use the Service.
          </p>

          <h2>2. Service Description</h2>
          <p>
            ReviewFlow is an AI-powered review reply management platform. The Service monitors Google Business Profile reviews on your behalf, generates draft replies using artificial intelligence, and allows you to approve, edit, and publish those replies to Google. The Service is designed to save time and improve your business&apos;s online reputation management.
          </p>

          <h2>3. Account Responsibilities</h2>
          <p>To use ReviewFlow, you must:</p>
          <ul>
            <li>Provide accurate and complete registration information.</li>
            <li>Maintain the security of your account credentials.</li>
            <li>Be at least 18 years of age or have the legal authority to enter into these Terms on behalf of a business entity.</li>
            <li>Promptly notify us of any unauthorized use of your account.</li>
          </ul>
          <p>
            You are responsible for all activity that occurs under your account. We are not liable for any loss or damage arising from unauthorized access to your account.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose or in violation of any applicable laws.</li>
            <li>Attempt to interfere with, compromise, or disrupt the Service or its infrastructure.</li>
            <li>Use the Service to generate misleading, defamatory, or fraudulent content.</li>
            <li>Resell or redistribute access to the Service without our written consent.</li>
            <li>Use automated methods to access the Service beyond what is provided by our interface and APIs.</li>
          </ul>

          <h2>5. Payment Terms</h2>
          <ul>
            <li><strong>Pricing:</strong> ReviewFlow Pro is $88 AUD per month.</li>
            <li><strong>Free Trial:</strong> New accounts receive a 14-day free trial with full access to all features. No credit card is required to start the trial.</li>
            <li><strong>Billing:</strong> After the trial period, you will be billed monthly. Payment is processed via Stripe.</li>
            <li><strong>Cancellation:</strong> You may cancel your subscription at any time from your account settings or the Stripe billing portal. Cancellation takes effect at the end of the current billing period. No refunds are provided for partial months.</li>
            <li><strong>Price Changes:</strong> We may adjust pricing with at least 30 days&apos; notice. Continued use after a price change constitutes acceptance of the new pricing.</li>
          </ul>

          <h2>6. Data Handling</h2>
          <h3>6.1 Google Business Profile Connection</h3>
          <p>
            To use the Service, you authorize ReviewFlow to connect to your Google Business Profile via OAuth. This grants us permission to read your reviews and post replies on your behalf. You may revoke this access at any time through your Google account settings or within ReviewFlow.
          </p>

          <h3>6.2 Data We Store</h3>
          <p>We store the following data:</p>
          <ul>
            <li>Your account information (email, business name, location).</li>
            <li>Google review data (reviewer name, rating, review text, timestamps).</li>
            <li>AI-generated and user-edited reply drafts.</li>
            <li>Activity logs related to review management.</li>
            <li>Your configuration preferences and AI prompt settings.</li>
          </ul>

          <h3>6.3 Data Security</h3>
          <p>
            We use industry-standard security measures to protect your data, including encrypted connections (TLS), secure authentication, and access controls. Your Google OAuth tokens are stored securely and are only used to interact with the Google Business Profile API on your behalf.
          </p>

          <h2>7. AI-Generated Content</h2>
          <p>
            ReviewFlow uses artificial intelligence to generate review reply drafts. While we strive to produce high-quality, appropriate replies, <strong>we do not guarantee the accuracy, appropriateness, or effectiveness of AI-generated content</strong>. You are responsible for reviewing and approving all replies before they are published. If you enable auto-publish, you accept full responsibility for automatically published replies.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law:
          </p>
          <ul>
            <li>The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, whether express or implied.</li>
            <li>We do not guarantee that the Service will be uninterrupted, error-free, or secure.</li>
            <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</li>
            <li>Our total liability to you for any claims arising from or related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim.</li>
          </ul>

          <h2>9. No Guarantee of Results</h2>
          <p>
            ReviewFlow is a tool to assist with review management. We do not guarantee any specific outcomes, including but not limited to: improved review ratings, increased customer engagement, higher search rankings, or business growth. Results depend on many factors beyond our control.
          </p>

          <h2>10. Modifications and Discontinuation</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We will make reasonable efforts to provide advance notice of material changes. Continued use of the Service after modifications constitutes acceptance of the updated Terms.
          </p>

          <h2>11. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at our discretion if you violate these Terms or engage in conduct that we determine is harmful to the Service or other users. Upon termination, your right to use the Service ceases immediately. You may request deletion of your data by contacting us.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of New South Wales, Australia. Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of New South Wales.
          </p>

          <h2>13. Contact</h2>
          <p>
            If you have any questions about these Terms, please contact us:
          </p>
          <ul>
            <li><strong>Company:</strong> Obvitech Pty Ltd</li>
            <li><strong>Email:</strong> <a href="mailto:admin@carwashai.com.au" className="text-emerald-600 hover:text-emerald-700">admin@carwashai.com.au</a></li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm text-gray-500">
            © 2026 ReviewFlow by Obvitech Pty Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
