import React, { useEffect, useRef, useState } from 'react';
import { servicesApi } from '../api/services';
import ReactCrop, { centerCrop, convertToPixelCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { EmailInput } from './EmailInput';
import { TextInput } from './TextInput';
import { TextareaInput } from './TextareaInput';
import { useToast } from './toast/useToast';
import { formatServiceRequestReference } from '../lib/references';
import { getServiceDisplayDescription, getServiceDisplayName, getServiceKind } from '../lib/serviceDisplay';
import { useTranslation } from 'react-i18next';


// ── Icons ──────────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-gray-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
  </svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12S5.25 5.25 12 5.25 21.75 12 21.75 12 18.75 18.75 12 18.75 2.25 12 2.25 12Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75A3.75 3.75 0 1 0 12 8.25a3.75 3.75 0 0 0 0 7.5Z" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v1.125A2.625 2.625 0 0 1 13.125 21H6.375A2.625 2.625 0 0 1 3.75 18.375V8.625A2.625 2.625 0 0 1 6.375 6h1.125" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 15.375A2.625 2.625 0 0 0 12.375 18h5.25a2.625 2.625 0 0 0 2.625-2.625v-9.75A2.625 2.625 0 0 0 17.625 3h-5.25A2.625 2.625 0 0 0 9.75 5.625v9.75Z" />
  </svg>
);

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.125 1.125 0 0 1 1.591 0L21.75 12M4.5 9.75v9A1.125 1.125 0 0 0 5.625 19.875H9.75V15a1.125 1.125 0 0 1 1.125-1.125h2.25A1.125 1.125 0 0 1 14.25 15v4.875h4.125A1.125 1.125 0 0 0 19.5 18.75v-9" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
  </svg>
);

const SparkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" />
  </svg>
);

const AadhaarBadgeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-7 h-7">
    <circle cx="12" cy="9" r="2.1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.6v1.3M8.15 4.9l.85 1M15.85 4.9l-.85 1M6.4 8.7h1.3M16.3 8.7h1.3M8.25 12.4l.95-.85M15.75 12.4l-.95-.85" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 18.4c.9-2.2 2.55-3.4 4.5-3.4s3.6 1.2 4.5 3.4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 20.2h14" />
  </svg>
);

const LinkUpdateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.2 14.8 7.6 16.4a3 3 0 1 1-4.25-4.25l2.5-2.5A3 3 0 0 1 10.1 9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.8 9.2 1.6-1.6a3 3 0 0 1 4.25 4.25l-2.5 2.5A3 3 0 0 1 13.9 15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.8 15.2 15.2 8.8" />
  </svg>
);

const MobileNumberIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-7 h-7">
    <rect x="7" y="2.25" width="10" height="19.5" rx="2.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 18.1h3.4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 7.75h4M10 11.2h4M10 14.65h2.2" />
  </svg>
);

const GooglePlayLogo = ({ className = 'h-16 w-16' }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="gp-green" x1="10.91" y1="44.31" x2="27.27" y2="27.95" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#34A853" />
        <stop offset="1" stopColor="#81C995" />
      </linearGradient>
      <linearGradient id="gp-blue" x1="9.13" y1="20.7" x2="27.74" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#00A0FF" />
        <stop offset="1" stopColor="#3C8DFF" />
      </linearGradient>
      <linearGradient id="gp-yellow" x1="27.43" y1="31.91" x2="52.95" y2="31.91" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFE000" />
        <stop offset="1" stopColor="#FFB300" />
      </linearGradient>
      <linearGradient id="gp-red" x1="10.82" y1="19.31" x2="36.13" y2="31.96" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FF3A44" />
        <stop offset="1" stopColor="#C31162" />
      </linearGradient>
    </defs>
    <path d="M8.92 6.79c-.53.55-.85 1.41-.85 2.52v45.38c0 1.11.32 1.97.85 2.52l.13.11L34.5 32.1v-.2L9.05 6.68l-.13.11Z" fill="url(#gp-blue)" />
    <path d="M42.98 40.52 34.5 32.1v-.2l8.48-8.42.19.11 10.05 5.71c2.87 1.63 2.87 4.27 0 5.9l-10.05 5.71-.19-.39Z" fill="url(#gp-yellow)" />
    <path d="M43.17 40.41 34.5 31.74 8.92 57.21c.84.87 2.22.98 3.79.11l30.46-16.91Z" fill="url(#gp-green)" />
    <path d="M43.17 23.59 12.71 6.68c-1.57-.87-2.95-.76-3.79.11L34.5 32.26l8.67-8.67Z" fill="url(#gp-red)" />
  </svg>
);

const GooglePlayRedeemHero = () => (
  <div className="mb-6 w-full max-w-md rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(16,185,129,0.45)] dark:border-slate-700 dark:bg-slate-800/90">
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-white via-slate-50 to-emerald-50 shadow-inner dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40">
        <GooglePlayLogo className="h-14 w-14 drop-shadow-[0_8px_18px_rgba(60,141,255,0.35)]" />
      </div>
      <div className="text-left">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-500 dark:text-emerald-300">Google Play</p>
        <h3 className="mt-1 text-lg font-black text-gray-900 dark:text-white">Redeem Codes</h3>
        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-slate-400">Instant gift code delivery and redeem support.</p>
      </div>
    </div>
  </div>
);

const AadhaarFlowLogos = () => (
  <div className="mb-6 grid w-full max-w-md grid-cols-3 gap-3">
    {[
      {
        label: 'Aadhaar',
        icon: <AadhaarBadgeIcon />,
        shell: 'bg-orange-50 text-orange-600 dark:bg-orange-900/25 dark:text-orange-300',
      },
      {
        label: 'Link Update',
        icon: <LinkUpdateIcon />,
        shell: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300',
      },
      {
        label: 'Mobile',
        icon: <MobileNumberIcon />,
        shell: 'bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-300',
      },
    ].map(({ label, icon, shell }) => (
      <div
        key={label}
        className="rounded-[20px] border border-white/70 bg-white/90 px-3 py-3 text-center shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/75"
      >
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${shell}`}>
          {icon}
        </div>
        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-gray-600 dark:text-slate-300">
          {label}
        </p>
      </div>
    ))}
  </div>
);

const PvcPdfIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 3.75h5.8L18 7.95v10.3A2 2 0 0 1 16 20.25H8A2 2 0 0 1 6 18.25v-12.5A2 2 0 0 1 8 3.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.75 3.9v4.2h4.1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.9 15.25h6.2M8.9 11.9h4.2" />
  </svg>
);

const PvcBasicDetailsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-7 h-7">
    <circle cx="8.5" cy="8" r="2.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.8 15.4c.8-2 2.15-3.1 3.7-3.1s2.9 1.1 3.7 3.1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 7.25h5.2M14 11h5.2M14 14.75h3.1" />
  </svg>
);

const PvcUploadDocumentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 4.25h5.6l3.4 3.4v10.1A2.25 2.25 0 0 1 14.25 20H7.5a2.25 2.25 0 0 1-2.25-2.25V6.5A2.25 2.25 0 0 1 7.5 4.25Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.1 4.4v3.45h3.4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.9 16.4v-4.4m0 0-1.6 1.6m1.6-1.6 1.6 1.6" />
  </svg>
);

const PvcPhotoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-7 h-7">
    <rect x="3.5" y="5.25" width="17" height="13.5" rx="2.5" />
    <circle cx="9" cy="10" r="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m7 16.25 3.1-3.1a1.2 1.2 0 0 1 1.7 0l1.55 1.55a1.2 1.2 0 0 0 1.7 0l2.95-2.95" />
  </svg>
);

const PvcDeliveryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 8.25h10.5v7.5H3.75zM14.25 10.5h2.9l2.1 2.35v2.9h-5z" />
    <circle cx="7.25" cy="17.6" r="1.6" />
    <circle cx="17.25" cy="17.6" r="1.6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.1 6.25h7.8" />
  </svg>
);

const PvcCardOrderFlowLogos = () => (
  <div className="mb-6 w-full max-w-lg">
    <div className="grid grid-cols-3 gap-3">
      {[
        {
          label: 'Basic Details',
          icon: <PvcBasicDetailsIcon />,
          shell: 'bg-violet-50 text-violet-600 dark:bg-violet-900/25 dark:text-violet-300',
        },
        {
          label: 'Upload Documents',
          icon: <PvcUploadDocumentsIcon />,
          shell: 'bg-rose-50 text-rose-600 dark:bg-rose-900/25 dark:text-rose-300',
        },
        {
          label: 'Get PVC Card',
          icon: <PvcDeliveryIcon />,
          shell: 'bg-sky-50 text-sky-600 dark:bg-sky-900/25 dark:text-sky-300',
        },
      ].map(({ label, icon, shell }) => (
        <div
          key={label}
          className="rounded-[20px] border border-white/70 bg-white/90 px-3 py-3 text-center shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/75"
        >
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${shell}`}>
            {icon}
          </div>
          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-gray-600 dark:text-slate-300">
            {label}
          </p>
        </div>
      ))}
    </div>
    <p className="mt-3 text-xs font-medium text-gray-500 dark:text-slate-400">
      Fill basic details, upload documents, and receive your PVC card order.
    </p>
  </div>
);

