var config  = require('./config.js');
var express = require('express');
var app     = express();
var https   = require('https');
var http   = require('http');
var fs      = require('fs');
var socket  = require('socket.io');
var options = {
    key : fs.readFileSync(config.key),
    cert: fs.readFileSync(config.cert),
    ca: [fs.readFileSync(config.chain)]
};
var httpsServer = https.createServer(options,app).listen(config.port);
//http.createServer(app).listen(config.httpport);
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(config.httpport);
var io = require('socket.io')(httpsServer);
app.use(express.static('public'));
//console.log('webrtc signaling running at port '+config.port);
var users = {};
var freeUsers = {};
var genderMap = {};
var searchCount = 0;
setTimeout(connectAllPeers,5000);
function connectAllPeers(){
    io.sockets.emit('onUserCount', Object.keys(users).length);
  ////console.log('trying to call');
  if(freeUsers){
      searchCount++;
      var strict = true;
      if(searchCount % 15 == 0){
          strict = false;
      }
      for(var key in freeUsers){
         var SelectedUser = freeUsers[key];
         var myPair       = findPair(genderMap[key],key,strict);
         if(myPair){
             sendTo(myPair, { 
                        type: "triggerCall", 
                        callerName: SelectedUser.id
                    }); 
                delete freeUsers[myPair.id];
                delete freeUsers[SelectedUser.id];
         }
      };
      /*
      searchCount++;
      var callerUser = [];
      var calleeUser = [];
      var i=0;
      var largestPairNo = 0;
      for(var key in freeUsers){
          i++;
          if(i%2 == 0){
              largestPairNo = i;
              callerUser.push(freeUsers[key]);
          }else{
              calleeUser.push(freeUsers[key]);
          }
      }
      for(var j=0;j<largestPairNo;j++){
        if(callerUser[j] && calleeUser[j]){
            console.log('both present');
            var callerUs = callerUser[j];
            var caleeUs  = calleeUser[j];
          if(genderMap[callerUs.id] != genderMap[caleeUs.id] || searchCount % 10 == 0){
                sendTo(calleeUser[j], { 
                        type: "triggerCall", 
                        callerName: callerUs.id
                    }); 
                delete freeUsers[callerUs.id];
                delete freeUsers[caleeUs.id];
          }
        }
      }
      */
  }  
  setTimeout(connectAllPeers,2000);
}
function findPair(gender,id,strict){
     for(var key in freeUsers){
         var SelectedUser = freeUsers[key];
         if(SelectedUser.id != id && genderMap[SelectedUser.id] != gender){
             return SelectedUser;
         }
      }
      if(!strict){
         for(var key in freeUsers){
            var SelectedUser = freeUsers[key];
            if(SelectedUser.id != id){
                return SelectedUser;
            }
        }
      }
      return false;
      
}
io.on('connection',function(connection){
    connection.on('message', function(message) { 
      var data; 
      //accepting only JSON messages 
      try {
         data = JSON.parse(message); 
      } catch (e) { 
         //console.log("Invalid JSON"); 
         data = {}; 
      } 
		
      //switching type of the user message 
      switch (data.type) { 
         //when a user tries to login 
			
         case "login": 
               //save user connection on the server 
               users[connection.id] = connection; 
               genderMap[connection.id] = data.gender;
               connection.name = connection.id; 
               sendTo(connection, { 
                  type: "login", 
                  success: true 
               }); 
               freeUsers[connection.id] = connection;
            break; 
        case "onChat": 
               var conn = users[data.name]; 
               if(conn){
                  sendTo(conn, data); 
               }
            break; 
		 case "onTyping": 
               var conn = users[data.name]; 
               if(conn){
                  sendTo(conn, data); 
               }
            break; 		
         case "offer": 
            //for ex. UserA wants to call UserB 
            //console.log("Sending offer to: ", data.name); 
				
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
            //console.log("Sending answer to: ", data.name); 
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
            //console.log("Sending candidate to:",data.name); 
            var conn = users[data.name];  
				
            if(conn != null) { 
               sendTo(conn, { 
                  type: "candidate", 
                  candidate: data.candidate 
               });
            } 
				
            break;  
				
         case "leave": 
            //console.log("Disconnecting from", data.name); 
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
		case "iamLeaving": 
            sendTo(connection, { 
                            type: "leave" 
                        });
            if(connection.name) { 
                delete users[connection.name]; 
                if(freeUsers.hasOwnProperty(connection.name)){
                    delete freeUsers[connection.name];
                }
                    if(connection.otherName) { 
                        var conn = users[connection.otherName]; 
                        if(conn){
                        conn.otherName = null;  
                        }				
                        if(conn != null) { 
                        sendTo(conn, { 
                            type: "leave" 
                        });
                    }  
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
      if(genderMap.hasOwnProperty(connection.name)){
           delete genderMap[connection.name]; 
      }
	  if(freeUsers.hasOwnProperty(connection.name)){
          delete freeUsers[connection.name];
      }
         if(connection.otherName) { 
            console.log("Disconnecting from ", connection.otherName);
            var conn = users[connection.otherName]; 
            if(conn){
               conn.otherName = null;  
            }				
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