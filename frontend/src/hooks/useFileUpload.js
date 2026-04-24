import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [ingestionStatus, setIngestionStatus] = useState(null);

  const uploadFile = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      setUploadedFiles([...uploadedFiles, response.data.filename]);
      setUploadProgress(0);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const ingestDocuments = async () => {
    setIngestionStatus('ingesting');
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/ingest`);
      setIngestionStatus('success');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Ingestion failed');
      setIngestionStatus('error');
      console.error('Ingestion error:', err);
    }
  };

  const clearError = () => setError(null);
  const clearFiles = () => {
    setUploadedFiles([]);
    setIngestionStatus(null);
  };

  return {
    uploadFile,
    ingestDocuments,
    isUploading,
    uploadProgress,
    uploadedFiles,
    error,
    ingestionStatus,
    clearError,
    clearFiles,
  };
}