// ── Reusable Components ────────────────────────────────────────────────────────

type UploadValue = {
  file: File | null;
  previewUrl: string | null;
  kind: 'pdf' | 'image' | null;
  editorSource: string | null;
};

type UploadFieldProps = {
  label: string;
  description: string;
  id: string;
  accept: string;
  value: UploadValue;
  onChange: (file: File | null) => void;
  onClear: () => void;
  onEdit?: () => void;
  onPreview?: () => void;
};

const getUploadFormatLabel = (accept: string) =>
  accept.includes('application/pdf') ? 'PDF only' : 'JPG, PNG, or WEBP';

const revokePreviewUrl = (previewUrl: string | null) => {
  if (previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
  }
};

const UploadField: React.FC<UploadFieldProps> = ({ label, description, id, accept, value, onChange, onClear, onEdit, onPreview }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-100/60 dark:border-slate-700/70 dark:bg-slate-900/60 dark:hover:shadow-blue-950/20">
    <div className="mb-3 space-y-1">
      <label className="text-sm font-bold text-gray-800 dark:text-slate-200">{label}</label>
      <p className="text-xs text-gray-500 dark:text-slate-400">{description}</p>
    </div>

      <label
      htmlFor={id}
      className="group flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/80 px-4 py-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-md hover:shadow-blue-100/50 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:border-blue-500/50 dark:hover:bg-slate-900 dark:hover:shadow-blue-950/20"
    >
      <div className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
        <UploadIcon />
      </div>
      <span className="mt-2 text-sm font-bold text-blue-600 transition-colors duration-300 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">Select file</span>
      <span className="mt-1 text-xs text-gray-500 dark:text-slate-400">{getUploadFormatLabel(accept)}</span>
    </label>
    <input
      id={id}
      type="file"
      className="hidden"
      accept={accept}
      onChange={(e) => onChange(e.target.files?.[0] || null)}
    />

    {value.file ? (
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50/70 dark:border-slate-700 dark:bg-slate-950/40">
        <div className="flex items-center gap-3 p-4">
          <div className={`rounded-xl p-3 ${value.kind === 'pdf' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'}`}>
            <FileIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">File selected</p>
            <p className="truncate text-xs text-gray-500 dark:text-slate-400">{value.file.name}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-3 py-2 dark:border-slate-700">
          {value.previewUrl && onPreview ? (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <EyeIcon />
              Preview
            </button>
          ) : null}
          {value.kind === 'image' && onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-md hover:shadow-blue-100/60 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-900/40 dark:hover:shadow-blue-950/20"
            >
              Edit Crop
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-200 hover:shadow-md dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:shadow-slate-950/20"
          >
            Remove
          </button>
        </div>
      </div>
    ) : null}
  </div>
);

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700/50 last:border-0">
    <span className="text-sm text-gray-500 dark:text-slate-400">{label}</span>
    <span className="text-sm font-bold text-gray-900 dark:text-white max-w-[50%] text-right truncate" title={value}>{value}</span>
  </div>
);

