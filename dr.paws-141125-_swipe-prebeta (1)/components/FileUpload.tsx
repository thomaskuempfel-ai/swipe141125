
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  files: File[];
  setFiles: (files: File[]) => void;
  setError: (error: string | null) => void;
  t: (key: string, options?: any) => string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles, setError, t }) => {
  const [isDragging, setIsDragging] = useState(false);

  const validateAndSetFiles = useCallback((selectedFiles: File[]) => {
    const validFiles: File[] = [];
    let errorOccurred = false;
    
    for (const file of selectedFiles) {
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            setError(t('error_file_too_large'));
            errorOccurred = true;
            break;
        }
        if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
            setError(t('error_invalid_file_type'));
            errorOccurred = true;
            break;
        }
        validFiles.push(file);
    }

    if (!errorOccurred) {
        setError(null);
        setFiles(validFiles);
    }
  }, [setFiles, setError, t]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files ? [...event.target.files] : [];
    if (selected.length > 0) {
      validateAndSetFiles(selected);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files ? [...e.dataTransfer.files] : [];
    if (dropped.length > 0) {
      validateAndSetFiles(dropped);
    }
  }, [validateAndSetFiles]);

  const baseClasses = "relative block w-full rounded-lg border-2 border-dashed p-8 text-center focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer transition-colors";
  const idleClasses = "border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-400";
  const draggingClasses = "border-teal-500 bg-teal-50 dark:bg-teal-900/20";

  return (
    <div>
      <label
        htmlFor="file-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`${baseClasses} ${isDragging ? draggingClasses : idleClasses}`}
      >
        <UploadIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
        <span className="mt-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
          {files.length > 0 ? t('files_selected', { count: files.length }) : t('upload_prompt')}
        </span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">
          {t('upload_subprompt')}
        </span>
        {!files.length && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('upload_recommendation')}</p>}
        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="video/*,audio/*" multiple />
      </label>
    </div>
  );
};
