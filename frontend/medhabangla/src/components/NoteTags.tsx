import React, { useState } from "react";
import { clsx } from "clsx";

export interface EnhancedNote {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  category?: string;
  isPinned?: boolean;
}

interface NoteTaggerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestedTags?: string[];
}

/**
 * Note Tagger Component
 * Allows users to add, remove, and organize tags for notes
 */
export const NoteTagger: React.FC<NoteTaggerProps> = ({
  tags,
  onTagsChange,
  suggestedTags = [],
}) => {
  const [newTag, setNewTag] = useState("");

  const addTag = (tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag) && cleanTag.length < 50) {
      onTagsChange([...tags, cleanTag]);
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(newTag);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Tags
      </label>

      {/* Tag Display */}
      <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 rounded-full text-sm">
            <span>#{tag}</span>
            <button
              onClick={() => removeTag(index)}
              className="hover:text-red-600 font-bold"
              title="Remove tag">
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Tag Input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add tags (press Enter or comma)"
          className={clsx(
            "flex-1 px-3 py-2 border rounded text-sm",
            "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
            "border-gray-300 dark:border-gray-700",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
          )}
        />
        <button
          onClick={() => addTag(newTag)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm font-medium">
          Add
        </button>
      </div>

      {/* Suggested Tags */}
      {suggestedTags.length > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <p className="mb-2 font-medium">Suggested tags:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition text-xs">
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Note category colors
export const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  math: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-900 dark:text-green-100",
    border: "border-green-300 dark:border-green-700",
  },
  science: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-900 dark:text-blue-100",
    border: "border-blue-300 dark:border-blue-700",
  },
  english: {
    bg: "bg-purple-100 dark:bg-purple-900",
    text: "text-purple-900 dark:text-purple-100",
    border: "border-purple-300 dark:border-purple-700",
  },
  history: {
    bg: "bg-yellow-100 dark:bg-yellow-900",
    text: "text-yellow-900 dark:text-yellow-100",
    border: "border-yellow-300 dark:border-yellow-700",
  },
  general: {
    bg: "bg-gray-100 dark:bg-gray-900",
    text: "text-gray-900 dark:text-gray-100",
    border: "border-gray-300 dark:border-gray-700",
  },
};

interface NoteCategoryPickerProps {
  category?: string;
  onCategoryChange: (category: string) => void;
}

/**
 * Note Category Picker
 * Allows users to categorize notes by subject
 */
export const NoteCategoryPicker: React.FC<NoteCategoryPickerProps> = ({
  category = "general",
  onCategoryChange,
}) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Category
      </label>
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={clsx(
          "w-full px-3 py-2 border rounded text-sm",
          "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
          "border-gray-300 dark:border-gray-700",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
        )}>
        <option value="general">📝 General</option>
        <option value="math">🔢 Math</option>
        <option value="science">🔬 Science</option>
        <option value="english">📚 English</option>
        <option value="history">🏛️ History</option>
      </select>
    </div>
  );
};

interface NoteCardProps {
  note: EnhancedNote;
  onClick: () => void;
  onPin?: (id: string) => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
}

/**
 * Note Card Component
 * Displays a preview of a note with tags and category
 */
export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onClick,
  onPin,
  onDelete,
  isSelected = false,
}) => {
  const categoryColor = CATEGORY_COLORS[note.category || "general"];
  const textPreview = note.content
    .substring(0, 100)
    .replace(/[#*_`]/g, "")
    .trim();

  return (
    <div
      onClick={onClick}
      className={clsx(
        "p-4 rounded border-2 cursor-pointer transition",
        "bg-white dark:bg-gray-900",
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
          : "border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600",
      )}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1">
          {note.isPinned && "📌 "}
          {note.title}
        </h3>
        <div className="flex gap-2">
          {onPin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin(note.id);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              {note.isPinned ? "📌" : "📍"}
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Delete this note?")) {
                  onDelete(note.id);
                }
              }}
              className="text-sm text-red-500 hover:text-red-700">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Badge */}
      <div
        className={clsx(
          "inline-block px-2 py-1 rounded text-xs font-medium mb-2",
          categoryColor.bg,
          categoryColor.text,
        )}>
        {note.category || "General"}
      </div>

      {/* Preview Text */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {textPreview}...
      </p>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{note.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Meta Info */}
      <div className="text-xs text-gray-400 dark:text-gray-600">
        {note.updatedAt
          ? new Date(note.updatedAt).toLocaleDateString()
          : "Not saved"}
      </div>
    </div>
  );
};

/**
 * Note Filter Bar
 * Allows filtering notes by category, tags, and search
 */
interface NoteFilterBarProps {
  onFilterChange: (filter: {
    search: string;
    category?: string;
    tags: string[];
  }) => void;
  availableTags: string[];
  availableCategories: string[];
}

export const NoteFilterBar: React.FC<NoteFilterBarProps> = ({
  onFilterChange,
  availableTags,
  availableCategories,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleFilterChange = () => {
    onFilterChange({
      search,
      category: selectedCategory || undefined,
      tags: selectedTags,
    });
  };

  React.useEffect(() => {
    handleFilterChange();
  }, [search, selectedCategory, selectedTags]);

  return (
    <div className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 space-y-3">
      {/* Search Box */}
      <input
        type="text"
        placeholder="Search notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={clsx(
          "w-full px-3 py-2 border rounded text-sm",
          "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
          "border-gray-300 dark:border-gray-700",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
        )}
      />

      {/* Category Filter */}
      <div>
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
          Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={clsx(
            "w-full px-2 py-1 border rounded text-sm",
            "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
            "border-gray-300 dark:border-gray-700",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
          )}>
          <option value="">All Categories</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Tag Filter */}
      {availableTags.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Tags (click to filter)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter((t) => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
                className={clsx(
                  "px-2 py-1 text-xs rounded transition",
                  selectedTags.includes(tag)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600",
                )}>
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
