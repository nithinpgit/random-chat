var config  = require('./config.js');
var express = require('express');
var app     = express();
var https   = require('https');
var http   = require('http');
var fs      = require('fs');
var socket  = require('socket.io');
var options = {
    key : fs.readFileSync(config.key),
    cert: fs.readFileSync(config.cert)
};
var httpsServer = https.createServer(options,app).listen(config.port);
http.createServer(app).listen(config.httpport);
var io = require('socket.io')(httpsServer);
app.use(express.static('public'));
console.log('webrtc signaling running at port '+config.port);
var users = {};
io.on('connection',function(connection){
    connection.on('message', function(message) { 
      var data; 
      //accepting only JSON messages 
      try {
         data = JSON.parse(message); 
      } catch (e) { 
         console.log("Invalid JSON"); 
         data = {}; 
      } 
		
      //switching type of the user message 
      switch (data.type) { 
         //when a user tries to login 
			
         case "login": 
            console.log("User logged", data.name); 
				
            //if anyone is logged in with this username then refuse 
            if(users[data.name]) { 
               sendTo(connection, { 
                  type: "login", 
                  success: false 
               }); 
            } else { 
               //save user connection on the server 
               users[data.name] = connection; 
               connection.name = data.name; 
					
               sendTo(connection, { 
                  type: "login", 
                  success: true 
               }); 
            } 
				
            break; 
				
         case "offer": 
            //for ex. UserA wants to call UserB 
            console.log("Sending offer to: ", data.name); 
				
            //if UserB exists then send him offer details 
            var conn = users[data.name];
				
            if(conn != null) { 
               //setting that UserA connected with UserB 
               connection.otherName = data.name; 
					
               sendTo(conn, { 
                  type: "offer", 
                  offer: data.offer, 
                  name: connection.name 
               }); 
            } 
				
            break;  
				
         case "answer": 
            console.log("Sending answer to: ", data.name); 
            //for ex. UserB answers UserA 
            var conn = users[data.name]; 
				
            if(conn != null) { 
               connection.otherName = data.name; 
               sendTo(conn, { 
                  type: "answer", 
                  answer: data.answer 
               }); 
            } 
				
            break;  
				
         case "candidate": 
            console.log("Sending candidate to:",data.name); 
            var conn = users[data.name];  
				
            if(conn != null) { 
               sendTo(conn, { 
                  type: "candidate", 
                  candidate: data.candidate 
               });
            } 
				
            break;  
				
         case "leave": 
            console.log("Disconnecting from", data.name); 
            var conn = users[data.name]; 
            if(conn){
               conn.otherName = null; 
				
                //notify the other user so he can disconnect his peer connection 
                if(conn != null) { 
                sendTo(conn, { 
                    type: "leave" 
                }); 
                }  
            }				
            break;  
				
         default: 
            sendTo(connection, { 
               type: "error", 
               message: "Command not found: " + data.type 
            }); 
				
            break; 
      }  
   });  

   connection.on("disconnect", function() { 
	
      if(connection.name) { 
      delete users[connection.name]; 
		
         if(connection.otherName) { 
            console.log("Disconnecting from ", connection.otherName);
            var conn = users[connection.otherName]; 
            conn.otherName = null;  
				
            if(conn != null) { 
               sendTo(conn, { 
                  type: "leave" 
               });
            }  
         } 
      } 
   });  
});

function sendTo(socket, message) { 
   
   socket.emit('message',JSON.stringify(message)); 
}

var ColorThief = require('color-thief'),  
colorThief     = new ColorThief(),  
fs             = require('fs');  
var imagePath = './anu.jpg';
var image = fs.readFileSync(imagePath);  
var rgb = colorThief.getColor(image);  
console.log(rgb);