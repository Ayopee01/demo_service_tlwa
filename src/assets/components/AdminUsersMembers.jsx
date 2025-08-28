// src/pages/admin/AdminUsersMembers.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiUsers, FiUserCheck, FiUser, FiSearch, FiEdit2, FiTrash2, FiX, FiSave, FiChevronLeft, FiChevronRight
} from "react-icons/fi";

// ------- Axios instance (พร้อม Interceptors) -------
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const ax = axios.create({
  baseURL: API_URL,
  withCredentials: true, // เผื่อใช้คุกกี้ token
});
// แนบ Bearer token อัตโนมัติถ้ามีเก็บไว้หลังล็อกอิน
ax.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && !config.headers?.Authorization) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});
// ดัก 401 ไว้กลาง ๆ
ax.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      console.warn("Unauthorized (401) – โปรดล็อกอินใหม่");
      // ถ้าต้องการ redirect หน้า login ให้เพิ่มที่นี่
      // window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ------- UI Tabs -------
const TABS = [
  { key: "all", label: "ทั้งหมด", icon: <FiUsers className="w-4 h-4" /> },
  { key: "member", label: "เฉพาะสมาชิก (Member)", icon: <FiUserCheck className="w-4 h-4" /> },
  { key: "normal", label: "ผู้ใช้ปกติ", icon: <FiUser className="w-4 h-4" /> },
];

