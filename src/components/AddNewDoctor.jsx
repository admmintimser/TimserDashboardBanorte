import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../main";
import axios from "axios";

const AddNewDoctor = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(Context);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [password, setPassword] = useState("");

  const navigateTo = useNavigate();

  

  

  const handleAddNewDoctor = async (e) => {
    e.preventDefault();
    const doctorData = {
      firstName,
      lastName,
      email,
      phone,
      password,
      nic,
      role: "Doctor"  // Explicitly setting the role
    };
  
    try {
      await axios.post("https://webapitimser.azurewebsites.net/api/v1/user/doctor/addnew", doctorData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }).then((res) => {
        toast.success(res.data.message);
        setIsAuthenticated(true);
        navigateTo("/");
        // Resetting fields after successful registration
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setNic("");
        setPassword("");
      });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };
  

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }
  return (
    <section className="page">
      <section className="container add-doctor-form">
        <img src="/logo.png" alt="logo" className="logo"/>
        <h1 className="form-title">Registrar nuevo cliente</h1>
        <form onSubmit={handleAddNewDoctor}>
          <div className="first-wrapper">
            
            <div>
              <input
                type="text"
                placeholder="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Dirección"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <input
                type="number"
                placeholder="Número de teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                type="number"
                placeholder="Código Develab"
                value={nic}
                onChange={(e) => setNic(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit">Registrar cliente</button>
            </div>
          </div>
        </form>
      </section>
    </section>
  );
};

export default AddNewDoctor;
