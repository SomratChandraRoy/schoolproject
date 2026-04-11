import React, { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  fullHeight?: boolean;
}

// Markdown formatting helpers
const markdownFormats = {
  bold: (text: string) => `**${text}**`,
  italic: (text: string) => `*${text}*`,
  code: (text: string) => `\`${text}\``,
  codeBlock: (text: string) => `\`\`\`\n${text}\n\`\`\``,
  bullet: (text: string) => `• ${text}`,
  heading1: (text: string) => `# ${text}`,
  heading2: (text: string) => `## ${text}`,
  heading3: (text: string) => `### ${text}`,
  link: (text: string, url: string) => `[${text}](${url})`,
  image: (alt: string, url: string) => `![${alt}](${url})`,
  quote: (text: string) => `> ${text}`,
  strikethrough: (text: string) => `~~${text}~~`,
};

// Markdown to HTML converter (basic)
export const markdownToHtml = (markdown: string): string => {
  let html = markdown;

  // Code blocks
  html = html.replace(/```(.*?)```/gs, "<pre><code>$1</code></pre>");

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-200 px-2 py-1 rounded">$1</code>',
  );

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Strikethrough
  html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  // Images
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="max-w-full max-h-96 rounded my-2" />',
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" class="text-blue-500 hover:underline">$1</a>',
  );

  // Headings
  html = html.replace(
    /^### ([^\n]+)/gm,
    '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>',
  );
  html = html.replace(
    /^## ([^\n]+)/gm,
    '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>',
  );
  html = html.replace(
    /^# ([^\n]+)/gm,
    '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>',
  );

  // Quotes
  html = html.replace(
    /^> ([^\n]+)/gm,
    '<blockquote class="border-l-4 border-gray-400 pl-4 italic text-gray-700">$1</blockquote>',
  );

  // Line breaks
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;

  // Bullet points
  html = html.replace(/• ([^\n]+)/g, '<li class="ml-6">$1</li>');
  html = html.replace(
    /(<li[^>]*>[^<]*<\/li>)+/g,
    '<ul class="list-disc">$&</ul>',
  );

  return html;
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your notes here... (Markdown supported)",
  readOnly = false,
  fullHeight = false,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (format: (text: string) => string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value;
    const selected = text.substring(start, end);

    if (selected) {
      const before = text.substring(0, start);
      const after = text.substring(end);
      const formatted = format(selected);
      onChange(before + formatted + after);

      // Re-select the formatted text
      setTimeout(() => {
        textarea.setSelectionStart(start);
        textarea.setSelectionEnd(start + formatted.length);
        textarea.focus();
      }, 0);
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    const text = selectedText || "link";
    if (url) {
      applyFormat(() => markdownFormats.link(text, url));
    }
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    const alt = prompt("Enter image description:") || "Image";
    if (url) {
      applyFormat(() => markdownFormats.image(alt, url));
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const getSelectedText = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      setSelectedText(value.substring(start, end));
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-t border border-gray-300 dark:border-gray-700">
          <button
            onClick={() => applyFormat(markdownFormats.bold)}
            title="Bold"
            className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 font-bold transition">
            B
          </button>
          <button
            onClick={() => applyFormat(markdownFormats.italic)}
            title="Italic"
            className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 italic transition">
            I
          </button>
          <button
            onClick={() => applyFormat(markdownFormats.strikethrough)}
            title="Strikethrough"
            className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 line-through transition">
            S
          </button>

          <div className="border-l border-gray-400 dark:border-gray-600"></div>

          <button
            onClick={() => applyFormat(markdownFormats.heading1)}
            title="Heading 1"
            className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm font-bold">
            H1
          </button>
          <button
            onClick={() => applyFormat(markdownFormats.heading2)}
            title="Heading 2"
            className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm font-bold">
            H2
          </button>
          <button
            onClick={() => applyFormat(markdownFormats.heading3)}
            title="Heading 3"
            className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm font-bold">
            H3
          </button>

          <div className="border-l border-gray-400 dark:border-gray-600"></div>

          <button
            onClick={() => applyFormat(markdownFormats.code)}
            title="Inline Code"
            className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition font-mono text-xs">
            Code
          </button>
          <button
            onClick={() => applyFormat(markdownFormats.codeBlock)}
            title="Code Block"
            className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm">
            Code Block
          </button>

          <div className="border-l border-gray-400 dark:border-gray-600"></div>

          <button
            onClick={() => applyFormat(markdownFormats.quote)}
            title="Quote"
            className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm">
            Quote
          </button>
          <button
            onClick={insertLink}
            title="Insert Link"
            className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm">
            🔗 Link
          </button>
          <button
            onClick={insertImage}
            title="Insert Image"
            className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm">
            🖼️ Image
          </button>

          <div className="border-l border-gray-400 dark:border-gray-600 ml-auto"></div>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className={clsx(
              "px-3 py-1 rounded transition",
              showPreview
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600",
            )}>
            {showPreview ? "✓ Preview" : "Preview"}
          </button>
        </div>
      )}

      {/* Editor and Preview */}
      <div
        className={clsx(
          "grid gap-2",
          showPreview ? "grid-cols-2" : "grid-cols-1",
        )}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onMouseUp={getSelectedText}
          placeholder={placeholder}
          readOnly={readOnly}
          className={clsx(
            "w-full p-3 font-mono text-sm border rounded resize-none",
            "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
            "border-gray-300 dark:border-gray-700",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            fullHeight ? "h-96" : "h-64",
            readOnly ? "opacity-75" : "",
          )}
        />

        {/* Preview */}
        {showPreview && (
          <div
            className={clsx(
              "w-full p-3 border rounded overflow-y-auto",
              "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
              "border-gray-300 dark:border-gray-700",
              fullHeight ? "h-96" : "h-64",
            )}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }}
          />
        )}
      </div>

      {/* Info text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 pb-2">
        💡 Markdown formatting supported: **bold**, *italic*, `code`, links,
        images, headings, quotes
      </div>
    </div>
  );
};

export default RichTextEditor;
