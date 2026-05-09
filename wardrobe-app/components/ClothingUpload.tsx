'use client';

import { useState, useRef, useCallback } from 'react';
import { AnalysisResult, ClothingCategory, Formality, Season } from '@/types';

interface Props {
  onSave: (item: AnalysisResult & { imageData: string }) => Promise<void>;
}

const categories: ClothingCategory[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'underwear', 'activewear', 'swimwear'];
const formalities: Formality[] = ['very_casual', 'casual', 'smart_casual', 'business_casual', 'business', 'formal'];
const seasons: Season[] = ['spring', 'summer', 'fall', 'winter'];

export default function ClothingUpload({ onSave }: Props) {
  const [imageData, setImageData] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target?.result as string);
      setAnalysis(null);
      setError('');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!imageData) return;
    setAnalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!analysis || !imageData) return;
    setSaving(true);
    try {
      await onSave({ ...analysis, imageData });
      setImageData('');
      setAnalysis(null);
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        {imageData ? (
          <div className="space-y-3">
            <img src={imageData} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain" />
            <p className="text-sm text-gray-500">Click or drop to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-5xl">📸</div>
            <p className="text-gray-600 font-medium">Drop a photo of your clothing item</p>
            <p className="text-gray-400 text-sm">or click to browse</p>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {imageData && !analysis && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {analyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⟳</span> Analyzing with AI...
            </span>
          ) : (
            'Analyze with AI'
          )}
        </button>
      )}

      {analysis && (
        <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
          <h3 className="font-semibold text-gray-800">AI Analysis Results</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
              <input
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={analysis.name}
                onChange={(e) => setAnalysis({ ...analysis, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
              <select
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={analysis.category}
                onChange={(e) => setAnalysis({ ...analysis, category: e.target.value as ClothingCategory })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Formality</label>
            <select
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={analysis.formality}
              onChange={(e) => setAnalysis({ ...analysis, formality: e.target.value as Formality })}
            >
              {formalities.map((f) => (
                <option key={f} value={f}>{f.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Colors</label>
            <input
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={analysis.colors.join(', ')}
              onChange={(e) => setAnalysis({ ...analysis, colors: e.target.value.split(',').map((s) => s.trim()) })}
              placeholder="navy, white"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Seasons</label>
            <div className="mt-1 flex gap-2 flex-wrap">
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    const current = analysis.seasons;
                    const next = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
                    setAnalysis({ ...analysis, seasons: next });
                  }}
                  className={`text-sm px-3 py-1 rounded-full border transition-colors capitalize ${
                    analysis.seasons.includes(s)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</label>
            <input
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={analysis.tags.join(', ')}
              onChange={(e) => setAnalysis({ ...analysis, tags: e.target.value.split(',').map((s) => s.trim()) })}
              placeholder="cotton, striped, slim-fit"
            />
          </div>

          <p className="text-sm text-gray-600 italic">{analysis.description}</p>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Saving...' : 'Save to Wardrobe'}
          </button>
        </div>
      )}
    </div>
  );
}