export default function AdminUsersMembers() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [users, setUsers] = useState({ rows: [], total: 0 });
  const [members, setMembers] = useState({ rows: [], total: 0 });

  const [loading, setLoading] = useState(false);

  // modals
  const [editUser, setEditUser] = useState(null);     // row object
  const [editMember, setEditMember] = useState(null); // row object
  const [confirm, setConfirm] = useState(null);       // { type:'user'|'member', id:number, name:string }

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        if (tab === "member") {
          const { data } = await ax.get("/api/admin/members", {
            params: { page, pageSize, q }
          });
          if (!cancelled) setMembers({ rows: data.rows || [], total: data.total || 0 });
        } else {
          const { data } = await ax.get("/api/admin/users", {
            params: { page, pageSize, q, hasMember: tab }
          });
          if (!cancelled) setUsers({ rows: data.rows || [], total: data.total || 0 });
        }
      } catch (e) {
        console.error(e);
        alert(e?.response?.data?.error || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        !cancelled && setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [tab, page, pageSize, q]);

  const total = tab === "member" ? members.total : users.total;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  const onSearch = (e) => {
    e?.preventDefault?.();
    setPage(1);
  };

  const onDelete = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === 'user') {
        await ax.delete(`/api/admin/users/${confirm.id}`);
      } else {
        await ax.delete(`/api/admin/members/${confirm.id}`);
      }
      setConfirm(null);
      // คำนวณหน้าปัจจุบันใหม่ถ้าลบจนหน้าเกิน
      const nextPage = page > 1 && (total - 1) <= (page - 1) * pageSize ? page - 1 : page;
      setPage(nextPage);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "ลบไม่สำเร็จ");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-extrabold">จัดการสมาชิก (Users / Members)</h1>

        <form onSubmit={onSearch} className="flex items-center gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="ค้นหาชื่อ, อีเมล, เบอร์, branch, receipt..."
              className="pl-9 pr-3 h-10 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button className="h-10 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">ค้นหา</button>
        </form>
      </header>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border
              ${tab === t.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-gray-50 border-gray-300'}`}
          >
            {t.icon}{t.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">ต่อหน้า</span>
          <select
            className="border rounded-lg h-9 px-2"
            value={pageSize}
            onChange={e => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
          >
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Tables */}
      <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
        {loading && <div className="p-6 text-center text-gray-500">กำลังโหลด...</div>}

        {!loading && tab !== 'member' && <UsersTable
          rows={users.rows}
          onEdit={setEditUser}
          onDelete={(row)=> setConfirm({ type:'user', id: row.id, name: `${row.firstName} ${row.lastName}` })}
        />}

        {!loading && tab === 'member' && <MembersTable
          rows={members.rows}
          onEdit={setEditMember}
          onDelete={(row)=> setConfirm({ type:'member', id: row.id, name: `${row.firstName} ${row.lastName}` })}
        />}

        {/* Pagination */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-t">
          <div className="text-sm text-gray-600">
            ทั้งหมด {total.toLocaleString()} รายการ • หน้า {page}/{maxPage}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page<=1}
              onClick={()=> setPage(p=> Math.max(1, p-1))}
              className="h-9 px-3 rounded-lg border bg-white disabled:opacity-40"
            >
              <FiChevronLeft className="inline" /> ก่อนหน้า
            </button>
            <button
              disabled={page>=maxPage}
              onClick={()=> setPage(p=> Math.min(maxPage, p+1))}
              className="h-9 px-3 rounded-lg border bg-white disabled:opacity-40"
            >
              ถัดไป <FiChevronRight className="inline" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editUser && (
        <EditUserModal
          row={editUser}
          onClose={()=> setEditUser(null)}
          onSaved={()=> { setEditUser(null); setPage(p=>p); }}
        />
      )}
      {editMember && (
        <EditMemberModal
          row={editMember}
          onClose={()=> setEditMember(null)}
          onSaved={()=> { setEditMember(null); setPage(p=>p); }}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title="ยืนยันการลบ"
          message={`ต้องการลบ ${confirm.name} ใช่ไหม?`}
          onCancel={()=> setConfirm(null)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}

/* ---------------- Users table ---------------- */
function UsersTable({ rows, onEdit, onDelete }) {
  if (!rows.length) return <div className="p-6 text-center text-gray-500">ไม่พบข้อมูล</div>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr className="text-left">
            <th className="px-4 py-2 font-semibold">ID</th>
            <th className="px-4 py-2 font-semibold">ชื่อ - นามสกุล</th>
            <th className="px-4 py-2 font-semibold">อีเมล</th>
            <th className="px-4 py-2 font-semibold">เบอร์</th>
            <th className="px-4 py-2 font-semibold">สมาชิก?</th>
            <th className="px-4 py-2 font-semibold">การชำระ</th>
            <th className="px-4 py-2 font-semibold">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=> (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{r.id}</td>
              <td className="px-4 py-2">{r.prefix ? `${r.prefix} ` : ''}{r.firstName} {r.lastName}</td>
              <td className="px-4 py-2">{r.email}</td>
              <td className="px-4 py-2">{r.phone || '-'}</td>
              <td className="px-4 py-2">{r.member_id ? <span className="text-green-700 font-medium">Member</span> : <span className="text-gray-500">Normal</span>}</td>
              <td className="px-4 py-2">{r.member_id ? (r.payment_status || '-') : '-'}</td>
              <td className="px-4 py-2">
                <div className="flex gap-2">
                  <button onClick={()=> onEdit(r)} className="px-3 py-1.5 rounded-lg border hover:bg-indigo-50 text-indigo-700 border-indigo-200">
                    <FiEdit2 className="inline mr-1" /> แก้ไข
                  </button>
                  <button onClick={()=> onDelete(r)} className="px-3 py-1.5 rounded-lg border hover:bg-red-50 text-red-700 border-red-200">
                    <FiTrash2 className="inline mr-1" /> ลบ
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Members table ---------------- */
function MembersTable({ rows, onEdit, onDelete }) {
  if (!rows.length) return <div className="p-6 text-center text-gray-500">ไม่พบข้อมูล</div>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr className="text-left">
            <th className="px-4 py-2 font-semibold">MID</th>
            <th className="px-4 py-2 font-semibold">ผู้ใช้</th>
            <th className="px-4 py-2 font-semibold">อีเมล</th>
            <th className="px-4 py-2 font-semibold">สาขา/หน่วยงาน</th>
            <th className="px-4 py-2 font-semibold">ประเภทใบกำกับ</th>
            <th className="px-4 py-2 font-semibold">สถานะชำระ</th>
            <th className="px-4 py-2 font-semibold">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=> (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{r.id}</td>
              <td className="px-4 py-2">{r.firstName} {r.lastName}</td>
              <td className="px-4 py-2">{r.email}</td>
              <td className="px-4 py-2">{r.branchName || '-'}</td>
              <td className="px-4 py-2">{r.receiptType || '-'}</td>
              <td className="px-4 py-2">{r.payment_status || '-'}</td>
              <td className="px-4 py-2">
                <div className="flex gap-2">
                  <button onClick={()=> onEdit(r)} className="px-3 py-1.5 rounded-lg border hover:bg-indigo-50 text-indigo-700 border-indigo-200">
                    <FiEdit2 className="inline mr-1" /> แก้ไข
                  </button>
                  <button onClick={()=> onDelete(r)} className="px-3 py-1.5 rounded-lg border hover:bg-red-50 text-red-700 border-red-200">
                    <FiTrash2 className="inline mr-1" /> ลบ
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Edit User Modal ---------------- */
function EditUserModal({ row, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    prefix: row.prefix || '',
    firstName: row.firstName || '',
    lastName: row.lastName || '',
    firstNameEn: row.firstNameEn || '',
    lastNameEn: row.lastNameEn || '',
    email: row.email || '',
    phone: row.phone || '',
    address: row.address || '',
  }));
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ax.put(`/api/admin/users/${row.id}`, form);
      onSaved();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`แก้ไขผู้ใช้ #${row.id}`}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="คำนำหน้า" value={form.prefix} onChange={v=> setForm(s=>({...s,prefix:v}))}/>
          <Input label="เบอร์โทร" value={form.phone} onChange={v=> setForm(s=>({...s,phone:v}))}/>
          <Input label="ชื่อ (TH)" value={form.firstName} onChange={v=> setForm(s=>({...s,firstName:v}))}/>
          <Input label="นามสกุล (TH)" value={form.lastName} onChange={v=> setForm(s=>({...s,lastName:v}))}/>
          <Input label="ชื่อ (EN)" value={form.firstNameEn} onChange={v=> setForm(s=>({...s,firstNameEn:v}))}/>
          <Input label="นามสกุล (EN)" value={form.lastNameEn} onChange={v=> setForm(s=>({...s,lastNameEn:v}))}/>
          <Input label="อีเมล" value={form.email} onChange={v=> setForm(s=>({...s,email:v}))}/>
          <Input label="ที่อยู่" value={form.address} onChange={v=> setForm(s=>({...s,address:v}))}/>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border">
            <FiX className="inline mr-1" /> ยกเลิก
          </button>
          <button disabled={saving} className="h-10 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            <FiSave className="inline mr-1" /> บันทึก
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Edit Member Modal ---------------- */
function EditMemberModal({ row, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    prefixTh: row.prefixTh || '', prefixEn: row.prefixEn || '', suffixEn: row.suffixEn || '', nickName: row.nickName || '',
    nationality: row.nationality || '', occupation: row.occupation || '',
    lineId: row.lineId || '', workPlace: row.workPlace || '', workAddress: row.workAddress || '', workPhone: row.workPhone || '', workPosition: row.workPosition || '',
    branchName: row.branchName || '', receiptType: row.receiptType || '',
    receiptAddressType: row.receiptAddressType || '', receiptAddressOther: row.receiptAddressOther || '',
    taxId: row.taxId || '',
    payment_status: row.payment_status || '', payment_gateway: row.payment_gateway || '', payment_ref: row.payment_ref || '', payment_slip_url: row.payment_slip_url || '',
  }));
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ax.put(`/api/admin/members/${row.id}`, form);
      onSaved();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`แก้ไขสมาชิก (Member) #${row.id}`}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Section title="ชื่อ/คำนำหน้า">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input label="คำนำหน้า (TH)" value={form.prefixTh} onChange={v=> setForm(s=>({...s,prefixTh:v}))}/>
            <Input label="คำนำหน้า (EN)" value={form.prefixEn} onChange={v=> setForm(s=>({...s,prefixEn:v}))}/>
            <Input label="Suffix (EN)" value={form.suffixEn} onChange={v=> setForm(s=>({...s,suffixEn:v}))}/>
            <Input label="ชื่อเล่น" value={form.nickName} onChange={v=> setForm(s=>({...s,nickName:v}))}/>
          </div>
        </Section>

        <Section title="ข้อมูลติดต่อ / งาน">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Input label="สัญชาติ" value={form.nationality} onChange={v=> setForm(s=>({...s,nationality:v}))}/>
            <Input label="อาชีพ" value={form.occupation} onChange={v=> setForm(s=>({...s,occupation:v}))}/>
            <Input label="Line ID" value={form.lineId} onChange={v=> setForm(s=>({...s,lineId:v}))}/>
            <Input label="สถานที่ทำงาน" value={form.workPlace} onChange={v=> setForm(s=>({...s,workPlace:v}))}/>
            <Input label="ที่อยู่ที่ทำงาน" value={form.workAddress} onChange={v=> setForm(s=>({...s,workAddress:v}))}/>
            <Input label="เบอร์ที่ทำงาน" value={form.workPhone} onChange={v=> setForm(s=>({...s,workPhone:v}))}/>
            <Input label="ตำแหน่ง" value={form.workPosition} onChange={v=> setForm(s=>({...s,workPosition:v}))}/>
          </div>
        </Section>

        <Section title="ออกใบกำกับภาษี">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Input label="ชื่อสาขา/หน่วยงาน (branchName)" value={form.branchName} onChange={v=> setForm(s=>({...s,branchName:v}))}/>
            <Input label="ประเภทใบกำกับ (receiptType)" value={form.receiptType} onChange={v=> setForm(s=>({...s,receiptType:v}))}/>
            <Input label="รูปแบบที่อยู่ใบกำกับ (receiptAddressType)" value={form.receiptAddressType} onChange={v=> setForm(s=>({...s,receiptAddressType:v}))}/>
            <Input label="ที่อยู่ใบกำกับ (ระบุเอง)" value={form.receiptAddressOther} onChange={v=> setForm(s=>({...s,receiptAddressOther:v}))}/>
            <Input label="เลขผู้เสียภาษี (Tax ID)" value={form.taxId} onChange={v=> setForm(s=>({...s,taxId:v}))}/>
          </div>
        </Section>

        <Section title="การชำระเงิน">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input label="สถานะชำระ (payment_status)" value={form.payment_status} onChange={v=> setForm(s=>({...s,payment_status:v}))}/>
            <Input label="ช่องทาง (payment_gateway)" value={form.payment_gateway} onChange={v=> setForm(s=>({...s,payment_gateway:v}))}/>
            <Input label="อ้างอิง (payment_ref)" value={form.payment_ref} onChange={v=> setForm(s=>({...s,payment_ref:v}))}/>
            <Input label="สลิป URL" value={form.payment_slip_url} onChange={v=> setForm(s=>({...s,payment_slip_url:v}))}/>
          </div>
        </Section>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border">
            <FiX className="inline mr-1" /> ยกเลิก
          </button>
          <button disabled={saving} className="h-10 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            <FiSave className="inline mr-1" /> บันทึก
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- UI helpers ---------------- */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border p-4 md:p-6">
        <div className="flex items-center justify-between pb-3 border-b">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-gray-100">
            <FiX />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type="text" }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-gray-600 mb-1">{label}</div>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e)=> onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="font-semibold text-gray-700 mb-2">{title}</div>
      <div className="p-3 rounded-xl border bg-gray-50">{children}</div>
    </div>
  );
}

function ConfirmDialog({ title, message, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border p-6">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="h-10 px-4 rounded-lg border">
            <FiX className="inline mr-1" /> ยกเลิก
          </button>
          <button onClick={onConfirm} className="h-10 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700">
            <FiTrash2 className="inline mr-1" /> ลบ
          </button>
        </div>
      </div>
    </div>
  );
}
