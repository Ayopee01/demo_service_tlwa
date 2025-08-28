import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiX, FiImage, FiRefreshCw } from "react-icons/fi";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

// ====== ENV (ใช้ env เป็นหลัก) ======
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const ax = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
const TZ = "Asia/Bangkok";

// ====== helper เวลา ======
const toInputLocal = (v) => {
  if (!v) return "";
  const s = typeof v === "string" && v.includes(" ") && !v.includes("T") ? v : v;
  return dayjs.tz(s, TZ).format("YYYY-MM-DDTHH:mm");
};
const toThaiMySQL = (v) => (v ? dayjs(v).tz(TZ, true).format("YYYY-MM-DD HH:mm:ss") : null);

// ====== component หลัก ======
export default function CourseManager() {
  // ตาราง
  const [courses, setCourses] = useState([]);
  const [types, setTypes] = useState([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [tableMsg, setTableMsg] = useState("");

  // ฟอร์ม (เพิ่ม/แก้ไข)
  const [editingId, setEditingId] = useState(null);  // null = โหมดเพิ่ม
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [formErr, setFormErr] = useState(false);

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

  // รูปจากเซิร์ฟเวอร์ (เก่า)
  const [serverCoverUrl, setServerCoverUrl] = useState("");
  const [serverBgUrl, setServerBgUrl] = useState("");

  // ธงลบรูปเดิม
  const [clearCover, setClearCover] = useState(false);
  const [clearBg, setClearBg] = useState(false);

  // ไฟล์ใหม่ + preview ชั่วคราว
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewLocal, setCoverPreviewLocal] = useState(""); // object URL ของไฟล์ใหม่
  const coverInputRef = useRef();

  const [bgFile, setBgFile] = useState(null);
  const [bgPreviewLocal, setBgPreviewLocal] = useState("");
  const bgInputRef = useRef();

  // ====== โหลดตาราง + types ======
  const loadAll = async () => {
    setLoadingTable(true);
    setTableMsg("");
    try {
      const [t, c] = await Promise.all([
        ax.get("/api/course_types"),
        ax.get("/api/courses"),
      ]);
      setTypes(Array.isArray(t.data) ? t.data : []);
      setCourses(Array.isArray(c.data) ? c.data : []);
    } catch (e) {
      setTableMsg("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoadingTable(false);
    }
  };
  useEffect(() => { loadAll(); }, []);

  // ====== เปิดฟอร์มแก้ไข ======
  const onEdit = async (courseId) => {
    try {
      setFormMsg(""); setFormErr(false);
      setEditingId(courseId);

      // โหลดคอร์สตัวเดียว
      const { data: course } = await ax.get(`/api/courses/${courseId}`);
      // โหลด inventory
      let inv = {};
      try {
        const { data } = await ax.get(`/api/courses/${courseId}/inventory`);
        inv = data || {};
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

      // เซ็ต URL รูปเดิมจากเซิร์ฟเวอร์
      setServerCoverUrl(course.cover_image || "");
      setServerBgUrl(course.bg_image || "");
      // ล้างไฟล์ใหม่ + ธงลบ
      setCoverFile(null); setCoverPreviewLocal(""); setClearCover(false);
      setBgFile(null); setBgPreviewLocal(""); setClearBg(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
      if (bgInputRef.current) bgInputRef.current.value = "";
    } catch {
      setFormErr(true);
      setFormMsg("ไม่พบ/โหลดคอร์สไม่สำเร็จ");
    }
  };

  // ====== เปิดฟอร์มเพิ่มใหม่ ======
  const onCreateNew = () => {
    setEditingId(null);
    setFormMsg(""); setFormErr(false);
    setFields({
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
    // reset รูปทั้งหมด
    setServerCoverUrl(""); setServerBgUrl("");
    setClearCover(false); setClearBg(false);
    setCoverFile(null); setCoverPreviewLocal("");
    setBgFile(null); setBgPreviewLocal("");
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (bgInputRef.current) bgInputRef.current.value = "";
  };

  // ====== ลบคอร์ส ======
  const onDelete = async (id, title) => {
    const ok = window.confirm(`ยืนยันลบคอร์ส\n\n#${id} - ${title}\n\nลบแล้วกู้คืนไม่ได้`);
    if (!ok) return;
    try {
      await ax.delete(`/api/courses/${id}`);
      await loadAll();
      if (editingId === id) onCreateNew();
      alert("ลบคอร์สสำเร็จ");
    } catch (e) {
      alert(e?.response?.data?.error || "ลบไม่สำเร็จ");
    }
  };

  // ====== ฟอร์ม ======
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFields((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  // เลือกรูปใหม่
  const onCoverChange = (e) => {
    const file = e.target.files?.[0] || null;
    setCoverFile(file);
    setCoverPreviewLocal(file ? URL.createObjectURL(file) : "");
    // ถ้าเลือกไฟล์ใหม่ถือว่าไม่ลบรูปเดิมแล้ว (จะแทนที่)
    if (file) setClearCover(false);
  };
  const onBgChange = (e) => {
    const file = e.target.files?.[0] || null;
    setBgFile(file);
    setBgPreviewLocal(file ? URL.createObjectURL(file) : "");
    if (file) setClearBg(false);
  };

  // ปุ่ม X:
  // - ถ้ามีไฟล์ใหม่ -> ยกเลิกไฟล์ใหม่
  // - ถ้าไม่มีไฟล์ใหม่และมีรูปเดิม -> ติดธงลบรูปเดิม
  const removeCover = () => {
    if (coverFile) {
      setCoverFile(null);
      setCoverPreviewLocal("");
      if (coverInputRef.current) coverInputRef.current.value = "";
    } else if (serverCoverUrl && !clearCover) {
      setClearCover(true); // จะส่ง "" ตอนบันทึก
    }
  };
  const removeBg = () => {
    if (bgFile) {
      setBgFile(null);
      setBgPreviewLocal("");
      if (bgInputRef.current) bgInputRef.current.value = "";
    } else if (serverBgUrl && !clearBg) {
      setClearBg(true);
    }
  };

  const detailWordCount = useMemo(() => {
    const s = (fields.detail || "").trim();
    return s ? s.split(/\s+/).filter(Boolean).length : 0;
  }, [fields.detail]);

  const canSave = useMemo(() => {
    if (!fields.title.trim()) return false;
    if (!fields.type_id) return false;
    if (!fields.registration_start || !fields.registration_end) return false;
    if (fields.price !== "" && (isNaN(+fields.price) || +fields.price < 0)) return false;
    if (fields.seats !== "" && (isNaN(+fields.seats) || +fields.seats < 0)) return false;
    return true;
  }, [fields]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSave || saving) return;

    setSaving(true);
    setFormErr(false);
    setFormMsg("");

    try {
      // ====== 1) สร้างหรืออัปเดต courses
      const fd = new FormData();
      fd.append("title", fields.title.trim());
      fd.append("type_id", fields.type_id);
      fd.append("location", fields.location.trim());
      fd.append("detail", fields.detail || "");
      fd.append("registration_start", toThaiMySQL(fields.registration_start));
      fd.append("registration_end", toThaiMySQL(fields.registration_end));
      fd.append("event_start_at", toThaiMySQL(fields.event_start_at) || "");
      fd.append("event_end_at", toThaiMySQL(fields.event_end_at) || "");

      // ส่งไฟล์ใหม่ถ้ามี
      if (coverFile) fd.append("cover_image", coverFile);
      if (bgFile) fd.append("bg_image", bgFile);

      // ถ้าอยู่โหมดแก้ไข และกดลบรูปเดิม แต่ไม่ได้อัปโหลดใหม่ -> ส่งค่าว่างเพื่อสั่งลบ
      if (editingId && clearCover && !coverFile) fd.append("cover_image", "");
      if (editingId && clearBg && !bgFile) fd.append("bg_image", "");

      let courseId = editingId;
      if (editingId) {
        await ax.put(`/api/courses/${editingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const { data } = await ax.post(`/api/courses`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        courseId = data?.course_id;
      }

      // ====== 2) อัปเดต/บันทึก inventory
      if (courseId) {
        await ax.put(`/api/courses/${courseId}/inventory`, {
          price: fields.price === "" ? null : Number(fields.price),
          stock: fields.seats === "" ? null : Number(fields.seats),
          is_active: fields.is_active ? 1 : 0,
        });
      }

      setFormMsg(editingId ? "บันทึกการแก้ไขสำเร็จ" : "สร้างคอร์สสำเร็จ");
      await loadAll();
      if (!editingId && courseId) onEdit(courseId);
      // รีเซ็ตธงลบหลังบันทึก
      setClearCover(false); setClearBg(false);
      setCoverFile(null); setCoverPreviewLocal("");
      setBgFile(null); setBgPreviewLocal("");
      if (coverInputRef.current) coverInputRef.current.value = "";
      if (bgInputRef.current) bgInputRef.current.value = "";
    } catch (error) {
      setFormErr(true);
      setFormMsg(error?.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // preview สุดท้ายที่จะโชว์
  const coverPreview = coverFile
    ? coverPreviewLocal
    : clearCover
      ? ""
      : serverCoverUrl;

  const bgPreview = bgFile
    ? bgPreviewLocal
    : clearBg
      ? ""
      : serverBgUrl;

  // ====== UI ======
  return (
    <div className="min-h-[90vh] px-4 py-6 md:py-8 bg-gradient-to-br from-indigo-50 to-white">
      <div className="mx-auto max-w-7xl grid gap-6 md:grid-cols-[1fr_480px]">
        {/* ==== ซ้าย: ตาราง ==== */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">คอร์สทั้งหมด</h2>
            <div className="flex gap-2">
              <button
                onClick={loadAll}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                title="รีเฟรช"
              >
                <FiRefreshCw />
                Refresh
              </button>
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                <FiPlus /> เพิ่มคอร์สใหม่
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">ชื่อคอร์ส</th>
                  <th className="px-3 py-2 text-left">ประเภท</th>
                  <th className="px-3 py-2 text-left">รับสมัคร</th>
                  <th className="px-3 py-2 text-right">ราคา</th>
                  <th className="px-3 py-2 text-right">จำนวน</th>
                  <th className="px-3 py-2 text-center">ขาย</th>
                  <th className="px-3 py-2 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loadingTable ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                      กำลังโหลด…
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-gray-400">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  courses.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-2">{c.id}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{c.title}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{c.location || "-"}</div>
                      </td>
                      <td className="px-3 py-2">{c.type_name || "-"}</td>
                      <td className="px-3 py-2 text-xs">
                        <div>{c.registration_start || "-"}</div>
                        <div>→ {c.registration_end || "-"}</div>
                      </td>
                      <td className="px-3 py-2 text-right">{c.price ?? "-"}</td>
                      <td className="px-3 py-2 text-right">{c.stock ?? "-"}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {c.is_active ? "เปิด" : "ปิด"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onEdit(c.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs hover:bg-gray-50"
                            title="แก้ไข"
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            onClick={() => onDelete(c.id, c.title)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs text-pink-700 border-pink-300 hover:bg-pink-50"
                            title="ลบ"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {tableMsg && (
            <div className="mt-3 text-center text-pink-600 text-sm">{tableMsg}</div>
          )}
        </div>

        {/* ==== ขวา: ฟอร์ม (เพิ่ม/แก้ไข) ==== */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold mb-1">
            {editingId ? `แก้ไขคอร์ส #${editingId}` : "เพิ่มคอร์สใหม่"}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            ปรับปรุงข้อมูลคอร์สและอัปโหลดรูป (หากต้องการ)
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* ชื่อคอร์ส */}
            <div>
              <label className="block mb-1 font-semibold">ชื่อคอร์ส <span className="text-pink-600">*</span></label>
              <input
                name="title"
                value={fields.title}
                onChange={onChange}
                className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
                placeholder="เช่น LIFESTYLE MEDICINE IN PRACTICE"
                required
              />
            </div>

            {/* ประเภท */}
            <div>
              <label className="block mb-1 font-semibold">ประเภทคอร์ส <span className="text-pink-600">*</span></label>
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

            {/* สถานที่ */}
            <div>
              <label className="block mb-1 font_NONNULL">สถานที่จัดงาน</label>
              <input
                name="location"
                value={fields.location}
                onChange={onChange}
                className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 border-gray-200"
                placeholder="เช่น ศูนย์ประชุมฯ"
              />
            </div>

            {/* รับสมัคร */}
            <div>
              <label className="block mb-1 font-semibold">ช่วงรับสมัคร <span className="text-pink-600">*</span></label>
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

            {/* เวลาเริ่ม–จบงาน */}
            <div>
              <label className="block mb-1 font-semibold">เวลาเริ่ม–จบกิจกรรม (ถ้ามี)</label>
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

            {/* รายละเอียด */}
            <div>
              <label className="block mb-1 font-semibold">
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
              <label className="block mb-1 font-semibold">รูปภาพปกคอร์ส</label>
              <div className="w-full flex items-center gap-4">
                <div className="relative w-44 h-28 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 shadow-inner">
                  {coverPreview ? (
                    <div className="relative w-full h-full">
                      <img src={coverPreview} alt="cover" className="object-cover w-full h-full rounded-lg" />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-white border border-gray-300 hover:bg-pink-600 hover:text-white transition-colors rounded-full p-1 shadow-md z-10"
                        onClick={removeCover}
                        title={coverFile ? "ยกเลิกไฟล์ใหม่" : "ลบรูปเดิม"}
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
              <label className="block mb-1 font-semibold">
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
                        title={bgFile ? "ยกเลิกไฟล์ใหม่" : "ลบรูปเดิม"}
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

            {/* ราคา/จำนวน/เปิดขาย */}
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
              {saving ? "กำลังบันทึก..." : (editingId ? "บันทึกการแก้ไข" : "สร้างคอร์ส")}
            </button>

            {formMsg && (
              <div
                className={`w-full rounded-md text-center px-4 py-2 text-base font-semibold
                ${formErr ? "bg-pink-100 text-pink-700 border border-pink-300" : "bg-green-100 text-green-700 border border-green-200"}`}
              >
                {formMsg}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
