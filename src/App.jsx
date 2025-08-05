import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./assets/components/Sidebar";
// Menu
import AddCourse from './assets/components/AddCourse';
import AddCourseCard from "./assets/components/AddCourseCard";
import AddDiscount from "./assets/components/AddDiscount";
import EditCourseCard from "./assets/components/EditCourseCard";
import EditCourse from './assets/components/EditCourse';
import CourseOrdersTable from "./assets/components/CourseOrdersTable";
import ManageSpeakers from "./assets/components/ManageSpeakers";

import ManageNews from "./assets/components/AdminAddNews";
import AddNewsDetail from "./assets/components/AddNewsDetail";

function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-56 min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<AddCourse />} />
            <Route path="/add-card" element={<AddCourseCard />} />
            <Route path="/discounts" element={<AddDiscount />} />
            <Route path="/edit" element={<EditCourse />} />
            <Route path="/edit-card" element={<EditCourseCard />} />
            <Route path="/course-orders" element={<CourseOrdersTable />} />
            <Route path="/speakers" element={<ManageSpeakers />} />
            {/* --------- ระบบข่าว --------- */}
            <Route path="/addnews" element={<ManageNews />} />
            {/* --------- ระบบข่าว --------- */}
            <Route path="/addnewsdetail" element={<AddNewsDetail />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
