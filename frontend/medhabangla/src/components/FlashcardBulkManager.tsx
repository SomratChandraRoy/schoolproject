import React, { useState, useRef } from 'react';
import { clsx } from 'clsx';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  cards: Flashcard[];
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface BulkFlashcardImporterProps {
  onImport: (cards: Flashcard[]) => Promise<void>;
  deckId?: string;
}

/**
 * Bulk Flashcard Importer
 * Supports multiple formats: CSV, JSON, plain text
 */
export const BulkFlashcardImporter: React.FC<BulkFlashcardImporterProps> = ({
  onImport,
  deckId
}) => {
  const [importFormat, setImportFormat] = useState<'csv' | 'json' | 'text'>('csv');
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): Flashcard[] => {
    return text
      .trim()
      .split('\n')
      .map((line, index) => {
        const [front, back] = line.split('\t');
        if (!front?.trim() || !back?.trim()) return null;
        return {
          id: `card_${Date.now()}_${index}`,
          front: front.trim(),
          back: back.trim()
        };
      })
      .filter((card): card is Flashcard => card !== null);
  };

  const parseJSON = (text: string): Flashcard[] => {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return data.map((item, index) => ({
          id: item.id || `card_${Date.now()}_${index}`,
          front: item.front || item.question || '',
          back: item.back || item.answer || ''
        }));
      }
      throw new Error('Invalid JSON format');
    } catch (e) {
      throw new Error('Failed to parse JSON');
    }
  };

  const parsePlainText = (text: string): Flashcard[] => {
    const cards: Flashcard[] = [];
    const lines = text.trim().split('\n');

    for (let i = 0; i < lines.length; i += 2) {
      if (i + 1 < lines.length) {
        cards.push({
          id: `card_${Date.now()}_${i}`,
          front: lines[i].trim(),
          back: lines[i + 1].trim()
        });
      }
    }

    return cards;
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      let cards: Flashcard[] = [];

      switch (importFormat) {
        case 'csv':
          cards = parseCSV(importText);
          break;
        case 'json':
          cards = parseJSON(importText);
          break;
        case 'text':
          cards = parsePlainText(importText);
          break;
      }

      if (cards.length === 0) {
        setImportStatus({ type: 'error', message: 'No valid cards found' });
        return;
      }

      await onImport(cards);
      setImportStatus({ type: 'success', message: `Successfully imported ${cards.length} cards!` });
      setImportText('');
    } catch (error: any) {
      setImportStatus({ type: 'error', message: error.message || 'Import failed' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📥 Bulk Import Flashcards</h3>

      {/* Format Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Import Format
        </label>
        <div className="flex gap-4">
          {['csv', 'json', 'text'].map((format) => (
            <label key={format} className="flex items-center gap-2">
              <input
                type="radio"
                value={format}
                checked={importFormat === format}
                onChange={(e) => setImportFormat(e.target.value as any)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {format === 'csv' && 'CSV (Tab-separated)'}
                {format === 'json' && 'JSON'}
                {format === 'text' && 'Plain Text (Line pairs)'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded text-sm text-blue-900 dark:text-blue-100">
        {importFormat === 'csv' && (
          <>
            <p className="font-medium mb-1">CSV Format:</p>
            <p>Each line: front_text[TAB]back_text</p>
            <p className="text-xs mt-1">Example: What is 2+2?	4</p>
          </>
        )}
        {importFormat === 'json' && (
          <>
            <p className="font-medium mb-1">JSON Format:</p>
            <p>[{"'{\"front\": \"...\", \"back\": \"...\"}'}, ...]</p>
            <p className="text-xs mt-1">Keys can also be: question/answer or just front/back</p>
          </>
        )}
        {importFormat === 'text' && (
          <>
            <p className="font-medium mb-1">Plain Text Format:</p>
            <p>Two lines per card (front, then back)</p>
            <p className="text-xs mt-1">Blank lines are ignored</p>
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Paste content or upload file
        </label>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste your flashcard data here..."
          className={clsx(
            'w-full p-3 font-mono text-sm border rounded resize-none h-40',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'border-gray-300 dark:border-gray-700',
            'focus:outline-none focus:ring-2 focus:ring-blue-500'
          )}
        />
        <div className="mt-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".csv,.json,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition"
          >
            📁 Or choose file
          </button>
        </div>
      </div>

      {/* Status */}
      {importStatus && (
        <div
          className={clsx(
            'mb-4 p-3 rounded text-sm',
            importStatus.type === 'success'
              ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
              : 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100'
          )}
        >
          {importStatus.message}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={!importText.trim() || isImporting}
          className={clsx(
            'flex-1 px-4 py-2 rounded font-medium transition',
            isImporting || !importText.trim()
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          )}
        >
          {isImporting ? 'Importing...' : `Import ${importFormat.toUpperCase()}`}
        </button>
        <button
          onClick={() => {
            setImportText('');
            setImportStatus(null);
          }}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 font-medium transition"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

interface BulkFlashcardEditorProps {
  cards: Flashcard[];
  onCardsChange: (cards: Flashcard[]) => void;
  onClose?: () => void;
}

/**
 * Bulk Flashcard Editor
 * Edit multiple cards at once
 */
export const BulkFlashcardEditor: React.FC<BulkFlashcardEditorProps> = ({
  cards,
  onCardsChange,
  onClose
}) => {
  const [editedCards, setEditedCards] = useState<Flashcard[]>(cards);

  const handleCardChange = (index: number, field: 'front' | 'back', value: string) => {
    const updated = [...editedCards];
    updated[index] = { ...updated[index], [field]: value };
    setEditedCards(updated);
  };

  const removeCard = (index: number) => {
    setEditedCards(editedCards.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onCardsChange(editedCards);
    onClose?.();
  };

  return (
    <div className="w-full space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        ✏️ Edit {editedCards.length} Cards
      </h3>

      <div className="max-h-96 overflow-y-auto space-y-3">
        {editedCards.map((card, index) => (
          <div key={card.id} className="p-3 border rounded bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Card {index + 1}
              </span>
              <button
                onClick={() => removeCard(index)}
                className="text-red-500 hover:text-red-700 font-bold transition"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={card.front}
              onChange={(e) => handleCardChange(index, 'front', e.target.value)}
              placeholder="Front (Question)"
              className={clsx(
                'w-full p-2 mb-2 border rounded text-sm',
                'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
                'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500'
              )}
            />

            <textarea
              value={card.back}
              onChange={(e) => handleCardChange(index, 'back', e.target.value)}
              placeholder="Back (Answer)"
              className={clsx(
                'w-full p-2 border rounded text-sm resize-none h-20',
                'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
                'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500'
              )}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition"
        >
          ✓ Save Changes
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded font-medium hover:bg-gray-400 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

interface FlashcardExporterProps {
  cards: Flashcard[];
  deckName: string;
}

/**
 * Export flashcards in multiple formats
 */
export const FlashcardExporter: React.FC<FlashcardExporterProps> = ({ cards, deckName }) => {
  const exportAsCSV = () => {
    const csv = cards.map((card) => `${card.front}\t${card.back}`).join('\n');
    downloadFile(csv, `${deckName}.csv`, 'text/csv');
  };

  const exportAsJSON = () => {
    const json = JSON.stringify(cards, null, 2);
    downloadFile(json, `${deckName}.json`, 'application/json');
  };

  const exportAsText = () => {
    const text = cards.map((card) => `${card.front}\n${card.back}\n`).join('\n');
    downloadFile(text, `${deckName}.txt`, 'text/plain');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportAsCSV}
        className="px-3 py-1 text-sm bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded hover:bg-blue-300 dark:hover:bg-blue-800 transition"
        title="Export as CSV"
      >
        📊 CSV
      </button>
      <button
        onClick={exportAsJSON}
        className="px-3 py-1 text-sm bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 rounded hover:bg-purple-300 dark:hover:bg-purple-800 transition"
        title="Export as JSON"
      >
        📋 JSON
      </button>
      <button
        onClick={exportAsText}
        className="px-3 py-1 text-sm bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100 rounded hover:bg-green-300 dark:hover:bg-green-800 transition"
        title="Export as Text"
      >
        📝 Text
      </button>
    </div>
  );
};
