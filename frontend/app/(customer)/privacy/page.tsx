export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <div className="prose prose-sm text-gray-600 space-y-4">
        <p>LocalKart respects your privacy. This policy explains what data we collect and how we use it.</p>
        <h2 className="text-lg font-semibold text-gray-800 mt-6">1. Information We Collect</h2>
        <p>We collect your name, phone number, email, and delivery address to process orders. Location data is used to show nearby shops and estimate delivery times.</p>
        <h2 className="text-lg font-semibold text-gray-800 mt-6">2. How We Use Your Information</h2>
        <p>Your information is used to process orders, send order updates via WhatsApp/SMS, and improve our service. We do not sell your personal data to third parties.</p>
        <h2 className="text-lg font-semibold text-gray-800 mt-6">3. Data Sharing</h2>
        <p>Order details are shared with the relevant seller to fulfill your order. We use Cash on Delivery — you pay the delivery person when your order arrives. We do not store card or UPI payment details on our servers.</p>
        <h2 className="text-lg font-semibold text-gray-800 mt-6">4. Your Rights</h2>
        <p>You can update or delete your account information anytime from your profile, or by contacting support@localkart.com.</p>
        <h2 className="text-lg font-semibold text-gray-800 mt-6">5. Contact</h2>
        <p>For privacy concerns, reach us at support@localkart.com.</p>
      </div>
    </div>
  );
}
