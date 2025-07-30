"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2, X } from "lucide-react";

type FileUploadProps = {
  onUpload: (file: File) => void;
};

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setLoading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'text/csv' || 
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel') {
        await processFile(file);
      }
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Processing Your File
        </h3>
        <p className="text-gray-600">
          Analyzing columns and preparing data...
        </p>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
          <p className="text-blue-700 text-sm">
            <strong>{selectedFile?.name}</strong> ({selectedFile ? formatFileSize(selectedFile.size) : ''})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Upload className="text-white" size={28} />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Upload Your Data File
          </h3>
          
          <p className="text-gray-600 mb-4 max-w-md">
            Drag and drop your Excel or CSV file here, or click to browse. 
            We&apos;ll analyze your data and help you download images from URL columns.
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <FileText size={16} className="mr-1" />
              .CSV
            </div>
            <div className="flex items-center">
              <FileText size={16} className="mr-1" />
              .XLSX
            </div>
            <div className="flex items-center">
              <FileText size={16} className="mr-1" />
              .XLS
            </div>
          </div>
          
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Choose File
          </button>
        </div>
      </div>

      {selectedFile && !loading && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="text-blue-600 mr-3" size={20} />
            <div className="text-left">
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            onClick={clearSelection}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500 max-w-md mx-auto">
        <p>
          <strong>Supported formats:</strong> CSV, Excel (.xlsx, .xls)<br />
          <strong>Max file size:</strong> 10MB<br />
          Your data is processed securely and not stored permanently.
        </p>
      </div>
    </div>
  );
};

export default FileUpload;