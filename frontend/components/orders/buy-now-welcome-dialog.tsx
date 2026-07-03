'use client';

import { Truck, ShieldCheck, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const BUY_NOW_WELCOME_MESSAGES = {
  en: {
    welcome: 'Welcome!',
    noteTitle: 'Important Note',
    note: 'After the delivery person hands you the product, please check it carefully. Pay the amount to the delivery person only after verifying the product.',
    continue: 'Continue to Checkout',
  },
  te: {
    welcome: 'స్వాగతం!',
    noteTitle: 'ముఖ్య గమనిక',
    note: 'డెలివరీ బాయ్ ప్రోడక్ట్ ఇచ్చిన తర్వాత దయచేసి ప్రోడక్ట్ ని బాగా చెక్ చేసుకోండి. ప్రోడక్ట్ సరిగ్గా ఉందని నిర్ధారించుకున్న తర్వాత మాత్రమే డెలివరీ బాయ్ కి అమౌంట్ ఇవ్వండి.',
    continue: 'చెక్అవుట్ కు కొనసాగండి',
  },
  hi: {
    welcome: 'स्वागत है!',
    noteTitle: 'महत्वपूर्ण सूचना',
    note: 'डिलीवरी बॉय द्वारा प्रोडक्ट देने के बाद कृपया प्रोडक्ट को अच्छी तरह जांच लें। प्रोडक्ट सही होने की पुष्टि के बाद ही डिलीवरी बॉय को राशि दें।',
    continue: 'चेकआउट पर जाएँ',
  },
} as const;

const LANG_LABELS = {
  en: 'English',
  te: 'తెలుగు',
  hi: 'हिंदी',
} as const;

interface BuyNowWelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  isLoading?: boolean;
}

export function BuyNowWelcomeDialog({
  open,
  onOpenChange,
  onContinue,
  isLoading = false,
}: BuyNowWelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black">
            {BUY_NOW_WELCOME_MESSAGES.en.welcome}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Thank you for shopping on LocalKart
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-amber-900">
              Please read this note before checkout
            </p>
          </div>

          {(['en', 'te', 'hi'] as const).map((lang) => (
            <div
              key={lang}
              className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Truck className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                  {LANG_LABELS[lang]} · {BUY_NOW_WELCOME_MESSAGES[lang].noteTitle}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">
                {BUY_NOW_WELCOME_MESSAGES[lang].note}
              </p>
            </div>
          ))}
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            className="w-full sm:w-auto min-w-[200px] font-bold"
            size="lg"
            onClick={onContinue}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : BUY_NOW_WELCOME_MESSAGES.en.continue}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
