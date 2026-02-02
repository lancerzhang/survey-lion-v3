
import React, { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);

  // Sync value to editor only if it's different from current innerHTML
  // to prevent cursor jumping
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
    selectionRef.current = range;
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  };

  const execCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    onChange(editorRef.current.innerHTML);
  };

  const handleLink = () => {
    const url = window.prompt('Enter URL');
    if (!url) return;
    execCommand('createLink', url);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-colors">
      <div className="flex items-center space-x-1 p-2 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'H2')}
          className="px-2 py-1 hover:bg-white rounded transition text-xs font-semibold"
          title="Heading"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'H3')}
          className="px-2 py-1 hover:bg-white rounded transition text-xs font-semibold"
          title="Subheading"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')}
          className="px-2 py-1 hover:bg-white rounded transition text-xs font-semibold"
          title="Quote"
        >
          “”
        </button>
        <div className="h-4 w-px bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1.5 hover:bg-white rounded transition font-bold w-8 h-8 flex items-center justify-center text-sm"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1.5 hover:bg-white rounded transition italic w-8 h-8 flex items-center justify-center text-sm font-serif"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1.5 hover:bg-white rounded transition underline w-8 h-8 flex items-center justify-center text-sm"
          title="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => execCommand('strikeThrough')}
          className="p-1.5 hover:bg-white rounded transition line-through w-8 h-8 flex items-center justify-center text-sm"
          title="Strikethrough"
        >
          S
        </button>
        <div className="h-4 w-px bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1.5 hover:bg-white rounded transition w-8 h-8 flex items-center justify-center text-lg"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1.5 hover:bg-white rounded transition w-8 h-8 flex items-center justify-center text-sm font-semibold"
          title="Numbered List"
        >
          1.
        </button>
        <div className="h-4 w-px bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={handleLink}
          className="p-1.5 hover:bg-white rounded transition w-8 h-8 flex items-center justify-center text-sm font-semibold"
          title="Insert Link"
        >
          ↗
        </button>
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="px-2 py-1 hover:bg-white rounded transition text-xs font-semibold"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onTouchEnd={saveSelection}
        className="sl-richtext p-4 min-h-[120px] focus:outline-none text-gray-600 max-w-none"
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #cbd5e1;
          pointer-events: none;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
