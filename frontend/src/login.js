import React from 'react'; 
import axios from 'axios'
import { useState } from 'react';
import LoginPage, {Logo, Footer, Username, Password, Submit } from '@react-login-page/page8';
import { useNavigate } from "react-router-dom";
import logo from './Naav logo.svg'



const Login = () => {

  const [logindata, setLogindata] = useState({username:'', password:''})
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handInputData = event =>{
    setLogindata(data => {
      data[event.target.name] = event.target.value; 
      return data;
    }) 
  }

  const handleSubmit = async () =>{

    console.log(logindata)
    try {

      const response = await axios.post("http://localhost:5000/user/login", logindata);
      
      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");

    } catch (err) {
      alert("Login Failed!!! Username/Password Incorrect")
      setError("Invalid credentials. Please try again.");
    }
    
  }

  return (
  <LoginPage style={{ height: 690 }}>
  
      <Logo>
        <img src={logo} alt="Naav Logo" height={80} width={80}/>
      </Logo>
  
      <Username placeholder='Naav Username' name='username' onChange={handInputData}/>
      <Password placeholder='Naav Password' name='password' onChange={handInputData}/>
      <Submit onClick={handleSubmit}/>
  
      <Footer>
        Want to use our Ad Service on your Website or mobile App? <a href="#">Developer Login</a>
      </Footer>
    </LoginPage> 
  );
}

export default Login;