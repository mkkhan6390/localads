import axios from "axios";
import {jwtDecode} from "jwt-decode";

const api = axios.create({
    withCredentials: true,
});

let curruserid = localStorage.getItem('userid');
let currusername = localStorage.getItem('username');
let currusertype = localStorage.getItem('usertype');

async function refreshAccessToken() {
    try {
        
        const res = await axios.post(
            `http://localhost:5000/user/token/refresh`,
            { userid:curruserid, username: currusername, usertype: currusertype },
            { withCredentials: true }
        );

        const { token } = res.data;
        localStorage.setItem("token", token);
        return token;
    } catch (err) {
        console.error("Refresh token failed", err);
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("userid");
        localStorage.removeItem("usertype");
        window.location.href = "/login";
        return null;
    }
}


api.interceptors.request.use(async (config) => {
    let token = localStorage.getItem("token");

    console.log('token is :',token)
    if (token) {
        try {
            const { exp } = jwtDecode(token);
            const isExpired = Date.now() >= exp * 1000;

            if (isExpired) {
                console.log("Access token expired — refreshing..."); 
                token = await refreshAccessToken();
            }
        } catch (e) {
            console.error("Invalid token format", e);
            token = null;
        }
    }else{ 
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("userid");
        localStorage.removeItem("usertype");
        window.location.href = "/login";
    }

    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
});


export default api;