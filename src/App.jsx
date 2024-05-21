import React, { useContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import DashboardClient from "./components/DashboardClient";
import Login from "./components/Login";
import AddNewDoctor from "./components/AddNewDoctor";
import Messages from "./components/Messages";
import Doctors from "./components/Doctors";
import Flebos from "./components/Flebos";
import { Context } from "./main";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./components/Sidebar";
import AddNewAdmin from "./components/AddNewAdmin";
import AddNewFleb from "./components/AddNewFleb";
import Elisas from "./components/Elisas";
import WesternBlot from "./components/WesternBlot";
import Informe from './components/Informe';
import "./App.css";

const App = () => {
  const { isAuthenticated, setIsAuthenticated, admin, setAdmin } =
    useContext(Context);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          "https://webapitimser.azurewebsites.net/api/v1/user/admin/me",
          {
            withCredentials: true,
          }
        );
        setIsAuthenticated(true);
        setAdmin(response.data.user);
      } catch (error) {
        setIsAuthenticated(false);
        setAdmin({});
      }
    };
    fetchUser();
  }, [isAuthenticated]);

  return (
    <Router>
      <Sidebar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/doctor/addnew" element={<AddNewDoctor />} />
        <Route path="/admin/addnew" element={<AddNewAdmin />} />
        <Route path="/flebo/addnew" element={<AddNewFleb />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/flebos" element={<Flebos />} />
        <Route path="/dashclient" element={<DashboardClient />} />
        <Route path="/elisas" element={<Elisas />} />
        <Route path="/westernblot" element={<WesternBlot />} />
        <Route path="/data-for-dashboard" element={<Informe />}></Route>
      </Routes>
      <ToastContainer position="top-center" />
    </Router>
  );
};

export default App;
