import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminAddVideo() {
  const [form, setForm] = useState({ title: "", youtube_url: "" });
  const [videos, setVideos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");

  // โหลดรายการวิดีโอ
  const fetchVideos = () => {
    axios.get(`${API_URL}/api/videos`).then(res => setVideos(res.data));
  };

  useEffect(() => { fetchVideos(); }, []);

  // Submit ฟอร์ม (เพิ่ม/แก้ไข)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.youtube_url) {
      setMsg("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    try {
      if (editing) {
        await axios.put(`${API_URL}/api/videos/${editing.id}`, form);
        setMsg("แก้ไขสำเร็จ");
      } else {
        await axios.post(`${API_URL}/api/videos`, form);
        setMsg("เพิ่มสำเร็จ");
      }
      setForm({ title: "", youtube_url: "" });
      setEditing(null);
      fetchVideos();
    } catch (e) {
      setMsg("เกิดข้อผิดพลาด");
    }
  };

  // ลบวิดีโอ
  const handleDelete = async (id) => {
    if (!window.confirm("ยืนยันการลบ?")) return;
    await axios.delete(`${API_URL}/api/videos/${id}`);
    fetchVideos();
  };

  // แก้ไข
  const handleEdit = (video) => {
    setEditing(video);
    setForm({ title: video.title, youtube_url: video.youtube_url });
    setMsg("");
  };

  // เคลียร์ฟอร์ม
  const handleCancel = () => {
    setEditing(null);
    setForm({ title: "", youtube_url: "" });
    setMsg("");
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h2 className="text-xl font-bold mb-4">{editing ? "แก้ไขคลิป" : "เพิ่มคลิป Youtube"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <input
          type="text"
          className="w-full border p-2 rounded"
          placeholder="ชื่อคลิป"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="text"
          className="w-full border p-2 rounded"
          placeholder="ลิงก์ Youtube (https://...)"
          value={form.youtube_url}
          onChange={e => setForm({ ...form, youtube_url: e.target.value })}
        />
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {editing ? "บันทึก" : "เพิ่ม"}
          </button>
          {editing && (
            <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={handleCancel}>
              ยกเลิก
            </button>
          )}
        </div>
        {msg && <div className="text-green-700">{msg}</div>}
      </form>

      <div className="mt-10">
        <h3 className="font-semibold mb-2">รายการวิดีโอ</h3>
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">ชื่อคลิป</th>
              <th className="p-2 border">Youtube URL</th>
              <th className="p-2 border">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {videos.map(v => (
              <tr key={v.id}>
                <td className="p-2 border">{v.id}</td>
                <td className="p-2 border">{v.title}</td>
                <td className="p-2 border break-all">{v.youtube_url}</td>
                <td className="p-2 border">
                  <button className="text-blue-600 mr-2" onClick={() => handleEdit(v)}>แก้ไข</button>
                  <button className="text-red-600" onClick={() => handleDelete(v.id)}>ลบ</button>
                </td>
              </tr>
            ))}
            {videos.length === 0 && <tr><td colSpan="4" className="text-center p-3">ไม่มีข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
