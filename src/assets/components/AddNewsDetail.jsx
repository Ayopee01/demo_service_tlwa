import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiUpload, FiX, FiPlus, FiEdit, FiTrash2, FiImage } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

export default function AddNewsDetail() {
  // ------- STATE หลัก --------
  const [newsList, setNewsList] = useState([]);
  const [form, setForm] = useState({
    news_id: "",
    caption: "",
  });

  // สำหรับ gallery (หลายรูป)
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [imgError, setImgError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // ข้อมูล Gallery จากฐานข้อมูล (ของข่าว detail ที่เลือก)
  const [dbGallery, setDbGallery] = useState([]);
  const [showGalleryManage, setShowGalleryManage] = useState(false);

  // --------- Section Author ---------
  const [authorForm, setAuthorForm] = useState({ name: "", imageFile: null, imageUrl: "" });
  const [authorPreview, setAuthorPreview] = useState("");
  const [authorList, setAuthorList] = useState([]);
  const [editAuthorIndex, setEditAuthorIndex] = useState(null);
  const [showAuthorForm, setShowAuthorForm] = useState(false);

  // ====== DATA FROM SQL (TABLE) ======
  const [newsDetailList, setNewsDetailList] = useState([]);
  const [editDetailId, setEditDetailId] = useState(null);

  // Refs
  const galleryInputRef = useRef();
  const authorFileRef = useRef();

  // ------- โหลดรายการข่าวสำหรับ dropdown -------
  useEffect(() => {
    axios.get(`${API_URL}/api/news`).then(res => setNewsList(Array.isArray(res.data) ? res.data : []));
    fetchNewsDetailList();
  }, []);

  // ------- ดึงรายการข่าว detail ทั้งหมด ------
  const fetchNewsDetailList = async () => {
    const res = await axios.get(`${API_URL}/api/news_detail`);
    setNewsDetailList(Array.isArray(res.data) ? res.data : []);
  };

  // ------- Preview Gallery -------
  useEffect(() => {
    if (!galleryFiles.length) return setGalleryPreviews([]);
    const urls = galleryFiles.map(file => URL.createObjectURL(file));
    setGalleryPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [galleryFiles]);

  // ------- Preview Author Image -------
  useEffect(() => {
    if (!authorForm.imageFile) return setAuthorPreview("");
    const url = URL.createObjectURL(authorForm.imageFile);
    setAuthorPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [authorForm.imageFile]);

  // ====== GALLERY ======
  // <--- ALLOW ALL FILE SIZE --->
  const handleGalleryFile = (e) => {
    let files = Array.from(e.target.files);
    let newFiles = files.filter(
      file =>
        ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"].includes(file.type)
    );
    if (newFiles.length !== files.length) {
      setImgError("บางไฟล์ไม่ได้เป็นไฟล์รูปภาพ (jpg/png/webp/gif)");
    } else {
      setImgError("");
    }
    setGalleryFiles(prev => [...prev, ...newFiles]);
  };
  const handleRemoveGallery = idx => setGalleryFiles(files => files.filter((_, i) => i !== idx));
  const handleGalleryDrop = e => {
    e.preventDefault();
    let files = Array.from(e.dataTransfer.files);
    let newFiles = files.filter(
      file =>
        ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"].includes(file.type)
    );
    setGalleryFiles(prev => [...prev, ...newFiles]);
  };

  // ดึง Gallery จาก DB ของข่าวที่เลือก (ตอนเปิด manage)
  const fetchDbGallery = async (news_detail_id) => {
    if (!news_detail_id) return setDbGallery([]);
    try {
      const res = await axios.get(`${API_URL}/api/news_detail_images/${news_detail_id}`);
      setDbGallery(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDbGallery([]);
    }
  };

  // อัปโหลด Gallery ไปยัง news_detail_images (ทีละรูป)
  const handleUploadGallery = async (e) => {
    e.preventDefault();
    setMsg(""); setLoading(true);

    if (!editDetailId && !form.news_id) {
      setMsg("กรุณาเลือกหรือเพิ่มข่าว detail ก่อน");
      setLoading(false);
      return;
    }
    if (galleryFiles.length === 0) {
      setMsg("กรุณาเลือกรูปที่จะอัปโหลด");
      setLoading(false);
      return;
    }

    const news_detail_id = editDetailId || form.news_id;
    try {
      for (const file of galleryFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("news_detail_id", news_detail_id);
        await axios.post(`${API_URL}/api/news_detail_images`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setMsg("อัปโหลดรูปสำเร็จ");
      setGalleryFiles([]);
      setGalleryPreviews([]);
      fetchDbGallery(news_detail_id);
    } catch (err) {
      setMsg("เกิดข้อผิดพลาดในการอัปโหลดรูป");
    } finally {
      setLoading(false);
    }
  };

  // ลบรูปในฐานข้อมูล
  const handleDeleteDbGallery = async (id) => {
    if (!window.confirm("ลบรูปนี้ถาวร?")) return;
    try {
      await axios.delete(`${API_URL}/api/news_detail_images/${id}`);
      fetchDbGallery(editDetailId || form.news_id);
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  };

  // ====== AUTHOR (Add/Edit/Delete) ======
  const handleAuthorFile = e => {
    const file = e.target.files[0];
    if (file) setAuthorForm(a => ({ ...a, imageFile: file }));
  };
  const handleRemoveAuthorImage = () => setAuthorForm(a => ({ ...a, imageFile: null, imageUrl: "" }));

  const handleAuthorAddOrUpdate = async () => {
    if (!authorForm.name) return;
    let imageUrl = authorForm.imageUrl;
    if (authorForm.imageFile) {
      imageUrl = await uploadSingleFile(authorForm.imageFile);
    }
    if (editAuthorIndex !== null) {
      setAuthorList(arr => arr.map((a, idx) =>
        idx === editAuthorIndex ? { name: authorForm.name, imageUrl } : a
      ));
    } else {
      setAuthorList(arr => [...arr, { name: authorForm.name, imageUrl }]);
    }
    setAuthorForm({ name: "", imageFile: null, imageUrl: "" });
    setEditAuthorIndex(null);
    setShowAuthorForm(false);
    setAuthorPreview("");
  };
  const handleAuthorEdit = idx => {
    setEditAuthorIndex(idx);
    setAuthorForm({ name: authorList[idx].name, imageFile: null, imageUrl: authorList[idx].imageUrl });
    setShowAuthorForm(true);
    setAuthorPreview(authorList[idx].imageUrl || "");
  };
  const handleAuthorDelete = idx => {
    if (!window.confirm("ลบผู้เขียนนี้?")) return;
    setAuthorList(arr => arr.filter((_, i) => i !== idx));
    if (editAuthorIndex === idx) {
      setEditAuthorIndex(null);
      setAuthorForm({ name: "", imageFile: null, imageUrl: "" });
      setShowAuthorForm(false);
    }
  };
  const handleCancelAuthor = () => {
    setEditAuthorIndex(null);
    setAuthorForm({ name: "", imageFile: null, imageUrl: "" });
    setShowAuthorForm(false);
    setAuthorPreview("");
  };
  const handleAuthorInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAuthorAddOrUpdate();
    }
  };

  // ====== MAIN FORM HANDLER ======
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // === อัปโหลด 1 ไฟล์ไป API /api/upload, คืน url
  const uploadSingleFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(`${API_URL}/api/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url;
  };

  // ------- MAIN SUBMIT -------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setLoading(true);

    try {
      // 1. อัปโหลดรูป Gallery ทุกไฟล์ไป API, คืน array url
      let urls = [];
      for (const file of galleryFiles) {
        const url = await uploadSingleFile(file);
        urls.push(url);
      }
      // 2. เตรียม authors (ชื่อ, url)
      const authorsFinal = [];
      for (const a of authorList) {
        let imageUrl = a.imageUrl;
        if (a.imageFile) imageUrl = await uploadSingleFile(a.imageFile);
        authorsFinal.push({ author_name: a.name, author_image_url: imageUrl });
      }

      if (editDetailId) {
        // UPDATE
        await axios.put(`${API_URL}/api/news_detail/${editDetailId}`, {
          news_id: form.news_id,
          caption: form.caption,
          authors: authorsFinal,
          images: urls,
        });
        setMsg("แก้ไขข้อมูลสำเร็จ");
      } else {
        // CREATE
        await axios.post(`${API_URL}/api/news_detail`, {
          news_id: form.news_id,
          caption: form.caption,
          authors: authorsFinal,
          images: urls,
        });
        setMsg("บันทึกข้อมูลสำเร็จ");
      }
      setForm({ news_id: "", caption: "" });
      setGalleryFiles([]); setGalleryPreviews([]);
      setAuthorList([]); setShowAuthorForm(false);
      setEditDetailId(null);
      fetchNewsDetailList();
    } catch (err) {
      setMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally { setLoading(false); }
  };

  // ====== LOAD FOR EDIT ======
  const handleEditDetail = async (row) => {
    setEditDetailId(row.id);
    setForm({
      news_id: row.news_id,
      caption: row.caption || "",
    });
    // Authors
    setAuthorList(
      Array.isArray(row.authors)
        ? row.authors.map(a => ({
            name: a.author_name,
            imageUrl: a.author_image_url || "",
          }))
        : []
    );
    setShowGalleryManage(true);
    fetchDbGallery(row.id);
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ====== DELETE ======
  const handleDeleteDetail = async (id) => {
    if (!window.confirm("ยืนยันลบข้อมูลนี้?")) return;
    try {
      await axios.delete(`${API_URL}/api/news_detail/${id}`);
      fetchNewsDetailList();
      setMsg("ลบข้อมูลสำเร็จ");
    } catch (err) {
      setMsg("ลบข้อมูลไม่สำเร็จ");
    }
  };

  // ====== UI ======
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-10 border border-blue-100">
      <h2 className="text-2xl font-bold text-blue-700 mb-8 flex items-center gap-2">
        <FiUpload className="text-blue-500" /> เพิ่ม <span className="text-blue-700">Gallery/รายละเอียดข่าว</span>
      </h2>
      {/* --------- ฟอร์มเพิ่ม/แก้ไข ข่าว Detail --------- */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* ------- ข่าวต้นทาง ------- */}
        <div>
          <label className="font-medium mb-1 block">เลือกข่าวต้นทาง</label>
          <select
            name="news_id"
            value={form.news_id}
            onChange={handleChange}
            required
            className="block w-full border rounded-lg px-3 py-2 bg-gray-50"
          >
            <option value="">--- เลือกข่าว ---</option>
            {newsList.map(news => (
              <option key={news.id} value={news.id}>
                {/* Both TH and EN name */}
                {news.title_th && news.title_en
                  ? `${news.title_th} / ${news.title_en}`
                  : news.title_th || news.title_en || `ID: ${news.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* ------- รูป Gallery (Upload ขณะเพิ่มข่าวได้ 1 รอบ) ------- */}
        <div>
          <label className="font-medium mb-1 block">อัปโหลด Gallery (พร้อมสร้างข่าว)</label>
          <div
            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center w-full min-h-[140px] relative group bg-gray-50 cursor-pointer transition ${
              imgError ? "border-pink-400" : "border-gray-200 hover:border-blue-400"
            }`}
            tabIndex={0}
            onClick={() => galleryInputRef.current && galleryInputRef.current.click()}
            onDrop={handleGalleryDrop}
            onDragOver={e => e.preventDefault()}
          >
            {galleryPreviews.length > 0 ? (
              <div className="flex flex-wrap gap-4 p-2 justify-center w-full">
                {galleryPreviews.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`gallery-${idx}`}
                      className="h-[90px] w-[120px] object-cover rounded-xl border shadow"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white/90 border border-gray-200 text-red-400 hover:text-white hover:bg-red-500 rounded-full shadow p-1 transition"
                      onClick={e => { e.stopPropagation(); handleRemoveGallery(idx); }}
                      tabIndex={-1}
                      title="ลบรูปนี้"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 h-full w-full">
                <FiUpload size={32} />
                <div className="text-xs text-center max-w-[120px] leading-tight break-words whitespace-normal mt-1" style={{ wordBreak: "break-word" }}>
                  เลือกไฟล์ Gallery<br />ลากไฟล์มาวาง
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
              multiple
              ref={galleryInputRef}
              className="hidden"
              onChange={handleGalleryFile}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">รองรับไฟล์ jpg, png, jpeg, webp, gif, ขนาดเท่าไรก็ได้</div>
          {imgError && <div className="text-xs text-pink-600 mt-1">{imgError}</div>}
        </div>

        {/* ------- คำอธิบายภาพ ------- */}
        <div>
          <label className="font-medium">คำอธิบายภาพ</label>
          <input
            type="text"
            name="caption"
            value={form.caption}
            onChange={handleChange}
            className="block w-full mt-1 border rounded-lg px-3 py-2 bg-gray-50"
            placeholder="คำอธิบายภาพประกอบข่าว"
          />
        </div>

        {/* ------- Section: Authors ------- */}
        {/* ====== Authors Logic เดิม Copy มาวางได้เลย ====== */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="font-medium">รายชื่อผู้เขียนบทความ</label>
            <button
              type="button"
              className="text-blue-600 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-blue-50 border border-blue-100"
              onClick={() => { setShowAuthorForm(true); setEditAuthorIndex(null); setAuthorForm({ name: "", imageFile: null, imageUrl: "" }); setAuthorPreview(""); }}
            >
              <FiPlus /> เพิ่มผู้เขียนบทความ
            </button>
          </div>
          {showAuthorForm && (
            <div className="border rounded-lg p-4 mb-3 bg-blue-50/50 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">ชื่อผู้เขียน</label>
                <input
                  type="text"
                  value={authorForm.name}
                  onChange={e => setAuthorForm(a => ({ ...a, name: e.target.value }))}
                  onKeyDown={handleAuthorInputKeyDown}
                  className="w-full border rounded px-2 py-1"
                  required
                  placeholder="เช่น ดร. ธนิศา วาสประสงค์"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="block text-sm font-medium mb-1">รูปโปรไฟล์</label>
                <div
                  className="relative flex items-center justify-center border-2 border-dashed rounded-full w-[56px] h-[56px] bg-white cursor-pointer"
                  tabIndex={0}
                  onClick={() => authorFileRef.current && authorFileRef.current.click()}
                  style={{ minWidth: 56, minHeight: 56 }}
                >
                  {authorPreview || authorForm.imageUrl ? (
                    <>
                      <img src={authorPreview || authorForm.imageUrl} alt="author" className="h-[46px] w-[46px] rounded-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-white/90 border border-gray-200 text-red-400 hover:text-white hover:bg-red-500 rounded-full p-1"
                        onClick={e => { e.stopPropagation(); handleRemoveAuthorImage(); }}
                        tabIndex={-1}
                        title="ลบโปรไฟล์"
                      >
                        <FiX />
                      </button>
                    </>
                  ) : (
                    <FiUpload className="text-gray-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={authorFileRef}
                    className="hidden"
                    onChange={handleAuthorFile}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAuthorAddOrUpdate}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  {editAuthorIndex !== null ? "อัปเดต" : "เพิ่ม"}
                </button>
                <button type="button" onClick={handleCancelAuthor} className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">ยกเลิก</button>
              </div>
            </div>
          )}
          {authorList.length > 0 && (
            <div className="mb-3">
              <table className="w-full text-sm border mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-1 px-2 text-center">#</th>
                    <th className="py-1 px-2 text-left">ชื่อผู้เขียน</th>
                    <th className="py-1 px-2 text-center">รูปโปรไฟล์</th>
                    <th className="py-1 px-2 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {authorList.map((a, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-1 px-2 text-center">{i + 1}</td>
                      <td className="py-1 px-2">{a.name}</td>
                      <td className="py-1 px-2 text-center">
                        {a.imageUrl && <img src={a.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover inline-block" />}
                      </td>
                      <td className="py-1 px-2 text-center">
                        <button type="button" className="text-blue-500 mr-2" onClick={() => handleAuthorEdit(i)} title="แก้ไข"><FiEdit /></button>
                        <button type="button" className="text-red-500" onClick={() => handleAuthorDelete(i)} title="ลบ"><FiTrash2 /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`w-full py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow hover:from-blue-600 hover:to-indigo-600 transition ${loading ? "opacity-50 pointer-events-none" : ""}`}
          disabled={loading}
        >
          <FiUpload className="text-lg" />
          {loading ? "กำลังบันทึก..." : (editDetailId ? "บันทึกการแก้ไข" : "บันทึกข้อมูล")}
        </button>
        {msg && <div className="text-center text-sm mt-2 text-green-600">{msg}</div>}
      </form>

      {/* ========== ตารางข้อมูลที่มีอยู่ใน DB ========== */}
      <div className="mt-10">
        <h3 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-1">
          <FiImage className="text-blue-400" /> ข้อมูลข่าว (news_detail)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border rounded-xl overflow-hidden bg-white">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">ข่าว</th>
                <th className="px-2 py-2">คำอธิบาย</th>
                <th className="px-2 py-2">Authors</th>
                <th className="px-2 py-2">จัดการ Gallery</th>
                <th className="px-2 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {newsDetailList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-6">ไม่มีข้อมูล</td>
                </tr>
              )}
              {newsDetailList.map((row, idx) => {
                const news = newsList.find(n => n.id === row.news_id);
                let newsDisplay = "-";
                if (news) {
                  // แสดงทั้งสองภาษา ถ้ามี
                  if (news.title_th && news.title_en) {
                    newsDisplay = (
                      <>
                        <div className="font-bold">{news.title_th}</div>
                        <div className="text-gray-700 text-xs">{news.title_en}</div>
                      </>
                    );
                  } else {
                    newsDisplay = <div className="font-bold">{news.title_th || news.title_en}</div>;
                  }
                }
                return (
                  <tr key={row.id} className="border-t hover:bg-blue-50/20 transition">
                    <td className="px-2 py-2 text-center">{idx + 1}</td>
                    <td className="px-2 py-2">
                      {newsDisplay}
                      <div className="text-xs text-gray-500">ID: {row.news_id}</div>
                    </td>
                    <td className="px-2 py-2">{row.caption}</td>
                    <td className="px-2 py-2">
                      {Array.isArray(row.authors) && row.authors.length > 0
                        ? row.authors.map((a, i) => (
                            <div key={i} className="flex items-center gap-1 mb-1">
                              {a.author_image_url && (
                                <img src={a.author_image_url} alt="" className="h-7 w-7 rounded-full border object-cover" />
                              )}
                              <span>{a.author_name}</span>
                            </div>
                          ))
                        : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        className="text-indigo-600 border border-indigo-300 px-2 py-1 rounded hover:bg-indigo-50"
                        onClick={() => {
                          setEditDetailId(row.id);
                          setShowGalleryManage(true);
                          fetchDbGallery(row.id);
                        }}
                      >
                        จัดการ Gallery
                      </button>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button className="text-blue-600 mr-2" title="แก้ไข" onClick={() => handleEditDetail(row)}>
                        <FiEdit />
                      </button>
                      <button className="text-red-500" title="ลบ" onClick={() => handleDeleteDetail(row.id)}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======= Section: แสดงและจัดการ Gallery ของข่าว ======= */}
      {showGalleryManage && (
        <div className="mt-12 bg-blue-50 border rounded-xl p-6 shadow">
          <div className="flex items-center gap-2 mb-4">
            <FiImage className="text-blue-400" />
            <span className="font-bold text-blue-700">จัดการ Gallery ของข่าว (ID: {editDetailId})</span>
            <button className="ml-auto text-xs px-2 py-1 rounded border" onClick={() => setShowGalleryManage(false)}>ปิด</button>
          </div>
          <form onSubmit={handleUploadGallery}>
            <div className="mb-4">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
                multiple
                ref={galleryInputRef}
                className="hidden"
                onChange={handleGalleryFile}
              />
              <div
                className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center w-full min-h-[120px] bg-white cursor-pointer"
                onClick={() => galleryInputRef.current && galleryInputRef.current.click()}
                onDrop={handleGalleryDrop}
                onDragOver={e => e.preventDefault()}
              >
                {galleryPreviews.length > 0 ? (
                  <div className="flex flex-wrap gap-3 p-2 justify-center w-full">
                    {galleryPreviews.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt={`gallery-${idx}`} className="h-20 w-28 object-cover rounded-xl border shadow" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-white/90 border border-gray-200 text-red-400 hover:text-white hover:bg-red-500 rounded-full shadow p-1 transition"
                          onClick={e => { e.stopPropagation(); handleRemoveGallery(idx); }}
                          tabIndex={-1}
                          title="ลบรูปนี้"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 h-full w-full">
                    <FiUpload size={28} />
                    <div className="text-xs text-center max-w-[120px]">เลือกหรือวางไฟล์รูปเพื่อเพิ่ม Gallery</div>
                  </div>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500">อัปโหลดทีละหลายรูปได้</div>
              {imgError && <div className="text-xs text-pink-600 mt-1">{imgError}</div>}
            </div>
            <button
              type="submit"
              className={`w-full py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow hover:from-blue-600 hover:to-indigo-600 transition ${loading ? "opacity-50 pointer-events-none" : ""}`}
              disabled={loading}
            >
              <FiUpload className="text-lg" />
              {loading ? "กำลังบันทึก..." : "เพิ่มรูปเข้า Gallery"}
            </button>
          </form>

          {/* แสดงรูปใน Gallery */}
          <div className="mt-8 flex flex-wrap gap-3">
            {dbGallery.length === 0 && <div className="text-gray-400">ยังไม่มีรูปใน Gallery</div>}
            {dbGallery.map(img => (
              <div key={img.id} className="relative group">
                <img src={img.image_url} alt="" className="w-28 h-20 object-cover rounded-xl border shadow" />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-white/90 border border-gray-200 text-red-400 hover:text-white hover:bg-red-500 rounded-full shadow p-1 transition"
                  onClick={() => handleDeleteDbGallery(img.id)}
                  tabIndex={-1}
                  title="ลบรูปนี้"
                >
                  <FiTrash2 />
                </button>
                <div className="text-[10px] text-center text-gray-400 mt-1">{img.created_at?.split(" ")[0]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
