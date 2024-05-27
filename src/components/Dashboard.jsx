import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const locationMapping = {
    '16 de Septiembre': 1915,
    '16 de septiembre': 1915,
    'Suprema Corte': 1916,
    'Bolivar': 1917,
    'Pino Suaréz': 1918,
    'Toluca': 1919,
    'Chimalpopoca': 1920
};

const Dashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [tokenDevel, setTokenDevel] = useState(null);
    const { isAuthenticated, authToken, admin } = useContext(Context);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [formValues, setFormValues] = useState({});

    const fetchData = async () => {
        try {
            const { data } = await axios.get(
                "https://webapitimser.azurewebsites.net/api/v1/appointment/getall",
                { withCredentials: true }
            );
            setAppointments(data.appointments.reverse()); // Mostrar citas en orden inverso
        } catch (error) {
            console.error("Error fetching data", error);
            setAppointments([]);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Actualizar cada minuto
        return () => clearInterval(interval);
    }, []);

    const handleUpdateDevelab = async (appointmentId, newStatus, appointment) => {
        try {
            if (!appointment.sampleLocationValue && appointment.sampleLocation) {
                appointment.sampleLocationValue = locationMapping[appointment.sampleLocation] || appointment.sampleLocationValue;
            }

            const currentDateTime = new Date().toISOString();
            const { data } = await axios.put(
                `https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointmentId}`,
                {
                    tomaEntregada: newStatus,
                    tomaProcesada: true,
                    fechaToma: currentDateTime,
                },
                { withCredentials: true, headers: { Authorization: `Bearer ${authToken}` } }
            );

            setAppointments((prevAppointments) => prevAppointments.map(
                (appt) => appt._id === appointmentId
                    ? { ...appt, tomaEntregada: newStatus, tomaProcesada: true, fechaToma: currentDateTime }
                    : appt
            ));

            toast.success("Estatus Develab actualizado con éxito");

            if (newStatus) {
                await performExternalApiCalls(appointment);
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Error al actualizar el estatus Develab"
            );
        }
    };

    const performExternalApiCalls = async (appointment) => {
        try {
            const loginResponse = await axios.post("https://webapi.devellab.mx/api/Account/login", {
                username: "mhs",
                password: "cd098f3b9eae4ae7af3911aec1847d76"
            });
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
                extraField6: ""
            };

            const patientResponse = await axios.post("https://webapi.devellab.mx/api/Patient/", patientData, {
                headers: {
                    accept: "*/*",
                    Authorization: `Bearer ${token}`
                }
            });
            const customerId = patientResponse.data.customerId;
            appointment.ClienteDevelab = customerId;

            const sampleDate = new Date(appointment.fechaToma).toISOString().slice(0, 16);

            const orderData = {
                branchId: 1,
                patientId: customerId,
                observations: "",
                customerId: appointment.sampleLocationValue,
                customerOrderNumber: "",
                extraField1: "",
                extraField2: "",
                extraField3: "",
                extraField4: "",
                extraField5: "",
                extraField6: "",
                exams: [
                    {
                        examId: "E-470"
                    }
                ],
                sampleDate: sampleDate
            };

            const orderResponse = await axios.post("https://webapi.devellab.mx/api/Order/", orderData, {
                headers: {
                    accept: "*/*",
                    Authorization: `Bearer ${token}`
                }
            });

            appointment.FolioDevelab = orderResponse.data.orderNumber;
            appointment.OrderIDDevelab = orderResponse.data.orderId;
            toast.success("Data sent to Develab successfully");
        } catch (error) {
            toast.error("Error while performing external API calls");
            console.error(error);
        }
    };

    const handleDeleteAppointment = async (appointmentId) => {
        try {
            await axios.delete(`https://webapitimser.azurewebsites.net/api/v1/appointment/delete/${appointmentId}`, { withCredentials: true, headers: { Authorization: `Bearer ${authToken}` } });
            setAppointments((prevAppointments) => prevAppointments.filter(appt => appt._id !== appointmentId));
            toast.success("Cita eliminada con éxito");
        } catch (error) {
            toast.error("Error al eliminar la cita");
            console.error(error);
        }
    };

    const handleUpdateAppointment = async (appointmentId, updatedFields) => {
        try {
            const { data } = await axios.put(`https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointmentId}`, updatedFields, { withCredentials: true, headers: { Authorization: `Bearer ${authToken}` } });
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
                    <p>Tomadas</p>
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
                                                onClick={() => handleUpdateDevelab(appointment._id, true, appointment)}
                                                className="processbot"
                                            >
                                                Procesar Toma
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleDeleteAppointment(appointment._id)}
                                                className="delete-button"
                                            >
                                                Eliminar
                                            </button>
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
