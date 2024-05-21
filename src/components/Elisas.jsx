import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Elisas = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(
          "https://webapitimser.azurewebsites.net/api/v1/appointment/getall",
          { withCredentials: true }
        );
        setAppointments(data.appointments);
      } catch (error) {
        console.error("Error fetching data", error);
        setAppointments([]);
      }
    };
    fetchData();
  }, []);

  // General function to update appointment fields
  const handleUpdateField = async (appointmentId, field, newValue) => {
    try {
      const payload = { [field]: newValue };
      const { data } = await axios.put(
        `https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointmentId}`,
        payload,
        { withCredentials: true }
      );
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment._id === appointmentId
            ? { ...appointment, ...payload }
            : appointment
        )
      );
      toast.success(`Campo ${field} actualizado con éxito`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Error al actualizar el campo ${field}`);
    }
  };

  const { isAuthenticated, admin } = useContext(Context);
  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <>
      <section className="dashboard page">
      <div className="banner">
          <div className="firstBox">
            <div className="content">
              <div>
                <h5>{admin && `${admin.firstName} ${admin.lastName}`}</h5>
              </div>
            </div>
          </div>
          <div className="secondBox">
            <p>Pacientes</p>
            <h3>{appointments.length}</h3>
          </div>
          <div className="thirdBox">
            <p>Procesadas</p>
            <h3>{appointments.filter(appt => appt.tomaProcesada).length}</h3>
          </div>
        </div>
        <div className="banner">
          <h5>Elisas</h5>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Folio</th>
                <th>Ayuno</th>
                <th>Fecha de Proceso</th>
                <th>Placa de Proceso</th>
                <th>Resultado 4PL</th>
                <th>Interpretación Preventix</th>
                <th>Observaciones Elisas</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? appointments.map((appointment) => (
                <tr key={appointment._id}>
                  
                  
                  <td>{`${appointment.patientFirstName} ${appointment.patientLastName}`}</td>
                  <td>{appointment.FolioDevelab}</td>
                  <td>{`${appointment.fastingHours} horas`}</td>
                  
                  <td>
                    <input
                      type="date"
                      value={appointment.fechaProceso ? new Date(appointment.fechaProceso).toISOString().slice(0, 10) : ''}
                      onChange={(e) => handleUpdateField(appointment._id, 'fechaProceso', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={appointment.placaProceso || ''}
                      onChange={(e) => handleUpdateField(appointment._id, 'placaProceso', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={appointment.resultado4PL || ''}
                      onChange={(e) => handleUpdateField(appointment._id, 'resultado4PL', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={appointment.interpretacionPreventix || ''}
                      onChange={(e) => handleUpdateField(appointment._id, 'interpretacionPreventix', e.target.value)}
                    />
                  </td>
                  
                  <td>
                    <input
                      type="text"
                      value={appointment.observacionesE || ''}
                      onChange={(e) => handleUpdateField(appointment._id, 'observacionesE', e.target.value)}
                    />
                  </td>
                </tr>
              )) : <tr><td colSpan="10">No appointments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default Elisas;
