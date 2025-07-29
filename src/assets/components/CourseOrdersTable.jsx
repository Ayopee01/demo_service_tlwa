// src/assets/components/CourseOrdersTable.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit, FiTrash, FiX } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

const emptyOrder = {
  user_id: "",
  user_name: "",
  course_ids: "",
  member_types: "",
  member_input: "",
  total_price: "",
  total_discount: "",
  payment_method: "",
};

function SlipPopup({ url, onClose }) {
  useEffect(() => {
    const closeEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeEsc);
    return () => window.removeEventListener("keydown", closeEsc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="relative" onClick={e => e.stopPropagation()}>
        <img
          src={url}
          alt="slip"
          className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-xl border-4 border-white"
        />
        <button
          className="absolute top-2 right-2 bg-white/90 hover:bg-red-500 hover:text-white text-gray-800 rounded-full p-2 shadow"
          onClick={onClose}
          aria-label="ปิด"
        >
          <FiX size={28} />
        </button>
      </div>
    </div>
  );
}

export default function CourseOrdersTable() {
  const [orders, setOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyOrder);
  const [loading, setLoading] = useState(false);
  const [imgPopup, setImgPopup] = useState(null);
  const [search, setSearch] = useState("");

  // ------- Fetch Data -------
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/course_orders`);
      setOrders(res.data || []);
    } catch (e) {
      alert("โหลดข้อมูลผิดพลาด");
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  // ------- Modal Logic -------
  const openModal = (order = null) => {
    if (order) {
      setEditId(order.id);
      setForm({
        user_id: order.user_id ?? "",
        user_name: order.user_name ?? "",
        course_ids: order.course_ids ?? "",
        member_types: order.member_types ?? "",
        member_input: order.member_input ?? "",
        total_price: order.total_price ?? "",
        total_discount: order.total_discount ?? "",
        payment_method: order.payment_method ?? "",
      });
    } else {
      setEditId(null);
      setForm(emptyOrder);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setForm(emptyOrder);
  };

  // ------- CRUD --------
  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.user_id || !form.user_name || !form.total_price || !form.payment_method) {
      alert("กรุณากรอกข้อมูลที่จำเป็น");
      return;
    }
    try {
      if (editId) {
        await axios.put(`${API_URL}/api/course_orders/${editId}`, form);
      } else {
        await axios.post(`${API_URL}/api/course_orders`, form);
      }
      closeModal();
      fetchOrders();
    } catch (err) {
      alert(err?.response?.data?.message || "ผิดพลาด");
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("ยืนยันลบออเดอร์นี้?")) return;
    try {
      await axios.delete(`${API_URL}/api/course_orders/${id}`);
      fetchOrders();
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  };

  // ------- Filtering -------
  const filteredOrders = orders.filter(o =>
    !search ||
    `${o.user_id} ${o.user_name} ${o.course_ids} ${o.payment_method}`.toLowerCase().includes(search.toLowerCase())
  );

  // ------- Render -------
  return (
    <div className="flex justify-center min-h-screen bg-[#f6f9fe] pt-10 px-2 sm:px-0">
      {imgPopup && <SlipPopup url={imgPopup} onClose={() => setImgPopup(null)} />}
      <div className="w-full max-w-[1300px] bg-white rounded-2xl shadow-2xl py-8 px-5 sm:px-8">
        <h1 className="text-2xl font-extrabold text-blue-800 flex items-center gap-3 mb-7">
          <span role="img" aria-label="order" className="text-3xl">📋</span>
          <span>
            <span className="text-blue-800">จัดการออเดอร์คอร์ส</span>
          </span>
        </h1>
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <input
            type="text"
            className="border rounded-lg px-4 py-2 w-full sm:w-[360px] shadow-sm focus:ring-2 focus:ring-blue-200 text-base"
            placeholder="ค้นหา User, Course, Payment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-all"
            onClick={fetchOrders}
            disabled={loading}
          >
            รีเฟรช
          </button>
        </div>
        <div className="overflow-x-auto pb-2">
          <table className="min-w-[1200px] w-full text-base">
            <thead>
              <tr className="bg-blue-50 text-blue-900">
                <th className="p-3 font-semibold text-center rounded-tl-xl">ID</th>
                <th className="p-3 font-semibold text-center">User ID</th>
                <th className="p-3 font-semibold text-left">ชื่อผู้ใช้</th>
                <th className="p-3 font-semibold text-left">Course IDs</th>
                <th className="p-3 font-semibold text-left">Member Types</th>
                <th className="p-3 font-semibold text-left">Member Input</th>
                <th className="p-3 font-semibold text-right">ราคาเต็ม</th>
                <th className="p-3 font-semibold text-right">ส่วนลด</th>
                <th className="p-3 font-semibold text-right">ราคาสุทธิ</th>
                <th className="p-3 font-semibold text-center">ชำระเงิน</th>
                <th className="p-3 font-semibold text-center">Slip</th>
                <th className="p-3 font-semibold text-center">สร้างเมื่อ</th>
                <th className="p-3 font-semibold text-center rounded-tr-xl" colSpan={2}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={14} className="text-center py-10">Loading...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={14} className="text-center py-10">ไม่มีข้อมูล</td></tr>
              ) : filteredOrders.map(order => {
                const fullPrice = Number(order.total_price) || 0;
                const discount = Number(order.total_discount) || 0;
                const netPrice = fullPrice - discount;
                return (
                  <tr key={order.id} className="border-b last:border-b-0 hover:bg-blue-50 transition group align-middle" style={{ height: 80 }}>
                    <td className="p-3 text-center font-semibold align-middle">{order.id}</td>
                    <td className="p-3 text-center break-all align-middle">{order.user_id}</td>
                    <td className="p-3 font-medium text-gray-800 whitespace-nowrap align-middle">
                      <span>{order.user_name}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap align-middle">
                      <span>{String(order.course_ids).replace(/[\[\]"]+/g, "")}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap align-middle">
                      <span>{order.member_types?.length > 40 ? `${order.member_types.slice(0, 40)}...` : order.member_types}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap align-middle max-w-[220px] overflow-hidden">
                      <span title={order.member_input}>{order.member_input?.length > 40 ? `${order.member_input.slice(0, 40)}...` : order.member_input}</span>
                    </td>
                    <td className="p-3 text-right align-middle font-semibold text-gray-700">{fullPrice.toLocaleString()}</td>
                    <td className="p-3 text-right align-middle text-blue-700">{discount ? `- ${discount.toLocaleString()}` : '-'}</td>
                    <td className="p-3 text-right align-middle font-bold text-green-600 text-lg">
                      {netPrice.toLocaleString()}
                    </td>
                    <td className="p-3 text-center align-middle whitespace-nowrap">{order.payment_method}</td>
                    <td className="p-3 text-center align-middle">
                      {order.slip_url ? (
                        <img
                          src={order.slip_url}
                          alt="slip"
                          className="w-20 h-20 object-cover rounded-xl shadow cursor-pointer hover:ring-2 ring-blue-400 mx-auto transition"
                          onClick={() => setImgPopup(order.slip_url)}
                          style={{ minWidth: 80, minHeight: 80 }}
                        />
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="p-3 text-center text-sm whitespace-nowrap align-middle">
                      {order.created_at ? String(order.created_at).slice(0, 16).replace("T", " ") : "-"}
                    </td>
                    <td className="p-3 text-center align-middle">
                      <button
                        className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1 shadow transition"
                        onClick={() => openModal(order)}
                      >
                        <FiEdit /> แก้ไข
                      </button>
                    </td>
                    <td className="p-3 text-center align-middle">
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1 shadow transition"
                        onClick={() => handleDelete(order.id)}
                      >
                        <FiTrash /> ลบ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal ฟอร์มแก้ไข */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[3000]">
            <form className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-7 relative animate-fade-in border" onSubmit={handleSave}>
              <h2 className="text-lg font-extrabold text-blue-700 mb-4">
                {editId ? "แก้ไขออเดอร์" : "เพิ่มออเดอร์"}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID*</label>
                  <input className="border w-full px-3 py-2 rounded-xl bg-gray-50" name="user_id" value={form.user_id} onChange={handleChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Name*</label>
                  <input className="border w-full px-3 py-2 rounded-xl bg-gray-50" name="user_name" value={form.user_name} onChange={handleChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Course IDs</label>
                  <input className="border w-full px-3 py-2 rounded-xl bg-gray-50" name="course_ids" value={form.course_ids} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Types</label>
                  <input className="border w-full px-3 py-2 rounded-xl bg-gray-50" name="member_types" value={form.member_types} onChange={handleChange} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Member Input (json)</label>
                  <input className="border w-full px-3 py-2 rounded-xl bg-gray-50" name="member_input" value={form.member_input} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Price*</label>
                  <input type="number" className="border w-full px-3 py-2 rounded-xl bg-gray-50" name="total_price" value={form.total_price} onChange={handleChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Discount</label>
                  <input type="number" className="border w-full px-3 py-2 rounded-xl bg-gray-50" name="total_discount" value={form.total_discount} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method*</label>
                  <input className="border w-full px-3 py-2 rounded-xl bg-gray-50" name="payment_method" value={form.payment_method} onChange={handleChange} required />
                </div>
              </div>
              <div className="flex justify-end mt-7 gap-2">
                <button type="button" className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold" onClick={closeModal}>ยกเลิก</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow" >
                  {editId ? "บันทึก" : "เพิ่ม"}
                </button>
              </div>
              <button type="button" className="absolute top-2 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold" onClick={closeModal}><FiX /></button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
