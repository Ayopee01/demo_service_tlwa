import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiX } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function CourseCardCreate() {
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

  // โหลด courses & types
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

  const setErrorMsg = (msg) => {
    setMessage(msg);
    setError(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setError(false);

    // Validate
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
    <div className="max-w-xl mx-auto py-10">
      <h2 className="text-xl font-bold mb-4">เพิ่มข้อมูล Card คอร์สเรียน</h2>
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        {/* course_id */}
        <div>
          <label className="font-semibold">เลือก Course*</label>
          <select name="course_id" value={fields.course_id} onChange={handleChange}
                  className="border rounded px-2 py-1 w-full" required>
            <option value="">เลือก Course</option>
            {courses.map(c =>
              <option key={c.id} value={c.id}>{c.title} (ID:{c.id})</option>
            )}
          </select>
        </div>
        {/* type_id */}
        <div>
          <label className="font-semibold">ประเภทคอร์ส*</label>
          <select name="type_id" value={fields.type_id} onChange={handleChange}
                  className="border rounded px-2 py-1 w-full" required>
            <option value="">เลือกประเภท</option>
            {types.map(t =>
              <option key={t.id} value={t.id}>{t.name}</option>
            )}
          </select>
        </div>
        {/* title */}
        <div>
          <label className="font-semibold">ชื่อ Card*</label>
          <input name="title" value={fields.title}
                 onChange={handleChange}
                 className="border px-2 py-1 rounded w-full" required />
        </div>
        {/* detail */}
        <div>
          <label className="font-semibold">รายละเอียด</label>
          <textarea name="detail" value={fields.detail}
                    onChange={handleChange}
                    className="border px-2 py-1 rounded w-full" rows={2} />
        </div>
        {/* วันที่ต่าง ๆ */}
        <div className="flex gap-2">
          <div>
            <label className="font-semibold">วันที่เริ่ม</label>
            <input type="date" name="start_date" value={fields.start_date || ""}
                   onChange={handleChange}
                   className="border px-2 py-1 rounded w-full" />
          </div>
          <div>
            <label className="font-semibold">วันที่จบ</label>
            <input type="date" name="end_date" value={fields.end_date || ""}
                   onChange={handleChange}
                   className="border px-2 py-1 rounded w-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <div>
            <label className="font-semibold">วันเปิดสมัคร</label>
            <input type="date" name="registration_start" value={fields.registration_start || ""}
                   onChange={handleChange}
                   className="border px-2 py-1 rounded w-full" />
          </div>
          <div>
            <label className="font-semibold">วันปิดสมัคร</label>
            <input type="date" name="registration_end" value={fields.registration_end || ""}
                   onChange={handleChange}
                   className="border px-2 py-1 rounded w-full" />
          </div>
        </div>
        {/* location */}
        <div>
          <label className="font-semibold">สถานที่</label>
          <input name="location" value={fields.location}
                 onChange={handleChange}
                 className="border px-2 py-1 rounded w-full" />
        </div>
        {/* max_participants */}
        <div>
          <label className="font-semibold">จำนวนคนสูงสุด</label>
          <input type="number" name="max_participants" value={fields.max_participants}
                 onChange={handleChange}
                 className="border px-2 py-1 rounded w-full" min={0} />
        </div>
        {/* price */}
        <div>
          <label className="font-semibold">ราคาคอร์ส (บาท)*</label>
          <input type="number" name="price" value={fields.price}
                 onChange={handleChange}
                 className="border px-2 py-1 rounded w-full"
                 min={0} required />
        </div>
        {/* card_image */}
        <div>
          <label className="font-semibold">รูปภาพ Card*</label>
          {coverPreview && (
            <div className="relative w-52 h-36 mb-2">
              <img src={coverPreview} alt="preview"
                   className="w-full h-full object-contain rounded shadow border" />
              <button type="button"
                      className="absolute top-1 right-1 bg-white/70 hover:bg-red-500 hover:text-white text-gray-700 rounded-full p-1 shadow"
                      onClick={handleRemoveImage} title="ลบรูป"
                      style={{ zIndex: 10 }}>
                <FiX size={20} />
              </button>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange}
                 ref={fileInputRef}
                 className="block" required={!coverPreview} />
        </div>
        {/* Submit */}
        <button type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700"
                disabled={loading}>
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        {message && (
          <div className={`mt-2 ${error ? "text-red-600" : "text-green-600"}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
