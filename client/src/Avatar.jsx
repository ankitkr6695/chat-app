export default function Avatar({ userId, username, online }) {
    const colors = [
        'bg-blue-200', 'bg-green-200','bg-purple-200', 'bg-yellow-200', 'bg-blue-200', 'bg-indigo-200', 'bg-pink-200', 'bg-gray-200' 
    ];
    
    //const userIdBase10=parseInt(userId,16);
    const userIdBase10 = parseInt(userId.slice(0, 8), 16);
    const colorIndex=userIdBase10 % colors.length;
    
    const color=colors[colorIndex];

    return (

        <div className={"w-8 h-8 relative rounded-full flex items-center "+color}>
            <div className="text-center w-full opacity-70">{username[0]?.toUpperCase()}</div>
            {online && (
                <div className="absolute w-2 h-2 bg-green-300 bottom-0 right-0 rounded-md border-0 border border-white"></div>
            )}
            {!online && (
                <div className="absolute w-2 h-2 bg-gray-400 bottom-0 right-0 rounded-md border-0 border border-white"></div>
            )}
            
        </div>


        
    )
}