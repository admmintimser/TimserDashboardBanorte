import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaSearch } from "react-icons/fa";
import PrintButton from "./PrintButton";
import moment from "moment-timezone";

const locationMapping = {
  "16 de septiembre": 1915,
  "Suprema Corte": 1916,
  Bolivar: 1917,
  "Pino Suaréz": 1918,
  Toluca: 1919,
  Chimalpopoca: 1920,
};

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [appointmentst, setAppointmentst] = useState([]);
  const [appointmentstp, setAppointmentstp] = useState([]);
  const [tokenDevel, setTokenDevel] = useState(null);
  const { isAuthenticated, authToken, admin } = useContext(Context);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formValues, setFormValues] = useState({
    privacyConsent: true,
    informedConsent: true,
    fastingHours: 4,
    patientFirstName: "",
    patientLastName: "",
    email: "",
    birthDate: "",
    mobilePhone: "",
    sampleLocation: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [successfulUpdates, setSuccessfulUpdates] = useState({});
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        "https://webapitimser.azurewebsites.net/api/v1/appointment/getall",
        { withCredentials: true }
      );
      if (response.data.appointments) {
        setAppointments(response.data.appointments.reverse());
      } else {
        throw new Error("No appointments data received");
      }
    } catch (error) {
      toast.error("Error fetching appointments: " + error.message);
      setAppointments([]);
    }
  };

  const fetchDatat = async () => {
    try {
      const response = await axios.get(
        "https://webapitimser.azurewebsites.net/api/v1/appointment/count/today",
        { withCredentials: true }
      );
      if (response.data.count !== undefined) {
        setAppointmentst(response.data.count);
      } else {
        throw new Error("No count data received");
      }
    } catch (error) {
      toast.error("Error fetching appointments: " + error.message);
      setAppointmentst(0);
    }
  };

  const fetchDatatp = async () => {
    try {
      const response = await axios.get(
        "https://webapitimser.azurewebsites.net/api/v1/appointment/count/today-processed",
        { withCredentials: true }
      );
      if (response.data.count !== undefined) {
        setAppointmentstp(response.data.count);
      } else {
        throw new Error("No count data received");
      }
    } catch (error) {
      toast.error("Error fetching appointments: " + error.message);
      setAppointmentstp(0);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDatat();
    fetchDatatp();
    const interval = setInterval(fetchData, 30000);
    const interval1 = setInterval(fetchDatat, 30000);
    const interval2 = setInterval(fetchDatatp, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, []);

  const addPatient = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormValues({
      privacyConsent: true,
      informedConsent: true,
      fastingHours: 4,
      patientFirstName: "",
      patientLastName: "",
      email: "",
      birthDate: "",
      mobilePhone: "",
      sampleLocation: "",
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedValue = type === "checkbox" ? checked : value;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: updatedValue,
      ...(name === "email" && { confirmEmail: updatedValue }),
    }));
  };

  const handleFormSubmit1 = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "https://webapitimser.azurewebsites.net/api/v1/appointment/post",
        {
          ...formValues,
          birthDate: moment(formValues.birthDate).tz("America/Mexico_City").format(),
        },
        {
          withCredentials: true,
        }
      );
      toast.success("Cita creada con éxito");
      handleModalClose();
      fetchData();
    } catch (error) {
      toast.error("Error al crear la cita: " + error.message);
    }
  };

  const handleUpdateDevelab = async (appointmentId, newStatus, appointment) => {
    if (successfulUpdates[appointmentId]) {
      const confirm = window.confirm(
        "Esta cita ya fue procesada con éxito. ¿Deseas enviar de nuevo?"
      );
      if (!confirm) {
        return;
      }
    }

    try {
      if (!appointment.sampleLocationValue && appointment.sampleLocation) {
        appointment.sampleLocationValue =
          locationMapping[appointment.sampleLocation] ||
          appointment.sampleLocationValue;
      }

      const currentDateTime = moment().tz("America/Mexico_City").toISOString();
      const { data } = await axios.put(
        `https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointmentId}`,
        {
          tomaEntregada: newStatus,
          tomaProcesada: true,
          fechaToma: currentDateTime,
        },
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      setAppointments((prevAppointments) =>
        prevAppointments.map((appt) =>
          appt._id === appointmentId
            ? {
                ...appt,
                tomaEntregada: newStatus,
                tomaProcesada: true,
                fechaToma: currentDateTime,
              }
            : appt
        )
      );

      setSuccessfulUpdates((prev) => ({ ...prev, [appointmentId]: true }));
      toast.success("Estatus Develab actualizado con éxito");

      if (newStatus) {
        await performExternalApiCalls(appointment);
      }
    } catch (error) {
      toast.error("Error al actualizar el estatus Develab");
      setSuccessfulUpdates((prev) => ({ ...prev, [appointmentId]: false }));
    }
  };

  const performExternalApiCalls = async (appointment) => {
    try {
      const loginResponse = await axios.post(
        "https://webapi.devellab.mx/api/Account/login",
        {
          username: "preventix",
          password: "7b5cbac342284010ac18f17ceba6364f",
        }
      );
      const token = loginResponse.data.accessToken;
      setTokenDevel(token);

      const patientData = {
        code: "",
        name: appointment.patientFirstName,
        lastname: appointment.patientLastName,
        address: "",
        phone: appointment.mobilePhone,
        birthDate: appointment.birthDate,
        gender: "F",
        email: appointment.email,
        comment: "",
        customerId: -1,
        extraField1: "",
        extraField2: "",
        extraField3: "",
        extraField4: "",
        extraField5: "",
        extraField6: "",
      };

      const patientResponse = await axios.post(
        "https://webapi.devellab.mx/api/Patient/",
        patientData,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const customerId = patientResponse.data.customerId;

      const fechaTomaValida = appointment.fechaToma
        ? moment(appointment.fechaToma).tz("America/Mexico_City")
        : moment().tz("America/Mexico_City");
      const sampleDate = fechaTomaValida.toISOString().slice(0, 16);

      const orderData = {
        branchId: 1,
        patientId: customerId,
        observations: "",
        customerId: 2371,
        customerOrderNumber: "",
        extraField1: "",
        extraField2: "",
        extraField3: "",
        extraField4: "",
        extraField5: "",
        extraField6: "",
        exams: [
          {
            examId: "E-470",
          },
        ],
        sampleDate: sampleDate,
      };

      const orderResponse = await axios.post(
        "https://webapi.devellab.mx/api/Order/",
        orderData,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updateFields = {
        FolioDevelab: orderResponse.data.orderNumber,
        OrderIDDevelab: orderResponse.data.orderId,
      };

      const updateResponse = await axios.put(
        `https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointment._id}`,
        updateFields,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      setAppointments((prevAppointments) =>
        prevAppointments.map((appt) => {
          if (appt._id === appointment._id) {
            return {
              ...appt,
              ...updateFields,
            };
          }
          return appt;
        })
      );

      toast.success(
        "Paciente cargado exitosamente a Devellab y actualizado localmente"
      );
    } catch (error) {
      toast.error(
        "Error al procesar la información del paciente en Devellab o localmente: " +
          error.message
      );
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm("¿Estás seguro que deseas eliminar esta cita?")) {
      try {
        await axios.delete(
          `https://webapitimser.azurewebsites.net/api/v1/appointment/delete/${appointmentId}`,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        setAppointments((prevAppointments) =>
          prevAppointments.filter((appt) => appt._id !== appointmentId)
        );
        toast.success("Cita eliminada con éxito");
      } catch (error) {
        toast.error("Error al eliminar la cita");
      }
    }
  };

  const handleUpdateAppointment = async (appointmentId, updatedFields) => {
    try {
      const { data } = await axios.put(
        `https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointmentId}`,
        {
          ...updatedFields,
          birthDate: moment(updatedFields.birthDate).tz("America/Mexico_City").format(),
        },
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setAppointments((prevAppointments) =>
        prevAppointments.map((appt) =>
          appt._id === appointmentId ? { ...appt, ...updatedFields } : appt
        )
      );
      toast.success("Cita actualizada con éxito");
      setEditingAppointment(null);
      setFormValues({
        privacyConsent: true,
        informedConsent: true,
        fastingHours: 4,
        patientFirstName: "",
        patientLastName: "",
        email: "",
        birthDate: "",
        mobilePhone: "",
        sampleLocation: "",
      });
    } catch (error) {
      toast.error("Error al actualizar la cita");
    }
  };

  const handleEditClick = (appointment) => {
    setEditingAppointment(appointment._id);
    setFormValues({
      ...appointment,
      birthDate: appointment.birthDate.split('T')[0], // mantener la fecha tal como viene de la base de datos
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleUpdateAppointment(editingAppointment, formValues);
  };

  const downloadExcel = async () => {
    try {
      const response = await axios.get(
        "https://webapitimser.azurewebsites.net/api/v1/appointment/getall/today",
        { withCredentials: true }
      );
  
      const appointments = response.data.appointments;
      
      const worksheet = XLSX.utils.json_to_sheet(appointments);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const data = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(data, "Reporte.xlsx");
    } catch (error) {
      toast.error("Error downloading Excel file: " + error.message);
    }
  };
  

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <section className="dashboard page">
      <div className="banner">
        <div className="secondBox">
          <p>Cuestionarios</p>
          <h3>{appointmentst}</h3>
        </div>
        <div className="secondBox">
          <p>Tomadas</p>
          <h3>{appointmentstp}</h3>
        </div>
        <div className="secondBox">
          <p>Pacientes</p>
          <h3>{appointments.length}</h3>
        </div>
        <div className="thirdBox">
          <div className="card-content">
            <span className="card-title">Búsqueda</span>
            <input
              type="text"
              placeholder="Buscar por ID, nombre, apellido o lugar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
              className="search-input"
            />
            <FaSearch className="card-icon" />
          </div>
        </div>
      </div>
      <div className="banner">
        <button
          onClick={() => {
            fetchData();
            fetchDatat();
            fetchDatatp();
          }}
          className="update-button"
        >
          Actualizar
        </button>
        <button onClick={downloadExcel} className="download-button">
          Descargar Excel
        </button>
        <button onClick={addPatient} className="appoin-button">
          Agregar
        </button>
        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={handleModalClose}>
                &times;
              </span>
              <h2>Agregar Nueva Cita</h2>
              <form onSubmit={handleFormSubmit1}>
                <input
                  type="text"
                  name="patientFirstName"
                  placeholder="Nombre"
                  value={formValues.patientFirstName}
                  onChange={handleFormChange}
                  className="input"
                  required
                />
                <input
                  type="text"
                  name="patientLastName"
                  placeholder="Apellido"
                  value={formValues.patientLastName}
                  onChange={handleFormChange}
                  className="input"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Correo Electrónico"
                  value={formValues.email}
                  onChange={handleFormChange}
                  className="input"
                  required
                />
                <input
                  type="date"
                  name="birthDate"
                  placeholder="Fecha de Nacimiento"
                  value={formValues.birthDate}
                  onChange={handleFormChange}
                  className="input"
                  required
                />
                <input
                  type="text"
                  name="mobilePhone"
                  placeholder="Teléfono móvil"
                  value={formValues.mobilePhone}
                  onChange={handleFormChange}
                  className="input"
                  required
                />
                <select
                  name="sampleLocation"
                  onChange={handleFormChange}
                  className="input"
                  required
                >
                  <option value="">Selecciona una ubicación</option>
                  <option value="Periférico 1950">Periférico 1950</option>
                  <option value="Sede Insurgentes - Sala de Ajustes">
                    Sede Insurgentes - Sala de Ajustes
                  </option>
                  <option value="Edificio Revolución - Aula Cristal">
                    Edificio Revolución - Aula Cristal
                  </option>
                  <option value="16 de septiembre">16 de septiembre</option>
                  <option value="Suprema Corte">Suprema Corte</option>
                  <option value="Bolivar">Bolivar</option>
                  <option value="Pino Suaréz">Pino Suaréz</option>
                  <option value="Toluca">Toluca</option>
                  <option value="Chimalpopoca">Chimalpopoca</option>
                </select>
                <button type="submit" className="save-button">
                  Guardar
                </button>
              </form>
            </div>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Lugar de toma</th>
              <th>Fecha de nacimiento</th>
              <th>Ayuno</th>
              <th>Tomada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? (
              appointments
                .filter(
                  (appointment) =>
                    appointment._id.toLowerCase().includes(searchTerm) ||
                    appointment.patientFirstName.toLowerCase().includes(searchTerm) ||
                    appointment.patientLastName.toLowerCase().includes(searchTerm) ||
                    appointment.sampleLocation.toLowerCase().includes(searchTerm)
                )
                .map((appointment) => (
                  <tr key={appointment._id}>
                    {editingAppointment === appointment._id ? (
                      <td colSpan="8">
                        <form onSubmit={handleFormSubmit}>
                          <input
                            type="text"
                            name="patientFirstName"
                            value={formValues.patientFirstName}
                            onChange={handleInputChange}
                            className="input"
                          />
                          <input
                            type="text"
                            name="email"
                            value={formValues.email}
                            onChange={handleInputChange}
                            className="input"
                          />
                          <input
                            type="text"
                            name="patientLastName"
                            value={formValues.patientLastName}
                            onChange={handleInputChange}
                            className="input"
                          />
                          <input
                            type="text"
                            name="sampleLocation"
                            value={formValues.sampleLocation}
                            onChange={handleInputChange}
                            className="input"
                          />
                          <input
                            type="date"
                            name="birthDate"
                            value={formValues.birthDate}
                            onChange={handleInputChange}
                            className="input"
                          />
                          <input
                            type="text"
                            name="fastingHours"
                            value={formValues.fastingHours}
                            onChange={handleInputChange}
                            className="input"
                          />
                          <button type="submit" className="update-button">
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAppointment(null)}
                            className="cancel-button"
                          >
                            Cancelar
                          </button>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td>{`${appointment.patientFirstName} ${appointment.patientLastName}`}</td>
                        <td>{appointment.email}</td>
                        <td>{appointment.sampleLocation}</td>
                        <td>{appointment.birthDate.split('T')[0]}</td> {/* Mostrar la fecha tal como viene de la base de datos */}
                        <td>{appointment.fastingHours}</td>
                        <td>
                          <button
                            onClick={() => handleUpdateDevelab(appointment._id, true, appointment)}
                            className={`processbot ${appointment.tomaEntregada ? "processbot-green" : ""}`}
                          >
                            Procesar Toma
                          </button>
                        </td>
                        <td>
                          <PrintButton appointment={appointment} />
                          <button onClick={() => handleEditClick(appointment)} className="update-button1">
                            Editar
                          </button>
                          <button onClick={() => handleDeleteAppointment(appointment._id)} className="delete-button">
                            Eliminar
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="8">No appointments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Dashboard;
