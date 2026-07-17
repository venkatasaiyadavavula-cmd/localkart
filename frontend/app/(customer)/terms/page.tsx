import { SITE_CONTACT } from '@/lib/site-contact';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Terms of Service</h1>
      <div className="prose prose-sm text-gray-600 space-y-4">
        <p>Welcome to LocalKart. By using our platform, you agree to the following terms.</p>

        <h2 className="text-lg font-semibold text-gray-800 mt-6">1. Using LocalKart</h2>
        <p>
          LocalKart connects local shops in Kadapa with customers for online shopping. You must provide
          accurate information when creating an account.
        </p>

        <h2 id="shipping-policy" className="text-lg font-semibold text-gray-800 mt-6 scroll-mt-24">
          2. Shipping Policy
        </h2>
        <p>
          Orders are fulfilled by local sellers and delivered within Kadapa and nearby serviceable areas.
          Delivery is typically same-day for orders placed during shop operating hours, subject to product
          availability and distance from the shop.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Delivery fees, if any, are shown at checkout before you confirm your order.</li>
          <li>Free delivery may apply above a minimum order value set by the seller.</li>
          <li>You will receive order status updates as your order is prepared and dispatched.</li>
          <li>If a shop cannot fulfill your order, you will be notified and will not be charged (COD).</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-800 mt-6">3. Orders & Payments</h2>
        <p>
          Orders are placed directly with local sellers. Payment is accepted via Cash on Delivery (COD) only.
          Pay when your order arrives at your doorstep. Prices and availability are set by individual sellers.
        </p>

        <h2 id="returns-refunds" className="text-lg font-semibold text-gray-800 mt-6 scroll-mt-24">
          4. Returns & Refunds
        </h2>
        <p>
          Returns are accepted within 24 hours of delivery for eligible items (damaged, wrong, or defective
          products). To start a return, open your order in the app and submit a return request, or contact
          support.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Refunds for approved returns are processed after the seller confirms receipt of the item.</li>
          <li>Perishable groceries and certain hygiene products may not be eligible for return unless defective.</li>
          <li>Refund timing depends on seller confirmation; we will keep you updated on the status.</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-800 mt-6">5. Seller Responsibilities</h2>
        <p>
          Sellers are responsible for accurate product listings, timely fulfillment, and complying with
          applicable laws. LocalKart charges a commission on completed orders.
        </p>

        <h2 className="text-lg font-semibold text-gray-800 mt-6">6. Contact</h2>
        <p>
          For questions about these terms, contact us at{' '}
          <a href="mailto:support@localkart.com" className="text-primary hover:underline">
            support@localkart.com
          </a>{' '}
          or WhatsApp{' '}
          <a href={SITE_CONTACT.whatsappUrl} className="text-primary hover:underline">
            {SITE_CONTACT.phoneDisplay}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
