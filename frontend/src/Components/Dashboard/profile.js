import React, { useState } from "react";
import { Card, Button, InputGroup, FormControl } from "react-bootstrap";
import { Eye, EyeOff, Copy, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


const Profile = () => {
    const navigate = useNavigate();
    const [apiKey, setApiKey] = useState(null);
    const [showKey, setShowKey] = useState(false);

    // 🔑 Generate/Reset API Key
    const generateApiKey = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const response = await axios.patch("http://localhost:5000/user/genkey", {}, { headers: { authorization: `Bearer ${token}` }});
            setApiKey(response.data.apikey)
            setShowKey(false);
        } catch (error) {
            console.log(error)
            alert(error.message)
        } 
    }

    const fetchApiKey = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const response = await axios.get("http://localhost:5000/user/key", { headers: { Authorization: `Bearer ${token}` }});
            
            if(response.data.apikey){
                setApiKey(response.data.apikey)
                setShowKey(false);
            }else{
                if (window.confirm("Api Key has not been generated yet. Generate now?")) {
                    return await generateApiKey()
                }
            }

        } catch (error) {
            console.log(error)
            alert(error.message)
        } 
    };

    // 📋 Copy to clipboard
    const copyToClipboard = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey);
            alert("API Key copied to clipboard!");
        }
    };

    return (
        <Card className="shadow-sm p-4 rounded-4">
            <h4 className="mb-3">Profile Settings</h4>

            <div className="mb-4">
                <h6 className="mb-2">API Key</h6>
                {apiKey ? (
                    <InputGroup>
                        <FormControl
                            type="text"
                            value={showKey ? apiKey : "•••••••••••••••••••"}
                            readOnly
                            className="rounded-start-pill"
                        />
                        <Button
                            variant="outline-secondary"
                            onClick={() => setShowKey(!showKey)}
                            className="d-flex align-items-center"
                        >
                            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                        <Button
                            variant="outline-secondary"
                            onClick={copyToClipboard}
                            className="d-flex align-items-center"
                        >
                            <Copy size={18} />
                        </Button>
                        <Button
                            variant="outline-danger"
                            onClick={generateApiKey}
                            className="d-flex align-items-center rounded-end-pill"
                        >
                            <RefreshCw size={18} className="me-1" /> Reset
                        </Button>
                    </InputGroup>
                ) : (
                    <Button
                        variant="primary"
                        onClick={fetchApiKey}
                        className="rounded-pill px-4"
                    >
                        Fetch Your API Key
                    </Button>
                )}
            </div>
        </Card>
    );
};

export default Profile;
