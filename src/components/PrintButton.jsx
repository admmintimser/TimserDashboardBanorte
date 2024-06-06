import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import BarcodeLabel from "./BarcodeLabel";

const PrintButton = ({ appointment }) => {
    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `${appointment.patientFirstName}_${appointment.patientLastName}_label`,
    });

    return (
        <div>
            <button 
                onClick={appointment.tomaProcesada ? handlePrint : null} 
                disabled={!appointment.tomaProcesada} 
                className={`buttonprint ${!appointment.tomaProcesada ? 'disabled' : ''}`}
            >
                Imprimir
            </button>
            <div style={{ display: "none" }}>
                <BarcodeLabel ref={componentRef} appointment={appointment} />
            </div>
        </div>
    );
};

export default PrintButton;
