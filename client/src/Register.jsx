

import { useContext, useState } from "react";
import axios from 'axios';
import { UserContext } from "./UserContext";

export default function Register() {
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [isLoggedinOrRegister, setIsLoggedinOrRegister] = useState('register');
    const {setUserName:setLoggedInUsername, setId}=useContext(UserContext)
    
    async function handlesubmit(e){
        e.preventDefault();
        const url= isLoggedinOrRegister==='register'?'register': 'login';
        const{data} =await axios.post(url,{username,password});
        setLoggedInUsername(username);
        setId(data.id);

    }
    return (
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
            <form className="w-96 bg-white p-8 rounded-2xl shadow-2xl border border-gray-200" onSubmit={handlesubmit}>
                <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
                    Register
                </h2>

                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Username"
                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all peer"
                        value={username}
                        onChange={(e) => setUserName(e.target.value)}
                    />

                </div>

                <div className="relative mb-6">
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all peer"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                </div>

                <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold shadow-md hover:bg-blue-600 transition-all duration-300">
                    {isLoggedinOrRegister==='register' ? 'Register' : 'Login'}
                </button>

                {/* <p className="text-gray-600 text-sm text-center mt-4">
                    Already have an account?{" "}
                    <a href="#" className="text-blue-500 hover:underline">
                        Login here
                    </a>
                </p> */}
                <div className="text-gray-600 text-sm text-center mt-4">
                {isLoggedinOrRegister==='register' &&(
                    <div>
                    Already have an account? 
                    
                    <button className="text-blue-500 hover:underline" onClick={()=>setIsLoggedinOrRegister('login')}>Login here
                    </button>
                    </div>
                )}
                {isLoggedinOrRegister==='login' && (
                    <div>
                    Don't have an account? 
                    
                    <button className="text-blue-500 hover:underline" onClick={()=>setIsLoggedinOrRegister('register')}>Register here
                    </button>
                    </div>
                )}
                    
                </div>
            </form>
        </div>
    );
}








// export default function Register(){
//     return (
//         <div className="bg-blue-50 h-screen flex items-center">
//         <form className="w-64 mx-auto ">
//             <input type="text" placeholder="Username"className="block w-full rounded-sm p-2 mb-2 "/>
//             <input type="text" placeholder="Password"className="block w-full rounded-sm p-2 mb-2"/>
//             <button className="bg-blue-500 block text-white w-full rounded-sm">Register</button>
//         </form>

//         </div>
//     )
// }