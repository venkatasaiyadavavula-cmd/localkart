export default function AccountDeletionPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Request Account Deletion</h1>
      <div className="prose prose-sm text-gray-600 space-y-4">
        <p>
          If you would like to delete your LocalKart account and associated
          personal data, you can request this by contacting our support team.
        </p>
        <h2 className="text-lg font-semibold text-gray-800 mt-6">How to request deletion</h2>
        <p>
          Email us at{' '}
          <a href="mailto:support@localkart.com" className="text-orange-600 underline">
            support@localkart.com
          </a>{' '}
          from the email or phone number linked to your account, with the subject
          line &quot;Account Deletion Request&quot;. Include your registered phone number
          so we can verify your account.
        </p>
        <h2 className="text-lg font-semibold text-gray-800 mt-6">What gets deleted</h2>
        <p>
          We will delete your profile information, saved addresses, and account
          credentials. Order history required for legal, tax, and accounting
          purposes may be retained in anonymized form as required by applicable
          law, even after account deletion.
        </p>
        <h2 className="text-lg font-semibold text-gray-800 mt-6">Processing time</h2>
        <p>Deletion requests are processed within 7 business days of verification.</p>
      </div>
    </div>
  );
}
