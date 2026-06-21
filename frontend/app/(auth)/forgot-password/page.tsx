'use client';

import Link from 'next/link';
import { ChevronLeft, MessageCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <MessageCircle className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Forgot your password?</h1>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        Password reset via WhatsApp OTP is coming soon. For now, please contact support to reset your password.
      </p>
      <a href="https://wa.me/919876543210?text=I%20need%20help%20resetting%20my%20LocalKart%20password" target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm mb-4">
        Contact us on WhatsApp
      </a>
      <Link href="/login" className="flex items-center gap-1 text-sm text-primary font-semibold">
        <ChevronLeft className="h-4 w-4" /> Back to Login
      </Link>
    </div>
  );
}
