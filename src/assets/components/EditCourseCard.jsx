import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiEdit, FiTrash, FiSave, FiX, FiImage } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

function formatDate(val) {
  if (!val) return "";
  return String(val).slice(0, 10);
}

export default function EditCourseCardTable() {
  const [cards, setCards] = useState([]);
  const [types, setTypes] = useState([]);
  const [editId, setEditId] = useState(null);           // กำลังแก้ id ไหน
  const [editFields, setEditFields] = useState({});
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);
  const fileInputRef = useRef();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // โหลดข้อมูล
  useEffect(() => {
    loadData();
  }, []);
  async function loadData() {
    setLoading(true);
    const [cardRes, typeRes] = await Promise.all([
      axios.get(`${API_URL}/api/courses_card`),
      axios.get(`${API_URL}/api/course_types`)
    ]);
    setCards(cardRes.data || []);
    setTypes(typeRes.data || []);
    setLoading(false);
  }

  // เข้าโหมดแก้ไข
  function handleEdit(card) {
    setEditId(card.id);
    setEditFields({
      ...card,
      start_date: formatDate(card.start_date),
      end_date: formatDate(card.end_date),
      registration_start: formatDate(card.registration_start),
      registration_end: formatDate(card.registration_end),
      price: card.price ?? ""
    });
    setEditFile(null);
    setEditPreview(card.card_image ? `${API_URL}${card.card_image}` : "");
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMsg("");
    setErr(false);
  }

  function handleCancel() {
    setEditId(null);
    setEditFields({});
    setEditFile(null);
    setEditPreview("");
    setRemoveImage(false);
    setMsg("");
    setErr(false);
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

  // กด Save
  async function handleSave(id) {
    setMsg(""); setErr(false);
    // validate
    if (!editFields.title?.trim()) return setErrMsg("กรอกชื่อ Card");
    if (!editFields.type_id) return setErrMsg("เลือกประเภทคอร์ส");
    if (!editFields.course_id) return setErrMsg("เลือก Course");
    if (editFields.price === "" || isNaN(editFields.price)) return setErrMsg("กรอกราคาเป็นตัวเลข");
    setLoading(true);
    try {
      const formData = new FormData();
      for (const [k, v] of Object.entries(editFields)) {
        if (k !== "card_image") formData.append(k, v ?? "");
      }
      if (editFile) formData.append("card_image", editFile);
      if (removeImage) formData.append("cover_image", ""); // แจ้ง backend ให้ลบภาพเดิม
      await axios.put(`${API_URL}/api/courses_card/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMsg("อัปเดตสำเร็จ");
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
      await axios.delete(`${API_URL}/api/courses_card/${id}`);
      setMsg("ลบสำเร็จ");
      setEditId(null);
      await loadData();
    } catch (e) {
      setErrMsg("ลบไม่สำเร็จ: " + (e.response?.data?.error || e.message));
    }
  }

  function setErrMsg(m) {
    setErr(true);
    setMsg(m);
  }

  // filter ค้นหา
  const filtered = cards.filter(
    c => !search ||
      (c.title + "" + c.course_title + "" + c.id + "" + c.type_name)
        .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-6 py-8 max-w-full">
      <h2 className="text-2xl font-bold mb-2">
        ตารางข้อมูล <span className="text-blue-600">Card</span> คอร์ส
      </h2>
      {msg && (
        <div className={`mb-3 p-2 rounded ${err ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
          {msg}
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <input
          className="border rounded px-3 py-2 w-80 text-sm"
          placeholder="ค้นหา ID หรือชื่อคอร์ส"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="px-4 py-2 rounded bg-blue-600 text-white font-semibold"
          onClick={loadData} disabled={loading}
        >รีเฟรช</button>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-[900px] w-full border text-sm">
          <thead>
            <tr className="bg-blue-50">
              <th className="border px-2 py-2">ID</th>
              <th className="border px-2 py-2">ชื่อ Card</th>
              <th className="border px-2 py-2">ประเภท</th>
              <th className="border px-2 py-2">รายละเอียด</th>
              <th className="border px-2 py-2">วันที่เริ่ม</th>
              <th className="border px-2 py-2">วันที่จบ</th>
              <th className="border px-2 py-2">จำนวน</th>
              <th className="border px-2 py-2">รูปภาพ</th>
              <th className="border px-2 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(card => (
              <tr key={card.id} className={editId === card.id ? "bg-yellow-50" : ""}>
                <td className="border px-2 py-2">{card.id}</td>
                {/* -- title -- */}
                <td className="border px-2 py-2 w-44">
                  {editId === card.id ? (
                    <input
                      value={editFields.title ?? ""}
                      onChange={e => handleChange("title", e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : card.title}
                </td>
                {/* -- type -- */}
                <td className="border px-2 py-2 w-28">
                  {editId === card.id ? (
                    <select
                      value={editFields.type_id ?? ""}
                      onChange={e => handleChange("type_id", e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    >
                      <option value="">เลือกประเภท</option>
                      {types.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  ) : (card.type_name || card.type_id)}
                </td>
                {/* -- detail -- */}
                <td className="border px-2 py-2 w-36">
                  {editId === card.id ? (
                    <input
                      value={editFields.detail ?? ""}
                      onChange={e => handleChange("detail", e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : card.detail}
                </td>
                {/* -- start_date -- */}
                <td className="border px-2 py-2 w-32">
                  {editId === card.id ? (
                    <input
                      type="date"
                      value={editFields.start_date ?? ""}
                      onChange={e => handleChange("start_date", e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : formatDate(card.start_date)}
                </td>
                {/* -- end_date -- */}
                <td className="border px-2 py-2 w-32">
                  {editId === card.id ? (
                    <input
                      type="date"
                      value={editFields.end_date ?? ""}
                      onChange={e => handleChange("end_date", e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : formatDate(card.end_date)}
                </td>
                {/* -- max_participants -- */}
                <td className="border px-2 py-2 w-16 text-center">
                  {editId === card.id ? (
                    <input
                      type="number"
                      value={editFields.max_participants ?? ""}
                      onChange={e => handleChange("max_participants", e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                      min={0}
                    />
                  ) : card.max_participants}
                </td>
                {/* -- image -- */}
                <td className="border px-2 py-2 w-32">
                  {editId === card.id ? (
                    <div className="flex flex-col items-center gap-2">
                      {editPreview && (
                        <div className="relative w-16 h-20">
                          <img
                            src={editPreview}
                            className="w-full h-full object-contain border rounded shadow"
                          />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 rounded-full p-1 shadow"
                            onClick={handleRemoveImageBtn}
                          ><FiX size={16} /></button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="w-full text-xs"
                        style={{ fontSize: 10 }}
                      />
                    </div>
                  ) : (
                    card.card_image ? (
                      <img
                        src={API_URL + card.card_image}
                        alt=""
                        className="w-16 h-20 object-contain rounded shadow border mx-auto"
                      />
                    ) : "-"
                  )}
                </td>
                {/* -- Action -- */}
                <td className="border px-2 py-2 w-40">
                  {editId === card.id ? (
                    <div className="flex gap-1">
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1"
                        onClick={() => handleSave(card.id)}
                        disabled={loading}
                      >
                        <FiSave /> Save
                      </button>
                      <button
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded flex items-center gap-1"
                        onClick={handleCancel}
                      >
                        <FiX /> Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded flex items-center gap-1"
                        onClick={() => handleEdit(card)}
                      >
                        <FiEdit /> Edit
                      </button>
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1"
                        onClick={() => handleDelete(card.id)}
                      >
                        <FiTrash /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={9} className="text-center text-gray-400 py-6">
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
