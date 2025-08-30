import React from 'react'; 
import axios from 'axios'
import { useState } from 'react';
import LoginPage, {Logo, Footer, Username, Password, Submit } from '@react-login-page/page8';
import { useNavigate } from "react-router-dom";
import logo from '../../Naav logo.svg'

const Login = () => {

  const [signindata, setSignindata] = useState({username:'', password:''})
  const [signupdata, setSignupdata] = useState({username:'', email:'', phone:'', password:'', confirmpassword:''})
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handInputData = event =>{
    setSignindata(data => {
      data[event.target.name] = event.target.value; 
      return data;
    }) 
  }

  const handleSignin = async () =>{
 
    try {
      const response = await axios.post("http://localhost:5000/user/login", signindata);
      
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userid", response.data.userid);
      navigate("/dashboard");

    } catch (err) {
      alert("Login Failed!!! Username/Password Incorrect")
      setError("Invalid credentials. Please try again.");
    }
    
  }

  const handleSignup = async () =>{
    try {
      const response = await axios.post("http://localhost:5000/user/create", signupdata);
      console.log(response.data)
    }catch (err) {
      alert("Signup Failed!!!")
      console.log("Signup Failed!!!\n", err)
    }
  }
  return (
  <LoginPage style={{ height: 690 }}>
  
      <Logo>
        <img src={logo} alt="Naav Logo" height={80} width={80}/>
      </Logo>
  
      {/* Sign in Form */}
      <Username placeholder='Naav Username' name='username' onChange={handInputData}/>
      <Password placeholder='Naav Password' name='password' onChange={handInputData}/>
      <Submit onClick={handleSignin}/>
  
      {/* Sign Up form */}
      <Username panel="signup" label="E-mail" type="email" placeholder="E-mail" keyname="e-mail" />
      <Password panel="signup" label="Password" placeholder="Password" keyname="password" />
      <Password panel="signup" label="Confirm Password" placeholder="Confirm Password" keyname="confirm-password" />
      <Submit keyname="signup-submit" panel="signup" onClick={handleSignup}>Signup</Submit>

      <Footer>
        Want to use our Ad Service on your Website or mobile App? <a href="#">Developer Login</a>
      </Footer>
    </LoginPage> 
  );
}

export default Login;