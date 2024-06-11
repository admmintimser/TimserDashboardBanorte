import React, { useContext, useEffect, useState, useCallback } from "react";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FaSearch } from "react-icons/fa";
import PrintButton from "./PrintButton";

const locationMapping = {
    '16 de septiembre': 1915,
    'Suprema Corte': 1916,
    'Bolivar': 1917,
    'Pino Suaréz': 1918,
    'Toluca': 1919,
    'Chimalpopoca': 1920
};

const Dashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [appointmentCounts, setAppointmentCounts] = useState({ today: 0, todayProcessed: 0 });
    const [tokenDevel, setTokenDevel] = useState(null);
    const { isAuthenticated, authToken, admin } = useContext(Context);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [formValues, setFormValues] = useState({
        privacyConsent: true,
        informedConsent: true,
        fastingHours: 4,
        patientFirstName: '',
        patientLastName: '',
        email: '',
        birthDate: '',
        mobilePhone: '',
        sampleLocation: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [successfulUpdates, setSuccessfulUpdates] = useState({});
    const [showModal, setShowModal] = useState(false);

    const fetchData = useCallback(async (url, updateFunc, defaultValue = []) => {
        try {
            const response = await axios.get(url, { withCredentials: true });
            updateFunc(response.data.appointments || response.data.count || defaultValue);
        } catch (error) {
            toast.error(`Error fetching data: ${error.message}`);
            updateFunc(defaultValue);
        }
    }, []);

    useEffect(() => {
        fetchData("https://webapitimser.azurewebsites.net/api/v1/appointment/getall", setAppointments);
        fetchData("https://webapitimser.azurewebsites.net/api/v1/appointment/count/today", (count) => setAppointmentCounts(prev => ({ ...prev, today: count })));
        fetchData("https://webapitimser.azurewebsites.net/api/v1/appointment/count/today-processed", (count) => setAppointmentCounts(prev => ({ ...prev, todayProcessed: count })));
        
        const interval = setInterval(() => {
            fetchData("https://webapitimser.azurewebsites.net/api/v1/appointment/getall", setAppointments);
            fetchData("https://webapitimser.azurewebsites.net/api/v1/appointment/count/today", (count) => setAppointmentCounts(prev => ({ ...prev, today: count })));
            fetchData("https://webapitimser.azurewebsites.net/api/v1/appointment/count/today-processed", (count) => setAppointmentCounts(prev => ({ ...prev, todayProcessed: count })));
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchData]);

    const addPatient = () => setShowModal(true);
    const handleModalClose = () => {
        setShowModal(false);
        setFormValues({
            privacyConsent: true,
            informedConsent: true,
            fastingHours: 4,
            patientFirstName: '',
            patientLastName: '',
            email: '',
            birthDate: '',
            mobilePhone: '',
            sampleLocation: ''
        });
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormValues(prevValues => ({
            ...prevValues,
            [name]: type === 'checkbox' ? checked : value,
            ...(name === 'email' && { confirmEmail: value })
        }));
    };

    const handleFormSubmit1 = async (e) => {
        e.preventDefault();
        try {
            await axios.post("https://webapitimser.azurewebsites.net/api/v1/appointment/post", formValues, { withCredentials: true });
            toast.success("Cita creada con éxito");
            handleModalClose();
            fetchData("https://webapitimser.azurewebsites.net/api/v1/appointment/getall", setAppointments);
        } catch (error) {
            toast.error(`Error al crear la cita: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleUpdateDevelab = async (appointmentId, newStatus, appointment) => {
        if (successfulUpdates[appointmentId] && !window.confirm("Esta cita ya fue procesada con éxito. ¿Deseas enviar de nuevo?")) return;

        try {
            const sampleLocationValue = locationMapping[appointment.sampleLocation] || appointment.sampleLocationValue;
            const currentDateTime = new Date().toISOString();

            await axios.put(`https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointmentId}`, {
                tomaEntregada: newStatus,
                tomaProcesada: true,
                fechaToma: currentDateTime,
                sampleLocationValue
            }, { withCredentials: true, headers: { Authorization: `Bearer ${authToken}` } });

            setAppointments(prevAppointments => prevAppointments.map(appt => 
                appt._id === appointmentId ? { ...appt, tomaEntregada: newStatus, tomaProcesada: true, fechaToma: currentDateTime, sampleLocationValue } : appt
            ));

            setSuccessfulUpdates(prev => ({ ...prev, [appointmentId]: true }));
            toast.success("Estatus Develab actualizado con éxito");

            if (newStatus) await performExternalApiCalls(appointment);
        } catch (error) {
            toast.error(`Error al actualizar el estatus Develab: ${error.response?.data?.message || error.message}`);
            setSuccessfulUpdates(prev => ({ ...prev, [appointmentId]: false }));
        }
    };

    const performExternalApiCalls = async (appointment) => {
        try {
            const { data: { accessToken: token } } = await axios.post("https://webapi.devellab.mx/api/Account/login", {
                username: "mhs",
                password: "cd098f3b9eae4ae7af3911aec1847d76"
            });
            setTokenDevel(token);

            const { data: { customerId } } = await axios.post("https://webapi.devellab.mx/api/Patient/", {
                code: "",
                name: appointment.patientFirstName,
                lastname: appointment.patientLastName,
                address: "",
                phone: appointment.mobilePhone,
                birthDate: appointment.birthDate,
                gender: "F",
                email: appointment.email,
                comment: "",
                customerId: -1
            }, { headers: { Authorization: `Bearer ${token}` } });

            const sampleDate = new Date(appointment.fechaToma || new Date()).toISOString().slice(0, 16);

            const { data: { orderNumber, orderId } } = await axios.post("https://webapi.devellab.mx/api/Order/", {
                branchId: 1,
                patientId: customerId,
                observations: "",
                customerId: 1783,
                sampleDate,
                exams: [{ examId: "E-470" }]
            }, { headers: { Authorization: `Bearer ${token}` } });

            await axios.put(`https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointment._id}`, { FolioDevelab: orderNumber, OrderIDDevelab: orderId }, { withCredentials: true, headers: { Authorization: `Bearer ${authToken}` } });

            setAppointments(prevAppointments => prevAppointments.map(appt => 
                appt._id === appointment._id ? { ...appt, FolioDevelab: orderNumber, OrderIDDevelab: orderId } : appt
            ));

            toast.success("Paciente cargado exitosamente a Devellab y actualizado localmente");
        } catch (error) {
            toast.error(`Error al procesar la información del paciente en Devellab: ${error.message}`);
        }
    };

    const handleDeleteAppointment = async (appointmentId) => {
        if (window.confirm("¿Estás seguro que deseas eliminar esta cita?")) {
            try {
                await axios.delete(`https://webapitimser.azurewebsites.net/api/v1/appointment/delete/${appointmentId}`, { withCredentials: true, headers: { Authorization: `Bearer ${authToken}` } });
                setAppointments(prevAppointments => prevAppointments.filter(appt => appt._id !== appointmentId));
                toast.success("Cita eliminada con éxito");
            } catch (error) {
                toast.error("Error al eliminar la cita");
            }
        }
    };

    const handleUpdateAppointment = async (appointmentId, updatedFields) => {
        try {
            await axios.put(`https://webapitimser.azurewebsites.net/api/v1/appointment/update/${appointmentId}`, updatedFields, { withCredentials: true, headers: { Authorization: `Bearer ${authToken}` } });
            setAppointments(prevAppointments => prevAppointments.map(appt => appt._id === appointmentId ? { ...appt, ...updatedFields } : appt));
            toast.success("Cita actualizada con éxito");
            setEditingAppointment(null);
            setFormValues({
                privacyConsent: true,
                informedConsent: true,
                fastingHours: 4,
                patientFirstName: '',
                patientLastName: '',
                email: '',
                birthDate: '',
                mobilePhone: '',
                sampleLocation: ''
            });
        } catch (error) {
            toast.error("Error al actualizar la cita");
        }
    };

    const handleEditClick = (appointment) => {
        setEditingAppointment(appointment._id);
        setFormValues({
            ...appointment,
            birthDate: formatDate(appointment.birthDate)
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prevValues => ({ ...prevValues, [name]: value }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleUpdateAppointment(editingAppointment, formValues);
    };

    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(appointments);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "appointments.xlsx");
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <section className="dashboard page">
            <div className="banner">
                <div className="secondBox">
                    <p>Cuestionarios</p>
                    <h3>{appointmentCounts.today}</h3>
                </div>
                <div className="secondBox">
                    <p>Tomadas</p>
                    <h3>{appointmentCounts.todayProcessed}</h3>
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
                            placeholder="Buscar por nombre, apellido o lugar..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value.toLowerCase())}
                            className="search-input"
                        />
                        <FaSearch className="card-icon" />
                    </div>
                </div>
            </div>
            <div className="banner">
                <button onClick={() => fetchData("https://webapitimser.azurewebsites.net/api/v1/appointment/getall", setAppointments)} className="update-button">Actualizar</button>
                <button onClick={downloadExcel} className="download-button">Descargar Excel</button>
                <button onClick={addPatient} className="appoin-button">Agregar</button>
                {showModal && (
                    <div className="modal">
                        <div className="modal-content">
                            <span className="close" onClick={handleModalClose}>&times;</span>
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
                                    value={formValues.sampleLocation}
                                    onChange={handleFormChange}
                                    className="input"
                                    required
                                >
                                    <option value="">Selecciona una ubicación</option>
                                    {Object.keys(locationMapping).map(location => (
                                        <option key={location} value={location}>{location}</option>
                                    ))}
                                </select>
                                <button type="submit" className="save-button">Guardar</button>
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
                        {appointments.length > 0 ? appointments.filter(appointment =>
                            appointment.patientFirstName.toLowerCase().includes(searchTerm) ||
                            appointment.patientLastName.toLowerCase().includes(searchTerm) ||
                            appointment.sampleLocation.toLowerCase().includes(searchTerm)
                        ).map((appointment) => (
                            <tr key={appointment._id}>
                                {editingAppointment === appointment._id ? (
                                    <td colSpan="7">
                                        <form onSubmit={handleFormSubmit}>
                                            <input
                                                type="text"
                                                name="patientFirstName"
                                                value={formValues.patientFirstName}
                                                onChange={handleInputChange}
                                                className="input"
                                            />
                                            <input
                                                type="email"
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
                                            <button type="submit" className="update-button">Guardar</button>
                                            <button type="button" onClick={() => setEditingAppointment(null)} className="cancel-button">Cancelar</button>
                                        </form>
                                    </td>
                                ) : (
                                    <>
                                        <td>{`${appointment.patientFirstName} ${appointment.patientLastName}`}</td>
                                        <td>{appointment.email}</td>
                                        <td>{appointment.sampleLocation}</td>
                                        <td>{formatDate(appointment.birthDate)}</td>
                                        <td>{`${appointment.fastingHours} horas`}</td>
                                        <td>
                                            <button
                                                onClick={() => handleUpdateDevelab(appointment._id, true, appointment)}
                                                className={`processbot ${appointment.tomaEntregada ? 'processbot-green' : ''}`}
                                            >
                                                Procesar Toma
                                            </button>
                                        </td>
                                        <td>
                                            <PrintButton appointment={appointment} />
                                            <button
                                                onClick={() => handleEditClick(appointment)}
                                                className="update-button1"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAppointment(appointment._id)}
                                                className="delete-button"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7">No se encontraron citas.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

const formatDate = (date) => new Date(date).toISOString().split('T')[0];

export default Dashboard;
