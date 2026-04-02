import React, { useState } from 'react';

export default function UploadZone({ onChange, value = [] }) {
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onChange(files);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  const removeFile = (index) => {
    const newFiles = value.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onChange(newFiles);
    setPreviews(newPreviews);
  };

  return (
    <section className="space-y-4">
      <div className="relative group">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Chọn nhiều ảnh để tải lên"
        />
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center transition-all group-hover:border-teal-600 group-hover:bg-teal-50">
          <p className="text-sm font-black text-slate-900 tracking-tight uppercase">NHẤP ĐỂ TẢI ẢNH LÊN</p>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">HỖ TRỢ: JPG, PNG, WEBP (TỐI ĐA 5MB/ẢNH)</p>
        </div>
      </div>

      {previews.length > 0 && (
        <ul className="grid grid-cols-4 gap-4" aria-label="Danh sách ảnh đã chọn">
          {previews.map((src, i) => (
            <li key={i} className="relative aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-200 group/item">
              <img src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label={`Xóa ảnh ${i + 1}`}
                className="absolute top-1 right-1 bg-white/90 px-1.5 py-0.5 rounded-md text-[10px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                [ X ]
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
