import { useEffect, useState } from "react";
import "./App.css";
import 'bootstrap/dist/css/bootstrap.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import {BrowserRouter as Router, Route, Routes, Navigate} from "react-router-dom";
import AuthPage from "./Components/auth/AuthPage.js";
import Dashboard from "./Components/Dashboard/dashboard";
import Home from "./Components/Landing/Home.js";
import api from "./api.js";

function App() { 
	const [user, setUser] = useState(null);
	
	const isLoggedIn = () => {
		const token = localStorage.getItem("token");
		return !!token;
	};

	const PrivateRoute = ({children}) => {
		return isLoggedIn() ? children : <Navigate to="/" />;
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
					<Route path="/login" element={!isLoggedIn() ? <AuthPage setUser={setUser}/> : <Navigate to="/dashboard" />} />
					
					<Route
						path="/dashboard"
						element={
							<PrivateRoute>
								<Dashboard user={user} />
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

