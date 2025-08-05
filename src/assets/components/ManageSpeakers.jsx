import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus, FiCheck, FiX, FiUpload } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function ManageSpeakers() {
  const [courses, setCourses] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [form, setForm] = useState({
    name: "",
    imageFile: null, imageUrl: "",
    avatarFile: null, avatarUrl: ""
  });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const [preview, setPreview] = useState("");       // รูป profile
  const [avatarPreview, setAvatarPreview] = useState(""); // รูป avatar
  const [imgError, setImgError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const fileRef = useRef();
  const avatarFileRef = useRef();

  // โหลดคอร์ส
  useEffect(() => {
    axios.get(`${API_URL}/api/courses`)
      .then(res => setCourses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCourses([]));
  }, []);

  // โหลด speaker
  useEffect(() => {
    if (!selectedCourse) return setSpeakers([]);
    setLoading(true);
    axios.get(`${API_URL}/api/course_speakers/by_course/${selectedCourse}`)
      .then(res => setSpeakers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSpeakers([]))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  // อัปเดต preview รูป profile
  useEffect(() => {
    if (!form.imageFile) return setPreview(form.imageUrl || "");
    const url = URL.createObjectURL(form.imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.imageFile, form.imageUrl]);

  // อัปเดต preview รูป avatar
  useEffect(() => {
    if (!form.avatarFile) return setAvatarPreview(form.avatarUrl || "");
    const url = URL.createObjectURL(form.avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.avatarFile, form.avatarUrl]);

  // Handle form change (text)
  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Handle profile image file change
  const handleFile = e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setImgError("ขนาดไฟล์เกิน 2 MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"].includes(file.type)) {
        setImgError("เฉพาะไฟล์ jpg, png, jpeg, webp, gif เท่านั้น");
        return;
      }
      setForm(f => ({
        ...f,
        imageFile: file,
        imageUrl: ""
      }));
      setImgError("");
    }
  };

  // Handle avatar file change
  const handleAvatarFile = e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setAvatarError("ขนาดไฟล์เกิน 2 MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"].includes(file.type)) {
        setAvatarError("เฉพาะไฟล์ jpg, png, jpeg, webp, gif เท่านั้น");
        return;
      }
      setForm(f => ({
        ...f,
        avatarFile: file,
        avatarUrl: ""
      }));
      setAvatarError("");
    }
  };

  // drag & drop สำหรับ profile image
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile({ target: { files: [file] } });
  };
  // drag & drop สำหรับ avatar
  const handleAvatarDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleAvatarFile({ target: { files: [file] } });
  };

  // รีเซ็ต profile image
  const handleResetImage = () => {
    setForm(f => ({ ...f, imageFile: null, imageUrl: "" }));
    setPreview("");
    setImgError("");
  };
  // รีเซ็ต avatar
  const handleResetAvatar = () => {
    setForm(f => ({ ...f, avatarFile: null, avatarUrl: "" }));
    setAvatarPreview("");
    setAvatarError("");
  };

  // Add or Edit speaker
  const handleSubmit = async e => {
    e.preventDefault();
    setMsg(""); setErr(""); setImgError(""); setAvatarError("");
    if (!form.name || !selectedCourse || (!form.imageFile && !form.imageUrl) || (!form.avatarFile && !form.avatarUrl))
      return setErr("กรุณากรอกข้อมูลให้ครบถ้วน และเลือกรูปภาพ + Avatar");

    if (form.imageFile && form.imageFile.size > 2 * 1024 * 1024)
      return setImgError("ขนาดไฟล์เกิน 2 MB");
    if (form.avatarFile && form.avatarFile.size > 2 * 1024 * 1024)
      return setAvatarError("ขนาดไฟล์ Avatar เกิน 2 MB");

    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("course_id", selectedCourse);
      if (form.imageFile) data.append("image", form.imageFile);         // สำหรับ image_url
      if (form.avatarFile) data.append("avatar", form.avatarFile);       // สำหรับ avatar_url

      if (editId) {
        await axios.put(`${API_URL}/api/course_speakers/${editId}`, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setMsg("แก้ไขข้อมูลสำเร็จ!");
      } else {
        await axios.post(`${API_URL}/api/course_speakers`, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setMsg("เพิ่มผู้สอนสำเร็จ!");
      }
      setForm({ name: "", imageFile: null, imageUrl: "", avatarFile: null, avatarUrl: "" });
      setEditId(null);
      setPreview(""); setAvatarPreview("");
      // reload speakers
      const res = await axios.get(`${API_URL}/api/course_speakers/by_course/${selectedCourse}`);
      setSpeakers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr("เกิดข้อผิดพลาด: " + (e?.response?.data?.message || ""));
    }
  };

  // Edit
  const handleEdit = s => {
    setForm({
      name: s.name,
      imageFile: null, imageUrl: s.image_url || "",
      avatarFile: null, avatarUrl: s.avatar_url || ""
    });
    setEditId(s.id);
    setPreview(s.image_url || "");
    setAvatarPreview(s.avatar_url || "");
    setErr(""); setMsg(""); setImgError(""); setAvatarError("");
  };

  // Delete
  const handleDelete = async id => {
    setMsg(""); setErr("");
    try {
      await axios.delete(`${API_URL}/api/course_speakers/${id}`);
      setSpeakers(speakers.filter(s => s.id !== id));
      setMsg("ลบผู้สอนสำเร็จ!");
      setConfirmDel(null);
    } catch {
      setErr("ลบไม่สำเร็จ");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        <FiPlus className="text-blue-600" /> จัดการผู้สอน/ผู้บรรยาย (Speakers)
      </h2>

      <div className="mb-6">
        <label className="block mb-1 font-medium">เลือกคอร์ส</label>
        <select
          value={selectedCourse}
          onChange={e => {
            setSelectedCourse(e.target.value);
            setEditId(null);
            setForm({ name: "", imageFile: null, imageUrl: "", avatarFile: null, avatarUrl: "" });
            setPreview(""); setAvatarPreview("");
            setImgError(""); setAvatarError("");
          }}
          className="w-full px-3 py-2 border rounded-lg bg-white"
        >
          <option value="">-- เลือกคอร์ส --</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <form onSubmit={handleSubmit} className="bg-white shadow p-4 rounded-xl mb-6 border border-blue-100">
          <div className="flex flex-col gap-3">
            <div>
              <label className="font-medium">ชื่อผู้สอน</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg mt-1"
                placeholder="เช่น ผศ. นพ. สวัสดิ์ ใจดี"
              />
            </div>
            {/* อัปโหลดรูป profile ผู้สอน */}
            <div>
              <label className="font-medium mb-1 block">
                <span className="flex items-center gap-1">
                  <FiUpload /> รูปภาพผู้สอน <span className="text-pink-500">*</span>
                </span>
              </label>
              <div
                className={`
                  border-2 border-dashed rounded-xl flex flex-col items-center justify-center
                  w-[180px] h-[120px] relative group bg-gray-50 cursor-pointer transition
                  ${imgError ? "border-pink-400" : "border-gray-200 hover:border-blue-400"}
                `}
                tabIndex={0}
                onClick={() => fileRef.current && fileRef.current.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="preview" className="h-[90px] object-contain" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white/90 border border-gray-200 text-red-400 hover:text-white hover:bg-red-500 rounded-full shadow p-1 transition"
                      onClick={e => { e.stopPropagation(); handleResetImage(); }}
                      tabIndex={-1}
                      title="ลบรูป"
                    >
                      <FiX />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 h-full w-full">
                    <FiUpload size={32} />
                    <div
                      className="text-xs text-center max-w-[95px] leading-tight break-words whitespace-normal mt-1"
                      style={{ wordBreak: "break-word" }}
                    >
                      เลือกไฟล์รูป<br />ลากไฟล์มาวาง
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
                  ref={fileRef}
                  className="hidden"
                  onChange={handleFile}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                รองรับไฟล์ jpg, png, jpeg, webp, gif, ขนาดไม่เกิน 2 MB
              </div>
              {imgError && <div className="text-xs text-pink-600 mt-1">{imgError}</div>}
            </div>
            {/* อัปโหลด avatar */}
            <div>
              <label className="font-medium mb-1 block">
                <span className="flex items-center gap-1">
                  <FiUpload /> รูป Avatar ผู้สอน <span className="text-pink-500">*</span>
                </span>
              </label>
              <div
                className={`
                  border-2 border-dashed rounded-full flex flex-col items-center justify-center
                  w-[120px] h-[120px] relative group bg-gray-50 cursor-pointer transition
                  ${avatarError ? "border-pink-400" : "border-gray-200 hover:border-blue-400"}
                `}
                tabIndex={0}
                onClick={() => avatarFileRef.current && avatarFileRef.current.click()}
                onDrop={handleAvatarDrop}
                onDragOver={e => e.preventDefault()}
              >
                {avatarPreview ? (
                  <>
                    <img src={avatarPreview} alt="avatar" className="h-[90px] w-[90px] rounded-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white/90 border border-gray-200 text-red-400 hover:text-white hover:bg-red-500 rounded-full shadow p-1 transition"
                      onClick={e => { e.stopPropagation(); handleResetAvatar(); }}
                      tabIndex={-1}
                      title="ลบ Avatar"
                    >
                      <FiX />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 h-full w-full">
                    <FiUpload size={32} />
                    <div
                      className="text-xs text-center max-w-[95px] leading-tight break-words whitespace-normal mt-1"
                      style={{ wordBreak: "break-word" }}
                    >
                      เลือก Avatar<br />ลากไฟล์มาวาง
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
                  ref={avatarFileRef}
                  className="hidden"
                  onChange={handleAvatarFile}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                รองรับไฟล์ jpg, png, jpeg, webp, gif, ขนาดไม่เกิน 2 MB
              </div>
              {avatarError && <div className="text-xs text-pink-600 mt-1">{avatarError}</div>}
            </div>
          </div>
          {err && <div className="text-red-600 mt-3">{err}</div>}
          {msg && <div className="text-green-700 mt-3">{msg}</div>}
          <button
            className="mt-4 px-4 py-2 w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow hover:from-blue-600 hover:to-indigo-600 transition"
            type="submit"
          >
            <FiUpload className="text-lg" />
            {editId ? "บันทึกการแก้ไข" : "เพิ่มผู้สอน"}
          </button>
          {editId && (
            <button
              type="button"
              className="mt-2 px-4 py-2 w-full bg-gray-400 text-white rounded-xl hover:bg-gray-500 transition"
              onClick={() => { setEditId(null); setForm({ name: "", imageFile: null, imageUrl: "", avatarFile: null, avatarUrl: "" }); setPreview(""); setAvatarPreview(""); setImgError(""); setAvatarError(""); }}
            >
              ยกเลิก
            </button>
          )}
        </form>
      )}

      {loading ? (
        <div className="text-gray-600">กำลังโหลด...</div>
      ) : (
        <div>
          <h3 className="font-semibold mb-3">ผู้สอนในคอร์สนี้</h3>
          {speakers.length === 0 ? (
            <div className="text-gray-400">ยังไม่มีข้อมูล</div>
          ) : (
            <div className="space-y-3">
              {speakers.map(s => (
                <div key={s.id} className="flex items-center bg-gray-50 rounded-lg border px-3 py-2">
                  <img src={s.avatar_url || s.image_url} alt={s.name} className="h-10 w-10 rounded-full object-cover border mr-3" />
                  <div className="flex-1">
                    <div className="font-semibold">{s.name}</div>
                  </div>
                  <button className="text-blue-500 hover:text-blue-700 mx-2" onClick={() => handleEdit(s)} title="แก้ไข"><FiEdit /></button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => setConfirmDel(s.id)}
                    title="ลบ"
                  ><FiTrash2 /></button>
                  {/* Popup confirm delete */}
                  {confirmDel === s.id && (
                    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setConfirmDel(null)}>
                      <div className="bg-white p-6 rounded-xl shadow-xl min-w-[280px] relative" onClick={e => e.stopPropagation()}>
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500" onClick={() => setConfirmDel(null)}><FiX /></button>
                        <div className="mb-4 font-semibold text-lg">ยืนยันการลบ?</div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-700"
                          >ลบ</button>
                          <button
                            onClick={() => setConfirmDel(null)}
                            className="px-4 py-2 rounded-xl bg-gray-300 hover:bg-gray-400"
                          >ยกเลิก</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
