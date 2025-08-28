// src/pages/admin/EditCourse.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { FiX, FiUpload, FiImage } from "react-icons/fi";

// Dayjs + Timezone
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
const TZ = "Asia/Bangkok";

const API_URL = import.meta.env.VITE_API_URL || "";

/** แปลงสตริงวันเวลา (MySQL/ISO) -> ค่าที่เหมาะกับ <input type="datetime-local"> = YYYY-MM-DDTHH:mm
 *  - ตรึงเป็นเวลาไทย ไม่ shift
 */
const toInputLocal = (v) => {
  if (!v) return "";
  const s =
    typeof v === "string" && v.includes(" ") && !v.includes("T")
      ? v // 'YYYY-MM-DD HH:mm:ss'
      : v; // ISO ก็ได้
  return dayjs.tz(s, TZ).format("YYYY-MM-DDTHH:mm");
};

/** จากค่า input (YYYY-MM-DDTHH:mm) -> MySQL DATETIME (YYYY-MM-DD HH:mm:ss) ตรึงเวลาไทย ไม่ shift */
const toThaiMySQL = (v) =>
  v ? dayjs(v).tz(TZ, true).format("YYYY-MM-DD HH:mm:ss") : null;

/** แปลง path รูปไฟล์ที่ขึ้นต้นด้วย /uploads ให้เป็น URL เต็ม */
const absUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/uploads")) return `${API_URL}${path}`;
  return path;
};

