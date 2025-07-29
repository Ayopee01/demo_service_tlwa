//Pass
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiX, FiUpload, FiImage } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function AddCourseCard() {
  const [fields, setFields] = useState({
    course_id: "",
    type_id: "",
    title: "",
    detail: "",
    start_date: "",
    end_date: "",
    registration_start: "",
    registration_end: "",
    location: "",
    max_participants: "",
    price: "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [types, setTypes] = useState([]);
  const fileInputRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        const [courseRes, typeRes] = await Promise.all([
          axios.get(`${API_URL}/api/courses`),
          axios.get(`${API_URL}/api/course_types`),
        ]);
        setCourses(Array.isArray(courseRes.data) ? courseRes.data : []);
        setTypes(Array.isArray(typeRes.data) ? typeRes.data : []);
      } catch (err) {
        setMessage("โหลดข้อมูลไม่สำเร็จ");
        setError(true);
      }
    })();
  }, []);

  const handleChange = (e) => setFields({ ...fields, [e.target.name]: e.target.value });

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

  const setErrorMsg = (msg) => {
    setMessage(msg);
    setError(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setError(false);
    if (!fields.title.trim()) return setErrorMsg("กรุณากรอกชื่อ Card");
    if (!fields.type_id) return setErrorMsg("เลือกประเภทคอร์ส");
    if (!fields.course_id) return setErrorMsg("เลือก Course");
    if (!coverFile) return setErrorMsg("เลือกรูปภาพ Card");
    if (!fields.price || isNaN(fields.price)) return setErrorMsg("กรุณากรอกราคาเป็นตัวเลข");

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) => formData.append(k, v || ""));
      formData.append("card_image", coverFile);

      await axios.post(`${API_URL}/api/courses_card`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("บันทึกสำเร็จ!");
      setError(false);
      setFields({
        course_id: "", type_id: "", title: "", detail: "", start_date: "",
        end_date: "", registration_start: "", registration_end: "",
        location: "", max_participants: "", price: "",
      });
      setCoverFile(null); setCoverPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setErrorMsg("เกิดข้อผิดพลาด: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl p-8 border border-gray-100 flex flex-col gap-6"
        encType="multipart/form-data"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
            เพิ่มข้อมูล Card คอร์สเรียน
          </h2>
          <p className="text-gray-500 text-sm">
            กรอกรายละเอียดและอัปโหลดภาพปก Card สำหรับคอร์สเรียน
          </p>
        </div>
        {/* Select Course */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            เลือก Course <span className="text-pink-600">*</span>
          </label>
          <select
            name="course_id"
            value={fields.course_id}
            onChange={handleChange}
            className="w-full rounded-lg border px-4 py-2 outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            required
          >
            <option value="">เลือก Course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} (ID:{c.id})
              </option>
            ))}
          </select>
        </div>
        {/* Select Type */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            ประเภทคอร์ส <span className="text-pink-600">*</span>
          </label>
          <select
            name="type_id"
            value={fields.type_id}
            onChange={handleChange}
            className="w-full rounded-lg border px-4 py-2 outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            required
          >
            <option value="">เลือกประเภท</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        {/* Card Name */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            ชื่อ Card <span className="text-pink-600">*</span>
          </label>
          <input
            name="title"
            value={fields.title}
            onChange={handleChange}
            className="w-full rounded-lg border px-4 py-2 outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            placeholder="กรอกชื่อ Card"
            required
          />
        </div>
        {/* Detail */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            รายละเอียด
          </label>
          <textarea
            name="detail"
            value={fields.detail}
            onChange={handleChange}
            className="w-full rounded-lg border px-4 py-2 outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            rows={2}
            placeholder="รายละเอียดคอร์สเพิ่มเติม"
          />
        </div>
        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold text-gray-700">วันที่เริ่ม</label>
            <input
              type="date"
              name="start_date"
              value={fields.start_date || ""}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-2 outline-none bg-gray-50 focus:bg-white border-gray-200"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-gray-700">วันที่จบ</label>
            <input
              type="date"
              name="end_date"
              value={fields.end_date || ""}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-2 outline-none bg-gray-50 focus:bg-white border-gray-200"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold text-gray-700">วันเปิดสมัคร</label>
            <input
              type="date"
              name="registration_start"
              value={fields.registration_start || ""}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-2 outline-none bg-gray-50 focus:bg-white border-gray-200"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-gray-700">วันปิดสมัคร</label>
            <input
              type="date"
              name="registration_end"
              value={fields.registration_end || ""}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-2 outline-none bg-gray-50 focus:bg-white border-gray-200"
            />
          </div>
        </div>
        {/* Location */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            สถานที่
          </label>
          <input
            name="location"
            value={fields.location}
            onChange={handleChange}
            className="w-full rounded-lg border px-4 py-2 outline-none bg-gray-50 focus:bg-white border-gray-200"
            placeholder="สถานที่"
          />
        </div>
        {/* Max participants */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">จำนวนคนสูงสุด</label>
          <input
            type="number"
            name="max_participants"
            value={fields.max_participants}
            onChange={handleChange}
            className="w-full rounded-lg border px-4 py-2 outline-none bg-gray-50 focus:bg-white border-gray-200"
            min={0}
            placeholder="สูงสุด"
          />
        </div>
        {/* Price */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            ราคาคอร์ส (บาท) <span className="text-pink-600">*</span>
          </label>
          <input
            type="number"
            name="price"
            value={fields.price}
            onChange={handleChange}
            className="w-full rounded-lg border px-4 py-2 outline-none bg-gray-50 focus:bg-white border-gray-200"
            min={0}
            placeholder="ราคาคอร์ส"
            required
          />
        </div>
        {/* Card image */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">รูปภาพ Card <span className="text-pink-600">*</span></label>
          <div className="flex items-center gap-4">
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
                  <FiImage size={30} className="mb-1 text-gray-400" />
                  <span className="text-xs text-gray-400">เลือกรูป Card</span>
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
            <span className="text-xs text-gray-400 mt-2">
              รองรับ jpg, png, jpeg, webp, gif, ไม่เกิน 2 MB
            </span>
          </div>
        </div>
        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold
            bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700
            text-white shadow-md transition-all focus:ring-2 focus:ring-indigo-400
            ${loading ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <FiUpload size={18} /> {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        {/* Message */}
        {message && (
          <div className={`w-full rounded-md text-center px-4 py-2 text-base font-semibold mt-2 transition-all
            ${error ? "bg-pink-100 text-pink-700 border border-pink-300" : "bg-green-100 text-green-700 border border-green-200"}
          `}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
