import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FiUpload, FiX, FiEdit, FiTrash2 } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

const NEWS_TYPE_OPTIONS = [
  { label: "ข่าวสาร", value: "news" },
  { label: "บทความ", value: "article" },
  { label: "LM Week", value: "lmweek" },
];

const LANG_OPTIONS = [
  { label: "TH (ไทย)", value: "th" },
  { label: "EN (English)", value: "en" },
];

export default function AdminAddNews() {
  const [form, setForm] = useState({
    news_type: "",
    lang: "",
    title_th: "",
    title_en: "",
    cover_image_url: "",
  });
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [newsList, setNewsList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const inputFile = useRef();

  // โหลดข่าวทั้งหมด
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/news`);
      setNewsList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setNewsList([]);
    }
  };

  // เลือกรูป
  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setMsg("ไฟล์ที่เลือกไม่ใช่รูปภาพ");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMsg("ขนาดไฟล์เกิน 2MB");
      return;
    }
    setMsg(""); setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API_URL}/api/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm(f => ({ ...f, cover_image_url: res.data.url }));
      setMsg("อัปโหลดสำเร็จ");
    } catch {
      setMsg("อัปโหลดไฟล์ไม่สำเร็จ");
    }
    setUploading(false);
  };

  // handle input
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    // Reset ช่อง title ทุกครั้งที่เปลี่ยนภาษา
    if (name === "lang") {
      setForm(f => ({
        ...f,
        lang: value,
        title_th: "",
        title_en: "",
      }));
    }
  };

  // แก้ไขข่าว
  const handleEdit = news => {
    setEditingId(news.id);
    setForm({
      news_type: news.news_type || "",
      lang: news.lang || "",
      title_th: news.title_th || "",
      title_en: news.title_en || "",
      cover_image_url: news.cover_image_url || "",
    });
    setPreview(news.cover_image_url || "");
    setMsg("");
    if (inputFile.current) inputFile.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ลบข่าว
  const handleDelete = async id => {
    if (!window.confirm("ยืนยันลบรายการนี้?")) return;
    try {
      await axios.delete(`${API_URL}/api/news/${id}`);
      fetchNews();
      setMsg("ลบสำเร็จ");
      setTimeout(() => setMsg(""), 1200);
      if (editingId === id) {
        setEditingId(null);
        setForm({
          news_type: "",
          lang: "",
          title_th: "",
          title_en: "",
          cover_image_url: "",
        });
        setPreview("");
      }
    } catch {
      setMsg("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  // สร้าง/อัปเดต
  const handleSubmit = async e => {
    e.preventDefault();
    setMsg("");
    if (!form.news_type || !form.lang || !form.cover_image_url) {
      setMsg("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (form.lang === "th" && !form.title_th) {
      setMsg("กรุณากรอก Title ภาษาไทย");
      return;
    }
    if (form.lang === "en" && !form.title_en) {
      setMsg("กรุณากรอก Title ภาษาอังกฤษ");
      return;
    }
    const payload = {
      news_type: form.news_type,
      lang: form.lang,
      cover_image_url: form.cover_image_url,
      title_th: form.lang === "th" ? form.title_th : "",
      title_en: form.lang === "en" ? form.title_en : "",
    };
    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/news/${editingId}`, payload);
        setMsg("อัปเดตสำเร็จ!");
      } else {
        await axios.post(`${API_URL}/api/news`, payload);
        setMsg("บันทึกสำเร็จ!");
      }
      setForm({
        news_type: "",
        lang: "",
        title_th: "",
        title_en: "",
        cover_image_url: "",
      });
      setPreview("");
      setEditingId(null);
      if (inputFile.current) inputFile.current.value = "";
      fetchNews();
    } catch (err) {
      setMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  // ยกเลิกแก้ไข
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      news_type: "",
      lang: "",
      title_th: "",
      title_en: "",
      cover_image_url: "",
    });
    setPreview("");
    setMsg("");
    if (inputFile.current) inputFile.current.value = "";
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 mt-10 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">เพิ่มข่าว/บทความ (Admin)</h2>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ประเภทข่าว */}
        <div>
          <label className="font-medium block mb-1">
            ประเภท <span className="text-red-500">*</span>
          </label>
          <select
            name="news_type"
            className="w-full border px-3 py-2 rounded"
            value={form.news_type}
            onChange={handleChange}
            required
          >
            <option value="">-- เลือกประเภท --</option>
            {NEWS_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* เลือกภาษา */}
        <div>
          <label className="font-medium block mb-1">
            ภาษา <span className="text-red-500">*</span>
          </label>
          <select
            name="lang"
            className="w-full border px-3 py-2 rounded"
            value={form.lang}
            onChange={handleChange}
            required
          >
            <option value="">-- เลือกภาษา --</option>
            {LANG_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* หัวข้อ Title ตามภาษา */}
        {form.lang === "th" && (
          <div>
            <label className="font-medium block mb-1">
              Title TH <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title_th"
              className="w-full border px-3 py-2 rounded"
              value={form.title_th}
              onChange={handleChange}
              required={form.lang === "th"}
              disabled={form.lang !== "th"}
            />
          </div>
        )}
        {form.lang === "en" && (
          <div>
            <label className="font-medium block mb-1">
              Title EN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title_en"
              className="w-full border px-3 py-2 rounded"
              value={form.title_en}
              onChange={handleChange}
              required={form.lang === "en"}
              disabled={form.lang !== "en"}
            />
          </div>
        )}

        {/* รูปภาพ */}
        <div>
          <label className="font-medium block mb-1">
            รูปภาพหัวบทความ <span className="text-red-500">*</span>
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-5 relative group bg-gray-50"
            style={{ minHeight: 120 }}
            onClick={() => inputFile.current?.click()}
          >
            {preview || form.cover_image_url ? (
              <div className="relative">
                <img
                  src={preview || form.cover_image_url}
                  alt="preview"
                  className="max-h-40 rounded shadow border object-contain mx-auto"
                  style={{ background: "#fff" }}
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-red-500 hover:text-white rounded-full p-1.5 shadow"
                  onClick={e => {
                    e.stopPropagation();
                    setPreview("");
                    setForm(f => ({ ...f, cover_image_url: "" }));
                    if (inputFile.current) inputFile.current.value = "";
                  }}
                  title="ลบรูป"
                >
                  <FiX size={19} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center cursor-pointer">
                <FiUpload size={36} className="text-gray-400 group-hover:text-indigo-500 mb-1" />
                <span className="text-gray-500 text-sm">เลือกไฟล์รูป / ลากไฟล์มาวาง</span>
                <span className="text-xs mt-1 text-gray-400">
                  รองรับ jpg, png, jpeg, webp, gif, ขนาดไม่เกิน 2 MB
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={inputFile}
              onChange={handleImage}
              className="hidden"
              disabled={uploading}
            />
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-indigo-700 font-bold rounded-xl z-10">
                กำลังอัปโหลด...
              </span>
            )}
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 text-white font-semibold py-2 rounded hover:bg-indigo-700 mt-4 disabled:opacity-60"
            disabled={uploading}
          >
            {editingId ? "อัปเดตข่าว" : uploading ? "กำลังอัปโหลด..." : "บันทึกข่าว"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex-0 bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded hover:bg-gray-300 mt-4"
            >
              ยกเลิก
            </button>
          )}
        </div>
        {msg && (
          <div className="text-center mt-2 text-sm text-green-600">{msg}</div>
        )}
      </form>

      {/* ตารางข่าวทั้งหมด */}
      <div className="mt-12">
        <h3 className="text-lg font-bold mb-2">รายการข่าว / บทความ</h3>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-2">ID</th>
                <th className="py-2 px-2">ประเภท</th>
                <th className="py-2 px-2">ภาษา</th>
                <th className="py-2 px-2">หัวข้อ</th>
                <th className="py-2 px-2">รูปภาพ</th>
                <th className="py-2 px-2">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {newsList.map(news => (
                <tr key={news.id} className={editingId === news.id ? "bg-blue-50" : "border-t"}>
                  <td className="px-2 py-1 font-mono">{news.id}</td>
                  <td className="px-2 py-1">{news.news_type}</td>
                  <td className="px-2 py-1">{news.lang}</td>
                  <td className="px-2 py-1">
                    {news.lang === "th" ? news.title_th : news.title_en}
                  </td>
                  <td className="px-2 py-1">
                    {news.cover_image_url && (
                      <img src={news.cover_image_url} alt="" className="h-10 rounded border" />
                    )}
                  </td>
                  <td className="px-2 py-1">
                    <button
                      className="mr-2 text-blue-500 hover:text-blue-700"
                      onClick={() => handleEdit(news)}
                      title="แก้ไข"
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(news.id)}
                      title="ลบ"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {!newsList.length && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    ไม่มีข้อมูลข่าว / บทความ
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
