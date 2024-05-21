import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const Flebos = () => {
  const [flebos, setFlebos] = useState([]);
  const { isAuthenticated } = useContext(Context);
  useEffect(() => {
    const fetchFlebos = async () => {
      try {
        const { data } = await axios.get(
          "https://webapitimser.azurewebsites.net/api/v1/user/flebos",
          { withCredentials: true }
        );
        setFlebos(data.flebos);
      } catch (error) {
        toast.error(error.response.data.message);
      }
    };
    fetchFlebos();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }
  return (
    <section className="page doctors">
<h1>Flebos</h1>
<div className="banner">
  {flebos && flebos.length > 0 ? (
    flebos.map((flebo, index) => {
      return (
        <div className="card">  
          <div className="details">
            <h4>{`${flebo.firstName}`}</h4>
            <p>Apellido: <span>{flebo.lastName}</span></p>
            <p>Correo: <span>{flebo.email}</span></p>
            <p>Teléfono: <span>{flebo.phone}</span></p>
            <p>Fecha de nacimiento: <span>{flebo.dob}</span></p>
            <p>Género: <span>{flebo.gender}</span></p>
          </div>
        </div>
      );
    })
  ) : (
    <h1>No Registered Found!</h1>
  )}
</div>

    </section>

    
  );
};

export default Flebos;
