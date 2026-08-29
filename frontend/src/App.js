import { useEffect, useState } from "react";
import "./App.css";
import 'bootstrap/dist/css/bootstrap.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import {BrowserRouter as Router, Route, Routes, Navigate} from "react-router-dom";
import Login from "./Components/auth/Login.js";
import Register from "./Components/auth/Register.js";
import RegisterDeveloper from "./Components/auth/RegisterDeveloper.js";
import Dashboard from "./Components/Dashboard/dashboard";
import Home from "./Components/Landing/Home.js";
import api from "./api.js";

function App() { 
	const [user, setUser] = useState(null);
	const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

	const isLoggedIn = () => loggedIn;

	const PrivateRoute = ({children}) => {
		return isLoggedIn() ? children : <Navigate to="/login" />;
	};
	
	useEffect(() => {
		if (isLoggedIn()) {
			const token = localStorage.getItem("token");
			const userid = localStorage.getItem("userid");

			api.get("http://localhost:5000/user/getuser/" + userid, {
				headers: { Authorization: `Bearer ${token}` }
			}).then(response => {
				      setUser({userid:response.data.userid,username:response.data.username,usertype:response.data.usertype})
			}).catch(err => {
				console.log(err);
			});
		}
	}, []);

	return (
		<>
			<Router>
				<Routes>
					
					<Route path="/" element={<Home isLoggedIn={isLoggedIn}/>} />
					<Route path="/login" element={!isLoggedIn() ? <Login setUser={setUser} setLoggedIn={setLoggedIn}/> : <Navigate to="/dashboard" />} />
					<Route path="/register" element={!isLoggedIn() ? <Register/> : <Navigate to="/dashboard" />} />
					<Route path="/register/developer" element={!isLoggedIn() ? <RegisterDeveloper/> : <Navigate to="/dashboard" />} />
					
					<Route
						path="/dashboard"
						element={
							<PrivateRoute>
								<Dashboard user={user} setLoggedIn={setLoggedIn} />
							</PrivateRoute>
						}
					/>
          {/* Need to create a 404 page */}
					<Route path="*" element={<Navigate to="/" />} />
				</Routes>
			</Router>
		</>
	);
}

export default App;

