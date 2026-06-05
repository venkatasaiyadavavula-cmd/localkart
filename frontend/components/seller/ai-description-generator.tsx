'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  productName: string;
  category:    string;
  price?:      number;
  unit?:       string;
  onGenerated: (description: string) => void;
}

type Status = 'idle' | 'loading-model' | 'generating' | 'done' | 'error';

export function AiDescriptionGenerator({ productName, category, price, unit, onGenerated }: Props) {
  const [status,   setStatus]   = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const pipelineRef = useRef<any>(null);

  const catLabels: Record<string, string> = {
    groceries:       'fresh grocery item sold at a local shop',
    electronics:     'electronics/gadget product sold at a local shop',
    fashion:         'clothing/fashion item sold at a local shop',
    beauty:          'beauty/personal care product sold at a local shop',
    home_essentials: 'home essential product sold at a local shop',
    accessories:     'fashion accessory sold at a local shop',
    sports:          'sports/fitness product sold at a local shop',
    books:           'book/stationery item sold at a local shop',
  };

  const buildPrompt = () => {
    const catDesc = catLabels[category] ?? 'product sold at a local shop';
    const parts   = [
      `Write a short 2-sentence product description for a ${catDesc}.`,
      `Product name: "${productName}".`,
      price  ? `Price: ₹${price}.`  : '',
      unit   ? `Size/unit: ${unit}.` : '',
      `Keep it simple, friendly and under 80 words.`,
    ].filter(Boolean);
    return parts.join(' ');
  };

  const generate = async () => {
    if (!productName.trim()) {
      toast.error('Enter product name first');
      return;
    }

    try {
      setStatus('loading-model');
      setProgress(0);

      // Lazy-load transformers.js only when needed
      const { pipeline, env } = await import('@xenova/transformers');
      env.allowLocalModels  = false;
      env.useBrowserCache   = true;

      if (!pipelineRef.current) {
        pipelineRef.current = await pipeline(
          'text2text-generation',
          'Xenova/flan-t5-small',
          {
            progress_callback: (p: any) => {
              if (p.status === 'downloading') {
                setProgress(Math.round((p.loaded / p.total) * 100));
              }
            },
          },
        );
      }

      setStatus('generating');

      const result = await pipelineRef.current(buildPrompt(), {
        max_new_tokens: 100,
        temperature:    0.7,
      });

      const text: string = result?.[0]?.generated_text ?? '';
      if (!text.trim()) throw new Error('Empty response');

      onGenerated(text.trim());
      setStatus('done');
      toast.success('✨ AI description generated!');
      setTimeout(() => setStatus('idle'), 3000);

    } catch (err: any) {
      console.error('AI error:', err);
      setStatus('error');

      // Graceful fallback — rule-based description
      const fallback = buildFallbackDescription();
      onGenerated(fallback);
      toast('Used smart template instead', { icon: '💡' });
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const buildFallbackDescription = () => {
    const catDesc = catLabels[category] ?? 'quality product';
    const parts   = [
      `Premium ${catDesc} — ${productName}.`,
      unit  ? `Available in ${unit}.`         : '',
      price ? `Best price at ₹${price}.`      : '',
      'Sold by a trusted local shop on LocalKart. Fast delivery available.',
    ].filter(Boolean);
    return parts.join(' ');
  };

  const statusConfig = {
    idle: {
      text:  'AI Generate',
      icon:  <Sparkles className="h-3 w-3" />,
      style: { background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)', boxShadow: '0 2px 10px rgba(61,90,241,0.30)' },
    },
    'loading-model': {
      text:  progress ? `Loading ${progress}%` : 'Loading AI...',
      icon:  <Loader2 className="h-3 w-3 animate-spin" />,
      style: { background: 'linear-gradient(135deg,#6B7280,#4B5563)', boxShadow: 'none' },
    },
    generating: {
      text:  'Writing...',
      icon:  <Loader2 className="h-3 w-3 animate-spin" />,
      style: { background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', boxShadow: '0 2px 10px rgba(124,58,237,0.35)' },
    },
    done: {
      text:  'Generated!',
      icon:  <CheckCircle2 className="h-3 w-3" />,
      style: { background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 2px 10px rgba(5,150,105,0.30)' },
    },
    error: {
      text:  'AI Generate',
      icon:  <Sparkles className="h-3 w-3" />,
      style: { background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)', boxShadow: '0 2px 10px rgba(61,90,241,0.30)' },
    },
  };

  const cfg = statusConfig[status];

  return (
    <button
      type="button"
      onClick={generate}
      disabled={status === 'loading-model' || status === 'generating'}
      className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
      style={{ ...cfg.style, opacity: (status === 'loading-model' || status === 'generating') ? 0.85 : 1 }}
      title="Runs in your browser — no API cost"
    >
      {cfg.icon}
      {cfg.text}
    </button>
  );
}