const Stepper: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => (
  <div className="flex items-center justify-between w-full mb-8 relative">
    {/* Line behind steps */}
    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 dark:bg-slate-700 rounded-full z-0" />
    {/* Active line */}
    <div 
      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500 ease-in-out" 
      style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
    />
    
    {Array.from({ length: totalSteps }).map((_, i) => {
      const stepNumber = i + 1;
      const isActive = stepNumber === currentStep;
      const isPast = stepNumber < currentStep;
      
      return (
        <div key={stepNumber} className="relative z-10 flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 shadow-sm
              ${isActive ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-500/20' : 
                isPast ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 border border-gray-200 dark:border-slate-700 text-sm'}
            `}
          >
            {isPast ? <CheckIcon /> : stepNumber}
          </div>
        </div>
      );
    })}
  </div>
);

// ── Main Flow Component ────────────────────────────────────────────────────────
interface ServiceFlowProps {
  serviceTitle: string;
  serviceDescription: string;
  onClose: () => void;
  onComplete: (formData: any) => Promise<{ requestId?: string; guestSubmission?: boolean } | void> | { requestId?: string; guestSubmission?: boolean } | void;
  onTrackApplication?: () => void;
  onGoHome?: () => void;
}

type RequirementSection = {
  title: string;
  items: string[];
};

type UploadFieldKey = 'combinedPdf' | 'frontImage' | 'backImage' | 'photoImage' | 'signatureImage';
type CropPresetKey = 'free' | 'passport' | 'square' | 'signature';

const MAX_UPLOAD_SIZE_MB = 5;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const MIN_ADDRESS_LENGTH = 10;
const PAY_BILL_CONSUMER_ID_LENGTH = 9;
const AADHAAR_MOBILE_LENGTH = 10;
const AADHAAR_NUMBER_LENGTH = 12;
const GOOGLE_PLAY_MIN_AMOUNT = 10;
const GOOGLE_PLAY_MAX_AMOUNT = 999;
const GOOGLE_PLAY_PROCESSING_FEE = 5;
const GOOGLE_PLAY_QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PDF_TYPES = ['application/pdf'];

const isValidAddress = (value: string) => value.trim().length >= MIN_ADDRESS_LENGTH;
const sanitizePayBillConsumerId = (value: string) => value.replace(/\D/g, '').slice(0, PAY_BILL_CONSUMER_ID_LENGTH);
const isValidPayBillConsumerId = (value: string) => new RegExp(`^\\d{${PAY_BILL_CONSUMER_ID_LENGTH}}$`).test(value);
const sanitizeAadhaarMobile = (value: string) => value.replace(/\D/g, '').slice(0, AADHAAR_MOBILE_LENGTH);
const isValidAadhaarMobile = (value: string) => new RegExp(`^\\d{${AADHAAR_MOBILE_LENGTH}}$`).test(value);
const sanitizeAadhaarNumber = (value: string) => value.replace(/\D/g, '').slice(0, AADHAAR_NUMBER_LENGTH);
const isValidAadhaarNumber = (value: string) => new RegExp(`^\\d{${AADHAAR_NUMBER_LENGTH}}$`).test(value);
const sanitizeGooglePlayAmount = (value: string) => value.replace(/\D/g, '').slice(0, 3);
const formatInr = (value: number) => `₹${value.toFixed(2)}`;

const DEFAULT_FREE_CROP: Crop = {
  unit: '%',
  x: 10,
  y: 10,
  width: 80,
  height: 80,
};

const CROP_PRESETS: Array<{
  key: CropPresetKey;
  label: string;
  hint: string;
  aspect?: number;
}> = [
  { key: 'free', label: 'Free', hint: 'Move and resize freely.' },
  { key: 'passport', label: 'Passport', hint: 'Best for PAN photo.', aspect: 3 / 4 },
  { key: 'square', label: 'Square', hint: 'Balanced crop area.', aspect: 1 },
  { key: 'signature', label: 'Signature', hint: 'Wide strip for signatures.', aspect: 4 / 1 },
];

const getDefaultCropPreset = (key: UploadFieldKey): CropPresetKey => {
  if (key === 'photoImage') return 'passport';
  if (key === 'signatureImage') return 'signature';
  return 'free';
};

const UPLOAD_FIELD_LABELS: Record<UploadFieldKey, string> = {
  combinedPdf: 'Combined PDF Upload',
  frontImage: 'Front Side Image',
  backImage: 'Back Side Image',
  photoImage: 'Passport Photo',
  signatureImage: 'Signature Upload',
};

const getPresetAspect = (preset: CropPresetKey) =>
  CROP_PRESETS.find((option) => option.key === preset)?.aspect;

const centerAspectCrop = (mediaWidth: number, mediaHeight: number, aspect: number) =>
  centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );

const createEmptyUploadValue = (): UploadValue => ({
  file: null,
  previewUrl: null,
  kind: null,
  editorSource: null,
});

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });

const getCroppedImageFile = async (source: string, crop: PixelCrop, fileName: string, mimeType: string) => {
  const image = new Image();
  image.src = source;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not prepare image crop.');
  }

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, 0.92);
  });

  if (!blob) {
    throw new Error('Failed to create cropped image.');
  }

  return new File([blob], fileName, { type: mimeType });
};

const getServiceRequirements = (
  serviceTitle: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): RequirementSection[] => {
  const requirements: Record<string, RequirementSection[]> = {
    'Apply PAN': [
      {
        title: t('serviceFlow.requirements.pan.identityTitle'),
        items: [
          t('serviceFlow.requirements.pan.identityItems.aadhaar'),
          t('serviceFlow.requirements.pan.identityItems.voter'),
          t('serviceFlow.requirements.pan.identityItems.passport'),
          t('serviceFlow.requirements.pan.identityItems.driving'),
          t('serviceFlow.requirements.pan.identityItems.photoId'),
        ],
      },
      {
        title: t('serviceFlow.requirements.pan.addressTitle'),
        items: [
          t('serviceFlow.requirements.pan.addressItems.aadhaar'),
          t('serviceFlow.requirements.pan.addressItems.passport'),
          t('serviceFlow.requirements.pan.addressItems.utility'),
          t('serviceFlow.requirements.pan.addressItems.bank'),
          t('serviceFlow.requirements.pan.addressItems.postOffice'),
        ],
      },
      {
        title: t('serviceFlow.requirements.pan.birthTitle'),
        items: [
          t('serviceFlow.requirements.pan.birthItems.birthCertificate'),
          t('serviceFlow.requirements.pan.birthItems.aadhaar'),
          t('serviceFlow.requirements.pan.birthItems.passport'),
          t('serviceFlow.requirements.pan.birthItems.matriculation'),
        ],
      },
      {
        title: t('serviceFlow.requirements.pan.photoTitle'),
        items: [
          t('serviceFlow.requirements.pan.photoItems.photo'),
          t('serviceFlow.requirements.pan.photoItems.signature'),
        ],
      },
    ],
    'Pay Bill': [
      {
        title: t('serviceFlow.requirements.heading'),
        items: [
          t('serviceFlow.requirements.payBill.consumerNumber'),
          t('serviceFlow.requirements.payBill.billCopy'),
        ],
      },
    ],
    Aadhaar: [
      {
        title: t('serviceFlow.requirements.heading'),
        items: [
          t('serviceFlow.requirements.aadhaar.aadhaarNumber'),
          t('serviceFlow.requirements.aadhaar.mobile'),
          t('serviceFlow.requirements.aadhaar.card'),
        ],
      },
    ],
    'Aadhaar Update': [
      {
        title: t('serviceFlow.requirements.heading'),
        items: [
          t('serviceFlow.requirements.aadhaar.aadhaarNumber'),
          t('serviceFlow.requirements.aadhaar.mobile'),
          t('serviceFlow.requirements.aadhaar.card'),
        ],
      },
    ],
    'Vehicle Tax': [
      {
        title: t('serviceFlow.requirements.heading'),
        items: [t('serviceFlow.requirements.vehicleTax.mobile')],
      },
    ],
  };

  return requirements[serviceTitle] || [
    {
      title: t('serviceFlow.requirements.heading'),
      items: [
        t('serviceFlow.requirements.default.mobile'),
        t('serviceFlow.requirements.default.aadhaar'),
        t('serviceFlow.requirements.default.photo'),
      ],
    },
  ];
};

export const ServiceFlow: React.FC<ServiceFlowProps> = ({ serviceTitle, serviceDescription, onClose, onComplete, onTrackApplication, onGoHome }) => {
  type FlowStage = 'intro' | 'form' | 'payment' | 'success';
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [stage, setStage] = useState<FlowStage>('intro');
  const [step, setStep] = useState(1);
  const displayServiceTitle = getServiceDisplayName(serviceTitle);
  const displayServiceDescription = getServiceDisplayDescription(serviceTitle, serviceDescription);
  const serviceKind = getServiceKind(serviceTitle);
  const isAadhaarService = serviceTitle === 'Aadhaar' || serviceTitle === 'Aadhaar Update';
  const isPvcCardOrderService = serviceKind === 'pvc_card_order';
  const isPanService = serviceTitle === 'Apply PAN';
  const isPayBillService = serviceTitle === 'Pay Bill';
  const isGooglePlayRedeemService = serviceKind === 'google_play_redeem_codes';
  const hasGooglePlayAmountStep = isGooglePlayRedeemService;
  const hasUploadStep = !isPayBillService && !isAadhaarService && !isGooglePlayRedeemService;
  const showAadhaarBasicDetailsExtras = !isPayBillService && !isAadhaarService && !isGooglePlayRedeemService;
  const requiresAddress = !isPayBillService && !isAadhaarService && !isGooglePlayRedeemService;
  const hasIntermediateStep = hasUploadStep || hasGooglePlayAmountStep;
  const totalSteps = hasIntermediateStep ? 3 : 2;
  const reviewStep = hasIntermediateStep ? 3 : 2;
  
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [useSinglePdf, setUseSinglePdf] = useState(false);
  const [isReviewConfirmed, setIsReviewConfirmed] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [isGuestSubmission, setIsGuestSubmission] = useState(false);
  const [googlePlayAmountInput, setGooglePlayAmountInput] = useState('');
  const [previewTarget, setPreviewTarget] = useState<{ key: UploadFieldKey; title: string; kind: 'pdf' | 'image'; url: string } | null>(null);
  const [cropTarget, setCropTarget] = useState<UploadFieldKey | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropPreset, setCropPreset] = useState<CropPresetKey>('free');
  const [cropDraft, setCropDraft] = useState<Crop>(DEFAULT_FREE_CROP);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const requirements = getServiceRequirements(serviceTitle, t);
  const showRequirementsHeading = !(requirements.length === 1 && requirements[0]?.title === t('serviceFlow.requirements.heading'));

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    aadhaarNumber: '',
    mobile: '',
    consumerId: '',
    email: '',
    address: '',
  });
  const aadhaarNumberError =
    isAadhaarService && formData.aadhaarNumber.length > 0 && !isValidAadhaarNumber(formData.aadhaarNumber)
      ? `Aadhar number must be exactly ${AADHAAR_NUMBER_LENGTH} digits.`
      : null;
  const aadhaarMobileError =
    isAadhaarService && formData.mobile.length > 0 && !isValidAadhaarMobile(formData.mobile)
      ? `Mobile number must be exactly ${AADHAAR_MOBILE_LENGTH} digits.`
      : null;
  const payBillConsumerIdError =
    isPayBillService && formData.consumerId.length > 0 && !isValidPayBillConsumerId(formData.consumerId)
      ? `WBSEDCL ID must be exactly ${PAY_BILL_CONSUMER_ID_LENGTH} digits.`
      : null;
  const [files, setFiles] = useState<Record<UploadFieldKey, UploadValue>>({
    combinedPdf: createEmptyUploadValue(),
    frontImage: createEmptyUploadValue(),
    backImage: createEmptyUploadValue(),
    photoImage: createEmptyUploadValue(),
    signatureImage: createEmptyUploadValue(),
  });
  const googlePlayRedeemAmount = Number(googlePlayAmountInput);
  const hasValidGooglePlayAmount =
    Number.isInteger(googlePlayRedeemAmount) &&
    googlePlayRedeemAmount >= GOOGLE_PLAY_MIN_AMOUNT &&
    googlePlayRedeemAmount <= GOOGLE_PLAY_MAX_AMOUNT;
  const googlePlayProcessingFee = hasValidGooglePlayAmount ? GOOGLE_PLAY_PROCESSING_FEE : 0;
  const googlePlayPayableAmount = hasValidGooglePlayAmount ? googlePlayRedeemAmount + googlePlayProcessingFee : 0;
  const imageRef = useRef<HTMLImageElement | null>(null);

  const syncCropState = (nextCrop: Crop, image = imageRef.current) => {
    setCropDraft(nextCrop);

    if (!image || !nextCrop.width || !nextCrop.height) {
      setCompletedCrop(null);
      return;
    }

    setCompletedCrop(convertToPixelCrop(nextCrop, image.width, image.height));
  };

  // Upload Logic
  const uploadDocuments = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const [key, value] of Object.entries(files)) {
      if (value.file) {
        try {
          const url = await servicesApi.uploadDocument(value.file, 'service_documents');
          urls.push(url);
        } catch (uploadError) {
          console.error('Error uploading', key, uploadError);
          throw uploadError;
        }
      }
    }
    return urls;
  };

  const closeCropper = () => {
    imageRef.current = null;
    setCropTarget(null);
    setCropSource(null);
    setCropPreset('free');
    setPendingImageFile(null);
    setCompletedCrop(null);
    setCropDraft(DEFAULT_FREE_CROP);
  };

  const setUploadValue = (key: UploadFieldKey, nextValue: UploadValue) => {
    setFiles((prev) => {
      const previousValue = prev[key];
      if (previousValue.previewUrl !== nextValue.previewUrl) {
        revokePreviewUrl(previousValue.previewUrl);
      }

      return { ...prev, [key]: nextValue };
    });
  };

  const clearUploadValue = (key: UploadFieldKey) => {
    setUploadValue(key, createEmptyUploadValue());
    setPreviewTarget((prev) => (prev?.key === key ? null : prev));
    setUploadError(null);
  };

  useEffect(() => {
    setUploadError(null);

    if (useSinglePdf) {
      setFiles((prev) => ({
        ...prev,
        ...(prev.frontImage.previewUrl ? (revokePreviewUrl(prev.frontImage.previewUrl), {}) : {}),
        ...(prev.backImage.previewUrl ? (revokePreviewUrl(prev.backImage.previewUrl), {}) : {}),
        frontImage: createEmptyUploadValue(),
        backImage: createEmptyUploadValue(),
      }));
      setPreviewTarget((prev) => (prev?.key === 'frontImage' || prev?.key === 'backImage' ? null : prev));
      return;
    }

    setFiles((prev) => ({
      ...prev,
      ...(prev.combinedPdf.previewUrl ? (revokePreviewUrl(prev.combinedPdf.previewUrl), {}) : {}),
      combinedPdf: createEmptyUploadValue(),
    }));
    setPreviewTarget((prev) => (prev?.key === 'combinedPdf' ? null : prev));
  }, [useSinglePdf]);

  useEffect(() => {
    const previewUrls = Object.values(files).map((value) => value.previewUrl);
    return () => {
      previewUrls.forEach((previewUrl) => revokePreviewUrl(previewUrl));
    };
  }, []);

  const validateSelectedFile = (key: UploadFieldKey, file: File) => {
    const isPdfSlot = key === 'combinedPdf';
    const validTypes = isPdfSlot ? PDF_TYPES : IMAGE_TYPES;

    if (!validTypes.includes(file.type)) {
      throw new Error(isPdfSlot ? 'Combined upload supports PDF only.' : 'Only JPG, PNG, or WEBP images are allowed.');
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error(`Each file must be ${MAX_UPLOAD_SIZE_MB}MB or smaller.`);
    }
  };

  const applyCropPreset = (nextPreset: CropPresetKey) => {
    setCropPreset(nextPreset);

    const currentImage = imageRef.current;
    const aspect = getPresetAspect(nextPreset);
    if (!currentImage || !aspect) {
      syncCropState(DEFAULT_FREE_CROP, currentImage);
      return;
    }

    syncCropState(centerAspectCrop(currentImage.width, currentImage.height, aspect), currentImage);
  };

  const openCropEditor = async (key: UploadFieldKey, file: File, source: string, nextPreset = getDefaultCropPreset(key)) => {
    imageRef.current = null;
    setUploadError(null);
    setCropTarget(key);
    setCropSource(source);
    setPendingImageFile(file);
    setCropPreset(nextPreset);
    setCompletedCrop(null);
    setCropDraft(DEFAULT_FREE_CROP);
  };

  const handleCropImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    imageRef.current = event.currentTarget;
    const aspect = getPresetAspect(cropPreset);
    if (!aspect) {
      syncCropState(DEFAULT_FREE_CROP, event.currentTarget);
      return;
    }

    syncCropState(centerAspectCrop(event.currentTarget.width, event.currentTarget.height, aspect), event.currentTarget);
  };

  const handleFileSelection = async (key: UploadFieldKey, file: File | null) => {
    if (!file) return;

    try {
      setUploadError(null);
      validateSelectedFile(key, file);

      if (key === 'combinedPdf') {
        setUploadValue(key, {
          file,
          previewUrl: URL.createObjectURL(file),
          kind: 'pdf',
          editorSource: null,
        });
        return;
      }

      const previewUrl = await readFileAsDataUrl(file);
      await openCropEditor(key, file, previewUrl);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Invalid file selected.');
    }
  };

  const handleEditImage = async (key: UploadFieldKey) => {
    const currentValue = files[key];
    if (!currentValue.file || currentValue.kind !== 'image' || !currentValue.previewUrl) {
      return;
    }

    await openCropEditor(
      key,
      currentValue.file,
      currentValue.editorSource || currentValue.previewUrl,
      getDefaultCropPreset(key),
    );
  };

  const handlePreviewFile = (key: UploadFieldKey) => {
    const currentValue = files[key];
    if (!currentValue.file || !currentValue.previewUrl || !currentValue.kind) {
      return;
    }

    setPreviewTarget({
      key,
      title: UPLOAD_FIELD_LABELS[key],
      kind: currentValue.kind,
      url: currentValue.previewUrl,
    });
  };

  const handleSaveCroppedImage = async () => {
    if (!cropTarget || !cropSource || !pendingImageFile || !completedCrop?.width || !completedCrop?.height) {
      setUploadError('Please adjust the crop before saving.');
      return;
    }

    try {
      const croppedFile = await getCroppedImageFile(
        cropSource,
        completedCrop,
        pendingImageFile.name,
        pendingImageFile.type,
      );

      const previewUrl = await readFileAsDataUrl(croppedFile);
      const existingValue = files[cropTarget];
      setUploadValue(cropTarget, {
        file: croppedFile,
        previewUrl,
        kind: 'image',
        editorSource: existingValue.editorSource || cropSource,
      });
      closeCropper();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to save cropped image.');
    }
  };

  const showErrorToast = (title: string, message: string) => {
    addToast({
      type: 'error',
      title,
      message,
    });
  };

  const showSuccessToast = (title: string, message: string) => {
    addToast({
      type: 'success',
      title,
      message,
    });
  };


  // Navigation Logic
  const handleNextFormStep = () => {
    // Basic validation
    if (step === 1) {
      if (!formData.name || !formData.mobile) {
        addToast({
          type: 'error',
          title: 'Missing Details',
          message: 'Please fill in the required fields (Name and Mobile).',
        });
        return;
      }

      if (isPayBillService && !isValidPayBillConsumerId(formData.consumerId)) {
        showErrorToast(
          'Invalid WBSEDCL ID',
          `Please enter a ${PAY_BILL_CONSUMER_ID_LENGTH}-digit WBSEDCL Consumer ID using numbers only.`
        );
        return;
      }

      if (isAadhaarService && !isValidAadhaarMobile(formData.mobile)) {
        showErrorToast(
          'Invalid Mobile Number',
          `Please enter a ${AADHAAR_MOBILE_LENGTH}-digit mobile number using numbers only.`
        );
        return;
      }

      if (isAadhaarService && !isValidAadhaarNumber(formData.aadhaarNumber)) {
        showErrorToast(
          'Invalid Aadhar Number',
          `Please enter a ${AADHAAR_NUMBER_LENGTH}-digit Aadhar number using numbers only.`
        );
        return;
      }

      if (requiresAddress && !isValidAddress(formData.address)) {
        showErrorToast(
          'Invalid Address',
          `Please enter a valid Current Address with at least ${MIN_ADDRESS_LENGTH} characters.`
        );
        return;
      }
    }

    if (hasUploadStep && step === 2) {
      const hasPrimaryDocuments = useSinglePdf
        ? Boolean(files.combinedPdf.file)
        : Boolean(files.frontImage.file && files.backImage.file);
      if (!hasPrimaryDocuments) {
        showErrorToast(
          'Missing Documents',
          useSinglePdf ? 'Upload the combined PDF to continue.' : 'Upload both front and back images to continue.'
        );
        return;
      }
      if (isPanService && (!files.photoImage.file || !files.signatureImage.file)) {
        showErrorToast('Missing PAN Documents', 'Upload the PAN photo and signature to continue.');
        return;
      }
    }
    if (hasGooglePlayAmountStep && step === 2 && !hasValidGooglePlayAmount) {
      showErrorToast(
        'Select Redeem Amount',
        `Choose or enter a redeem amount between ₹${GOOGLE_PLAY_MIN_AMOUNT} and ₹${GOOGLE_PLAY_MAX_AMOUNT}.`
      );
      return;
    }
    if (step === reviewStep && !isReviewConfirmed) {
      showErrorToast(
        'Confirmation Required',
        hasUploadStep
          ? 'Please confirm that the information and documents are correct.'
          : 'Please confirm that the information is correct.'
      );
      return;
    }
    
    if (step < totalSteps) {
      setStep(s => s + 1);
    } else {
      setStage('payment');
    }
  };

  const handleBack = () => {
    if (stage === 'form') {
      if (step > 1) setStep(s => s - 1);
      else setStage('intro');
    } else if (stage === 'payment') {
      setStage('form');
    }
  };

  const simulateLoading = (nextStage: FlowStage, delay = 1000) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStage(nextStage);
    }, delay);
  };

  const copyReferenceToClipboard = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referenceId);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = referenceId;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      showSuccessToast('Reference Copied', 'Reference ID copied to your clipboard.');
    } catch (error) {
      console.error('Failed to copy reference ID', error);
      showErrorToast('Copy Failed', 'Could not copy the reference ID. Please try again.');
    }
  };

  // ── Render Helpers ───────────────────────────────────────────────────────────
  const renderIntro = () => (
    <div className={`animate-fade-in flex flex-col items-center px-2 py-6 text-center sm:px-4 sm:py-8 ${isPanService ? 'mx-auto max-w-4xl' : ''}`}>
      {isAadhaarService ? (
        <AadhaarFlowLogos />
      ) : isPvcCardOrderService ? (
        <PvcCardOrderFlowLogos />
      ) : isGooglePlayRedeemService ? (
        <GooglePlayRedeemHero />
      ) : (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[20px] bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
        </div>
      )}
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{displayServiceTitle}</h2>
      <p className={`mb-8 mx-auto text-sm leading-relaxed text-gray-500 dark:text-slate-400 ${isPanService ? 'max-w-2xl' : 'max-w-sm'}`}>{displayServiceDescription}</p>
      
      <div className="w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 rounded-[12px] p-6 mb-8 text-left shadow-sm">
        {showRequirementsHeading && <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">{t('serviceFlow.requirements.headingLabel')}</h3>}
        <div className={isPanService ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-4' : 'space-y-5'}>
          {requirements.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-300 font-medium">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      
      <div className={`w-full ${(isPanService || isAadhaarService || isPvcCardOrderService) ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center' : ''}`}>
        <button 
          onClick={() => setStage('form')} 
          className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white tap-scale shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/25 sm:w-auto sm:min-w-[220px] sm:px-10"
        >
          {t('serviceFlow.startApplication')}
        </button>
        {(isPanService || isAadhaarService || isPvcCardOrderService) && onTrackApplication && (
          <button
            type="button"
            onClick={onTrackApplication}
            className="w-full rounded-xl border border-blue-200 bg-white py-4 font-bold text-blue-700 tap-scale shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md dark:border-blue-500/30 dark:bg-slate-900 dark:text-blue-300 dark:hover:border-blue-400/50 dark:hover:bg-slate-800 sm:w-auto sm:min-w-[220px] sm:px-10"
          >
            {isAadhaarService ? t('serviceFlow.trackStatus') : isPanService ? t('serviceFlow.trackApplication') : t('serviceFlow.trackOrder')}
          </button>
        )}
      </div>
    </div>
  );

  const renderFormSteps = () => (
    <div className={`animate-fade-in mx-auto w-full ${isPanService ? 'max-w-5xl' : 'max-w-md'}`}>
      <div className={isPanService ? 'mx-auto max-w-3xl' : ''}>
        <Stepper currentStep={step} totalSteps={totalSteps} />
      </div>
      
      <div className="min-h-[320px] rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-800 sm:p-5 lg:p-6">
        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className={`animate-slide-up space-y-5 ${isPanService ? 'mx-auto max-w-3xl' : ''}`}>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">{t('serviceFlow.form.basicTitle')}</h3>
            <p className="text-xs text-gray-500 mb-4">{t('serviceFlow.form.basicSubtitle')}</p>
            <div className={isPanService ? 'grid gap-4 md:grid-cols-2' : 'space-y-5'}>
              <TextInput
                label={t('serviceFlow.form.fullNameLabel')}
                placeholder={t('serviceFlow.form.fullNamePlaceholder')}
                value={formData.name}
                onChange={(nextValue) => setFormData({ ...formData, name: nextValue })}
                required
                success={isAadhaarService && formData.name.trim().length >= 3}
              />
              {isAadhaarService && (
                <TextInput
                  label="Aadhar Number *"
                  type="tel"
                  placeholder="Enter 12-digit Aadhar number"
                  value={formData.aadhaarNumber}
                  onChange={(nextValue) => setFormData({
                    ...formData,
                    aadhaarNumber: sanitizeAadhaarNumber(nextValue),
                  })}
                  inputMode="numeric"
                  maxLength={AADHAAR_NUMBER_LENGTH}
                  required
                  error={aadhaarNumberError}
                  hint="Only 12 digits are allowed."
                  success={isValidAadhaarNumber(formData.aadhaarNumber)}
                />
              )}
              <TextInput
                label={t('serviceFlow.form.mobileLabel')}
                type="tel"
                placeholder={isAadhaarService ? t('serviceFlow.form.aadhaarMobilePlaceholder') : t('serviceFlow.form.mobilePlaceholder')}
                value={formData.mobile}
                onChange={(nextValue) => setFormData({
                  ...formData,
                  mobile: isAadhaarService ? sanitizeAadhaarMobile(nextValue) : nextValue,
                })}
                inputMode={isAadhaarService ? 'numeric' : undefined}
                maxLength={isAadhaarService ? AADHAAR_MOBILE_LENGTH : undefined}
                required
                error={aadhaarMobileError}
                hint={isAadhaarService ? 'Only 10 digits are allowed.' : undefined}
                success={isAadhaarService && isValidAadhaarMobile(formData.mobile)}
              />
              {isPayBillService && (
                <TextInput
                  label="WBSEDCL Consumer ID *"
                  placeholder="Enter 9-digit WBSEDCL ID"
                  value={formData.consumerId}
                  onChange={(nextValue) => setFormData({ ...formData, consumerId: sanitizePayBillConsumerId(nextValue) })}
                  inputMode="numeric"
                  maxLength={PAY_BILL_CONSUMER_ID_LENGTH}
                  required
                  error={payBillConsumerIdError}
                  hint="Only numbers are allowed, and the ID must be 9 digits."
                />
              )}
              {showAadhaarBasicDetailsExtras && (
                <div className={isPanService ? 'md:col-span-2' : ''}>
                  <EmailInput
                    label={t('serviceFlow.form.emailLabel')}
                    value={formData.email}
                    onChange={(nextValue) => setFormData({ ...formData, email: nextValue })}
                    placeholder={t('serviceFlow.form.emailPlaceholder')}
                    hint={t('serviceFlow.form.emailHint')}
                  />
                </div>
              )}
              {showAadhaarBasicDetailsExtras && (
                <div className={isPanService ? 'md:col-span-2' : ''}>
                  <TextareaInput
                    label={t('serviceFlow.form.currentAddressLabel')}
                    placeholder={t('serviceFlow.form.currentAddressPlaceholder')}
                    rows={3}
                    value={formData.address}
                    onChange={(nextValue) => setFormData({ ...formData, address: nextValue })}
                    required
                    validator={isValidAddress}
                    requiredMessage={t('serviceFlow.form.currentAddressRequired')}
                    invalidMessage={t('serviceFlow.form.currentAddressInvalid', { count: MIN_ADDRESS_LENGTH })}
                    hint={t('serviceFlow.form.currentAddressHint')}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Document Upload */}
        {hasUploadStep && step === 2 && (
          <div className="space-y-5 animate-slide-up">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Upload Documents</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Choose one upload method, then add the required files.</p>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-xs text-gray-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
              {isPanService
                ? 'For PAN, also upload one photo and one signature.'
                : 'Choose the format that is easiest for you.'}
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all duration-300 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-slate-500 dark:hover:shadow-blue-950/10">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Use Single PDF</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Turn on for one combined PDF, or keep off for front and back images.</p>
              </div>
              <button
                type="button"
                onClick={() => setUseSinglePdf((prev) => !prev)}
                aria-pressed={useSinglePdf}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 hover:scale-105 hover:shadow-md ${
                  useSinglePdf ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 dark:hover:shadow-blue-950/30' : 'bg-gray-300 hover:bg-gray-400 dark:bg-slate-700 dark:hover:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    useSinglePdf ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {uploadError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
                {uploadError}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              {useSinglePdf ? (
                <div className="md:col-span-2">
                  <UploadField
                    label="Single PDF"
                    description="Use this if both sides are already in one file."
                    id="combined-pdf-upload"
                    accept=".pdf,application/pdf"
                    value={files.combinedPdf}
                    onChange={(file) => handleFileSelection('combinedPdf', file)}
                    onPreview={() => handlePreviewFile('combinedPdf')}
                    onClear={() => clearUploadValue('combinedPdf')}
                  />
                </div>
              ) : (
                <>
                  <UploadField
                    label="Front Image"
                    description="Upload the front side."
                    id="front-image-upload"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    value={files.frontImage}
                    onChange={(file) => handleFileSelection('frontImage', file)}
                    onPreview={() => handlePreviewFile('frontImage')}
                    onClear={() => clearUploadValue('frontImage')}
                    onEdit={() => handleEditImage('frontImage')}
                  />
                  <UploadField
                    label="Back Image"
                    description="Upload the back side."
                    id="back-image-upload"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    value={files.backImage}
                    onChange={(file) => handleFileSelection('backImage', file)}
                    onPreview={() => handlePreviewFile('backImage')}
                    onClear={() => clearUploadValue('backImage')}
                    onEdit={() => handleEditImage('backImage')}
                  />
                </>
              )}
              {isPanService ? (
                <>
                  <UploadField
                    label="Photo"
                    description="Upload one recent passport photo."
                    id="passport-photo-upload"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    value={files.photoImage}
                    onChange={(file) => handleFileSelection('photoImage', file)}
                    onPreview={() => handlePreviewFile('photoImage')}
                    onClear={() => clearUploadValue('photoImage')}
                    onEdit={() => handleEditImage('photoImage')}
                  />
                  <UploadField
                    label="Signature"
                    description="Upload your signature image."
                    id="signature-upload"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    value={files.signatureImage}
                    onChange={(file) => handleFileSelection('signatureImage', file)}
                    onPreview={() => handlePreviewFile('signatureImage')}
                    onClear={() => clearUploadValue('signatureImage')}
                    onEdit={() => handleEditImage('signatureImage')}
                  />
                </>
              ) : null}
            </div>
          </div>
        )}

        {hasGooglePlayAmountStep && step === 2 && (
          <div className="animate-slide-up">
            <div className="mx-auto max-w-md rounded-[30px] border border-[#E3EAF6] bg-white p-5 shadow-[0_26px_70px_-42px_rgba(37,99,235,0.42)] dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <div>
                <h3 className="text-[26px] font-black tracking-tight text-[#0B2450] dark:text-white">
                  Choose Your Recharge Amount
                </h3>
                <p className="mt-2 text-sm font-medium text-[#4F678A] dark:text-slate-300">
                  Select an amount or enter your own value
                </p>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-3">
                {GOOGLE_PLAY_QUICK_AMOUNTS.map((amount) => {
                  const isActive = googlePlayAmountInput === String(amount);
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setGooglePlayAmountInput(String(amount))}
                      className={`rounded-[16px] border px-3 py-5 text-center text-xl font-black transition-all duration-300 ${
                        isActive
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-[0_10px_24px_-16px_rgba(37,99,235,0.55)] dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-200'
                          : 'border-[#D7E0EF] bg-white text-[#24406A] hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-blue-500/50'
                      }`}
                    >
                      ₹{amount}
                    </button>
                  );
                })}
              </div>

              <div className="mt-7">
                <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#8DA1C3] dark:text-slate-400">
                  Custom Amount
                </p>

                <div
                  className={`mt-3 rounded-[16px] border px-4 py-4 transition-all duration-300 ${
                    googlePlayAmountInput && !hasValidGooglePlayAmount
                      ? 'border-rose-300 bg-rose-50 ring-4 ring-rose-500/10 dark:border-rose-700 dark:bg-rose-950/20'
                      : 'border-[#DDE5F2] bg-[#F5F7FB] focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950'
                  }`}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    value={googlePlayAmountInput}
                    onChange={(event) => setGooglePlayAmountInput(sanitizeGooglePlayAmount(event.target.value))}
                    placeholder="Enter custom amount"
                    className="w-full bg-transparent text-lg font-semibold text-[#0B2450] outline-none placeholder:font-medium placeholder:text-[#8AA0C0] dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                <p className={`mt-2 text-xs font-medium ${
                  googlePlayAmountInput && !hasValidGooglePlayAmount
                    ? 'text-rose-500 dark:text-rose-300'
                    : 'text-[#8AA0C0] dark:text-slate-400'
                }`}>
                  {googlePlayAmountInput && !hasValidGooglePlayAmount
                    ? `Enter a value from ₹${GOOGLE_PLAY_MIN_AMOUNT} to ₹${GOOGLE_PLAY_MAX_AMOUNT}`
                    : `Min ₹${GOOGLE_PLAY_MIN_AMOUNT}, Max ₹${GOOGLE_PLAY_MAX_AMOUNT}`}
                </p>
              </div>

              <div className="mt-7 rounded-[22px] bg-[#F8FAFF] p-4 dark:bg-slate-950/80">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4 text-[#4F678A] dark:text-slate-300">
                    <span>Amount</span>
                    <span className="font-bold text-[#0B2450] dark:text-white">
                      {hasValidGooglePlayAmount ? formatInr(googlePlayRedeemAmount) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[#4F678A] dark:text-slate-300">
                    <span>Convenience Fee</span>
                    <span className="font-bold text-[#0B2450] dark:text-white">
                      {hasValidGooglePlayAmount ? formatInr(googlePlayProcessingFee) : '—'}
                    </span>
                  </div>
                  <div className="border-t border-[#E2EAF6] pt-3 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xl font-black leading-none text-[#0B2450] dark:text-white sm:text-2xl">
                        Total Payable
                      </span>
                      <span className="text-[28px] font-black leading-none text-[#2962FF] dark:text-blue-300 sm:text-[30px]">
                        {hasValidGooglePlayAmount ? formatInr(googlePlayPayableAmount) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === reviewStep && (
          <div className={`animate-slide-up space-y-4 ${isPanService ? 'mx-auto max-w-3xl' : ''}`}>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Review & Confirm</h3>
            <p className="text-xs text-gray-500 mb-4">Check your details before proceeding to payment.</p>
            
            <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-4 space-y-1">
              <SummaryRow label="Name" value={formData.name || 'N/A'} />
              {isAadhaarService && <SummaryRow label="Aadhar Number" value={formData.aadhaarNumber || 'N/A'} />}
              <SummaryRow label="Mobile" value={formData.mobile || 'N/A'} />
              {isPayBillService && <SummaryRow label="WBSEDCL ID" value={formData.consumerId || 'N/A'} />}
              {hasGooglePlayAmountStep && <SummaryRow label="Redeem Code Value" value={hasValidGooglePlayAmount ? `₹${googlePlayRedeemAmount}` : 'N/A'} />}
              {hasGooglePlayAmountStep && <SummaryRow label="Processing Fee" value={`₹${googlePlayProcessingFee || GOOGLE_PLAY_PROCESSING_FEE}`} />}
              {hasGooglePlayAmountStep && <SummaryRow label="Payable Total" value={hasValidGooglePlayAmount ? `₹${googlePlayPayableAmount}` : 'N/A'} />}
              {requiresAddress && <SummaryRow label="Address" value={formData.address || 'N/A'} />}
              {hasUploadStep && <SummaryRow label="Docs Uploaded" value={Object.values(files).filter((entry) => Boolean(entry.file)).length.toString() + ' file(s)'} />}
            </div>

            <label className="mt-4 flex items-start gap-3 rounded-xl bg-blue-50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-md hover:shadow-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:hover:shadow-blue-950/20">
              <input
                type="checkbox"
                checked={isReviewConfirmed}
                onChange={(event) => setIsReviewConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] text-gray-600 dark:text-slate-300 font-medium leading-relaxed">
                I confirm that all the information provided is correct and the documents are authentic.
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Form Controls */}
      <div className={`mt-6 flex gap-4 ${isPanService ? 'mx-auto max-w-3xl' : hasGooglePlayAmountStep && step === 2 ? 'mx-auto max-w-md' : ''}`}>
        <button 
          onClick={handleNextFormStep}
          className={`flex-1 font-bold text-white tap-scale transition-all duration-300 hover:-translate-y-0.5 ${
            hasGooglePlayAmountStep && step === 2
              ? 'rounded-[18px] bg-[#2962FF] py-4 text-base shadow-[0_20px_36px_-18px_rgba(41,98,255,0.65)] hover:bg-[#1E56F0] hover:shadow-[0_22px_40px_-18px_rgba(41,98,255,0.72)]'
              : 'rounded-xl bg-blue-600 py-3.5 shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/25'
          }`}
        >
          {hasGooglePlayAmountStep && step === 2
            ? `${t('serviceFlow.form.proceedToPayment')} →`
            : step === totalSteps
              ? t('serviceFlow.form.proceedToPayment')
              : t('serviceFlow.form.continue')}
        </button>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className={`animate-fade-in mx-auto w-full space-y-6 ${isPanService ? 'max-w-4xl' : 'max-w-md'}`}>
      <div className={isPanService ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start' : 'space-y-6'}>
      <div className="bg-white dark:bg-slate-800 rounded-[16px] p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 text-center">
        <h3 className="text-gray-500 dark:text-slate-400 font-bold mb-2">Total Amount due</h3>
        {isGooglePlayRedeemService && (
          <div className="mb-6 rounded-[24px] border border-emerald-100 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_38%),linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] p-5 text-left shadow-[0_18px_45px_-30px_rgba(16,185,129,0.45)] dark:border-emerald-900/30 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(6,78,59,0.36)_100%)]">
            <p className="text-center text-4xl font-black text-gray-900 dark:text-white">{`₹${googlePlayPayableAmount}.00`}</p>
            <div className="mt-4 bg-white/80 dark:bg-slate-900/50 rounded-xl p-3">
              <SummaryRow label="Service" value={displayServiceTitle} />
              <SummaryRow label="Redeem Code Value" value={`₹${googlePlayRedeemAmount}.00`} />
              <SummaryRow label="Processing Fee" value={`₹${googlePlayProcessingFee}.00`} />
              <SummaryRow label="Payable Total" value={`₹${googlePlayPayableAmount}.00`} />
            </div>
          </div>
        )}
        {!isGooglePlayRedeemService && (
          <>
        <p className="text-4xl font-black text-gray-900 dark:text-white mb-6">₹150.00</p>
        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-3 text-left">
              <SummaryRow label="Service" value={displayServiceTitle} />
          <SummaryRow label="Application Fee" value="₹150.00" />
        </div>
          </>
        )}
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-[16px] p-5 shadow-sm border border-gray-100 dark:border-slate-700/50">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Payment Method</h3>
        <div className="space-y-3">
          {['UPI', 'Credit/Debit Card', 'Net Banking', 'Wallet'].map((method, idx) => (
            <label key={method} className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-md hover:shadow-blue-100/40 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-700/50 dark:hover:shadow-blue-950/10">
              <span className="text-sm font-bold text-gray-700 dark:text-slate-200">{method}</span>
              <input type="radio" name="payment-method" className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500" defaultChecked={idx === 0} />
            </label>
          ))}
        </div>
      </div>
      </div>

      <button 
        onClick={async () => {
          try {
            setLoading(true);
            const urls = await uploadDocuments();
            // Wait 1 second to simulate payment processing
            await new Promise(r => setTimeout(r, 1000));
            const submissionResult = await Promise.resolve(onComplete({
              form_data: {
                ...formData,
                ...(isGooglePlayRedeemService
                  ? {
                      redeem_code_amount: googlePlayRedeemAmount,
                      processing_fee: googlePlayProcessingFee,
                      payable_amount: googlePlayPayableAmount,
                    }
                  : {}),
              },
              document_urls: urls,
            }));
            setIsGuestSubmission(Boolean(submissionResult?.guestSubmission));
            setReferenceId(formatServiceRequestReference(submissionResult?.requestId));
            setLoading(false);
            setStage('success');
            addToast({
              type: 'success',
              title: isPvcCardOrderService ? 'Order Placed' : 'Submission Complete',
              message: isPvcCardOrderService
                ? 'Your PVC card order has been placed successfully and is now being prepared.'
                : hasUploadStep
                  ? 'Payment and document upload completed successfully.'
                  : 'Payment completed successfully.',
            });
          } catch (err) {
            console.error('Submission failed', err);
            addToast({
              type: 'error',
              title: 'Submission Failed',
              message: err instanceof Error ? err.message : 'Failed to submit the application. Please try again.',
            });
            setLoading(false);
          }
        }}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 font-bold text-white tap-scale shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-black hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
      >
        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Pay & Submit'}
      </button>
    </div>
  );

  const renderSuccess = () => {
    const isGuestGooglePlayOrder = isGuestSubmission && isGooglePlayRedeemService;
    const successHeading = isPvcCardOrderService || isGuestGooglePlayOrder ? 'Order Confirmed!' : 'Application Submitted!';
    const successDescription = isGuestGooglePlayOrder
      ? `Your guest order for ${displayServiceTitle} has been received successfully. Save this reference ID in case you need delivery or redeem support.`
      : isPvcCardOrderService
      ? `Your order for ${displayServiceTitle} has been placed successfully. We will process it and deliver your PVC card soon.`
      : `Your application for ${displayServiceTitle} has been submitted successfully and is now under review.`;
    const successStatus = isGuestGooglePlayOrder ? 'Guest Order' : isPvcCardOrderService ? 'Order Booked' : 'Under Review';
    const successNextStep = isGuestGooglePlayOrder ? 'Save Reference' : isPvcCardOrderService ? 'Track Delivery' : 'Track Updates';
    const referenceLabel = isGuestGooglePlayOrder || isPvcCardOrderService ? 'Order ID' : 'Reference ID';
    const primaryActionLabel = isGuestGooglePlayOrder ? 'Done' : isPvcCardOrderService ? 'Track Order' : 'Track';
    const primaryAction = isGuestGooglePlayOrder ? (onGoHome ?? onClose) : (onTrackApplication ?? onClose);

    return (
      <div className="animate-fade-in px-2 py-4 sm:px-4 sm:py-6">
        <div className="mx-auto max-w-md overflow-hidden rounded-[28px] border border-emerald-100 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-xl shadow-emerald-100/40 dark:border-emerald-900/30 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(15,23,42,0.9)_100%)] dark:shadow-emerald-950/10">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-emerald-100 text-emerald-600 shadow-inner shadow-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>

        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <SparkIcon />
            Success
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">{successHeading}</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-slate-400">
            {successDescription}
          </p>
          {isGuestGooglePlayOrder ? (
            <p className="mx-auto mt-3 max-w-sm rounded-2xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              Guest orders are saved on this device only and will not appear in your dashboard unless you order while signed in.
            </p>
          ) : null}
        </div>

        <div className="mt-6 rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">{referenceLabel}</p>
              <p className="mt-2 text-xl font-black tracking-[0.18em] text-gray-900 dark:text-white">{referenceId}</p>
            </div>
            <button
              type="button"
              onClick={copyReferenceToClipboard}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-2 text-[11px] font-bold text-gray-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 hover:shadow-md dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <CopyIcon />
              Copy
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gray-50 px-3 py-3 text-left dark:bg-slate-800/80">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-slate-400">Status</p>
              <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{successStatus}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 px-3 py-3 text-left dark:bg-slate-800/80">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-slate-400">Next Step</p>
              <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{successNextStep}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={primaryAction}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-sm font-bold text-white tap-scale shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/25"
          >
            {isGuestGooglePlayOrder ? <HomeIcon /> : <SearchIcon />}
            {primaryActionLabel}
          </button>
          <button
            onClick={onGoHome ?? onClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-3 py-3 text-sm font-bold text-gray-900 tap-scale transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 hover:shadow-md dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:hover:shadow-slate-950/20"
          >
            <HomeIcon />
            Home
          </button>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-6">
      {previewTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[24px] border border-white/10 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{previewTarget.title}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Preview the uploaded document.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTarget(null)}
                  className="rounded-full bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition-all duration-300 hover:bg-gray-200 hover:shadow-md dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTarget(null)}
                  aria-label="Close preview"
                  className="rounded-full bg-gray-100 p-2 text-gray-700 transition-all duration-300 hover:bg-gray-200 hover:shadow-md dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-950">
              {previewTarget.kind === 'pdf' ? (
                <iframe
                  src={previewTarget.url}
                  title={`${previewTarget.title} preview`}
                  className="h-[70vh] w-full rounded-xl bg-white dark:bg-slate-900"
                />
              ) : (
                <div className="flex max-h-[70vh] items-center justify-center rounded-xl bg-white p-2 dark:bg-slate-900">
                  <img
                    src={previewTarget.url}
                    alt={`${previewTarget.title} preview`}
                    className="max-h-[66vh] w-full rounded-lg object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {cropSource && cropTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[24px] border border-white/10 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Edit {UPLOAD_FIELD_LABELS[cropTarget]}</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Use the advanced crop presets below, adjust the visible area, then save the cropped image.
              </p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CROP_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyCropPreset(preset.key)}
                  className={`rounded-2xl border px-3 py-2 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                    cropPreset === preset.key
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md shadow-blue-100/50 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-200 dark:shadow-blue-950/20'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-blue-100/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:hover:shadow-blue-950/10'
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em]">{preset.label}</p>
                  <p className="mt-1 text-[11px] font-medium text-current/80">{preset.hint}</p>
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-950">
              <ReactCrop
                crop={cropDraft}
                onChange={(nextCrop) => syncCropState(nextCrop)}
                onComplete={(nextCrop) => syncCropState(nextCrop)}
              >
                <img
                  src={cropSource}
                  alt="Crop preview"
                  onLoad={handleCropImageLoad}
                  className="max-h-[55vh] w-full object-contain"
                />
              </ReactCrop>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeCropper}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 hover:shadow-md dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:shadow-slate-950/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCroppedImage}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
              >
                Save Crop
              </button>
            </div>
          </div>
        </div>
      ) : null}
      
      <div className={`max-h-[calc(100vh-1.5rem)] w-full overflow-y-auto rounded-[24px] border border-white/20 bg-[#F9FAFB]/96 px-3 pb-8 pt-4 shadow-2xl dark:border-slate-700/60 dark:bg-[#0f172a]/96 sm:max-h-[calc(100vh-3rem)] sm:px-4 lg:px-6 lg:pt-8 ${isPanService ? 'max-w-5xl' : 'max-w-xl'}`}>
        {/* Top Bar */}
        <div className="mb-6 flex items-center gap-3 sm:mb-8 sm:gap-4">
          <button 
            onClick={stage === 'intro' || stage === 'success' ? onClose : handleBack}
            className="rounded-full bg-white p-3 text-gray-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-blue-100/50 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:shadow-blue-950/20"
          >
             <BackIcon />
          </button>
          {stage !== 'intro' && stage !== 'success' && (
            <div className="flex flex-1 items-center gap-3">
              {isGooglePlayRedeemService && (
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                  <GooglePlayLogo className="h-6 w-6" />
                </span>
              )}
              <h1 className="flex-1 text-lg font-black text-gray-900 dark:text-white">{displayServiceTitle}</h1>
            </div>
          )}
          {stage === 'intro' || stage === 'success' ? <div className="flex-1" /> : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full bg-white p-3 text-gray-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-gray-50 hover:shadow-lg hover:shadow-blue-100/50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:shadow-blue-950/20"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        {stage === 'intro' && renderIntro()}
        {stage === 'form' && renderFormSteps()}
        {stage === 'payment' && renderPayment()}
        {stage === 'success' && renderSuccess()}
      </div>
    </div>
  );
};

export default ServiceFlow;
