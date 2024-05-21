import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Dashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [tokenDevel, setTokenDevel] = useState(null);
    const { isAuthenticated, authToken, admin } = useContext(Context);
    const [searchTerm, setSearchTerm] = useState('');

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

    const handleUpdateToma = async (appointmentId, newStatus, appointment) => {
        try {
            const { data } = await axios.put(
                `https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointmentId}`,
                {
                    tomaProcesada: newStatus
                },
                { withCredentials: true }
            );

            setAppointments((prevAppointments) => prevAppointments.map(
                (appt) => appt._id === appointmentId
                    ? { ...appt, tomaProcesada: newStatus }
                    : appt
            ));

            toast.success("Estatus de toma actualizado con éxito");
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Error al actualizar el estatus de toma"
            );
        }
    };

    const handleUpdateDevelab = async (appointmentId, newStatus, appointment) => {
        try {
            const { data } = await axios.put(
                `https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointmentId}`,
                {
                    tomaEntregada: newStatus
                },
                { withCredentials: true }
            );

            setAppointments((prevAppointments) => prevAppointments.map(
                (appt) => appt._id === appointmentId
                    ? { ...appt, tomaEntregada: newStatus }
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
            // Login and get TokenDevel
            const loginResponse = await axios.post("https://webapi.devellab.mx/api/Account/login", {
                username: "mhs",
                password: "cd098f3b9eae4ae7af3911aec1847d76"
            });
            const token = loginResponse.data.accessToken;
            setTokenDevel(token);

            // Create JSON1 and POST to /Patient
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

            // Ensure sampleDate is correctly formatted
            const sampleDate = new Date(appointment.fechaToma).toISOString().slice(0, 16);

            // Create JSON2 and POST to /Order
            const orderData = {
                branchId: 1,
                patientId: customerId,
                observations: "",
                customerId: appointment.sampleLocation,
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

    const handleUpdateFlebo = async (appointmentId, newFlebo) => {
        try {
            const { data } = await axios.put(
                `https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointmentId}`,
                {
                    flebotomista: newFlebo
                },
                { withCredentials: true }
            );
            setAppointments((prevAppointments) => prevAppointments.map(
                (appointment) => appointment._id === appointmentId
                    ? { ...appointment, flebotomista: newFlebo }
                    : appointment
            ));
            toast.success("Flebotomista actualizado con éxito");
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Error al actualizar el flebotomista"
            );
        }
    };

    const handleUpdateDateTime = async (appointmentId, newDateTime) => {
        try {
            const { data } = await axios.put(
                `https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointmentId}`,
                {
                    fechaToma: newDateTime
                },
                { withCredentials: true }
            );
            setAppointments((prevAppointments) => prevAppointments.map(
                (appointment) => appointment._id === appointmentId
                    ? { ...appointment, fechaToma: newDateTime }
                    : appointment
            ));
            toast.success("Fecha y hora actualizadas con éxito");
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Error al actualizar la fecha y hora"
            );
        }
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
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Lugar de toma</th>
                            <th>Ayuno</th>
                            <th>Tomada</th>
                            <th>Flebotomista</th>
                            <th>Fecha y Hora de Toma</th>
                            <th>Estatus Develab</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.length > 0 ? appointments.map((appointment) => (
                            <tr key={appointment._id}>
                                <td>{`${appointment.patientFirstName} ${appointment.patientLastName}`}</td>
                                <td>{appointment.sampleLocation}</td>
                                <td>{`${appointment.fastingHours} horas`}</td>
                                <td>
                                    <select
                                        value={appointment.tomaProcesada}
                                        onChange={(e) => handleUpdateToma(appointment._id, e.target.value === 'true', appointment)}
                                        className={appointment.tomaProcesada ? "value-accepted" : "value-rejected"}
                                    >
                                        <option value="false">Pendiente</option>
                                        <option value="true">Tomada</option>
                                    </select>
                                </td>
                                <td>
                                    <select
                                        value={appointment.flebotomista}
                                        onChange={(e) => handleUpdateFlebo(appointment._id, e.target.value)}
                                        className="dropdown-selector"
                                    >
                                        <option value="">Selecciona un flebotomista</option>
                                        <option value="Gabriela Mata">Gabriela Mata</option>
                                        <option value="Nohemi Garcia">Nohemi Garcia</option>
                                        <option value="Ayudante MHS">Ayudante MHS</option>
                                        <option value="MHS">MHS</option>
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type="datetime-local"
                                        value={appointment.fechaToma ? new Date(appointment.fechaToma).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => handleUpdateDateTime(appointment._id, e.target.value)}
                                        className="date-time-input"
                                    />
                                </td>
                                <td>
                                    <select
                                        value={appointment.tomaEntregada}
                                        onChange={(e) => handleUpdateDevelab(appointment._id, e.target.value === 'true', appointment)}
                                        className={appointment.tomaEntregada ? "value-accepted" : "value-rejected"}
                                    >
                                        <option value="false">Pendiente</option>
                                        <option value="true">Enviada</option>
                                    </select>
                                </td>
                            </tr>
                        )) : <tr>
                            <td colSpan="7">No appointments found.</td>
                        </tr>}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Dashboard;