export default function EditCourse({ courseId }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fields, setFields] = useState({
    title: "",
    type_id: "",
    location: "",
    detail: "",
    registration_start: "",
    registration_end: "",
    event_start_at: "",
    event_end_at: "",
    price: "",
    seats: "",
    is_active: true,
  });

  // ไฟล์รูป
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const coverInputRef = useRef();

  const [bgFile, setBgFile] = useState(null);
  const [bgPreview, setBgPreview] = useState("");
  const bgInputRef = useRef();

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);

  // นับจำนวนคำของ detail (แค่บอกผู้ใช้ ไม่บังคับ)
  const detailWordCount = useMemo(() => {
    const s = (fields.detail || "").trim();
    if (!s) return 0;
    return s.split(/\s+/).filter(Boolean).length;
  }, [fields.detail]);

  // โหลดประเภทคอร์ส + ข้อมูลคอร์ส
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // types
        const t = await axios.get(`${API_URL}/api/course_types`);
        if (!alive) return;
        setTypes(Array.isArray(t.data) ? t.data : []);

        // course
        const c = await axios.get(`${API_URL}/api/courses/${courseId}`);
        const course = c.data || {};
        if (!alive) return;

        // inventory (ราคา/จำนวน/สถานะขาย)
        let inv = {};
        try {
          const i = await axios.get(`${API_URL}/api/courses/${courseId}/inventory`);
          inv = i.data || {};
        } catch {
          inv = {};
        }

        setFields({
          title: course.title || "",
          type_id: course.type_id || "",
          location: course.location || "",
          detail: course.detail || "",
          registration_start: toInputLocal(course.registration_start),
          registration_end: toInputLocal(course.registration_end),
          event_start_at: toInputLocal(course.event_start_at),
          event_end_at: toInputLocal(course.event_end_at),
          price: inv.price ?? "",
          seats: inv.stock ?? "",
          is_active: inv.is_active ? true : false,
        });

        setCoverPreview(absUrl(course.cover_image));
        setBgPreview(absUrl(course.bg_image));
        setErr(false);
        setMsg("");
      } catch (e) {
        setErr(true);
        setMsg("ไม่สามารถโหลดข้อมูลคอร์สได้");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, [courseId]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFields((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onCoverChange = (e) => {
    const file = e.target.files?.[0];
    setCoverFile(file || null);
    setCoverPreview(file ? URL.createObjectURL(file) : coverPreview);
  };
  const removeCover = () => {
    setCoverFile(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const onBgChange = (e) => {
    const file = e.target.files?.[0];
    setBgFile(file || null);
    setBgPreview(file ? URL.createObjectURL(file) : bgPreview);
  };
  const removeBg = () => {
    setBgFile(null);
    if (bgInputRef.current) bgInputRef.current.value = "";
  };

  const canSave = useMemo(() => {
    if (!fields.title.trim()) return false;
    if (!fields.type_id) return false;
    if (!fields.registration_start || !fields.registration_end) return false;
    // ราคา/จำนวน ไม่ต้องบังคับ แต่ถ้าจะกรอกต้องเป็นตัวเลขถูกต้อง
    if (fields.price !== "" && (isNaN(+fields.price) || +fields.price < 0)) return false;
    if (fields.seats !== "" && (isNaN(+fields.seats) || +fields.seats < 0)) return false;
    return true;
  }, [fields]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving || !canSave) return;

    setSaving(true);
    setErr(false);
    setMsg("");

    try {
      // อัปเดต courses
      const fd = new FormData();
      fd.append("title", fields.title.trim());
      fd.append("type_id", fields.type_id);
      fd.append("location", fields.location.trim());
      fd.append("detail", fields.detail || "");
      fd.append("registration_start", toThaiMySQL(fields.registration_start));
      fd.append("registration_end", toThaiMySQL(fields.registration_end));
      fd.append("event_start_at", toThaiMySQL(fields.event_start_at) || "");
      fd.append("event_end_at", toThaiMySQL(fields.event_end_at) || "");
      if (coverFile) fd.append("cover_image", coverFile);
      if (bgFile) fd.append("bg_image", bgFile);

      await axios.put(`${API_URL}/api/courses/${courseId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      // อัปเดต inventory ถ้ามีการกรอก
      await axios.put(
        `${API_URL}/api/courses/${courseId}/inventory`,
        {
          // ถ้าค่าว่าง จะถือว่าไม่แก้ก็ได้ แล้วแต่แบ็กเอนด์คุณรองรับ
          price: fields.price === "" ? null : Number(fields.price),
          stock: fields.seats === "" ? null : Number(fields.seats),
          is_active: fields.is_active ? 1 : 0,
        },
        { withCredentials: true }
      );

      setMsg("บันทึกข้อมูลเรียบร้อย");
      setErr(false);
    } catch (error) {
      setErr(true);
      setMsg(error?.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600">
        กำลังโหลดข้อมูล…
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white py-8">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-8 border border-gray-100 space-y-6"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">แก้ไขคอร์ส</h2>
          <p className="text-gray-500 text-sm">
            ปรับปรุงข้อมูลคอร์สและอัปโหลดรูป (หากต้องการเปลี่ยน)
          </p>
        </div>

        {/* ชื่อคอร์ส */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            ชื่อคอร์ส <span className="text-pink-600">*</span>
          </label>
          <input
            name="title"
            value={fields.title}
            onChange={onChange}
            className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            placeholder="เช่น LIFESTYLE MEDICINE IN PRACTICE"
            required
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
            onChange={onChange}
            className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            required
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
            onChange={onChange}
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
              onChange={onChange}
              className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
              required
            />
            <input
              type="datetime-local"
              name="registration_end"
              value={fields.registration_end}
              onChange={onChange}
              className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
              required
            />
          </div>
        </div>

        {/* เวลาเริ่ม–จบกิจกรรม (ถ้ามี) */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            เวลาเริ่ม–จบกิจกรรม (ถ้ามี)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="datetime-local"
              name="event_start_at"
              value={fields.event_start_at}
              onChange={onChange}
              className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            />
            <input
              type="datetime-local"
              name="event_end_at"
              value={fields.event_end_at}
              onChange={onChange}
              className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            />
          </div>
        </div>

        {/* รายละเอียด (ไม่บังคับ ≤100 คำ — ไม่บล็อคแค่แสดงตัวนับ) */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            รายละเอียด <span className="text-gray-400 text-xs">(ไม่บังคับ ≤ 100 คำ)</span>
          </label>
          <textarea
            name="detail"
            value={fields.detail}
            onChange={onChange}
            rows={5}
            className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
            placeholder="สรุปรายละเอียดคอร์สแบบสั้น ๆ"
          />
          <div className={`text-xs mt-1 ${detailWordCount > 100 ? "text-pink-600" : "text-gray-500"}`}>
            {detailWordCount}/100 คำ
          </div>
        </div>

        {/* รูปปก */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            รูปภาพปกคอร์ส
          </label>
          <div className="w-full flex items-center gap-4">
            <div className="relative w-44 h-28 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 shadow-inner">
              {coverPreview ? (
                <div className="relative w-full h-full">
                  <img src={coverPreview} alt="cover" className="object-cover w-full h-full rounded-lg" />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-white border border-gray-300 hover:bg-pink-600 hover:text-white transition-colors rounded-full p-1 shadow-md z-10"
                    onClick={removeCover}
                    title="ยกเลิกรูปใหม่ (คงรูปเดิม)"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <FiImage size={32} className="mb-1 text-gray-400" />
                  <span className="text-xs text-gray-400">อัปโหลดรูปใหม่ (ไม่บังคับ)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onCoverChange}
                    ref={coverInputRef}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <span className="text-xs text-gray-400">รองรับ jpg, png, jpeg, webp, gif (≤ 5 MB)</span>
          </div>
        </div>

        {/* รูปพื้นหลัง */}
        <div>
          <label className="block mb-1 font-semibold text-gray-700">
            รูปพื้นหลัง (สำหรับหน้ารายละเอียด) <span className="text-gray-400 text-xs">(ไม่บังคับ)</span>
          </label>
          <div className="w-full flex items-center gap-4">
            <div className="relative w-44 h-28 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 shadow-inner">
              {bgPreview ? (
                <div className="relative w-full h-full">
                  <img src={bgPreview} alt="bg" className="object-cover w-full h-full rounded-lg" />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-white border border-gray-300 hover:bg-pink-600 hover:text-white transition-colors rounded-full p-1 shadow-md z-10"
                    onClick={removeBg}
                    title="ยกเลิกรูปใหม่ (คงรูปเดิม)"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <FiImage size={32} className="mb-1 text-gray-400" />
                  <span className="text-xs text-gray-400">อัปโหลดรูปใหม่ (ไม่บังคับ)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onBgChange}
                    ref={bgInputRef}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <span className="text-xs text-gray-400">ถ้าไม่อัปโหลด ระบบจะใช้สีพื้นหลังปกติ</span>
          </div>
        </div>

        {/* ราคา/จำนวน/สถานะขาย */}
        <div className="rounded-xl border p-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 text-gray-700 font-medium">ราคา (บาท)</label>
              <input
                name="price"
                value={fields.price}
                onChange={onChange}
                type="number"
                min="0"
                step="0.01"
                placeholder="เช่น 1500"
                className="w-full rounded-lg border px-4 py-2 bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-700 font-medium">จำนวนที่รับได้</label>
              <input
                name="seats"
                value={fields.seats}
                onChange={onChange}
                type="number"
                min="0"
                step="1"
                placeholder="เช่น 100"
                className="w-full rounded-lg border px-4 py-2 bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={fields.is_active}
                  onChange={onChange}
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
          disabled={saving || !canSave}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold 
            bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 
            text-white shadow-md transition-all focus:ring-2 focus:ring-indigo-400
            ${saving || !canSave ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <FiUpload size={18} />
          {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
        </button>

        {msg && (
          <div
            className={`w-full rounded-md text-center px-4 py-2 text-base font-semibold
            ${err ? "bg-pink-100 text-pink-700 border border-pink-300" : "bg-green-100 text-green-700 border border-green-200"}`}
          >
            {msg}
          </div>
        )}
      </form>
    </div>
  );
}
