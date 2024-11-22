import "./App.css";
import {BrowserRouter as Router, Route, Routes, Navigate} from "react-router-dom";
import Login from "./login";
import Dashboard from "./dashboard";

function App() {
	const isLoggedIn = () => {
		const token = localStorage.getItem("token");
		return !!token;
	};

	const PrivateRoute = ({children}) => {
		return isLoggedIn() ? children : <Navigate to="/login" />;
	};

	return (
		<>
			<Router>
				<Routes>
					<Route path="/login" element={isLoggedIn() ? <Navigate to="/dashboard" /> : <Login />} />
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

