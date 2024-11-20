import React from 'react'; 
import { useState } from 'react';
import LoginLogo from 'react-login-page/logo-rect';
import LoginPage, {Logo, Footer, Username, Password, Submit } from '@react-login-page/page8';
import logo from './Naav logo.svg'



const Login = () => {

  const [logindata, setLogindata] = useState({username:'', password:''})

  const handInputData = event =>{
    setLogindata(data => {
      data[event.target.name] = event.target.value; 
      return data;
    }) 
  }

  const handleSubmit = () =>{
    console.log(logindata)
    console.log('submitted')
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