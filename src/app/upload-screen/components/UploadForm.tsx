'use client';
import React, { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';
import * as tus from 'tus-js-client';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const SUBJECTS = ['Mathematics', 'Physics', 'Computer Science', 'Biology', 'Chemistry', 'Economics', 'Psychology', 'History', 'Engineering', 'Law', 'Literature', 'Business', 'Medicine', 'Architecture'];
const DOC_TYPES = ['Word', 'PDF'];

interface FormValues {
  title: string;
  description: string;
  subject: string;
  docType: string;
  visibility: string;
  tags: string;
  termsAccepted: boolean;
}

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [aiTagsVisible, setAiTagsVisible] = useState(false);
  const [aiTagsLoading, setAiTagsLoading] = useState(false);
  const [selectedAiTags, setSelectedAiTags] = useState<string[]>([]);
  const [suggestedAiTags, setSuggestedAiTags] = useState<string[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [otherSubject, setOtherSubject] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      visibility: 'public',
    }
  });

  const watchedSubject = watch('subject');

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }, []);

  const processFile = async (f: File) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(f.type)) {
      toast.error('Unsupported file type. Only PDF and DOCX are accepted.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 50 MB.');
      return;
    }
    setFile(f);
    setAiTagsLoading(true);
    setAiTagsVisible(false);
    setSuggestedAiTags([]);
    setSelectedAiTags([]);

    try {
      const currentTitle = watch('title');
      const currentSubject = watch('subject');
      const currentDocType = watch('docType');

      const res = await fetch('/api/ai/generate-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: f.name,
          fileType: f.type,
          title: currentTitle || '',
          subject: currentSubject || '',
          docType: currentDocType || '',
        }),
      });

      const data = await res.json();
      const tags: string[] = data.tags || [];

      setSuggestedAiTags(tags);
      setSelectedAiTags(tags); // all selected by default
      setAiTagsLoading(false);
      setAiTagsVisible(true);
      toast.success('AI tags generated — review and adjust as needed!');
    } catch {
      setAiTagsLoading(false);
      // Fallback: generate basic tags from filename
      const nameParts = f.name.replace(/\.[^/.]+$/, '').split(/[-_\s]+/).filter(p => p.length > 2);
      const fallbackTags = nameParts.slice(0, 5).map(t => t.toLowerCase());
      setSuggestedAiTags(fallbackTags);
      setSelectedAiTags(fallbackTags);
      setAiTagsVisible(true);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const toggleAiTag = (tag: string) => {
    setSelectedAiTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const onSubmit = async (data: FormValues) => {
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }
    if (!data.termsAccepted) {
      toast.error('Please accept the terms to proceed.');
      return;
    }
    if (!user) {
      toast.error('You must be signed in to upload documents.');
      router.push('/login-register-screen');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const supabase = createClient();

      // Build file path: userId/timestamp_filename
      const filePath = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      setUploadProgress(10);

      // Get current session for auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error('No active session. Please sign in again.');
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      // Use TUS resumable upload protocol to bypass the global 50MB HTTP size limit
      // The bucket is configured for 200MB, TUS uploads in 6MB chunks
      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${accessToken}`,
            apikey: supabaseAnonKey,
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: 'documents',
            objectName: filePath,
            contentType: file.type,
            cacheControl: '3600',
          },
          chunkSize: 6 * 1024 * 1024, // 6MB chunks as required by Supabase TUS
          onError: (error: Error) => {
            reject(error);
          },
          onProgress: (bytesUploaded: number, bytesTotal: number) => {
            const pct = Math.round((bytesUploaded / bytesTotal) * 50) + 10;
            setUploadProgress(Math.min(pct, 60));
          },
          onSuccess: () => {
            resolve();
          },
        });

        upload.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length) {
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        });
      });

      setUploadProgress(65);

      // Combine manual tags + AI tags
      const manualTags = data.tags
        ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      const allTags = [...new Set([...selectedAiTags, ...manualTags])];

      // Insert document record into database
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert({
          uploader_id: user.id,
          title: data.title,
          description: data.description,
          subject: data.subject === 'other' ? (otherSubject.trim() || 'Other') : data.subject,
          doc_type: data.docType,
          course_code: null,
          semester: null,
          year: null,
          visibility: data.visibility,
          tags: allTags,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
        })
        .select('id')
        .single();

      if (dbError) {
        // Clean up uploaded file if DB insert fails
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(dbError.message);
      }

      setUploadProgress(100);
      setUploadedDocId(docData?.id || null);
      setUploadedFilePath(filePath);
      setUploadedFileName(file.name);
      setUploading(false);
      setUploadDone(true);
      toast.success('Document uploaded successfully! It\'s now live on StudoShare.');
    } catch (err: any) {
      setUploading(false);
      setUploadProgress(0);
      toast.error(err?.message || 'Upload failed. Please try again.');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return { icon: 'DocumentTextIcon', color: 'text-red-500', bg: 'bg-red-50 border-red-100', label: 'PDF' };
    if (type.includes('word')) return { icon: 'DocumentIcon', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100', label: 'DOCX' };
    return { icon: 'PresentationChartBarIcon', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100', label: 'PPTX' };
  };

  if (uploadDone) {
    const handleDownload = async () => {
      if (!uploadedFilePath || !uploadedFileName) return;
      try {
        const supabase = createClient();
        const { data: blobData, error } = await supabase.storage
          .from('documents')
          .download(uploadedFilePath);
        if (error || !blobData) {
          toast.error('Download failed. Please try again.');
          return;
        }
        const url = URL.createObjectURL(blobData);
        const a = document.createElement('a');
        a.href = url;
        a.download = uploadedFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        toast.error('Download failed. Please try again.');
      }
    };

    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="CheckCircleIcon" size={32} className="text-green-600" />
        </div>
        <h2 className="font-display font-700 text-xl text-gray-900 mb-2">Document Uploaded!</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Your document is now live and searchable by students worldwide. Thank you for contributing to StudoShare!
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/document-detail-screen"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-display font-600 rounded-xl transition-all duration-150"
          >
            <Icon name="EyeIcon" size={15} />
            View Document
          </Link>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-display font-600 rounded-xl transition-all duration-150"
          >
            <Icon name="ArrowDownTrayIcon" size={15} />
            Download File
          </button>
          <button
            onClick={() => { setFile(null); setUploadDone(false); setUploadProgress(0); setAiTagsVisible(false); setDuplicateWarning(false); setUploadedDocId(null); setUploadedFilePath(null); setUploadedFileName(null); }}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-display font-600 rounded-xl transition-all duration-150"
          >
            <Icon name="ArrowUpTrayIcon" size={15} />
            Upload Another
          </button>
          <Link
            href="/home-screen"
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-display font-600 rounded-xl transition-all duration-150"
          >
            <Icon name="HomeIcon" size={15} />
            Browse Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Section 1: File Upload */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-display font-700 text-xs">1</div>
          <span className="font-display font-600 text-gray-900">Select File</span>
          <span className="text-xs text-gray-400 ml-1">PDF, DOCX — max 50 MB</span>
        </div>

        <div className="p-5">
          {/* Duplicate Warning */}
          {duplicateWarning && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <Icon name="ExclamationTriangleIcon" size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-display font-600 text-amber-800">Possible Duplicate Detected</p>
                <p className="text-xs text-amber-700 mt-0.5">A document with a similar file hash already exists. Please verify this is a unique upload before continuing.</p>
              </div>
              <button type="button" onClick={() => setDuplicateWarning(false)} className="text-amber-500 hover:text-amber-700 ml-auto">
                <Icon name="XMarkIcon" size={14} />
              </button>
            </div>
          )}

          {/* Dropzone */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
                  : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40'
              }`}
            >
              <div className="w-14 h-14 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Icon name="CloudArrowUpIcon" size={26} className={dragActive ? 'text-indigo-500' : 'text-gray-400'} />
              </div>
              <p className="font-display font-600 text-gray-800 mb-1">
                {dragActive ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-sm text-gray-500 mb-3">or click to browse from your computer</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {['PDF', 'DOCX'].map((ft) => (
                  <span key={`ft-badge-${ft}`} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 shadow-sm">
                    {ft}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Maximum file size: 50 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* File Preview Card */}
              <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${getFileIcon(file.type).bg}`}>
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border ${getFileIcon(file.type).bg} flex-shrink-0`}>
                  <Icon name={getFileIcon(file.type).icon as any} size={20} className={getFileIcon(file.type).color} />
                  <span className={`text-xs font-display font-700 mt-0.5 ${getFileIcon(file.type).color}`}>{getFileIcon(file.type).label}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-600 text-sm text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 tabular-nums">{(file.size / (1024 * 1024)).toFixed(2)} MB · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-green-600 font-medium">File ready to upload</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setAiTagsVisible(false); setDuplicateWarning(false); setSelectedAiTags([]); }}
                  className="p-2 rounded-lg hover:bg-white/80 text-gray-400 hover:text-red-500 transition-all duration-150"
                  aria-label="Remove file"
                >
                  <Icon name="TrashIcon" size={16} />
                </button>
              </div>

              {/* AI Tags Preview */}
              {aiTagsLoading && (
                <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                  <svg className="animate-spin w-4 h-4 text-violet-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <div>
                    <p className="text-xs font-display font-600 text-violet-800">Analyzing document with AI...</p>
                    <p className="text-xs text-violet-600 mt-0.5">Extracting keywords, subject tags, and metadata</p>
                  </div>
                </div>
              )}

              {aiTagsVisible && !aiTagsLoading && suggestedAiTags.length > 0 && (
                <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="SparklesIcon" size={14} className="text-violet-600" />
                    <span className="text-xs font-display font-600 text-violet-800">AI-Suggested Tags</span>
                    <span className="text-xs text-violet-500">— click to toggle</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedAiTags.map((tag) => {
                      const isSelected = selectedAiTags.includes(tag);
                      return (
                        <button
                          key={`aitag-${tag}`}
                          type="button"
                          onClick={() => toggleAiTag(tag)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border ${
                            isSelected
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'bg-white text-violet-600 border-violet-300 hover:bg-violet-100'
                          }`}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-violet-500 mt-2">{selectedAiTags.length} of {suggestedAiTags.length} tags selected — these help students discover your document</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Document Metadata */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-display font-700 text-xs">2</div>
          <span className="font-display font-600 text-gray-900">Document Details</span>
          <span className="text-xs text-gray-400 ml-1">Help students find your document</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-display font-600 text-gray-700 mb-1">
              Document Title <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-1.5">Be descriptive — include the course name, topic, and any relevant identifiers</p>
            <input
              type="text"
              placeholder="e.g. Calculus II — Integration Techniques & Series — MIT 18.02 Spring 2026"
              className={`w-full px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 border rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-150 ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 10, message: 'Title must be at least 10 characters' },
                maxLength: { value: 150, message: 'Title must be under 150 characters' },
              })}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} />{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-display font-600 text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-1.5">What does this document cover? What will students learn from it?</p>
            <textarea
              rows={4}
              placeholder="Describe the content, topics covered, level of difficulty, and what makes this document useful..."
              className={`w-full px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 border rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-all duration-150 ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 30, message: 'Description must be at least 30 characters' },
              })}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} />{errors.description.message}</p>}
          </div>

          {/* Subject + Document Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-600 text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-1.5">Primary academic subject</p>
              <select
                className={`w-full px-3 py-2.5 text-sm text-gray-800 border rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-150 ${errors.subject ? 'border-red-300' : 'border-gray-200'}`}
                {...register('subject', { required: 'Subject is required' })}
                onChange={(e) => {
                  register('subject').onChange(e);
                  if (e.target.value !== 'other') setOtherSubject('');
                }}
              >
                <option value="">Select subject...</option>
                {SUBJECTS.map((s) => <option key={`subj-opt-${s}`} value={s}>{s}</option>)}
                <option value="other">Other...</option>
              </select>
              {watchedSubject === 'other' && (
                <input
                  type="text"
                  value={otherSubject}
                  onChange={(e) => setOtherSubject(e.target.value)}
                  placeholder="Enter your subject..."
                  autoFocus
                  className="mt-2 w-full px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-150"
                />
              )}
              {errors.subject && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} />{errors.subject.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-display font-600 text-gray-700 mb-1">
                Document Type <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-1.5">What kind of study material is this?</p>
              <select
                className={`w-full px-3 py-2.5 text-sm text-gray-800 border rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-150 ${errors.docType ? 'border-red-300' : 'border-gray-200'}`}
                {...register('docType', { required: 'Document type is required' })}
              >
                <option value="">Select type...</option>
                {DOC_TYPES.map((t) => <option key={`doctype-${t}`} value={t}>{t}</option>)}
              </select>
              {errors.docType && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} />{errors.docType.message}</p>}
            </div>
          </div>

          {/* Additional Tags */}
          <div>
            <label className="block text-xs font-display font-600 text-gray-700 mb-1">Additional Tags</label>
            <p className="text-xs text-gray-400 mb-1.5">Comma-separated keywords to help students find your document</p>
            <input
              type="text"
              placeholder="e.g. exam-prep, final-exam, chapter-5, midterm"
              className="w-full px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-150"
              {...register('tags')}
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-display font-600 text-gray-700 mb-2">Visibility</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'public', label: 'Public', desc: 'Visible to all students', icon: 'GlobeAltIcon', color: 'indigo' },
                { value: 'private', label: 'Private', desc: 'Only accessible via direct link', icon: 'LockClosedIcon', color: 'indigo' },
              ].map((v) => (
                <label key={`vis-${v.value}`} className="cursor-pointer">
                  <input type="radio" value={v.value} className="sr-only" {...register('visibility')} />
                  <div className={`p-3 rounded-xl border-2 transition-all duration-150 ${
                    watch('visibility') === v.value
                      ? `border-${v.color}-400 bg-${v.color}-50`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name={v.icon as any} size={14} className={watch('visibility') === v.value ? `text-${v.color}-600` : 'text-gray-400'} />
                      <span className={`text-xs font-display font-600 ${watch('visibility') === v.value ? `text-${v.color}-700` : 'text-gray-700'}`}>{v.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-snug">{v.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-150 ${
                  watch('termsAccepted') ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 hover:border-indigo-400'
                }`}
                onClick={() => setValue('termsAccepted', !watch('termsAccepted'))}
              >
                {watch('termsAccepted') && <Icon name="CheckIcon" size={10} className="text-white" />}
              </div>
              <div>
                <p className="text-xs text-gray-700 font-medium">I confirm this document is my original work or I have the right to share it</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  By uploading, you agree to our{' '}
                  <span className="text-indigo-600 hover:underline cursor-pointer">Terms of Service</span>{' '}
                  and{' '}
                  <span className="text-indigo-600 hover:underline cursor-pointer">Content Policy</span>.
                  Do not upload copyrighted materials without permission.
                </p>
              </div>
            </label>
            {errors.termsAccepted && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <Icon name="ExclamationCircleIcon" size={12} />
                You must accept the terms to upload
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-display font-600 text-gray-800">Uploading to StudoShare...</span>
            </div>
            <span className="text-sm font-display font-700 text-indigo-600 tabular-nums">{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {uploadProgress < 40 ? 'Uploading file to secure storage...' :
             uploadProgress < 70 ? 'Processing and indexing document...' :
             uploadProgress < 90 ? 'Running AI auto-tagging...' : 'Finalizing and publishing...'}
          </p>
        </div>
      )}

      {/* Submit Bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Icon name="ShieldCheckIcon" size={16} className="text-green-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm">Your document will be scanned for quality before publishing</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/home-screen"
            className="flex-1 sm:flex-none text-center px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-display font-600 rounded-xl transition-all duration-150"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-display font-600 rounded-xl transition-all duration-150 shadow-sm"
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <Icon name="ArrowUpTrayIcon" size={15} />
                Upload Document
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}