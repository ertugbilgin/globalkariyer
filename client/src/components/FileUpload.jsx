import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const FileUpload = ({ onFileSelect, selectedFile }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                onFileSelect(file);
            } else {
                alert('Lütfen sadece PDF dosyası yükleyin.');
            }
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                onFileSelect(file);
            } else {
                alert('Lütfen sadece PDF dosyası yükleyin.');
            }
        }
    };

    const removeFile = (e) => {
        e.stopPropagation();
        onFileSelect(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer group",
                    isDragging
                        ? "border-blue-500 bg-blue-50/50 scale-[1.02]"
                        : "border-gray-300 hover:border-blue-400 hover:bg-gray-50",
                    selectedFile ? "border-green-500 bg-green-50/30" : ""
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileInput}
                />

                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <AnimatePresence mode="wait">
                        {selectedFile ? (
                            <motion.div
                                key="file-selected"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                    <FileText className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">{selectedFile.name}</h3>
                                <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button
                                    onClick={removeFile}
                                    className="mt-4 flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors text-sm font-medium"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Dosyayı Kaldır
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="upload-prompt"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="flex flex-col items-center"
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors",
                                    isDragging ? "bg-blue-100" : "bg-gray-100 group-hover:bg-blue-50"
                                )}>
                                    <Upload className={cn(
                                        "w-8 h-8 transition-colors",
                                        isDragging ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
                                    )} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    CV'nizi buraya sürükleyin
                                </h3>
                                <p className="text-sm text-gray-500">
                                    veya dosya seçmek için tıklayın (PDF)
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default FileUpload;
