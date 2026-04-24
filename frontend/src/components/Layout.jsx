import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">{children ?? <Outlet />}</main>
    </div>
  );
};

export default Layout;
