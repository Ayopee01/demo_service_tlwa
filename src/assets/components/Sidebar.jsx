import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaPlus,
  FaEdit,
  FaRegIdCard,
  FaPercentage,
  FaRegEdit,
} from "react-icons/fa";

const menu = [
  { to: "/", label: "เพิ่มคอร์สใหม่", icon: <FaPlus /> },
  { to: "/add-card", label: "เพิ่ม Card คอร์ส", icon: <FaRegIdCard /> },
  { to: "/discounts", label: "จัดการส่วนลดคอร์ส", icon: <FaPercentage /> },
  { to: "/edit", label: "แก้ไขคอร์ส", icon: <FaEdit /> },        // <== ตรงกับ Route /edit
  { to: "/edit-card", label: "แก้ไข Card คอร์ส", icon: <FaRegEdit /> }, // <== ตรงกับ Route /edit-card
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r shadow-md flex flex-col py-6 px-3 z-30">
      <div className="mb-10 text-2xl font-bold text-blue-700 flex items-center gap-2 px-2">
        <FaHome />
        <span>Course Admin</span>
      </div>
      <nav className="flex flex-col gap-1">
        {menu.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all hover:bg-blue-50
              ${isActive
                ? "bg-blue-100 text-blue-700 font-bold border-l-4 border-blue-600"
                : "text-gray-700"
              }`
            }
            end={to === "/"}
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
