import React, { useRef, useEffect, forwardRef } from "react";
import bwipjs from "bwip-js";

const BarcodeLabel = forwardRef(({ appointment }, ref) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current && appointment.FolioDevelab) {
            try {
                bwipjs.toCanvas(canvasRef.current, {
                    bcid: 'code128', // Tipo de código de barras
                    text: String(appointment.FolioDevelab), // Convertir texto a string
                    scale: 3, // Factor de escala 3x
                    height: 10, // Altura de la barra, en milímetros
                    includetext: true, // Mostrar texto legible por humanos
                    textxalign: 'center', // Alinear texto al centro
                });
            } catch (e) {
                console.error('Error generating barcode:', e);
            }
        }
    }, [appointment.FolioDevelab]);

    // Verificar que las fechas existan antes de intentar usarlas
    const birthDate = appointment.birthDate ? appointment.birthDate.split('T')[0] : 'N/A';
    const fechaToma = appointment.fechaToma ? appointment.fechaToma.split('T')[0] : 'N/A';
    const age = appointment.birthDate ? new Date().getFullYear() - new Date(appointment.birthDate).getFullYear() : 'N/A';
    const nombre = (appointment.patientFirstName + " " + appointment.patientLastName).toUpperCase();
    const email = appointment.email;

    return (
        <div ref={ref} style={{ width: '120mm', height: '37mm', padding: '2mm', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: 'Arial' }} className="border border-gray-300 bg-white">
            <div style={{ width: '100%', fontSize: '9pt', lineHeight: '1em', fontWeight: '800', color: 'black', textAlign: 'left' }}>
                <div style={{ marginBottom: '1mm' }}>{nombre}</div>
            </div>
            <div style={{ width: '100%', fontSize: '7pt', lineHeight: '1em', fontWeight: '700', color: 'black', textAlign: 'left' }}>
                <div>BANORTE  -  {age}A  -  Fem</div>
                <div >F.Nac: {birthDate}  -  F.Orden: {fechaToma}</div>
                <div style={{ marginBottom: '1mm' }}>{email}</div>
            </div>
            <div style={{ width: '100%', fontSize: '10pt', lineHeight: '1.2em', fontWeight: '700', color: 'black', textAlign: 'left', paddingLeft: '2%' }}>
                <canvas ref={canvasRef} style={{ display: 'block', width: '45mm', height: '15mm' }}></canvas>
            </div>
            <div style={{ width: '100%', fontSize: '7pt', lineHeight: '1em', fontWeight: '700', color: 'black', textAlign: 'left' }}>
                <div style={{ marginTop: '1mm' }}>SUERO 1  -  TUBO AMARILLO</div>
                <div>PEP2</div>
            </div>
        </div>
    );
});

export default BarcodeLabel;
