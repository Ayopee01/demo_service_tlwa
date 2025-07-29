// src/assets/components/DiscountForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiTrash2 } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function DiscountForm() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [rows, setRows] = useState([
    { type: "", custom_name: "", discount_amount: "", discount_percent: "" }
  ]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);

  // โหลดคอร์ส
  useEffect(() => {
    axios.get(`${API_URL}/api/courses`)
      .then(res => setCourses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCourses([]));
  }, []);

  // ตัวเลือกสมาชิก/องค์กร
  const MEMBER_OPTIONS = [
    { value: 1, label: "สมาชิกสมาคมเวชศาสตร์วิถีชีวิตและสุขภาวะไทย (TLWA)" },
    { value: 2, label: "องค์กรพันธมิตรสมาคมเวชศาสตร์วิถีชีวิตและสุขภาวะไทย (TLWA)" },
    { value: 3, label: "ไม่ได้เป็นสมาชิกหรือองค์กรพันธมิตรใดเลย" },
    { value: 4, label: "ระบุเอง" }
  ];

  // เพิ่ม/ลบแถว
  const addRow = () =>
    setRows([...rows, { type: "", custom_name: "", discount_amount: "", discount_percent: "" }]);
  const removeRow = idx => setRows(rows.filter((_, i) => i !== idx));
  // เปลี่ยนค่า row
  const handleChange = (idx, field, value) => {
    setRows(rows.map((row, i) =>
      i === idx
        ? {
            ...row,
            [field]: value,
            ...(field === "type" && Number(value) !== 4 ? { custom_name: "" } : {})
          }
        : row
    ));
  };
  // Validate และ submit
  const handleSubmit = async e => {
    e.preventDefault();
    setMsg(""); setError(false);

    if (!selectedCourse) return setErrorMsg("กรุณาเลือก Card หรือ Course ก่อน");
    for (const [i, row] of rows.entries()) {
      if (!row.type) return setErrorMsg(`กรุณาเลือกประเภทสมาชิก/องค์กร แถวที่ ${i + 1}`);
      if (Number(row.type) === 4 && !row.custom_name.trim())
        return setErrorMsg(`กรอก 'ระบุเอง' แถวที่ ${i + 1}`);
      if (Number(row.type) !== 3 && row.discount_amount === "" && row.discount_percent === "")
        return setErrorMsg(`แถวที่ ${i + 1} ต้องกรอกส่วนลดอย่างน้อย 1 ช่อง`);
    }

    try {
      await axios.post(`${API_URL}/api/course_discounts`, {
        course_id: selectedCourse,
        items: rows.map(row => ({
          member_type_id: Number(row.type),
          custom_name: Number(row.type) === 4 ? row.custom_name : null,
          discount_amount: row.discount_amount ? Number(row.discount_amount) : 0,
          discount_percent: row.discount_percent ? Number(row.discount_percent) : 0
        }))
      });
      setMsg("บันทึกข้อมูลสำเร็จ");
      setError(false);
      setRows([{ type: "", custom_name: "", discount_amount: "", discount_percent: "" }]);
      setSelectedCourse("");
    } catch (e) {
      setErrorMsg("เกิดข้อผิดพลาด: " + (e.response?.data?.error || e.message));
    }
  };

  const setErrorMsg = m => { setMsg(m); setError(true); };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-[#f6f9fe] px-2 py-10">
      <div className="w-full max-w-4xl mx-auto shadow-2xl rounded-3xl border border-gray-100 bg-white overflow-hidden">
        {/* Header */}
        <div className="rounded-t-3xl bg-gradient-to-r from-blue-600 to-indigo-500 px-8 py-7">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide flex items-center gap-3">
            <span role="img" aria-label="discount" className="text-3xl">🎟️</span>
            เพิ่มประเภทสมาชิก/องค์กร + ส่วนลด
          </h2>
          <p className="text-blue-100 text-base mt-1">
            สร้างส่วนลดที่หลากหลายสำหรับคอร์สของคุณ เพิ่มหลายแถวได้
          </p>
        </div>
        {/* Form */}
        <form className="p-8 space-y-8" onSubmit={handleSubmit} autoComplete="off">
          {/* เลือก Card/Course */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              เลือก Card/Course <span className="text-pink-600">*</span>
            </label>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 bg-gray-50 text-base"
              required
            >
              <option value="">กรุณาเลือก Card หรือคอร์ส</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} (ID: {c.id})
                </option>
              ))}
            </select>
          </div>
          {/* ตารางประเภท/ส่วนลด */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">
                รายการประเภทสมาชิก/องค์กร และ ส่วนลด
              </h3>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-green-500 hover:bg-green-600 text-white shadow transition"
                onClick={addRow}
              >
                <FiPlus size={18} /> เพิ่มแถว
              </button>
            </div>
            {/* Head row */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-blue-50 rounded-lg text-base font-bold text-blue-600 mb-2">
              <div className="col-span-5">ประเภทสมาชิก/องค์กร</div>
              <div className="col-span-3">ชื่อ/รายละเอียด</div>
              <div className="col-span-2 text-center">ส่วนลด (บาท)</div>
              <div className="col-span-1 text-center">% ส่วนลด</div>
              <div className="col-span-1 text-center">จัดการ</div>
            </div>
            {/* Rows */}
            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4 bg-white border border-gray-100 rounded-2xl shadow hover:shadow-lg transition">
                  {/* Type */}
                  <div className="col-span-5">
                    <select
                      value={row.type}
                      onChange={e => handleChange(idx, "type", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 bg-gray-50 text-base"
                      required
                    >
                      <option value="">เลือกประเภทสมาชิก/องค์กร</option>
                      {MEMBER_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Custom Name */}
                  <div className="col-span-3">
                    {Number(row.type) === 4 ? (
                      <input
                        type="text"
                        placeholder="ระบุเอง"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 text-base bg-white"
                        value={row.custom_name}
                        onChange={e => handleChange(idx, "custom_name", e.target.value)}
                        required
                      />
                    ) : (
                      <div className="text-gray-400 text-center">-</div>
                    )}
                  </div>
                  {/* Discount Amount */}
                  <div className="col-span-2">
                    {Number(row.type) !== 3 ? (
                      <input
                        type="number"
                        placeholder="บาท"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 text-base"
                        min={0}
                        value={row.discount_amount}
                        onChange={e => handleChange(idx, "discount_amount", e.target.value)}
                      />
                    ) : (
                      <div className="text-gray-400 text-center">-</div>
                    )}
                  </div>
                  {/* Discount Percent */}
                  <div className="col-span-1">
                    {Number(row.type) !== 3 ? (
                      <input
                        type="number"
                        placeholder="%"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 text-base"
                        min={0}
                        max={100}
                        value={row.discount_percent}
                        onChange={e => handleChange(idx, "discount_percent", e.target.value)}
                      />
                    ) : (
                      <div className="text-gray-400 text-center">-</div>
                    )}
                  </div>
                  {/* Remove */}
                  <div className="col-span-1 flex items-center justify-center">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-200 flex items-center justify-center text-red-500 hover:text-red-700 shadow transition"
                        onClick={() => removeRow(idx)}
                        title="ลบแถวนี้"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Submit & Message */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-100">
            <button
              type="submit"
              className="w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-bold shadow transition text-lg"
            >
              บันทึกข้อมูลทั้งหมด
            </button>
            {msg && (
              <div className={`mt-3 w-full md:w-auto px-4 py-3 rounded-xl text-center font-semibold shadow ${
                error
                  ? "bg-red-100 text-red-700 border border-red-300"
                  : "bg-green-100 text-green-700 border border-green-300"
              }`}>
                {msg}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
