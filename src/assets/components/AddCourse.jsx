import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { FiX, FiUpload, FiImage } from "react-icons/fi";

// ---- เวลาไทย ----
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
const TZ = "Asia/Bangkok";

// รับค่าจาก <input type="datetime-local" /> แล้ว “ตรึง” เป็นเวลาไทย (ไม่ shift) แปลงเป็น MySQL DATETIME
const toThaiMySQL = (v) =>
  v ? dayjs(v).tz(TZ, true).format("YYYY-MM-DD HH:mm:ss") : null;

const API_URL = import.meta.env.VITE_API_URL || "";

export default function AddCourse() {
  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const [fields, setFields] = useState({
    title: "",
    type_id: "",
    detail: "",                 // ← รายละเอียด (ไม่บังคับ)
    location: "",
    registration_start: "",
    registration_end: "",
    event_start_at: "",
    event_end_at: "",
    price: "",
    seats: "",
    is_active: true,
  });

  // ----- cover_image (ของเดิม) -----
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const fileInputRef = useRef();

  // ===== bg_image (ไม่บังคับ) =====
  const [bgFile, setBgFile] = useState(null);
  const [bgPreview, setBgPreview] = useState("");
  const bgInputRef = useRef();
  // ================================

  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveInventory, setSaveInventory] = useState(true);

  // ===== ตัวนับคำ detail =====
  const detailWordCount = useMemo(() => {
    const s = (fields.detail || "").trim();
    if (!s) return 0;
    return s.split(/\s+/).filter(Boolean).length;
  }, [fields.detail]);

  // โหลดประเภทคอร์ส
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/course_types`);
        if (alive) setTypes(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (alive) setTypes([]);
      } finally {
        if (alive) setLoadingTypes(false);
      }
    })();
    return () => (alive = false);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFields((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setCoverFile(file || null);
    setCoverPreview(file ? URL.createObjectURL(file) : "");
    setMessage("");
    setError(false);
  };

  const handleRemoveImage = () => {
    setCoverFile(null);
    setCoverPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // bg_image handlers
  const handleBgChange = (e) => {
    const file = e.target.files?.[0];
    setBgFile(file || null);
    setBgPreview(file ? URL.createObjectURL(file) : "");
    setMessage("");
    setError(false);
  };

  const handleRemoveBg = () => {
    setBgFile(null);
    setBgPreview("");
    if (bgInputRef.current) bgInputRef.current.value = "";
  };

  const canSubmit = useMemo(() => {
    if (!fields.title.trim()) return false;
    if (!fields.type_id) return false;
    if (!fields.registration_start || !fields.registration_end) return false;
    if (saveInventory) {
      if (fields.price === "" || isNaN(+fields.price) || +fields.price < 0) return false;
      if (fields.seats === "" || isNaN(+fields.seats) || +fields.seats < 0) return false;
    }
    return true;
  }, [fields, saveInventory]);

  const validate = () => {
    // ตรวจช่วงรับสมัคร (ใช้ dayjs โซนไทย)
    const rs = dayjs(fields.registration_start).tz(TZ, true);
    const re = dayjs(fields.registration_end).tz(TZ, true);
    if (!rs.isValid() || !re.isValid()) {
      setMessage("กรุณาระบุช่วงรับสมัครให้ครบถ้วน");
      setError(true);
      return false;
    }
    if (rs.isAfter(re)) {
      setMessage("ช่วงรับสมัครไม่ถูกต้อง: วันเริ่มต้องไม่เกินวันสิ้นสุด");
      setError(true);
      return false;
    }
    // เวลาเริ่ม–จบกิจกรรม (ถ้ามี)
    if (fields.event_start_at && fields.event_end_at) {
      const es = dayjs(fields.event_start_at).tz(TZ, true);
      const ee = dayjs(fields.event_end_at).tz(TZ, true);
      if (es.isAfter(ee)) {
        setMessage("เวลาเริ่ม–จบกิจกรรมไม่ถูกต้อง");
        setError(true);
        return false;
      }
    }

    // จำกัด detail ไม่เกิน 100 คำ (ปล่อยว่างได้)
    if (detailWordCount > 100) {
      setMessage(`รายละเอียดต้องไม่เกิน 100 คำ (ปัจจุบัน ${detailWordCount} คำ)`);
      setError(true);
      return false;
    }

    if (!coverFile) {
      setMessage("กรุณาเลือกรูปภาพปกคอร์ส");
      setError(true);
      return false;
    }
    setError(false);
    setMessage("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !canSubmit) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      // 1) สร้างคอร์ส
      const fd = new FormData();
      fd.append("title", fields.title.trim());
      fd.append("type_id", fields.type_id);
      fd.append("location", fields.location.trim());
      fd.append("registration_start", toThaiMySQL(fields.registration_start));
      fd.append("registration_end", toThaiMySQL(fields.registration_end));
      fd.append("event_start_at", toThaiMySQL(fields.event_start_at) || "");
      fd.append("event_end_at", toThaiMySQL(fields.event_end_at) || "");
      fd.append("cover_image", coverFile);
      // ส่งรายละเอียด (ว่างได้)
      fd.append("detail", fields.detail?.trim() || "");
      // แนบไฟล์ bg_image ถ้ามี
      if (bgFile) fd.append("bg_image", bgFile);

      const courseRes = await axios.post(`${API_URL}/api/courses`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      const courseId = courseRes.data?.course_id; // แบ็กเอนด์ส่ง field นี้กลับมา

      // 2) บันทึกราคาและจำนวนที่รับได้ (inventory)
      if (saveInventory && courseId) {
        await axios.post(
          `${API_URL}/api/courses/${courseId}/inventory`,
          {
            price: Number(fields.price) || 0,
            stock: Number(fields.seats) || 0, // ใช้จำนวนที่รับได้ตัวเดียว
            is_active: fields.is_active ? 1 : 0,
          },
          { withCredentials: true }
        );
      }

      setMessage("เพิ่มคอร์สสำเร็จ");
      setError(false);

      // reset form
      setFields({
        title: "",
        type_id: "",
        detail: "",
        location: "",
        registration_start: "",
        registration_end: "",
        event_start_at: "",
        event_end_at: "",
        price: "",
        seats: "",
        is_active: true,
      });
      setCoverFile(null);
      setCoverPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // reset bg_image
      setBgFile(null);
      setBgPreview("");
      if (bgInputRef.current) bgInputRef.current.value = "";
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "เกิดข้อผิดพลาด";
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
        className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-8 border border-gray-100 space-y-6"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">เพิ่มคอร์สใหม่</h2>
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
            className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            placeholder="เช่น LIFESTYLE MEDICINE IN PRACTICE"
            required
            autoFocus
          />
        </div>

        {/* ประเภทคอร์ส */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            ประเภทคอร์ส <span className="text-pink-600">*</span>
          </label>
          <select
            name="type_id"
            value={fields.type_id}
            onChange={handleChange}
            className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            required
            disabled={loadingTypes}
          >
            <option value="">— เลือกประเภท —</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.type_code ? `(${t.type_code})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* สถานที่จัดงาน */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">สถานที่จัดงาน</label>
          <input
            name="location"
            value={fields.location}
            onChange={handleChange}
            className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            placeholder="เช่น ศูนย์ประชุมฯ"
          />
        </div>

        {/* ช่วงรับสมัคร */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            ช่วงรับสมัคร <span className="text-pink-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="datetime-local"
              name="registration_start"
              value={fields.registration_start}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
              required
            />
            <input
              type="datetime-local"
              name="registration_end"
              value={fields.registration_end}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
              required
            />
          </div>
        </div>

        {/* เวลาเริ่ม–จบกิจกรรม (ถ้ามี) */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">เวลาเริ่ม–จบกิจกรรม (ถ้ามี)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="datetime-local"
              name="event_start_at"
              value={fields.event_start_at}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            />
            <input
              type="datetime-local"
              name="event_end_at"
              value={fields.event_end_at}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            />
          </div>
        </div>

        {/* รายละเอียด (ไม่บังคับ ≤ 100 คำ) */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            รายละเอียด <span className="text-gray-400 text-xs">(ไม่บังคับ ≤ 100 คำ)</span>
          </label>
          <textarea
            name="detail"
            value={fields.detail}
            onChange={handleChange}
            rows={4}
            placeholder="สรุปรายละเอียดคอร์สแบบสั้น ๆ"
            className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
          />
          <div className={`mt-1 text-xs ${detailWordCount > 100 ? "text-pink-600" : "text-gray-400"}`}>
            {detailWordCount}/100 คำ
          </div>
        </div>

        {/* รูปปก (cover_image) */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            รูปภาพปกคอร์ส <span className="text-pink-600">*</span>
          </label>
          <div className="w-full flex items-center gap-4">
            <div className="relative w-44 h-28 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 shadow-inner">
              {coverPreview ? (
                <div className="relative w-full h-full">
                  <img src={coverPreview} alt="preview" className="object-cover w-full h-full rounded-lg" />
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
            <span className="text-xs text-gray-400">รองรับ jpg, png, jpeg, webp, gif (≤ 5 MB)</span>
          </div>
        </div>

        {/* รูปพื้นหลัง (bg_image) — ไม่บังคับ */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            รูปพื้นหลัง (สำหรับหน้ารายละเอียด) <span className="text-gray-400 text-xs">(ไม่บังคับ)</span>
          </label>
          <div className="w-full flex items-center gap-4">
            <div className="relative w-44 h-28 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 shadow-inner">
              {bgPreview ? (
                <div className="relative w-full h-full">
                  <img src={bgPreview} alt="bg preview" className="object-cover w-full h-full rounded-lg" />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-white border border-gray-300 hover:bg-pink-600 hover:text-white transition-colors rounded-full p-1 shadow-md z-10"
                    onClick={handleRemoveBg}
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
                    onChange={handleBgChange}
                    ref={bgInputRef}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <span className="text-xs text-gray-400">ถ้าไม่อัปโหลด ระบบจะใช้สีขาวเป็นพื้นหลัง</span>
          </div>
        </div>

        {/* บันทึกราคา + จำนวนที่รับได้ */}
        <div className="rounded-xl border p-4 bg-gray-50">
          <label className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
            <input
              type="checkbox"
              checked={saveInventory}
              onChange={(e) => setSaveInventory(e.target.checked)}
              className="accent-indigo-600"
            />
            บันทึกราคาและจำนวนที่รับได้ (course_inventory)
          </label>

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${!saveInventory ? "opacity-50" : ""}`}>
            <div>
              <label className="block mb-1 text-gray-700 font-medium">ราคา (บาท)</label>
              <input
                name="price"
                value={fields.price}
                onChange={handleChange}
                type="number"
                min="0"
                step="0.01"
                placeholder="เช่น 1500"
                disabled={!saveInventory}
                className="w-full rounded-lg border px-4 py-2 bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-700 font-medium">จำนวนที่รับได้</label>
              <input
                name="seats"
                value={fields.seats}
                onChange={handleChange}
                type="number"
                min="0"
                step="1"
                placeholder="เช่น 100"
                disabled={!saveInventory}
                className="w-full rounded-lg border px-4 py-2 bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={fields.is_active}
                  onChange={handleChange}
                  disabled={!saveInventory}
                  className="accent-indigo-600"
                />
                <span className="font-medium text-gray-700">เปิดขายคอร์สนี้</span>
              </label>
            </div>
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold 
            bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 
            text-white shadow-md transition-all focus:ring-2 focus:ring-indigo-400
            ${submitting || !canSubmit ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <FiUpload size={18} />
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>

        {message && (
          <div
            className={`w-full rounded-md text-center px-4 py-2 text-base font-semibold
              ${error ? "bg-pink-100 text-pink-700 border border-pink-300" : "bg-green-100 text-green-700 border border-green-200"}`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
