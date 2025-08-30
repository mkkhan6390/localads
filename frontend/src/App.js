import "./App.css";
import 'bootstrap/dist/css/bootstrap.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import {BrowserRouter as Router, Route, Routes, Navigate} from "react-router-dom";
import Login from "./Components/auth/login";
import Dashboard from "./Components/Dashboard/dashboard";
import Home from "./Components/Landing/Home.js";

function App() {
	const isLoggedIn = () => {
		const token = localStorage.getItem("token");
		return !!token;
	};

	const PrivateRoute = ({children}) => {
		return isLoggedIn() ? children : <Navigate to="/" />;
	};

	return (
		<>
			<Router>
				<Routes>
					
					<Route path="/" element={<Home isLoggedIn={isLoggedIn}/>} />
					<Route path="/login" element={!isLoggedIn() ? <Login /> : <Navigate to="/dashboard" />} />
					
					<Route
						path="/dashboard"
						element={
							<PrivateRoute>
								<Dashboard />
							</PrivateRoute>
						}
					/>
          {/* Need to create a 404 page */}
					<Route path="*" element={<Navigate to="/login" />} />
				</Routes>
			</Router>
		</>
	);
}

export default App;

