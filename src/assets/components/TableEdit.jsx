import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiX, FiUpload, FiEdit2, FiSave, FiTrash2 } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";
console.log('VITE_API_URL', API_URL);

function TableEdit() {
  const [rows, setRows] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [editFile, setEditFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // popup
  const [showImg, setShowImg] = useState(false);
  const [imgUrl, setImgUrl] = useState("");

  // โหลดข้อมูลคอร์ส
  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/courses`);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMessage("โหลดข้อมูลล้มเหลว");
    }
    setLoading(false);
  };

  // โหลดประเภทคอร์ส
  const loadTypes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/course_types`);
      setCourseTypes(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  useEffect(() => {
    loadCourses();
    loadTypes();
  }, []);

  // filter ค้นหา
  const filtered = rows.filter(
    c =>
      (!search ||
        String(c.id).includes(search) ||
        (c.title || "").toLowerCase().includes(search.toLowerCase()))
  );

  // เริ่มแก้ไข
  const handleEdit = (c) => {
    setEditingId(c.id);
    setEditFields({ ...c });
    setEditFile(null);
    setPreview("");
    setMessage("");
  };

  // ยกเลิกแก้ไข
  const handleCancel = () => {
    setEditingId(null);
    setEditFields({});
    setEditFile(null);
    setPreview("");
    setMessage("");
  };

  // ลบรูป (set ให้ cover_image เป็นค่าว่าง)
  const handleRemoveImage = () => {
    setEditFields(f => ({ ...f, cover_image: "" }));
    setEditFile(null);
    setPreview("");
  };

  // เปลี่ยนไฟล์
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setEditFile(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  };

  // เปลี่ยนประเภท
  const handleTypeChange = (e) => {
    setEditFields(f => ({ ...f, type_id: e.target.value }));
  };

  // บันทึกแก้ไข
  const handleSave = async () => {
    if (!editingId) {
      setMessage("ไม่พบข้อมูลคอร์สนี้ (บันทึกไม่ได้)");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const formData = new FormData();
      if (editFields.title !== undefined) formData.append("title", editFields.title);
      if (editFields.type_id !== undefined) formData.append("type_id", editFields.type_id);

      // ถ้ามีไฟล์ใหม่ ส่ง cover_image เป็นไฟล์
      if (editFile) formData.append("cover_image", editFile);
      // ถ้า remove รูป (cover_image เป็นค่าว่าง)
      if (!editFile && editFields.cover_image === "") {
        formData.append("cover_image", "");
      }

      await axios.put(`${API_URL}/api/courses/${editingId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMessage("บันทึกสำเร็จ!");
      await loadCourses();
      setEditingId(null);
      setEditFile(null);
      setPreview("");
    } catch (err) {
      setMessage("บันทึกไม่สำเร็จ: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  // ลบ course (ลบทั้ง courses และ courses_card)
  const handleDelete = async (id) => {
    if (!window.confirm("ต้องการลบคอร์สนี้จริงหรือไม่?")) return;
    setLoading(true);
    setMessage("");
    try {
      await axios.delete(`${API_URL}/api/courses/${id}`);
      setMessage("ลบข้อมูลสำเร็จ!");
      await loadCourses();
    } catch (err) {
      setMessage("ลบไม่สำเร็จ: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  // Preview image popup
  const openPreview = (img) => {
    setImgUrl(img.startsWith("http") ? img : API_URL + img);
    setShowImg(true);
  };
  const closePreview = () => setShowImg(false);

  return (
    <div className="max-w-6xl mx-auto py-10 px-3 relative">
      <h2 className="text-2xl font-bold mb-4">ตารางข้อมูลคอร์ส (Courses)</h2>
      <div className="flex gap-2 mb-6">
        <input
          className="border px-3 py-2 rounded w-full"
          placeholder="ค้นหา ID หรือชื่อคอร์ส"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-5 rounded flex items-center gap-1"
          onClick={loadCourses}>รีเฟรช</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border bg-white rounded shadow text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-2 border">ID</th>
              <th className="px-2 py-2 border">ชื่อคอร์ส</th>
              <th className="px-2 py-2 border">ประเภท</th>
              <th className="px-2 py-2 border">รายละเอียด</th>
              <th className="px-2 py-2 border">วันที่เริ่ม</th>
              <th className="px-2 py-2 border">วันที่จบ</th>
              <th className="px-2 py-2 border">จำนวน</th>
              <th className="px-2 py-2 border">รูปภาพ</th>
              <th className="px-2 py-2 border"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row =>
              editingId === row.id ? (
                <tr key={row.id} className="bg-yellow-50">
                  <td className="border px-2">{row.id}</td>
                  <td className="border px-2">
                    <input className="border rounded px-1 w-full"
                      value={editFields.title || ""}
                      onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
                    />
                  </td>
                  <td className="border px-2">
                    <select
                      className="border rounded px-1 w-full"
                      value={editFields.type_id || ""}
                      onChange={handleTypeChange}
                    >
                      <option value="">เลือกประเภท</option>
                      {courseTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-2">{/* รายละเอียด (ไม่ได้เก็บใน courses) */}</td>
                  <td className="border px-2"></td>
                  <td className="border px-2"></td>
                  <td className="border px-2"></td>
                  <td className="border px-2 relative" style={{ minWidth: 120 }}>
                    {(preview || editFields.cover_image) ? (
                      <div className="relative w-[70px] h-[56px] mx-auto group">
                        <img
                          src={
                            preview
                              ? preview
                              : editFields.cover_image?.startsWith("http")
                                ? editFields.cover_image
                                : API_URL + editFields.cover_image
                          }
                          alt=""
                          className="w-full h-full object-contain border rounded shadow cursor-pointer"
                          onClick={() => openPreview(preview || editFields.cover_image)}
                          title="Click to preview"
                        />
                        <button
                          className="absolute top-1 right-1 bg-white/80 rounded-full p-1 shadow"
                          title="Remove image"
                          onClick={handleRemoveImage}
                          type="button"
                        >
                          <FiX size={16} className="text-red-500" />
                        </button>
                      </div>
                    ) : null}
                    <label className="block text-xs mt-1 cursor-pointer flex items-center gap-1 text-blue-600 hover:underline">
                      <FiUpload />
                      <span>เลือกรูปใหม่</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                    </label>
                  </td>
                  <td className="border px-2">
                    <div className="flex flex-row gap-2 justify-center items-center">
                      <button className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"
                        onClick={handleSave} disabled={loading}><FiSave />Save</button>
                      <button className="bg-gray-300 px-3 py-1 rounded flex items-center gap-1"
                        onClick={handleCancel}>Cancel</button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
                        onClick={() => handleDelete(row.id)} disabled={loading}><FiTrash2 />Delete</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={row.id}>
                  <td className="border px-2">{row.id}</td>
                  <td className="border px-2">{row.title}</td>
                  <td className="border px-2">{row.type_name || row.type_id}</td>
                  <td className="border px-2"></td>
                  <td className="border px-2"></td>
                  <td className="border px-2"></td>
                  <td className="border px-2"></td>
                  <td className="border px-2 relative" style={{ minWidth: 120 }}>
                    {row.cover_image && (
                      <div className="relative w-[70px] h-[56px] mx-auto group">
                        <img
                          src={
                            row.cover_image.startsWith("http")
                              ? row.cover_image
                              : API_URL + row.cover_image
                          }
                          alt=""
                          className="w-full h-full object-contain border rounded shadow cursor-pointer"
                          onClick={() => openPreview(row.cover_image)}
                          title="Click to preview"
                        />
                      </div>
                    )}
                  </td>
                  <td className="border px-2">
                    <div className="flex flex-row gap-2 justify-center items-center">
                      <button className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1"
                        onClick={() => handleEdit(row)}><FiEdit2 />Edit</button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
                        onClick={() => handleDelete(row.id)}><FiTrash2 />Delete</button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      {message && <div className="mt-5 text-red-500">{message}</div>}

      {/* Popup preview image */}
      {showImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            className="bg-white shadow-xl rounded-lg relative p-2"
            style={{ minWidth: 320, minHeight: 220, maxWidth: "90vw", maxHeight: "90vh" }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 rounded-full p-2"
              onClick={closePreview}
            >
              <FiX size={24} />
            </button>
            <img
              src={imgUrl}
              alt="Preview"
              className="max-w-full max-h-[70vh] object-contain rounded mx-auto mt-5"
              style={{ display: "block" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TableEdit;
