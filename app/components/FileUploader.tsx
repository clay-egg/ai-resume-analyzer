import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "../lib/utils";

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
        const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0] || null;
            setSelectedFile(file);
            onFileSelect?.(file);
        },
        [onFileSelect]
    );

    const maxFileSize = 20 * 1024 * 1024;

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: { "application/pdf": [".pdf"] },
        maxSize: maxFileSize,
    });

    const handleRemoveFile = () => {
        setSelectedFile(null);
        onFileSelect?.(null);
    };

    return (
        <div className="w-full gradient-border">
            <div
                {...getRootProps()}
                className={`rounded-xl border border-dashed p-5 text-center transition sm:p-7 ${
                    isDragActive
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                }`}
            >
                <input {...getInputProps()} />
                            <div className="space-y-4 cursor-pointer">
                                {selectedFile ? (
                                    <div
                                        className="uploader-selected-file"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <img src="/images/pdf.png" alt="pdf" className="size-10" />
                                        <div className="flex min-w-0 items-center space-x-3">
                                            <div className="min-w-0">
                                                <p className="max-w-[190px] truncate text-sm font-medium text-slate-700 sm:max-w-sm">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {formatSize(selectedFile.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="p-2 cursor-pointer" onClick={handleRemoveFile}>
                                            <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                                            <img src="/icons/info.svg" alt="upload" className="size-20" />
                                        </div>
                                        <p className="text-base text-slate-600 sm:text-lg">
                                            <span className="font-semibold">Click to upload</span> or drag
                                            and drop
                                        </p>
                                        <p className="text-sm text-slate-500 sm:text-base">
                                            PDF (max {formatSize(maxFileSize)})
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    );
                    };

                    export default FileUploader;
