import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {TextStyle} from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import {Table} from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiCode,
  FiList,
  FiLink,
  FiImage,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
} from 'react-icons/fi';
import { MdFormatListNumbered, MdFormatQuote, MdTableChart } from 'react-icons/md';
import styles from './styles/TiptapEditor.module.css';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className={styles.menuBar}>
      {/* Text Formatting */}
      <div className={styles.menuGroup}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? styles.isActive : ''}
          title="Bold"
          type="button"
        >
          <FiBold />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? styles.isActive : ''}
          title="Italic"
          type="button"
        >
          <FiItalic />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? styles.isActive : ''}
          title="Underline"
          type="button"
        >
          <FiUnderline />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? styles.isActive : ''}
          title="Strikethrough"
          type="button"
        >
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </button>
      </div>

      {/* Headings */}
      <div className={styles.menuGroup}>
        <select
          onChange={(e) => {
            const level = parseInt(e.target.value);
            if (level === 0) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().toggleHeading({ level }).run();
            }
          }}
          value={
            editor.isActive('heading', { level: 1 })
              ? 1
              : editor.isActive('heading', { level: 2 })
              ? 2
              : editor.isActive('heading', { level: 3 })
              ? 3
              : editor.isActive('heading', { level: 4 })
              ? 4
              : editor.isActive('heading', { level: 5 })
              ? 5
              : editor.isActive('heading', { level: 6 })
              ? 6
              : 0
          }
          className={styles.headingSelect}
        >
          <option value={0}>Paragraph</option>
          <option value={1}>Heading 1</option>
          <option value={2}>Heading 2</option>
          <option value={3}>Heading 3</option>
          <option value={4}>Heading 4</option>
          <option value={5}>Heading 5</option>
          <option value={6}>Heading 6</option>
        </select>
      </div>

      {/* Lists */}
      <div className={styles.menuGroup}>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? styles.isActive : ''}
          title="Bullet List"
          type="button"
        >
          <FiList />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? styles.isActive : ''}
          title="Numbered List"
          type="button"
        >
          <MdFormatListNumbered />
        </button>
      </div>

      {/* Alignment */}
      <div className={styles.menuGroup}>
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? styles.isActive : ''}
          title="Align Left"
          type="button"
        >
          <FiAlignLeft />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? styles.isActive : ''}
          title="Align Center"
          type="button"
        >
          <FiAlignCenter />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? styles.isActive : ''}
          title="Align Right"
          type="button"
        >
          <FiAlignRight />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? styles.isActive : ''}
          title="Justify"
          type="button"
        >
          <FiAlignJustify />
        </button>
      </div>

      {/* Code & Quote */}
      <div className={styles.menuGroup}>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? styles.isActive : ''}
          title="Inline Code"
          type="button"
        >
          <FiCode />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? styles.isActive : ''}
          title="Code Block"
          type="button"
        >
          {'</>'}
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? styles.isActive : ''}
          title="Quote"
          type="button"
        >
          <MdFormatQuote />
        </button>
      </div>

      {/* Colors */}
      <div className={styles.menuGroup}>
        <label className={styles.colorLabel}>
          Text Color:
          <input
            type="color"
            onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className={styles.colorInput}
          />
        </label>
        <label className={styles.colorLabel}>
          Highlight:
          <input
            type="color"
            onInput={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
            className={styles.colorInput}
          />
        </label>
      </div>

      {/* Links & Images */}
      <div className={styles.menuGroup}>
        <button onClick={addLink} title="Add Link" type="button">
          <FiLink />
        </button>
        <button onClick={addImage} title="Add Image" type="button">
          <FiImage />
        </button>
        <button onClick={insertTable} title="Insert Table" type="button">
          <MdTableChart />
        </button>
      </div>

      {/* Clear Formatting */}
      <div className={styles.menuGroup}>
        <button
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          title="Clear Formatting"
          type="button"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

const TiptapEditor = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'tiptap-image',
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  return (
    <div className={styles.editor}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className={styles.editorContent} />
    </div>
  );
};

export default TiptapEditor;