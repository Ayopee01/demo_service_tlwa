import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./assets/components/Sidebar";
// Manage Course
import AddCourse from './assets/components/AddCourse';
import AddCourseCard from "./assets/components/AddCourseCard";
// Manage User Member
import AdminUsersMembers from "./assets/components/AdminUsersMembers";
// Manage CourseOrders
import CourseOrdersTable from "./assets/components/CourseOrdersTable";
// Manage Speakers
import ManageSpeakers from "./assets/components/ManageSpeakers";
// Manage News
import ManageNews from "./assets/components/AdminAddNews";
import AddNewsDetail from "./assets/components/AddNewsDetail";
// Manage Video
import AdminAddVideo from "./assets/components/AdminAddVideo";

function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-56 min-h-screen bg-gray-50">
          <Routes>
            {/* --------- Manage Course --------- */}
            <Route path="/" element={<AddCourse />} />
            <Route path="/add-card" element={<AddCourseCard />} />
            {/* --------- Manage User Member --------- */}
            <Route path="/users-members" element={<AdminUsersMembers />} />
            {/* --------- Manage CourseOrders --------- */}
            <Route path="/course-orders" element={<CourseOrdersTable />} />
            {/* --------- Manage Speakers --------- */}
            <Route path="/speakers" element={<ManageSpeakers />} />
            {/* --------- Manage News --------- */}
            <Route path="/addnews" element={<ManageNews />} />
            <Route path="/addnewsdetail" element={<AddNewsDetail />} />
            {/* --------- Manage Video --------- */}
            <Route path="/admin/videos" element={<AdminAddVideo />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
