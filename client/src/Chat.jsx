import { useContext, useEffect, useState, useRef } from "react"
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from 'lodash';
import axios from "axios";
import Contact from "./Contact";

export default function Chat() {
    const [ws, setWs] = useState(null)
    const [onlinePeople, setOnlinePeople] = useState({});
    const [offlinePeople, setOfflinePeople] = useState({})
    const [SelecteduserId, setSelecteduserId] = useState(null);
    const [newMessageText, setNewMessageText] = useState('');
    const [messages, setMessage] = useState([])
    const { username, id, setId, setUserName } = useContext(UserContext);
    const divUnderMessages = useRef();

    useEffect(() => {
        connectWs();
    }, []);

    function connectWs() {
        const ws = new WebSocket(import.meta.env.VITE_WS_URL);
        setWs(ws);
        ws.addEventListener('message', handleMessage);
        ws.addEventListener('close', () => {
            setTimeout(() => {
                console.log('Disconnected. Trying to reconnect');
                connectWs();
            }, 1000)
        })
    }

    function showOnlinePeople(pepoleArray) {
        // update the list of online users
        const pepole = {};
        pepoleArray.forEach(({ userId, username }) => {
            pepole[userId] = username;
        })
        setOnlinePeople(pepole);
    }
    function handleMessage(event) {
        const messageData = JSON.parse(event.data);
        console.log(event, messageData)
        if ('online' in messageData) {
            showOnlinePeople(messageData.online);
        } else if ('text' in messageData) {
            if (messageData.sender === SelecteduserId) {
                setMessage((prev) => ([...prev, { ...messageData }]))
            }

        }
    }
    const messageWithoutDupes = uniqBy(messages, '_id');

    function sendMessage(e, file = null) {
        if (e) e.preventDefault();
        ws.send(JSON.stringify({

            recipient: SelecteduserId,
            text: newMessageText,
            file,

        }));

        if (file) {
            axios.get('/messages/' + SelecteduserId).then(res => {
                setMessage(res.data)
            })
        } else {
            setNewMessageText('');
            setMessage(prev => ([...prev, {
                text: newMessageText,
                sender: id,
                recipient: SelecteduserId,
                _id: Date.now(),
            }]));
        }

    }

    function sendFile(e) {
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = () => {
            sendMessage(null, {
                name: e.target.files[0].name,
                data: reader.result,
            })
        }
    }

    // send file new
    // function sendFile(e) {
    //     const file = e.target.files[0];
    //     const formData = new FormData();
    //     formData.append("file", file);

        // Upload to Cloudinary
    //     axios.post(`${axios.defaults.baseURL}/upload`, formData)
    //         .then(res => {
    //             const fileUrl = res.data.url;
    //             sendMessage(null, { name: file.name, url: fileUrl });
    //         })
    //         .catch(err => console.error("Upload Error:", err));
    // }
    //end send file

    function logout() {
        axios.post('/logout').then(() => {
            setWs(null)
            setId(null);
            setUserName(null);
        })
    }



    useEffect(() => {
        const div = divUnderMessages.current;
        if (div) {
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages]);

    useEffect(() => {
        axios.get('/people').then(res => {
            const offlinePeopleArr = res.data
                .filter(p => p._id !== id)
                .filter(p => !Object.keys(onlinePeople).includes(p._id))
            const offlinePeople = {}
            offlinePeopleArr.forEach(p => {
                offlinePeople[p._id] = p
            })
            setOfflinePeople(offlinePeople)
        })
    }, [onlinePeople])

    useEffect(() => {
        if (SelecteduserId) {
            axios.get('/messages/' + SelecteduserId).then(res => {
                setMessage(res.data)
            })
        }
    }, [SelecteduserId])


    const onlinePeopleExclourUser = { ...onlinePeople };
    delete onlinePeopleExclourUser[id];

    return (
        <div className="flex h-screen">
            <div className="bg-white w-1/3 flex flex-col ">
                <div className="flex-grow">

                    <Logo />
                    {Object.keys(onlinePeopleExclourUser).map(userId => (
                        <Contact
                            key={userId}
                            id={userId}
                            online={true}
                            username={onlinePeopleExclourUser[userId]}
                            onClick={() => setSelecteduserId(userId)}
                            selected={userId === SelecteduserId}
                        />
                    ))}
                    {Object.keys(offlinePeople).map(userId => (
                        <Contact
                            key={userId}
                            id={userId}
                            online={false}
                            username={offlinePeople[userId].username}
                            onClick={() => setSelecteduserId(userId)}
                            selected={userId === SelecteduserId}
                        />
                    ))}

                </div>
                <div className="p-2 text-center flex items-center justify-center">

                    <span className="mr-2 text-sm text-gray-600 flex items-center">{username}</span>
                    <button
                        onClick={logout}
                        className="cursor-pointer text-sm py-1 px-2 text-gray-500 bg-blue-100 border rounded-sm ">logout</button>
                </div>
            </div>

            <div className="bg-blue-200 w-2/3 flex flex-col p-2" >

                <div className="flex-grow">
                    {!SelecteduserId && (
                        <div className="flex h-full flex-grow items-center justify-center">
                            <div className="text-gray-400">
                                &larr; Select a person
                            </div>
                        </div>
                    )}
                    {!!SelecteduserId && (
                        <div className="relative h-full">
                            <div className="overflow-y-scroll absolute inset-0">
                                {messageWithoutDupes.map(message => (
                                    <div key={message._id} className={(message.sender === id ? 'text-right' : 'text-left')}>
                                        <div className={"text-left inline-block p-2 my-2 rounded-md text-sm " + (message.sender === id ? 'bg-blue-700 text-white' : 'bg-white text-gray-500')}>
                                            {/* sender: {message.sender} <br />
                                    my id: {id}<br /> */}
                                            {message.text}
                                            {message.file && (
                                                <div>
                                                    <a target="_blank" className="underline" href={axios.defaults.baseURL + '/uploads/' + message.file}>
                                                        {message.file}
                                                    </a>
                                                </div>
                                            )}

                                            {/* {message.file && (
                                                <div>
                                                    <a target="_blank" rel="noopener noreferrer" className="underline text-blue-600" href={message.file.url}>
                                                        {message.file.name}
                                                    </a>
                                                </div>
                                            )} */}


                                        </div>
                                    </div>
                                ))}
                                <div ref={divUnderMessages} >
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {!!SelecteduserId && (
                    <form className="flex gap-2" onSubmit={sendMessage}>
                        <input type="text"
                            value={newMessageText}
                            onChange={(e) => setNewMessageText(e.target.value)}
                            placeholder="type message" className="bg-white border p-2 flex-grow rounded-sm cursor-pointer" />
                        <label type="button" className="bg-blue-200 text-gray-700 p-2 rounde-md">
                            <input type="file" className="hidden"
                                onChange={sendFile}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z" clipRule="evenodd" />
                            </svg>

                        </label>
                        <button type="submit" className="bg-blue-500 text-white p-2 rounde-md"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>
                        </button>
                    </form>
                )}
            </div>
        </div >
    )
}





















