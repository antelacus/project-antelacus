'use client';

import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { basicSetup } from 'codemirror';

// The narrow interface (DESIGN §2.1): Markdown in, Markdown out, one upload function. CodeMirror is an
// implementation detail behind it; swapping the widget touches nothing else. Without `onUpload` the editor
// is text only: pasted or dropped images are ignored and there is no image button.
export type MarkdownEditorProps = {
  value: string;
  onChange(next: string): void;
  onUpload?(file: File): Promise<string>;
  onError?(message: string): void;
};

const isImage = (file: File) => file.type.startsWith('image/');

export default function MarkdownEditor({ value, onChange, onUpload, onError }: MarkdownEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latest = useRef({ onChange, onUpload, onError });
  useEffect(() => {
    latest.current = { onChange, onUpload, onError };
  });

  useEffect(() => {
    if (!host.current) return;

    const insertUploads = async (files: File[], editor: EditorView) => {
      const upload = latest.current.onUpload;
      if (!upload) return;
      for (const file of files) {
        try {
          const url = await upload(file);
          const at = editor.state.selection.main.head;
          const text = `![${file.name.replace(/\.[^.]+$/, '')}](${url})`;
          editor.dispatch({ changes: { from: at, insert: text }, selection: { anchor: at + text.length } });
        } catch (error) {
          latest.current.onError?.(error instanceof Error ? error.message : 'Upload failed');
        }
      }
    };

    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          markdown(),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) latest.current.onChange(update.state.doc.toString());
          }),
          EditorView.domEventHandlers({
            paste(event, editorView) {
              const files = Array.from(event.clipboardData?.files ?? []).filter(isImage);
              if (files.length === 0 || !latest.current.onUpload) return false;
              event.preventDefault();
              void insertUploads(files, editorView);
              return true;
            },
            drop(event, editorView) {
              const files = Array.from(event.dataTransfer?.files ?? []).filter(isImage);
              if (files.length === 0 || !latest.current.onUpload) return false;
              event.preventDefault();
              void insertUploads(files, editorView);
              return true;
            },
          }),
          EditorView.theme({
            '&': { fontSize: '1rem', minHeight: '24rem', border: '1px solid rgba(29, 29, 27, 0.18)', borderRadius: '8px', background: 'var(--color-paper)' },
            '.cm-content': { fontFamily: 'var(--font-code)', padding: '0.75rem 0' },
            '.cm-scroller': { minHeight: '24rem' },
          }),
        ],
      }),
    });
    view.current = editor;
    (host.current as HTMLDivElement & { insertFiles?: (files: File[]) => void }).insertFiles = (files) => void insertUploads(files, editor);

    return () => {
      editor.destroy();
      view.current = null;
    };
    // The editor owns its document after mount; `value` only seeds it and is re-synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A value changed from outside (a restored draft) replaces the document without recreating the editor.
  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const current = editor.state.doc.toString();
    if (current !== value) editor.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [value]);

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div ref={host} />
      {/* The file picker is how a phone inserts an image; paste and drop are for desks. */}
      {onUpload && <label className="admin-button" style={{ justifySelf: 'start' }}>
        Insert image from device
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []).filter(isImage);
            (host.current as (HTMLDivElement & { insertFiles?: (files: File[]) => void }) | null)?.insertFiles?.(files);
            event.target.value = '';
          }}
        />
      </label>}
    </div>
  );
}
