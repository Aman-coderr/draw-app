import{useState} from 'react';
import axios from 'axios';

function Chat(){
const[message,setMessage]=useState("");

  return(
  
 <div className="flex h-screen w-screen bg-blue-50 items-center justify-center">
 <input type="text"
  value={message}
  onChange={(e)=>setMessage(e.target.value)}
    />

    <button>Send</button>
    </div>
  )

}
export default Chat;
