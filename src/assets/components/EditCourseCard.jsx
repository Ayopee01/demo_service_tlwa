//Pass
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiEdit, FiTrash, FiSave, FiX, FiZoomIn } from "react-icons/fi";
const API_URL = import.meta.env.VITE_API_URL || "";

function ImagePopup({ url, onClose }) {
  useEffect(() => {
    function handleKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl p-2 shadow-2xl flex flex-col items-center max-w-[96vw] max-h-[96vh]"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={url}
          alt=""
          className="max-w-[85vw] max-h-[70vh] object-contain rounded-lg shadow-lg"
          onError={e => { e.target.src = "/no-image.png"; }}
        />
        <button
          className="absolute top-2 right-2 bg-white hover:bg-red-500 hover:text-white text-gray-800 rounded-full p-2 shadow transition"
          onClick={onClose}
          aria-label="ปิด"
        >
          <FiX size={28} />
        </button>
      </div>
    </div>
  );
}

export default function EditCoursesTable() {
  const [rows, setRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupImg, setPopupImg] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cardRes, typeRes] = await Promise.all([
        axios.get(`${API_URL}/api/courses_card`),
        axios.get(`${API_URL}/api/course_types`)
      ]);
      setRows(Array.isArray(cardRes.data) ? cardRes.data : []);
      setTypes(Array.isArray(typeRes.data) ? typeRes.data : []);
    } catch {
      setRows([]); setTypes([]);
    }
    setLoading(false);
  }

  function handleEdit(row) {
    setEditId(row.id);
    setEditFields({
      ...row,
      title: row.title ?? "",
      type_id: row.type_id ?? "",
    });
    setEditFile(null);
    setEditPreview(row.card_image ? row.card_image : "");
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMsg(""); setErr(false);
  }

  function handleCancel() {
    setEditId(null); setEditFields({});
    setEditFile(null); setEditPreview(""); setRemoveImage(false);
    setMsg(""); setErr(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleChange(field, value) {
    setEditFields(f => ({ ...f, [field]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    setEditFile(file);
    setEditPreview(file ? URL.createObjectURL(file) : "");
    setRemoveImage(false);
  }

  function handleRemoveImageBtn() {
    setEditFile(null);
    setEditPreview("");
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave(id) {
    setMsg(""); setErr(false);
    if (!editFields.title?.trim()) return setErrMsg("กรอกชื่อคอร์ส");
    if (!editFields.type_id) return setErrMsg("เลือกประเภทคอร์ส");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", editFields.title ?? "");
      formData.append("type_id", editFields.type_id ?? "");
      if (editFile) formData.append("card_image", editFile);
      if (removeImage) formData.append("card_image", "");
      await axios.put(`${API_URL}/api/courses_card/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMsg("อัปเดตสำเร็จ");
      setEditId(null); setEditFields({}); setEditFile(null); setRemoveImage(false);
      await loadData();
    } catch (e) {
      setErrMsg("ผิดพลาด: " + (e.response?.data?.error || e.message));
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("ยืนยันลบข้อมูลนี้?")) return;
    setMsg(""); setErr(false);
    try {
      await axios.delete(`${API_URL}/api/courses_card/${id}`);
      setMsg("ลบสำเร็จ");
      setEditId(null);
      await loadData();
    } catch (e) {
      setErrMsg("ลบไม่สำเร็จ: " + (e.response?.data?.error || e.message));
    }
  }

  function setErrMsg(m) { setErr(true); setMsg(m); }

  // Responsive: ขยายตารางแบบ scroll ถ้าจอเล็ก
  const filtered = rows.filter(
    c => !search ||
      (c.title + "" + c.id + "" + (c.type_name || c.type_id))
        .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#f6faff] min-h-screen py-8 px-2 sm:px-0">
      {/* Popup Preview */}
      {popupImg && (
        <ImagePopup url={popupImg} onClose={() => setPopupImg(null)} />
      )}
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl shadow-xl bg-white p-6 sm:p-10">
          <h2 className="font-bold text-2xl text-[#171e41] mb-5 flex items-center gap-2">
            <span role="img" aria-label="icon">📝</span>
            <span>
              ตารางข้อมูล <span className="text-blue-600">Card</span> คอร์สเรียน
            </span>
          </h2>

          {msg && (
            <div className={`mb-3 p-2 rounded-xl text-center text-base font-medium 
              ${err ? "bg-red-50 text-red-500 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}>
              {msg}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5">
            <input
              className="border border-gray-200 rounded-xl px-4 py-3 w-full sm:w-[340px] text-base bg-[#f8fafb] focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="ค้นหา ID หรือชื่อคอร์ส"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold transition-colors shadow-sm flex items-center gap-1"
              onClick={loadData} disabled={loading}
            >
              <span className="text-lg">⟳</span> รีเฟรช
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-[600px] w-full text-base">
              <thead>
                <tr className="bg-[#f6faff] text-blue-700">
                  <th className="px-2 py-3 text-left w-[36px] rounded-tl-xl font-bold">ID</th>
                  <th className="px-3 py-3 text-left min-w-[170px] w-[260px] sm:w-[340px] font-bold">ชื่อคอร์ส</th>
                  <th className="px-3 py-3 text-left w-[100px] font-bold">ประเภท</th>
                  <th className="px-2 py-3 text-center w-[68px] font-bold">รูปภาพ</th>
                  <th className="px-2 py-3 text-center w-[100px] sm:w-[160px] rounded-tr-xl font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr
                    key={row.id}
                    className={`border-b last:border-0 ${editId === row.id ? "bg-blue-50" : "hover:bg-[#f8fafb]"}`}
                  >
                    {/* ID */}
                    <td className="px-2 py-3 text-center font-semibold text-sm">{row.id}</td>
                    {/* ชื่อคอร์ส */}
                    <td className="px-3 py-3 font-medium text-[#171e41] break-words">
                      {editId === row.id ? (
                        <input
                          value={editFields.title ?? ""}
                          onChange={e => handleChange("title", e.target.value)}
                          className="border border-gray-200 rounded-xl px-3 py-2 w-full text-base bg-[#f8fafb] focus:ring-2 focus:ring-blue-300"
                        />
                      ) : row.title}
                    </td>
                    {/* ประเภท */}
                    <td className="px-3 py-3">
                      {editId === row.id ? (
                        <select
                          value={editFields.type_id ?? ""}
                          onChange={e => handleChange("type_id", e.target.value)}
                          className="border border-gray-200 rounded-xl px-3 py-2 w-full text-base bg-[#f8fafb] focus:ring-2 focus:ring-blue-300"
                        >
                          <option value="">เลือกประเภท</option>
                          {types.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      ) : (row.type_name || row.type_id)}
                    </td>
                    {/* รูปภาพ */}
                    <td className="px-2 py-3 text-center">
                      {editId === row.id ? (
                        <div className="flex flex-col items-center gap-2">
                          {editPreview && (
                            <div className="relative w-12 h-16 group flex items-center justify-center">
                              <img
                                src={editPreview}
                                className="w-full h-full object-contain border rounded-lg shadow cursor-pointer bg-white"
                                alt=""
                                onClick={() => setPopupImg(editPreview)}
                                onError={e => { e.target.src = "/no-image.png"; }}
                                title="ดูรูปขยาย"
                              />
                              <button
                                type="button"
                                className="absolute -top-2 -right-2 bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 rounded-full p-1 shadow"
                                onClick={handleRemoveImageBtn}
                                title="ลบรูป"
                              ><FiX size={16} /></button>
                              {/* Icon ขยายตรงกลาง */}
                              <button
                                type="button"
                                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                onClick={() => setPopupImg(editPreview)}
                                tabIndex={-1}
                              >
                                <FiZoomIn size={26} className="text-blue-700 bg-white/80 rounded-full p-1" />
                              </button>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="w-full text-xs mt-1"
                            style={{ fontSize: 10 }}
                          />
                        </div>
                      ) : (
                        row.card_image ? (
                          <div className="relative w-12 h-16 mx-auto group flex items-center justify-center">
                            <img
                              src={row.card_image}
                              alt=""
                              className="w-full h-full object-contain rounded-lg shadow border bg-white cursor-pointer"
                              onClick={() => setPopupImg(row.card_image)}
                              onError={e => { e.target.src = "/no-image.png"; }}
                              title="ดูรูปขยาย"
                            />
                            {/* Icon ขยายตรงกลาง */}
                            <button
                              type="button"
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                              onClick={() => setPopupImg(row.card_image)}
                              tabIndex={-1}
                            >
                              <FiZoomIn size={26} className="text-blue-700 bg-white/80 rounded-full p-1" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-2 py-3 text-center">
                      {editId === row.id ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl flex items-center gap-1 shadow"
                            onClick={() => handleSave(row.id)}
                            disabled={loading}
                          >
                            <FiSave /> Save
                          </button>
                          <button
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-xl flex items-center gap-1 shadow"
                            onClick={handleCancel}
                          >
                            <FiX /> Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button
                            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-2 rounded-xl flex items-center gap-1 shadow font-bold"
                            onClick={() => handleEdit(row)}
                          >
                            <FiEdit /> แก้ไข
                          </button>
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl flex items-center gap-1 shadow font-bold"
                            onClick={() => handleDelete(row.id)}
                          >
                            <FiTrash /> ลบ
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-8">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
