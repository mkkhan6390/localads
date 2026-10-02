import axios from "axios";
import {jwtDecode} from "jwt-decode";

// One place for the backend address. Set REACT_APP_API_URL in frontend/.env for other environments.
export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = axios.create({
    withCredentials: true,
});

function clearSession() {
    ["token", "username", "userid", "usertype"].forEach((key) => localStorage.removeItem(key));
    window.location.href = "/login";
}

// If several requests find the token expired at the same moment they share ONE refresh call.
let refreshing = null;

function refreshAccessToken() {
    if (!refreshing) {
        // The server reads who you are from the httpOnly refresh cookie, so nothing is sent in the body.
        refreshing = axios
            .post(`${API_URL}/user/token/refresh`, {}, { withCredentials: true })
            .then((res) => {
                localStorage.setItem("token", res.data.token);
                return res.data.token;
            })
            .catch(() => {
                clearSession();
                return null;
            })
            .finally(() => {
                refreshing = null;
            });
    }
    return refreshing;
}

api.interceptors.request.use(async (config) => {
    let token = localStorage.getItem("token");

    if (!token) {
        clearSession();
        return config;
    }

    try {
        const { exp } = jwtDecode(token);
        if (Date.now() >= exp * 1000) {
            token = await refreshAccessToken();
        }
    } catch (e) {
        token = null;
    }

    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
});

export default api;
