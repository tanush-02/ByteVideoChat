import * as React from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar, Alert } from '@mui/material';
import '../App.css';

export default function Authentication() {

    

    const [username, setUsername] = React.useState();
    const [password, setPassword] = React.useState();
    const [name, setName] = React.useState();
    const [error, setError] = React.useState();
    const [message, setMessage] = React.useState();


    const [formState, setFormState] = React.useState(0);

    const [open, setOpen] = React.useState(false)


    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    let handleAuth = async () => {
        try {
            if (formState === 0) {

                await handleLogin(username, password)


            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);
                console.log(result);
                setUsername("");
                setMessage(result);
                setOpen(true);
                setError("")
                setFormState(0)
                setPassword("")
            }
        } catch (err) {

            console.log(err);
            let message = (err.response.data.message);
            setError(message);
        }
    }


    return (
        <div className="authContainer">
            {/* Background Elements */}
            <div className="authBackground">
                <div className="authGradient"></div>
                <div className="authPattern"></div>
            </div>

            {/* Main Auth Card */}
            <div className="authCard">
                <div className="authHeader">
                    <div className="authLogo">
                        <div className="logoIcon">🎥</div>
                        <h1>L O G I N</h1>
                    </div>
                    <p className="authSubtitle">
                        {formState === 0 ? "Welcome back! Sign in to continue" : "Create your account to get started"}
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="authTabs">
                    <button 
                        className={`authTab ${formState === 0 ? 'active' : ''}`}
                        onClick={() => setFormState(0)}
                    >
                        Sign In
                    </button>
                    <button 
                        className={`authTab ${formState === 1 ? 'active' : ''}`}
                        onClick={() => setFormState(1)}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                <form className="authForm" onSubmit={(e) => { e.preventDefault(); handleAuth(); }}>
                    {formState === 1 && (
                        <div className="inputGroup">
                            <label htmlFor="name"></label>
                            <input
                                type="text"
                                id="name"
                                value={name || ''}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                required
                                className="authInput"
                            />
                        </div>
                    )}

                    <div className="inputGroup">
                        <label htmlFor="username"></label>
                        <input
                            type="text"
                            id="username"
                            value={username || ''}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            className="authInput"
                        />
                    </div>

                    <div className="inputGroup">
                        <label htmlFor="password"></label>
                        <input
                            type="password"
                            id="password"
                            value={password || ''}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="authInput"
                        />
                    </div>

                    {error && (
                        <div className="errorMessage">
                            <span className="errorIcon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="authButton">
                        <span className="buttonText">
                            {formState === 0 ? "Sign In" : "Create Account"}
                        </span>
                        <span className="buttonIcon">→</span>
                    </button>
                </form>

                {/* Footer */}
                <div className="authFooter">
                    <p>
                        {formState === 0 ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            className="authLink"
                            onClick={() => setFormState(formState === 0 ? 1 : 0)}
                        >
                            {formState === 0 ? " Sign up" : " Sign in"}
                        </button>
                    </p>
                </div>
            </div>

            {/* Snackbar for success messages */}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setOpen(false)} severity="success" sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </div>
    );
}