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
            <Route path="/edit-card" element={<TableEdit />} /> {/* <-- เพิ่ม Route ตรงนี้ */}
            <Route path="/edit/:id" element={<EditCourseCard />} /> {/* เหลือแค่ 1 อัน */}
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
