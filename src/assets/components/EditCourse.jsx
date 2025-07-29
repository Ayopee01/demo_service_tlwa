import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FiEdit, FiTrash, FiSave, FiX, FiUpload, FiZoomIn } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

function ImagePopup({ url, onClose }) {
  useEffect(() => {
    function onEsc(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center" onClick={onClose}>
      <div className="relative bg-white p-4 rounded-xl shadow-xl max-w-[90vw] max-h-[90vh] flex items-center"
           onClick={e => e.stopPropagation()}>
        <img src={url} alt="" className="max-w-[80vw] max-h-[70vh] object-contain rounded-lg" />
        <button onClick={onClose}
          className="absolute top-2 right-2 bg-white hover:bg-red-500 hover:text-white text-gray-700 rounded-full p-2 shadow"
          aria-label="close"><FiX size={26} /></button>
      </div>
    </div>
  );
}

export default function EditCourse() {
  const [rows, setRows] = useState([]);
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

  // Load data
  useEffect(() => { loadData(); }, []);
  async function loadData() {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/courses`);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }

  // Inline Edit handlers
  function handleEdit(row) {
    setEditId(row.id);
    setEditFields({
      ...row,
      title: row.title || "",
      type_id: row.type_id || "",
      cover_image: row.cover_image || "",
    });
    setEditFile(null);
    setEditPreview(row.cover_image || "");
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMsg(""); setErr(false);
  }
  function handleCancel() {
    setEditId(null);
    setEditFields({});
    setEditFile(null);
    setEditPreview("");
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMsg(""); setErr(false);
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
    if (!editFields.type_id) return setErrMsg("กรอกประเภทคอร์ส");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", editFields.title ?? "");
      formData.append("type_id", editFields.type_id ?? "");
      if (editFile) formData.append("cover_image", editFile);
      if (removeImage) formData.append("cover_image", "");
      await axios.put(`${API_URL}/api/courses/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg("บันทึกสำเร็จ");
      setEditId(null);
      setEditFields({});
      setEditFile(null);
      setRemoveImage(false);
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
      await axios.delete(`${API_URL}/api/courses/${id}`);
      setMsg("ลบสำเร็จ");
      setEditId(null);
      await loadData();
    } catch (e) {
      setErrMsg("ลบไม่สำเร็จ: " + (e.response?.data?.error || e.message));
    }
  }
  function setErrMsg(m) { setErr(true); setMsg(m); }

  // Search filter
  const filtered = rows.filter(
    c => !search ||
      (c.title + "" + c.id + "" + (c.type_id || ""))
        .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#f6faff] min-h-screen flex items-center justify-center py-10 px-2">
      {popupImg && (
        <ImagePopup url={popupImg} onClose={() => setPopupImg(null)} />
      )}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8">
        <h2 className="font-bold text-2xl mb-5 text-[#171e41] flex items-center gap-2">
          <span role="img" aria-label="icon">📝</span>
          ตารางข้อมูล <span className="text-blue-700 font-bold ml-1">คอร์สเรียน</span>
        </h2>

        {msg && (
          <div className={`mb-3 p-2 rounded-xl ${err ? "bg-red-50 text-red-500 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
            {msg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <input
            className="border border-gray-200 rounded-xl px-4 py-2 w-full sm:w-96 bg-[#f8fafb] text-base shadow-sm focus:ring-2 focus:ring-blue-200"
            placeholder="ค้นหา ID หรือชื่อคอร์ส"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold transition-colors shadow"
            onClick={loadData}
            disabled={loading}
          ><span className="text-lg">⟳</span> รีเฟรช</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-base border-separate border-spacing-0">
            <thead>
              <tr className="bg-blue-50 text-blue-700">
                <th className="px-2 py-3 text-center rounded-tl-xl w-[56px]">ID</th>
                <th className="px-4 py-3 text-left w-[320px]">ชื่อคอร์ส</th>
                <th className="px-4 py-3 text-left w-[150px]">ประเภท</th>
                <th className="px-4 py-3 text-center w-[120px]">รูปภาพ</th>
                <th className="px-3 py-3 text-center rounded-tr-xl w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} className={editId === row.id ? "bg-yellow-50" : ""} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  {/* ID */}
                  <td className="px-2 py-3 text-center font-semibold">{row.id}</td>
                  {/* ชื่อคอร์ส */}
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {editId === row.id ? (
                      <input
                        value={editFields.title ?? ""}
                        onChange={e => handleChange("title", e.target.value)}
                        className="border rounded-xl px-3 py-2 w-full text-base focus:ring-2 focus:ring-blue-300 bg-[#f8fafb]"
                      />
                    ) : row.title}
                  </td>
                  {/* ประเภท */}
                  <td className="px-4 py-3">
                    {editId === row.id ? (
                      <input
                        value={editFields.type_id ?? ""}
                        onChange={e => handleChange("type_id", e.target.value)}
                        className="border rounded-xl px-3 py-2 w-full text-base focus:ring-2 focus:ring-blue-300 bg-[#f8fafb]"
                        placeholder="ใส่ประเภท"
                      />
                    ) : row.type_id}
                  </td>
                  {/* รูปภาพ */}
                  <td className="px-4 py-3 text-center">
                    {editId === row.id ? (
                      <div className="flex flex-col items-center gap-2">
                        {editPreview && (
                          <div className="relative w-16 h-20 group">
                            <img
                              src={editPreview}
                              className="w-full h-full object-contain border rounded-xl shadow cursor-pointer"
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
                            <button
                              type="button"
                              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center opacity-0 group-hover:opacity-100 transition"
                              onClick={() => setPopupImg(editPreview)}
                              tabIndex={-1}
                            >
                              <FiZoomIn size={22} className="text-blue-700 bg-white/80 rounded-full p-1" />
                            </button>
                          </div>
                        )}
                        <label className="w-full">
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <span className="flex gap-1 justify-center items-center text-blue-600 cursor-pointer mt-1 text-xs font-medium hover:underline">
                            <FiUpload size={16} /> เลือกไฟล์ใหม่
                          </span>
                        </label>
                      </div>
                    ) : (
                      row.cover_image ? (
                        <div className="relative w-16 h-20 mx-auto group">
                          <img
                            src={row.cover_image}
                            alt=""
                            className="w-full h-full object-contain rounded-xl shadow border cursor-pointer"
                            onClick={() => setPopupImg(row.cover_image)}
                            onError={e => { e.target.src = "/no-image.png"; }}
                            title="ดูรูปขยาย"
                          />
                          <button
                            type="button"
                            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center opacity-0 group-hover:opacity-100 transition"
                            onClick={() => setPopupImg(row.cover_image)}
                            tabIndex={-1}
                          >
                            <FiZoomIn size={22} className="text-blue-700 bg-white/80 rounded-full p-1" />
                          </button>
                        </div>
                      ) : <span className="text-gray-300 text-xs">-</span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="px-3 py-3 text-center">
                    {editId === row.id ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-1 shadow font-bold"
                          onClick={() => handleSave(row.id)}
                          disabled={loading}
                        >
                          <FiSave /> Save
                        </button>
                        <button
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-1 shadow font-bold"
                          onClick={handleCancel}
                        >
                          <FiX /> Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-center">
                        <button
                          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-xl flex items-center gap-1 shadow font-bold"
                          onClick={() => handleEdit(row)}
                        >
                          <FiEdit /> แก้ไข
                        </button>
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex items-center gap-1 shadow font-bold"
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
  );
}
