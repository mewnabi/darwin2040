"use client";

import { Upload } from "lucide-react";
import { useRef } from "react";

interface FileUploadProps {
  label?: string;
  accept?: string;
  onFileSelect: (file: File) => void;
}

export function FileUpload({
  label = "파일 업로드",
  accept,
  onFileSelect,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-gold-400 transition-colors"
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">
        클릭하여 파일을 선택하세요
      </p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
    </div>
  );
}
