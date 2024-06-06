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

    const birthDate = new Date(appointment.birthDate).toLocaleDateString('es-ES');
    const fechaToma = new Date(appointment.fechaToma).toLocaleDateString('es-ES');
    const age = new Date().getFullYear() - new Date(appointment.birthDate).getFullYear();
    const nombre = (appointment.patientFirstName + " " + appointment.patientLastName).toUpperCase();

    return (
        <div ref={ref} style={{ width: '120mm', height: '37mm', padding: '2mm', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: 'Arial' }} className="border border-gray-300 bg-white">
            <div style={{ width: '100%', fontSize: '10pt', lineHeight: '1.2em', fontWeight: 'bold', color: 'black', textAlign: 'left' }}>
                <div style={{ marginBottom: '1mm' }}>{nombre}</div>
                
            </div>
            <div style={{ width: '100%', fontSize: '7pt', lineHeight: '1em', fontWeight: 'light', color: 'black', textAlign: 'left' }}>
                <div>BANORTE -- {age}A -- Fem</div>
                <div style={{ marginBottom: '1mm' }}>F.Nac: {birthDate} -- F.Orden: {fechaToma}</div>
            </div>
            <div style={{ width: '100%', fontSize: '10pt', lineHeight: '1.2em', fontWeight: 'bold', color: 'black', textAlign: 'left', paddingLeft: '2%' }}>
                <canvas ref={canvasRef} style={{ display: 'block', width: '45mm', height: '15mm' }}></canvas>
            </div>
            <div style={{ width: '100%', fontSize: '7pt', lineHeight: '1em', fontWeight: 'bold', color: 'black', textAlign: 'left' }}>
                <div style={{ marginTop: '1mm' }}>SUERO 1 -- TUBO AMARILLO</div>
                <div>PEP2</div>
            </div>
        </div>
    );
});

export default BarcodeLabel;
