import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Dashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [formValues, setFormValues] = useState({});
    const { isAuthenticated, admin } = useContext(Context);

    const fetchData = async () => {
        try {
            const { data } = await axios.get(
                "https://webapitimser.azurewebsites.net/api/v1/appointment/getall",
                { withCredentials: true }
            );
            setAppointments(data.appointments.reverse());
        } catch (error) {
            console.error("Error fetching data", error);
            setAppointments([]);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdateAppointment = async (appointmentId, updatedFields) => {
        try {
            const { data } = await axios.put(
                `https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointmentId}`,
                updatedFields, { withCredentials: true }
            );
            setAppointments((prevAppointments) => prevAppointments.map(
                (appt) => appt._id === appointmentId ? { ...appt, ...updatedFields } : appt
            ));
            toast.success("Cita actualizada con éxito");
            setEditingAppointment(null);
        } catch (error) {
            toast.error("Error al actualizar la cita");
            console.error(error);
        }
    };

    const handleEditClick = (appointment) => {
        setEditingAppointment(appointment._id);
        setFormValues(appointment);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleUpdateAppointment(editingAppointment, formValues);
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
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
                <h5>Preventix</h5>
                <button onClick={fetchData} className="update-button">Actualizar</button>
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Lugar de toma</th>
                            <th>Ayuno</th>
                            <th>Tomada</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.length > 0 ? appointments.map((appointment) => (
                            <tr key={appointment._id}>
                                {editingAppointment === appointment._id ? (
                                    <td colSpan="5">
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
                                                type="text"
                                                name="fastingHours"
                                                value={formValues.fastingHours}
                                                onChange={handleInputChange}
                                                className="input"
                                            />
                                            <button type="submit" className="update-button">Guardar</button>
                                            <button type="button" onClick={() => setEditingAppointment(null)} className="cancel-button">Cancelar</button>
                                        </form>
                                    </td>
                                ) : (
                                    <>
                                        <td>{`${appointment.patientFirstName} ${appointment.patientLastName}`}</td>
                                        <td>{appointment.sampleLocation}</td>
                                        <td>{`${appointment.fastingHours} horas`}</td>
                                        <td>
                                            <button
                                                onClick={() => handleUpdateAppointment(appointment._id, { tomaEntregada: true })}
                                                className="processbot"
                                            >
                                                Procesar Toma
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleEditClick(appointment)}
                                                className="update-button"
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        )) : <tr>
                            <td colSpan="5">No appointments found.</td>
                        </tr>}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Dashboard;
