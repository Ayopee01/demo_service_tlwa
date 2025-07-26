import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./assets/components/Sidebar";
import CourseUpload from './assets/components/CourseUpload';
import DiscountForm from "./assets/components/DiscountForm";
import EditCourseCard from "./assets/components/EditCourseCard";
import TableEdit from './assets/components/TableEdit';
import CourseCardCreate from "./assets/components/CourseCardCreate";

function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-56 min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<CourseUpload />} />
            <Route path="/add-card" element={<CourseCardCreate />} />
            <Route path="/discounts" element={<DiscountForm />} />
            <Route path="/edit" element={<TableEdit />} />          {/* ✅ Route รวมแก้ไขคอร์ส */}
            <Route path="/edit-card" element={<EditCourseCard />} />{/* ✅ Route รวมแก้ไข Card */}
            <Route path="/edit/:id" element={<CourseUpload />} />   {/* ✅ Route แก้ไขคอร์สทีละตัว (แก้ component ตามจริง) */}
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
