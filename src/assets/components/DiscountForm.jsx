import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function AddDiscountOptions() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [rows, setRows] = useState([
    { type: "", custom_name: "", discount_amount: "", discount_percent: "" }
  ]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);

  // โหลดคอร์ส (courses)
  useEffect(() => {
    axios.get(`${API_URL}/api/courses`)
      .then(res => setCourses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCourses([]));
  }, []);

  // ตัวเลือก type_id
  const MEMBER_OPTIONS = [
    { value: 1, label: "สมาชิกสมาคมเวชศาสตร์วิถีชีวิตและสุขภาวะไทย (TLWA)" },
    { value: 2, label: "องค์กรพันธมิตรสมาคมเวชศาสตร์วิถีชีวิตและสุขภาวะไทย (TLWA)" },
    { value: 3, label: "ไม่ได้เป็นสมาชิกหรือองค์กรพันธมิตรใดเลย" },
    { value: 4, label: "ระบุเอง" }
  ];

  // เพิ่ม/ลบแถว
  const addRow = () =>
    setRows([
      ...rows,
      { type: "", custom_name: "", discount_amount: "", discount_percent: "" }
    ]);
  const removeRow = idx => setRows(rows.filter((_, i) => i !== idx));

  // handle เปลี่ยนค่า
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

    if (!selectedCourse) return setErrorMsg("เลือก Card/Course ก่อน");
    for (const [i, row] of rows.entries()) {
      if (!row.type) return setErrorMsg(`เลือกประเภทสมาชิก/องค์กรแถวที่ ${i + 1}`);
      if (Number(row.type) === 4 && !row.custom_name.trim())
        return setErrorMsg(`กรอกรายละเอียด 'ระบุเอง' แถวที่ ${i + 1}`);
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
      setRows([{ type: "", custom_name: "", discount_amount: "", discount_percent: "" }]);
      setSelectedCourse("");
    } catch (e) {
      setErrorMsg("เกิดข้อผิดพลาด: " + (e.response?.data?.error || e.message));
    }
  };

  const setErrorMsg = m => { setMsg(m); setError(true); };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h2 className="text-2xl font-bold text-white">
              เพิ่มประเภทสมาชิก/องค์กร + ส่วนลด
            </h2>
            <p className="text-blue-100 mt-2 text-sm">
              เพิ่มแถว กำหนดส่วนลดได้หลายประเภทใน 1 คอร์ส
            </p>
          </div>
          <form className="p-8 space-y-8" onSubmit={handleSubmit}>
            {/* เลือก Card/Course */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                เลือก Card/Course <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  ประเภทสมาชิก/องค์กร และ ส่วนลด
                </h3>
                <button
                  type="button"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                  onClick={addRow}
                >
                  <span className="text-lg">+</span>
                  เพิ่มประเภทสมาชิก/องค์กร
                </button>
              </div>
              <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-600">
                <div className="col-span-5">ประเภทสมาชิก/องค์กร</div>
                <div className="col-span-3">ชื่อ/รายละเอียด</div>
                <div className="col-span-2">ส่วนลด (บาท)</div>
                <div className="col-span-1">% ส่วนลด</div>
                <div className="col-span-1 text-center">จัดการ</div>
              </div>
              <div className="space-y-3">
                {rows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    {/* Member Type Selection */}
                    <div className="col-span-5">
                      <select
                        value={row.type}
                        onChange={e => handleChange(idx, "type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
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
                    {/* Custom Name Input */}
                    <div className="col-span-3">
                      {Number(row.type) === 4 ? (
                        <input
                          type="text"
                          placeholder="ระบุชื่อ/รายละเอียด"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                          value={row.custom_name}
                          onChange={e => handleChange(idx, "custom_name", e.target.value)}
                          required
                        />
                      ) : (
                        <div className="text-gray-400 text-sm py-2">-</div>
                      )}
                    </div>
                    {/* Discount Amount */}
                    <div className="col-span-2">
                      {Number(row.type) !== 3 ? (
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                          min={0}
                          value={row.discount_amount}
                          onChange={e => handleChange(idx, "discount_amount", e.target.value)}
                        />
                      ) : (
                        <div className="text-gray-400 text-sm py-2 text-center">-</div>
                      )}
                    </div>
                    {/* Discount Percent */}
                    <div className="col-span-1">
                      {Number(row.type) !== 3 ? (
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                          min={0}
                          max={100}
                          value={row.discount_percent}
                          onChange={e => handleChange(idx, "discount_percent", e.target.value)}
                        />
                      ) : (
                        <div className="text-gray-400 text-sm py-2 text-center">-</div>
                      )}
                    </div>
                    {/* Remove Button */}
                    <div className="col-span-1 text-center">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-colors"
                          onClick={() => removeRow(idx)}
                          title="ลบแถวนี้"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-sm shadow-md hover:shadow-lg"
              >
                บันทึกข้อมูลทั้งหมด
              </button>
            </div>
            {/* Message Display */}
            {msg && (
              <div className={`p-4 rounded-lg text-sm font-medium ${
                error
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                {msg}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
