import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import './dashboard.css'; // Asegúrate de importar los estilos CSS
import { FaSearch } from "react-icons/fa";

const DashboardClient = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("https://webapitimser.azurewebsites.net/api/v1/appointment/getall", { withCredentials: true });
        setAppointments(data.appointments);
      } catch (error) {
        console.error("Error fetching data", error);
        toast.error("Error al cargar los datos");
        setAppointments([]);
      }
    };
    fetchData();
  }, []);

  const { isAuthenticated } = useContext(Context);
  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <div className="dashboard page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>
      <div className="dashboard-cards">
        <div className="card1">
          <div className="card-content">
            <span className="card-title">Pacientes</span>
            <p className="card-value">{appointments.length}</p>
          </div>
        </div>
        <div className="card1">
          <div className="card-content">
            <span className="card-title">Tomadas</span>
            <p className="card-value">{appointments.filter(appt => appt.tomaEntregada).length}</p>
          </div>
        </div>
        <div className="card1">
          <div className="card-content">
            <span className="card-title">Resultados</span>
            <p className="card-value">{appointments.filter(appt => appt.tomaEntregada).length}</p>
          </div>
        </div>
        <div className="card1">
          <div className="card-content">
            <span className="card-title">Búsqueda</span>
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o lugar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value.toLowerCase())}
              className="search-input"
            />
            <FaSearch className="card-icon" />
          </div>
        </div>
      </div>
      
      <div className="appointments-list">
        <h2>Pacientes</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Lugar de toma</th>
              <th>Ayuno</th>
              <th>Procesada</th>
              <th>Flebotomista</th>
              <th>Fecha y Hora de Toma</th>
              <th>Correo</th>
            </tr>
          </thead>
          <tbody>
  {appointments.filter(appointment => 
    appointment.patientFirstName.toLowerCase().includes(searchTerm) ||
    appointment.patientLastName.toLowerCase().includes(searchTerm) ||
    appointment.sampleLocation.toLowerCase().includes(searchTerm)
  ).map((appointment, index) => (
    <tr key={index}>
      <td>{`${appointment.patientFirstName} ${appointment.patientLastName}`}</td>
      <td>{appointment.sampleLocation}</td>
      <td>{`${appointment.fastingHours} horas`}</td>
      <td>{appointment.tomaEntregada ? "Sí" : "No"}</td>
      <td>{appointment.flebotomista}</td>
      <td>{new Date(appointment.fechaToma).toLocaleString()}</td>
      <td>{appointment.email}</td>
    </tr>
  ))}
</tbody>

        </table>
      </div>
    </div>
  );
};

export default DashboardClient;
