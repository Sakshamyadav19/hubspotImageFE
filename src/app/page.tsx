"use client";
import React, { useState } from 'react';
import api from './api';
import FileUpload from './components/FileUpload';
import ColumnSelector from './components/ColumnSelector';
import { CheckCircle, Download, FileText, AlertCircle } from 'lucide-react';

type ProcessingStep = 'upload' | 'select' | 'download' | 'complete';

function App() {
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filename, setFilename] = useState('');
  const [message, setMessage] = useState('');
  const [totalImages, setTotalImages] = useState(0);
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('upload');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [error, setError] = useState('');


  const handleFileUpload = async (file: File) => {
    try {
      setError('');
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
      setColumns(res.data.columns);
      setFilename(res.data.filename);
      setUploadedFileName(file.name);
      setCurrentStep('select');
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      console.error('Upload error:', err);
    }
  };



  const handleDownload = async () => {
    try {
      setError('');
      
      const res = await api.post('/download-images', {
        filename,
        columns: selectedColumns,
        downloadPath: 'downloads' // Use default downloads folder
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes timeout
      });
      
      // Check if any images were actually downloaded
      if (res.data.total_images === 0) {
        setError('No images found to download. Please check that the selected columns contain valid image URLs.');
        setCurrentStep('select'); // Go back to column selection
      } else {
        // Download images to user's local machine
        if (res.data.images && res.data.images.length > 0) {
          downloadImagesToLocal(res.data.images);
        }
        
        setMessage(res.data.message);
        setTotalImages(res.data.total_images);
        setCurrentStep('complete');
      }
    } catch (err: unknown) {
      // Handle different types of errors gracefully
      const error = err as { response?: { data?: { error?: string } }, code?: string, message?: string };
      if (error.response?.data?.error) {
        // Server returned a specific error message
        setError(error.response.data.error);
      } else if (error.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else if (error.message?.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else {
        setError('Please try different columns.');
      }
      console.error('Download error:', err);
      setCurrentStep('select'); // Go back to column selection on error
    }
  };

  const downloadImagesToLocal = (images: any[]) => {
    // Group images by column
    const imagesByColumn: { [key: string]: any[] } = {};
    images.forEach(img => {
      if (!imagesByColumn[img.column]) {
        imagesByColumn[img.column] = [];
      }
      imagesByColumn[img.column].push(img);
    });

    // Download each image
    images.forEach(img => {
      try {
        // Convert base64 to blob
        const byteCharacters = atob(img.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: `image/${img.extension}` });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = img.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading image:', img.filename, error);
      }
    });
  };

  const resetProcess = () => {
    setColumns([]);
    setSelectedColumns([]);
    setFilename('');
    setMessage('');
    setTotalImages(0);
    setCurrentStep('upload');
    setUploadedFileName('');
    setError('');
  };

  const getStepStatus = (step: ProcessingStep) => {
    const stepOrder = ['upload', 'select', 'download', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            HubSpot Image Downloader
          </h1>
          <p className="text-lg text-gray-600">
            Professional bulk image downloading tool for your marketing assets
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { key: 'upload', label: 'Upload File', icon: FileText },
              { key: 'select', label: 'Select Columns', icon: CheckCircle },
              { key: 'download', label: 'Download Images', icon: Download },
              { key: 'complete', label: 'Complete', icon: CheckCircle }
            ].map(({ key, label, icon: Icon }, index) => {
              const status = getStepStatus(key as ProcessingStep);
              return (
                <div key={key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 
                        status === 'current' ? 'bg-blue-500 border-blue-500 text-white' : 
                        'bg-gray-200 border-gray-300 text-gray-500'}
                    `}>
                      <Icon size={20} />
                    </div>
                    <span className={`mt-2 text-sm font-medium ${
                      status === 'current' ? 'text-blue-600' : 
                      status === 'completed' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      getStepStatus(['select', 'download', 'complete'][index] as ProcessingStep) === 'completed' ? 
                      'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="text-red-500 mr-3 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 mb-1">Download Error</h4>
                  <div className="text-red-700 text-sm whitespace-pre-line">{error}</div>
                  {error.includes('Please try different columns') && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                      <strong>Tip:</strong> Look for columns with &quot;Recommended&quot; or &quot;Suggested&quot; badges that are likely to contain image URLs.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 'upload' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <FileUpload onUpload={handleFileUpload} />
            </div>
          )}

          {currentStep === 'select' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    File Uploaded Successfully
                  </h3>
                  <button
                    onClick={resetProcess}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Upload Different File
                  </button>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={20} />
                  <span className="text-green-700">
                    <strong>{uploadedFileName}</strong> processed successfully. 
                    Found {columns.length} columns.
                  </span>
                </div>
              </div>

              <ColumnSelector
                columns={columns}
                selected={selectedColumns}
                onChange={setSelectedColumns}
              />

              {/* Helpful guidance */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-sm">
                  💡 <strong>Tip:</strong> Select columns that contain image URLs (usually ending in .jpg, .png, .gif, etc.) or HubSpot signed URLs.
                </p>
              </div>

              {selectedColumns.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setCurrentStep('download');
                      handleDownload();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <Download className="mr-2" size={20} />
                    Download Images ({selectedColumns.length} Column{selectedColumns.length !== 1 ? 's' : ''} Selected)
                  </button>
                </div>
              )}
            </div>
          )}



          {currentStep === 'download' && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="mb-6">
                <div className="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Downloading Images...
                </h3>
                <p className="text-gray-600 mb-4">
                  Processing {selectedColumns.length} column{selectedColumns.length !== 1 ? 's' : ''} from {uploadedFileName}
                </p>
                
                {/* Folder Structure Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="text-green-500 mt-0.5">📁</div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Download Location</h4>
                      <p className="text-green-700 text-sm">
                        Images will be saved to: <strong>Downloads/hubspot-images/</strong>
                      </p>
                      <p className="text-green-600 text-sm mt-1">
                        Each column will have its own subfolder for organized storage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  This may take a few minutes depending on the number of images. 
                  Please don&apos;t close this window.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="mb-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Download Complete!
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-700 mb-2">{message}</p>
                  <p className="text-green-600 text-sm">
                    Successfully downloaded {totalImages} images from {selectedColumns.length} column{selectedColumns.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    <strong>Download Location:</strong> Downloads/hubspot-images/
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={resetProcess}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Process Another File
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p>💡 Images have been downloaded to Downloads/hubspot-images/ and organized by column name</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>© 2025 HubSpot Image Downloader - Professional Marketing Tools</p>
        </div>
      </div>
    </div>
  );
}

export default App;