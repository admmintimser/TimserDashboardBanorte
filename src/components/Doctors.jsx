import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const { isAuthenticated } = useContext(Context);
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await axios.get(
          "https://webapitimser.azurewebsites.net/api/v1/user/doctors",
          { withCredentials: true }
        );
        setDoctors(data.doctors);
      } catch (error) {
        toast.error(error.response.data.message);
      }
    };
    fetchDoctors();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }
  return (
    <section className="paged doctors">
      <h1>Clientes</h1>
      <div className="banner">
  {doctors && doctors.length > 0 ? (
    doctors.map((doctor, index) => {
      return (
        <div className="card" >  
          <div className="details">
            <h4>{`${doctor.firstName}`}</h4>
            <p>Dirección: <span>{doctor.lastName}</span></p>
            <p>Correo: <span>{doctor.email}</span></p>
            <p>Teléfono: <span>{doctor.phone}</span></p>
            <p>Cliente: <span>{doctor.doctorDepartment}</span></p>
            <p>ID Develab: <span>{doctor.nic}</span></p>
          </div>
        </div>
      );
    })
  ) : (
    <h1>No Registered Found!</h1>
  )}
</div>
    </section>

    
  );
};

export default Doctors;
