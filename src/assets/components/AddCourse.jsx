//Pass
import React, { useState, useRef } from "react";
import axios from "axios";
import { FiX, FiUpload, FiImage } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function AddCourse() {
  const [fields, setFields] = useState({ title: "", type_name: "" });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  const handleChange = (e) => {
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : "");
    setMessage("");
    setError(false);
  };

  const handleRemoveImage = () => {
    setCoverFile(null);
    setCoverPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Validate
    if (!fields.title.trim() || !fields.type_name.trim()) {
      setMessage("กรุณากรอกชื่อคอร์สและประเภทคอร์ส");
      setError(true);
      return;
    }
    if (!coverFile) {
      setMessage("กรุณาเลือกรูปปกคอร์ส");
      setError(true);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", fields.title.trim());
      formData.append("type_name", fields.type_name.trim());
      formData.append("cover_image", coverFile);

      await axios.post(`${API_URL}/api/courses`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setMessage("เพิ่มคอร์สสำเร็จ");
      setError(false);
      setFields({ title: "", type_name: "" });
      setCoverFile(null);
      setCoverPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "เกิดข้อผิดพลาด";
      setMessage("เกิดข้อผิดพลาด: " + msg);
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 border border-gray-100 flex flex-col gap-6"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">เพิ่มคอร์สใหม่</h2>
          <p className="text-gray-500 text-sm">กรอกข้อมูลคอร์สและอัปโหลดภาพปก</p>
        </div>

        {/* ชื่อคอร์ส */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            ชื่อคอร์ส <span className="text-pink-600">*</span>
          </label>
          <input
            name="title"
            value={fields.title}
            onChange={handleChange}
            className={`w-full rounded-lg border px-4 py-2 outline-none transition-all 
              bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400
              ${error && !fields.title.trim() ? "border-pink-400" : "border-gray-200"}
            `}
            placeholder="ชื่อคอร์ส"
            required
            autoFocus
          />
        </div>
        {/* ประเภทคอร์ส */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            ประเภทคอร์ส <span className="text-pink-600">*</span>
          </label>
          <input
            name="type_name"
            value={fields.type_name}
            onChange={handleChange}
            className={`w-full rounded-lg border px-4 py-2 outline-none transition-all
              bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400
              ${error && !fields.type_name.trim() ? "border-pink-400" : "border-gray-200"}
            `}
            placeholder="เช่น อาหาร กีฬา ฯลฯ"
            required
          />
        </div>
        {/* รูปปก */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">รูปภาพปกคอร์ส <span className="text-pink-600">*</span></label>
          <div className="w-full flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-40 h-28 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 shadow-inner">
              {coverPreview ? (
                <div className="relative w-full h-full">
                  <img
                    src={coverPreview}
                    alt="preview"
                    className="object-cover w-full h-full rounded-lg"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-white border border-gray-300 hover:bg-pink-600 hover:text-white transition-colors rounded-full p-1 shadow-md z-10"
                    onClick={handleRemoveImage}
                    title="ลบรูป"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <FiImage size={32} className="mb-1 text-gray-400" />
                  <span className="text-xs text-gray-400">เลือกไฟล์รูป</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                    required
                  />
                </label>
              )}
            </div>
            <span className="text-xs text-gray-400 mt-2 sm:mt-0">
              รองรับไฟล์ jpg, png, jpeg, webp, gif, ขนาดไม่เกิน 2 MB
            </span>
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold 
            bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 
            text-white shadow-md transition-all focus:ring-2 focus:ring-indigo-400
            ${submitting ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <FiUpload size={18} /> {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>

        {/* ข้อความแสดงผล */}
        {message && (
          <div
            className={`w-full rounded-md text-center px-4 py-2 text-base font-semibold mt-2 transition-all
            ${error ? "bg-pink-100 text-pink-700 border border-pink-300" : "bg-green-100 text-green-700 border border-green-200"}
          `}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
