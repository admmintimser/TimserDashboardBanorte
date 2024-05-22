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

    const handleUpdateDevelab = async (appointmentId, newStatus, appointment) => {
        try {
            // Verificar y asignar sampleLocationValue si está vacío
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
                { withCredentials: true }
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
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.length > 0 ? appointments.map((appointment) => (
                            <tr key={appointment._id}>
                                <td>{`${appointment.patientFirstName} ${appointment.patientLastName}`}</td>
                                <td>{appointment.sampleLocation}</td>
                                <td>{`${appointment.fastingHours} horas`}</td>
                                <td>
                                    <button
                                        onClick={() => handleUpdateDevelab(appointment._id, true, appointment)}
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Procesar Toma
                                    </button>
                                </td>
                            </tr>
                        )) : <tr>
                            <td colSpan="6">No appointments found.</td>
                        </tr>}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Dashboard;
