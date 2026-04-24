import { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FileUploader({ onUpload, isUploading, uploadProgress, uploadedFiles, error, ingestionStatus, onIngest, onClear }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Upload Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? '#06b6d4' : '#3f3f46',
        }}
        className={`
          relative p-8 rounded-2xl border-2 border-dashed
          transition-all duration-300 cursor-pointer
          bg-gradient-to-br from-zinc-900/50 to-zinc-800/30
          backdrop-blur-xl hover:border-cyan-500/50 hover:from-zinc-900/60
          ${isDragging ? 'border-cyan-500 bg-cyan-500/5' : 'border-zinc-700'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <motion.div
            animate={{
              y: isDragging ? -8 : 0,
            }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Upload
              size={40}
              className={`${isDragging ? 'text-cyan-400' : 'text-purple-400'} transition-colors`}
            />
          </motion.div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">
              {isDragging ? 'Drop your PDF here' : 'Drag PDFs here or click to upload'}
            </p>
            <p className="text-zinc-400 text-sm mt-1">Supported: PDF files only</p>
          </div>
        </div>
      </motion.div>

      <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />

      {/* Upload Progress */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Uploading...</span>
              <span className="text-cyan-400 font-semibold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3"
          >
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                <Check size={20} className="text-green-400" />
                <span>Uploaded Files ({uploadedFiles.length})</span>
              </h3>
              <button
                onClick={onClear}
                className="text-zinc-400 hover:text-red-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {uploadedFiles.map((filename, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-white text-sm font-medium flex-1 truncate">{filename}</span>
                </motion.div>
              ))}
            </div>

            {/* Ingest Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onIngest}
              disabled={ingestionStatus === 'ingesting'}
              className={`
                w-full mt-4 py-3 px-4 rounded-xl font-semibold
                flex items-center justify-center space-x-2
                transition-all duration-300
                ${
                  ingestionStatus === 'ingesting'
                    ? 'bg-zinc-600 text-zinc-300 cursor-not-allowed'
                    : ingestionStatus === 'success'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-purple-500/50'
                }
              `}
            >
              {ingestionStatus === 'ingesting' && (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>Ingesting Documents...</span>
                </>
              )}
              {ingestionStatus === 'success' && (
                <>
                  <Check size={18} />
                  <span>Documents Ready!</span>
                </>
              )}
              {!ingestionStatus && (
                <>
                  <Upload size={18} />
                  <span>Ingest & Process Files</span>
                </>
              )}
            </motion.button>

            {ingestionStatus === 'success' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-center text-green-400 text-sm font-medium"
              >
                ✨ Ready! Start asking questions about your documents
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
