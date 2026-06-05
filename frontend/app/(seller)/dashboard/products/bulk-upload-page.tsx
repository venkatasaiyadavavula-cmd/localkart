'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import {
  Upload, Download, FileSpreadsheet, CheckCircle2,
  XCircle, AlertCircle, ChevronLeft, Sparkles, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

interface BulkUploadResult {
  total:   number;
  created: number;
  skipped: number;
  errors:  { row: number; reason: string }[];
}

interface PlanInfo {
  plan:      string;
  limit:     number;
  used:      number;
  remaining: number;
}

const PLAN_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  starter:  { color: '#6B7280', bg: '#F3F4F6', label: 'Starter' },
  growth:   { color: '#2563EB', bg: '#EFF6FF', label: 'Growth' },
  business: { color: '#7C3AED', bg: '#F5F3FF', label: 'Business' },
};

export default function BulkUploadPage() {
  const fileInputRef            = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [result,   setResult]   = useState<BulkUploadResult | null>(null);
  const [fileName, setFileName] = useState('');

  const { data: planInfo } = useQuery<PlanInfo>({
    queryKey: ['plan-info'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/catalog/seller/product-limit`, { headers: auth() });
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await axios.post(`${API}/catalog/seller/bulk-upload`, form, {
        headers: { ...auth(), 'Content-Type': 'multipart/form-data' },
      });
      return data as BulkUploadResult;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.created > 0) toast.success(`✅ ${data.created} products uploaded!`);
      if (data.skipped > 0) toast.warning(`⚠️ ${data.skipped} rows skipped`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Upload failed');
    },
  });

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Only Excel files (.xlsx / .xls) allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large — max 5MB');
      return;
    }
    setFileName(file.name);
    setResult(null);
    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const downloadTemplate = async () => {
    const res = await axios.get(`${API}/catalog/seller/bulk-upload/template`, {
      headers: auth(),
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const a   = document.createElement('a');
    a.href = url;
    a.download = 'localkart-products-template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  const planCfg  = PLAN_COLORS[planInfo?.plan ?? 'starter'];
  const usedPct  = planInfo ? Math.min((planInfo.used / planInfo.limit) * 100, 100) : 0;
  const isLoading = uploadMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/seller/dashboard/products">
          <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
            Bulk Upload Products
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Upload Excel file — add 100s of products at once</p>
        </div>
      </div>

      {/* Plan quota card */}
      {planInfo && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-extrabold px-2.5 py-1 rounded-full"
                style={{ background: planCfg.bg, color: planCfg.color }}
              >
                {planCfg.label} Plan
              </span>
              <span className="text-sm font-bold text-gray-700">
                {planInfo.used} / {planInfo.limit} products
              </span>
            </div>
            <span className="text-sm font-extrabold" style={{ color: planInfo.remaining > 10 ? '#059669' : '#EF4444' }}>
              {planInfo.remaining} slots left
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width:      `${usedPct}%`,
                background: usedPct > 80
                  ? 'linear-gradient(90deg,#EF4444,#DC2626)'
                  : 'linear-gradient(90deg,#3D5AF1,#6D28D9)',
              }}
            />
          </div>

          {/* Plan comparison */}
          {planInfo.plan === 'starter' && (
            <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                <span className="font-bold text-gray-600">Growth plan</span> — up to 150 products · ₹199/mo
              </p>
              <Link href="/seller/dashboard/subscription">
                <button
                  className="flex items-center gap-1 text-xs font-extrabold text-white px-3 py-1.5 rounded-xl"
                  style={{ background: 'linear-gradient(135deg,#2563EB,#1D4ED8)' }}
                >
                  Upgrade <ArrowRight className="h-3 w-3" />
                </button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Step 1 — Download template */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl text-white text-sm font-extrabold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)' }}>
            1
          </div>
          <div>
            <p className="text-sm font-extrabold text-gray-800">Download Template</p>
            <p className="text-xs text-gray-400">Fill your products in the Excel template</p>
          </div>
        </div>

        <button
          onClick={downloadTemplate}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-sm font-bold transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
          style={{ borderColor: '#E5E9F2', color: '#3D5AF1' }}
        >
          <Download className="h-4 w-4" />
          Download Excel Template (.xlsx)
        </button>

        {/* Column reference */}
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {[
            { col: 'name',        req: true,  note: 'Product name' },
            { col: 'price',       req: true,  note: 'Selling price ₹' },
            { col: 'category',    req: true,  note: 'groceries / fashion...' },
            { col: 'mrp',         req: false, note: 'Original price ₹' },
            { col: 'stock',       req: false, note: 'Quantity' },
            { col: 'description', req: false, note: 'Product details' },
            { col: 'brand',       req: false, note: 'Brand name' },
            { col: 'unit',        req: false, note: '1kg / 500ml...' },
          ].map(({ col, req, note }) => (
            <div key={col} className="flex items-center gap-2 bg-gray-50 rounded-xl px-2.5 py-1.5">
              <code className="text-[10px] font-extrabold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">{col}</code>
              {req && <span className="text-[9px] text-red-500 font-bold">*</span>}
              <span className="text-[10px] text-gray-400 truncate">{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2 — Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl text-white text-sm font-extrabold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
            2
          </div>
          <div>
            <p className="text-sm font-extrabold text-gray-800">Upload Filled Excel</p>
            <p className="text-xs text-gray-400">Max 5MB · .xlsx or .xls</p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200"
          style={{
            borderColor: dragOver ? '#3D5AF1' : isLoading ? '#6D28D9' : '#E5E9F2',
            background:  dragOver ? '#EEF0FE' : isLoading ? '#F5F3FF' : '#FAFAFA',
          }}
        >
          {isLoading ? (
            <>
              <div className="relative">
                <FileSpreadsheet className="h-10 w-10 text-indigo-400 animate-pulse" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-purple-500 animate-bounce" />
              </div>
              <div className="text-center">
                <p className="text-sm font-extrabold text-indigo-600">Uploading {fileName}...</p>
                <p className="text-xs text-gray-400 mt-0.5">Processing your products</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: '#EEF0FE' }}>
                <Upload className="h-6 w-6" style={{ color: '#3D5AF1' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700">
                  {dragOver ? 'Drop here!' : 'Click or drag & drop your Excel file'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">.xlsx or .xls · max 5MB</p>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
        </div>
      </div>

      {/* Step 3 — Results */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl text-white text-sm font-extrabold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
              3
            </div>
            <p className="text-sm font-extrabold text-gray-800">Upload Result</p>
          </div>

          {/* Summary pills */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total rows', value: result.total,   color: '#6B7280', bg: '#F3F4F6', icon: FileSpreadsheet },
              { label: 'Created',    value: result.created, color: '#059669', bg: '#ECFDF5', icon: CheckCircle2 },
              { label: 'Skipped',    value: result.skipped, color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className="rounded-2xl p-3 text-center" style={{ background: bg }}>
                <Icon className="h-5 w-5 mx-auto mb-1" style={{ color }} />
                <p className="text-lg font-extrabold" style={{ color }}>{value}</p>
                <p className="text-[10px] font-semibold text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div>
              <p className="text-xs font-extrabold text-red-500 mb-2 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {result.errors.length} rows had errors
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 bg-red-50 rounded-xl px-3 py-2">
                    <span className="text-[10px] font-extrabold text-red-400 mt-0.5 flex-shrink-0">
                      Row {err.row}
                    </span>
                    <span className="text-[11px] text-red-600 font-medium">{err.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.created > 0 && (
            <Link href="/seller/dashboard/products">
              <button
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-extrabold text-white transition-all active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 4px 16px rgba(5,150,105,0.30)' }}
              >
                <CheckCircle2 className="h-4 w-4" />
                View {result.created} Products
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
