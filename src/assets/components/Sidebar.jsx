import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaPlus,
  FaEdit,
  FaRegIdCard,
  FaPercentage,
  FaRegEdit,
  FaClipboardList,
  FaUserFriends,
  FaRegNewspaper,
  FaNewspaper,
  FaYoutube,
} from "react-icons/fa";

const menu = [
  // Manage Course
  { to: "/", label: "Add Course", icon: <FaPlus /> },
  { to: "/add-card", label: "Add Course Card", icon: <FaRegIdCard /> },
  // Manage User Member
  { to: "/users-members", label: "User Member", icon: <FaPercentage /> },
  // Manage CourseOrders
  { to: "/course-orders", label: "Order Course", icon: <FaClipboardList /> },
  // Manage Speakers
  { to: "/speakers", label: "Manage Speakers", icon: <FaUserFriends /> },
  // Manage News
  { to: "/addnews", label: "Add News Title", icon: <FaRegNewspaper /> },
  { to: "/addnewsdetail", label: "Add News Detail", icon: <FaNewspaper /> },
  // Manage Video
  { to: "/admin/videos", label: "Add Youtube Video", icon: <FaYoutube className="text-red-500" /> },
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
