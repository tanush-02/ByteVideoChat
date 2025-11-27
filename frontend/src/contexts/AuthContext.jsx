import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";


export const AuthContext = createContext({});

const userClient = axios.create({
    baseURL: `${server}/api/v1/users`
})

const commentClient = axios.create({
    baseURL: `${server}/api/v1/comments`
})


export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext);


    const [userData, setUserData] = useState(authContext);


    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            let request = await userClient.post("/register", {
                name: name,
                username: username,
                password: password
            })


            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    }

    const handleLogin = async (username, password) => {
        try {
            let request = await userClient.post("/login", {
                username: username,
                password: password
            });

            console.log(username, password)
            console.log(request.data)

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                if (request.data.role) {
                    localStorage.setItem("role", request.data.role);
                }
                if (request.data.username) {
                    localStorage.setItem("username", request.data.username);
                }
                const redirect = localStorage.getItem("postLoginRedirect");
                if (redirect) {
                    localStorage.removeItem("postLoginRedirect");
                    router(redirect);
                } else {
                    router("/")
                }
            }
        } catch (err) {
            throw err;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await userClient.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data
        } catch
         (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await userClient.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request
        } catch (e) {
            throw e;
        }
    }

    const getComments = async (section) => {
        try {
            let request = await commentClient.get("/", {
                params: { section }
            });
            return request.data;
        } catch (e) {
            throw e;
        }
    }

    const addComment = async (section, text) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Not authenticated");
            let request = await commentClient.post("/", {
                token,
                section,
                text
            });
            return request.data;
        } catch (e) {
            throw e;
        }
    }


    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser, handleRegister, handleLogin,
        getComments, addComment
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}
