import React, { useState, useRef } from "react";
import axios from "axios";
import { FiX } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

function CourseForm() {
  const [fields, setFields] = useState({ title: "", type_name: "" });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  const handleChange = (e) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
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

    // Validation
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
    <div className="max-w-lg mx-auto py-8">
      <h2 className="text-xl font-bold mb-4">เพิ่มคอร์สใหม่</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ชื่อคอร์ส */}
        <div>
          <label className="block mb-1 font-semibold">ชื่อคอร์ส*</label>
          <input
            name="title"
            value={fields.title}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
            placeholder="ชื่อคอร์ส"
            required
          />
        </div>

        {/* ประเภทคอร์ส */}
        <div>
          <label className="block mb-1 font-semibold">ประเภทคอร์ส* (กำหนดเอง)</label>
          <input
            name="type_name"
            value={fields.type_name}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
            placeholder="ใส่ประเภท เช่น อาหาร กีฬา ฯลฯ"
            required
          />
        </div>

        {/* รูปปก */}
        <div>
          <label className="block mb-1 font-semibold">รูปภาพปกคอร์ส*</label>
          <div className="relative w-52 h-36">
            {coverPreview ? (
              <div className="relative w-full h-full">
                <img
                  src={coverPreview}
                  alt="preview"
                  className="w-full h-full object-cover rounded shadow"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-white bg-opacity-70 hover:bg-red-500 hover:text-white text-gray-600 rounded-full p-1 shadow"
                  onClick={handleRemoveImage}
                  title="ลบรูป"
                  style={{ zIndex: 10 }}
                >
                  <FiX size={20} />
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="block mt-2"
                required
              />
            )}
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <button
          type="submit"
          disabled={submitting}
          className={`bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 ${
            submitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>

        {/* ข้อความแสดงผล */}
        {message && (
          <div className={`mt-2 ${error ? "text-red-600" : "text-green-600"}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default CourseForm;
