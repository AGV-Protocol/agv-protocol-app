"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';

interface MediumEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function MediumEditor({ content, onChange, placeholder = "Start writing...", className = "" }: MediumEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const uploadAndInsertImage = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        // Insert image at cursor position or at the end
        const selection = window.getSelection();
        let range: Range;
        
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
        } else {
          // If no selection, insert at the end
          range = document.createRange();
          if (editorRef.current) {
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
          }
        }
        
        const img = document.createElement('img');
        img.src = result.url;
        img.alt = 'Uploaded image';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '20px auto';
        img.className = 'medium-image';
        
        range.deleteContents();
        range.insertNode(img);
        range.setStartAfter(img);
        range.setEndAfter(img);
        
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        handleInput();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const insertImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadAndInsertImage(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    for (const file of imageFiles) {
      await uploadAndInsertImage(file);
    }
  };

  const getAuthToken = async () => {
    try {
      const { auth } = await import('@/lib/firebase');
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertHeading = (level: number) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const heading = document.createElement(`h${level}`);
      heading.textContent = selection.toString() || `Heading ${level}`;
      range.deleteContents();
      range.insertNode(heading);
      range.setStartAfter(heading);
      range.setEndAfter(heading);
      selection.removeAllRanges();
      selection.addRange(range);
      handleInput();
    }
  };

  const insertQuote = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const blockquote = document.createElement('blockquote');
      blockquote.textContent = selection.toString() || 'Quote';
      blockquote.style.borderLeft = '4px solid #ccc';
      blockquote.style.paddingLeft = '20px';
      blockquote.style.margin = '20px 0';
      blockquote.style.fontStyle = 'italic';
      range.deleteContents();
      range.insertNode(blockquote);
      range.setStartAfter(blockquote);
      range.setEndAfter(blockquote);
      selection.removeAllRanges();
      selection.addRange(range);
      handleInput();
    }
  };

  return (
    <div className={`medium-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border border-gray-200 rounded-t-lg bg-gray-50 sticky top-0 z-10">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('bold')}
            className="h-8 w-8 p-0"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('italic')}
            className="h-8 w-8 p-0"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('underline')}
            className="h-8 w-8 p-0"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHeading(1)}
            className="h-8 w-8 p-0"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHeading(2)}
            className="h-8 w-8 p-0"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHeading(3)}
            className="h-8 w-8 p-0"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertUnorderedList')}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertOrderedList')}
            className="h-8 w-8 p-0"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyLeft')}
            className="h-8 w-8 p-0"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyCenter')}
            className="h-8 w-8 p-0"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyRight')}
            className="h-8 w-8 p-0"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Quote */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertQuote}
            className="h-8 w-8 p-0"
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </Button>
        </div>

        {/* Link */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertLink}
            className="h-8 w-8 p-0"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Image Upload */}
        <div className="flex items-center gap-1">
          <input
            type="file"
            accept="image/*"
            onChange={insertImage}
            className="hidden"
            id="image-upload"
            disabled={isUploading}
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Insert Image"
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </Button>
          </label>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`min-h-[400px] p-4 border border-gray-200 border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-500 relative ${
          isDragging ? 'border-blue-500 bg-blue-50' : ''
        }`}
        style={{
          lineHeight: '1.6',
          fontSize: '16px',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-500 rounded-lg z-10">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-600 font-medium">Drop images here to upload</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .medium-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #999;
          font-style: italic;
        }
        
        .medium-editor .medium-image {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .medium-editor blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 20px;
          margin: 20px 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .medium-editor h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 24px 0 16px 0;
          line-height: 1.2;
        }
        
        .medium-editor h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 20px 0 12px 0;
          line-height: 1.3;
        }
        
        .medium-editor h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 16px 0 8px 0;
          line-height: 1.4;
        }
        
        .medium-editor ul, .medium-editor ol {
          margin: 16px 0;
          padding-left: 24px;
        }
        
        .medium-editor li {
          margin: 8px 0;
        }
        
        .medium-editor a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .medium-editor a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
}

