import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { questions } from './questionData';
import SliderInput from './SliderInput';
import './AppointmentForm.scss';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AppointmentForm = () => {
    const { register, handleSubmit, setValue, getValues, reset, formState: { errors } } = useForm();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isFormComplete, setIsFormComplete] = useState(false);
    const [showFastingError, setShowFastingError] = useState(false);
    const [weight, setWeight] = useState(70); // Default weight
    const [height, setHeight] = useState(170); // Default height
    const [submittedData, setSubmittedData] = useState(null);

    const onSubmit = async (formData) => {
        const calculateFastingHours = (lastMealTimeStr) => {
            if (!lastMealTimeStr) 
                return 0;
            
            const lastMealDate = new Date();
            const timeParts = lastMealTimeStr.split(':');
            lastMealDate.setHours(timeParts[0], timeParts[1], 0, 0);

            const currentDate = new Date();
            const fastingMilliseconds = currentDate - lastMealDate;
            const fastingHours = Math.floor(fastingMilliseconds / 3600000);

            return fastingHours > 0
                ? fastingHours
                : 0;
        };

        const selectedLocation = formData.sampleLocation;
        const sampleLocationQuestion = questions.find(q => q.field === 'sampleLocation');
        const sampleLocationValue = sampleLocationQuestion.mapping[selectedLocation] || null;

        const formattedData = {
            ...formData,
            privacyConsent: formData.privacyConsent === "Sí acepto",
            informedConsent: formData.informedConsent === "Sí acepto",
            weight: parseFloat(formData.weight) || 0,
            height: parseFloat(formData.height) || 0,
            lastMealTime: formData.lastMealTime
                ? new Date(`2021-01-01T${formData.lastMealTime}:00`).toISOString()
                : null,
            fastingHours: calculateFastingHours(formData.lastMealTime),
            sampleLocation: formData.sampleLocation || "default location",
            sampleLocationValue: sampleLocationValue
        };

        console.log('Sending data:', formattedData);

        try {
            const response = await axios.post(
                'https://webapitimser.azurewebsites.net/api/v1/appointment/post',
                formattedData,
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
            console.log('Response:', response.data);
            toast.success('Formulario enviado con éxito');
            setSubmittedData(formattedData);
            setIsFormComplete(true);
        } catch (error) {
            console.error(
                'Error al enviar formulario',
                error.response?.data.message || error.message
            );
            toast.error(error.response?.data.message || "An error occurred while submitting the form.");
        }
    };

    const handleNext = () => {
        const currentQuestion = questions[currentQuestionIndex];
        const answer = getValues()[currentQuestion.field];

        if (currentQuestion.id === 'fastingHoursQ' && answer === 'No') {
            setShowFastingError(true);
        } else {
            setShowFastingError(false);
            if (currentQuestion.nextq) {
                if (typeof currentQuestion.nextq === 'object') {
                    const nextQuestionId = currentQuestion.nextq[answer];
                    if (nextQuestionId === 'showFastingError') {
                        setShowFastingError(true);
                    } else if (nextQuestionId === 'close') {
                        setIsFormComplete(true);
                        handleSubmit(onSubmit)();
                    } else {
                        setCurrentQuestionIndex(questions.findIndex(q => q.id === nextQuestionId));
                    }
                } else if (currentQuestion.nextq === 'close') {
                    setIsFormComplete(true);
                    handleSubmit(onSubmit)();
                } else {
                    setCurrentQuestionIndex(questions.findIndex(q => q.id === currentQuestion.nextq));
                }
            } else {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            }
        }
        if (currentQuestion && currentQuestion.type !== 'choice') {
            setValue(currentQuestion.field, '');
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleAddAnotherForm = () => {
        reset();
        setCurrentQuestionIndex(0);
        setIsFormComplete(false);
        setShowFastingError(false);
    };

    const currentQuestion = questions[currentQuestionIndex];

    useEffect(() => {
        if (currentQuestion && currentQuestion.type !== 'choice') {
            setValue(currentQuestion.field, '');
        }
    }, [currentQuestionIndex, setValue, currentQuestion]);

    return (
        <div className="appointment-page">
            <ToastContainer />
            <div className="logos">
                <img src="/Logo-Preventix.png" alt="logo" className="logo-img"/>
                <img src="/BanorteMHS.png" alt="logoBanorte" className="logo-img"/>
            </div>
            <div className="container">
                <div className="center">
                    {showFastingError && (
                        <div className="banner-error">
                            Gracias por tu interés en aplicarte la prueba, pero no podemos realizártela si no cuentas con un ayuno menor a 6 horas.
                        </div>
                    )}
                    {!isFormComplete ? (
                        <form id="dynamic" onSubmit={handleSubmit(onSubmit)}>
                            {currentQuestion.type === 'slider' ? (
                                <SliderInput
                                    label={currentQuestion.label}
                                    min={currentQuestion.min}
                                    max={currentQuestion.max}
                                    value={currentQuestion.field === 'weight' ? weight : height}
                                    onChange={(e) => currentQuestion.field === 'weight' ? setWeight(e.target.value) : setHeight(e.target.value)}
                                    unit={currentQuestion.unit}
                                />
                            ) : (
                                <div className="question-wrap">
                                    <div className="question">{currentQuestion.question}</div>
                                    <div className="answer">
                                        {currentQuestion.type === 'choice' ? (
                                            currentQuestion.answers.map((answer, index) => (
                                                <div key={index}>
                                                    <label>
                                                        <input type="radio" value={answer} {...register(currentQuestion.field)} defaultChecked={index === 0} /> {answer}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            currentQuestion.type === 'time' && currentQuestion.id === 'lastMealTimeQ' ? (
                                                <input
                                                    type="time"
                                                    {...register(currentQuestion.field)}
                                                    min={new Date(new Date().getTime() - 4 * 60 * 60 * 1000).toISOString().substring(11, 16)}
                                                />
                                            ) : (
                                                <input type={currentQuestion.type} {...register(currentQuestion.field)} />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                            {currentQuestionIndex < questions.length - 1 && !showFastingError && (
                                <button type="button" onClick={handleNext}>Siguiente</button>
                            )}
                            {currentQuestionIndex > 0 && (
                                <button type="button" onClick={handleBack}>Atrás</button>
                            )}
                            
                        </form>
                    ) : (
                        <div>
                            <h2>¡Formulario enviado con éxito!</h2>
                            <button onClick={handleAddAnotherForm} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                Agregar otro Formulario
                            </button>
                            <button onClick={() => alert(JSON.stringify(submittedData, null, 2))} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                                Revisar tus respuestas
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentForm;
