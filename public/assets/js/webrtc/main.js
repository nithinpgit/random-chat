var smileys = {
    ':)':'<i class="em em-joy"></i>',
    '[sm2]':'<i class="em em-smiley"></i>',
    '[sm3]':'<i class="em em-relieved"></i>',
    '[sm4]':'<i class="em em-pensive"></i>',
    ':(':'<i class="em em-neutral_face"></i>',
    '[sm6]':'<i class="em em-no_mouth"></i>',
    '[sm7]':'<i class="em em-mask"></i>',
    '[sm8]':'<i class="em em-laughing"></i>',
    '[sm9]':'<i class="em em-kissing_closed_eyes"></i>',
    '[sm10]':'<i class="em em-kissing_heart"></i>',
    '[sm11]':'<i class="em em-joy"></i>',
    '[sm12]':'<i class="em em-innocent"></i>',
    '[sm13]':'<i class="em em-hushed"></i>',
    '[sm14]':'<i class="em em-heart_eyes"></i>',
    '[sm15]':'<i class="em em-heart_eyes_cat"></i>',
    '[sm16]':'<i class="em em-grimacing"></i>',
    '[sm17]':'<i class="em em-grinning"></i>',
    '[sm18]':'<i class="em em-frowning"></i>',
    '[sm19]':'<i class="em em-disappointed"></i>',
    '[sm20]':'<i class="em em-dizzy_face"></i>',
    '[sm21]':'<i class="em em-cry"></i>',
    '[sm22]':'<i class="em em-confounded"></i>',
    '[sm23]':'<i class="em em-anguished"></i>',
    '[sm24]':'<i class="em em-angry"></i>',
    '[sm25]':'<i class="em em---1"></i>',
    '[sm26]':'<i class="em em--1"></i>',
    '[sm27]':'<i class="em em-back"></i>',
    '[sm28]':'<i class="em em-basketball"></i>',
    '[sm29]':'<i class="em em-boom"></i>',
    '[sm30]':'<i class="em em-blue_heart"></i>',
    '[sm31]':'<i class="em em-bikini"></i>',
    '[sm32]':'<i class="em em-bride_with_veil"></i>',
    '[sm33]':'<i class="em em-checkered_flag"></i>',
    '[sm34]':'<i class="em em-coffee"></i>',
    '[sm35]':'<i class="em em-couple"></i>',
    '[sm36]':'<i class="em em-couplekiss"></i>',
    '[sm37]':'<i class="em em-dog"></i>',
    '[sm38]':'<i class="em em-fire"></i>',
    '[sm39]':'<i class="em em-fuelpump"></i>',
    '[sm40]':'<i class="em em-information_desk_person"></i>',
    '[sm41]':'<i class="em em-leaves"></i>',
    '[sm42]':'<i class="em em-man"></i>'
}
var configuration = { 
    //"iceServers": [{ "url": "stun:stun.1.google.com:19302" }] 
    "iceServers": [{
    urls: 'turn:nithinprasad.com:3478',
    credential: 'turn',
    username: 'turn'
}]
}; 
var myConnection = null;
var name;;
var yourname;
var socket = null;
var dataChannel = null;
var userName = 'user1';
var yourImage = '/assets/images/avatar.jpg';
var myImage   = '/assets/images/avatar.jpg';
var smylyPopClicked = false;
var tryingForNew = false;
var lastChated;
var lastChatId = 0;
var gender     = false;
$('document').ready(function(){
    $('video').playsInline = true;
    connectSocket();
    $('.smiley-but').click(function(){
        smylyPopClicked = true;
        $('.smily-pop').fadeIn();
    });
    $('body').click(function(){
        if(smylyPopClicked ==false){
           $('.smily-pop').fadeOut();
        }
        smylyPopClicked = false;
    });
    $('.smily-pop').click(function(){
       smylyPopClicked = true;
    });
    $('.smily-pop').children().on('click', function (e) {
       var value = '<i class="'+$(this).attr('class')+'"></i>';
       $('.chat-input').val($('.chat-input').val()+getKeyByValue(value));
    });
});
function agreed(){
    $('#terms').hide();
    $('#gender').show();
}
var lock = false;
function goRoom(){
     
     gender = $("input[name=gender]:checked").val();
     if(!lock){
       if(gender){
          login();
          lock = true;
          $('#gender').hide();
       }
        
     }
    
}
function getKeyByValue(value ) {
    for( var prop in smileys ) {
        if( smileys.hasOwnProperty( prop ) ) {
             if( smileys[ prop ] === value )
                 return prop;
        }
    }
}
function connectSocket(){
    showNotification('Connecting to server...');
    webkitRTCPeerConnection = window.RTCPeerConnection;
    socket = io.connect('https://nithinprasad.com:9001/');
    socket.on('connect',function(){
       if(lock){
           login();
       }
       socket.on('onUserCount',function(data){
           $('.user-count').html(data+' ');
       });
       socket.on('message',function(data){
           var data = JSON.parse(data);
                switch(data.type) { 
                    case "login": 
                        if(data.success === true){
                            showNotification('Looking for someone to chat');
                            publish();
                            $('.stop-btn').removeAttr('disabled');
                            tryingForNew = false;
                        }else{
                            showNotification('Unable to connect at this time please try later');
                        }
                        break; 
                    case "triggerCall": 
                        call(data.callerName); 
                        break; 
                    case "onChat":
                        loadChat(data.message,false);
                        break; 
                    case "onTyping":
                        showIsTyping();
                        break; 
                    //when somebody wants to call us 
                    case "offer": 
                        handleOffer(data.offer, data.name); 
                        break; 
                    case "answer": 
                        handleAnswer(data.answer); 
                        break; 
                    //when a remote peer sends an ice candidate to us 
                    case "candidate": 
                        handleCandidate(data.candidate); 
                        break; 
                    case "leave": 
                        handleLeave(); 
                        break; 
                    default: 
                        break; 
                } 
       })
    });
}
function login(){
    send({ 
         type: "login", 
         name: "a",
         gender:gender 
      }); 
}
function send(data){
    if (yourname) { 
      data.name = yourname; 
   } 
   socket.emit('message',JSON.stringify(data));
}
var localvideo;
var remotevideo;
var stream;
function publish(){
         navigator.getUserMedia({ video: true, audio: true },function(mediaStream){
         stream = mediaStream;
         localvideo = document.getElementById('my-video');
         remotevideo = document.getElementById('your-video');
         localvideo.setAttribute("playsinline", true);
         localvideo.setAttribute("controls", true);
        setTimeout(() => {
            localvideo.removeAttribute("controls");
        });
         remotevideo.setAttribute("playsinline", true);
         remotevideo.setAttribute("controls", true);
        setTimeout(() => {
            remotevideo.removeAttribute("controls");
        });
         //localvideo.src = window.URL.createObjectURL(stream);
         localvideo.srcObject = stream;
         localvideo.play();
         myConnection = new webkitRTCPeerConnection(configuration);
         myConnection.addStream(stream);
         myConnection.onaddstream = function(e){
             //remotevideo.src = window.URL.createObjectURL(e.stream);
             remotevideo.srcObject = e.stream;
             remotevideo.play();
             showNotification('You\'re now chatting with a random stranger. Say hi!');
             $('.stop-btn').html('Stop');
             setTimeout(captureImage,2000,'your');
             $('.chat-input').removeAttr('disabled');
         };
         myConnection.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }); 
            } 
         }; 
         setTimeout(captureImage,2000,'my');
    },function(error){

    });
}
var onIceCandidate  = function(event){
   // alert(event.candidate);
};

function call(callename){
    yourname = callename;
        if(yourname){
           myConnection.createOffer(function (offer) { 
               //if (compatibility.isSafari && compatibility.major >= 11) {
                    if (offer.offerToReceiveAudio) {
                        myConnection.addTransceiver('audio')
                    }
                    if (offer.offerToReceiveVideo) {
                        myConnection.addTransceiver('video')
                    }
                //}
                send({ 
                    type: "offer", 
                    offer: offer 
                }); 
                    
                myConnection.setLocalDescription(offer); 
            }, function (error) { 
                send({ 
                    type: "iamLeaving", 
                    name: "a" 
                }); 
            });
        }else{
           send({ 
            type: "iamLeaving", 
            name: "a" 
        }); 
        }
        
}
//when somebody sends us an offer 
function handleOffer(offer, name) { 
   yourname = name; 
   myConnection.setRemoteDescription(new RTCSessionDescription(offer));
	
   //create an answer to an offer 
   myConnection.createAnswer(function (answer) { 
      myConnection.setLocalDescription(answer); 
      send({ 
         type: "answer", 
         answer: answer 
      }); 
		
   }, function (error) { 
      send({ 
            type: "iamLeaving", 
            name: "a" 
        }); 
   }); 
};
function handleAnswer(answer) { 
   myConnection.setRemoteDescription(new RTCSessionDescription(answer)); 
};
function handleCandidate(candidate) { 
   myConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
};
function handleLeave() { 
   yourname = null; 
   var remotevideo = document.getElementById('your-video');
   remotevideo.src = null; 
	
   myConnection.close(); 
   myConnection.onicecandidate = null; 
   myConnection.onaddstream = null;
   showNotification('You have disconnected.');
   $('.chat-input').attr('disabled','disabled');
   $('.chat-list').html('');
   $('.chat-input').val('');
   lastChated = null;
   lastChatId = 0;
   setTimeout(function(){
       
       if($('.stop-btn').html() == 'Really?'){
         //handleLeave();
         $('.stop-btn').removeAttr('disabled');
       }
       $('.stop-btn').html('New');
       if(tryingForNew == false){
           $('.stop-btn').trigger('click');
       }
    },1000);
  
   yourImage = '/assets/images/avatar.jpg';
  // setTimeout(connectSocket,2000);
};
$('.stop-btn').click(function(){
    if($('.stop-btn').html() == 'Stop'){
         $('.stop-btn').html('Really?');
    }else if($('.stop-btn').html() == 'Really?'){
         //handleLeave();
         $('.stop-btn').attr('disabled','disabled');
         send({ 
            type: "iamLeaving", 
            name: "a" 
        }); 
    }else if($('.stop-btn').html() == 'New'){
        tryingForNew = true;
        send({ 
            type: "iamLeaving", 
            name: "a" 
        }); 
        $('.stop-btn').attr('disabled','disabled');
        setTimeout(connectSocket,1000);
    }
});
function onMuteChange(){
   var val = $('.mute').is(":checked");
   if(val){
      controlAudio(true,stream);
   }else{
      controlAudio(false,stream);
   }
}
function onVideoEnable(){
    var val = $('.video-enable').is(":checked");
   if(val){
      controlVideo(true,stream);
   }else{
      controlVideo(false,stream);
   }
}
function controlVideo(bool,streamObj){
    console.log(streamObj);
        streamObj.getVideoTracks().forEach(function (track) {
            track.enabled = !!bool;
        });
}
function controlAudio(bool,streamObj){
    console.log(streamObj);
        streamObj.getAudioTracks().forEach(function (track) {
            track.enabled = !!bool;
        });
}
$(document).keyup(function(e) {
     if (e.keyCode == 27) { // escape key maps to keycode `27`
        // <DO YOUR WORK HERE>
        $('.stop-btn').trigger('click');
    }
});
$('.zmdi-refresh').click(function(){
    $('.stop-btn').trigger('click');
})
$(".chat-input").keyup(function (e) {
     var code = (e.keyCode ? e.keyCode : e.which);
     if (code == 13) {
         event.preventDefault();
         sendChat();
         
     }else{
         
          sendTyping();
          event.preventDefault();
          
     }
 });
var sendLock = false;
function sendTyping(){
    if(sendLock == false){
     send({ 
         type: "onTyping",
         userName:userName
      }); 
      sendLock = true;
      setTimeout(function(){
         sendLock = false;
      },2000);
    }
}
function sendChat(){
   var msg = $('.chat-input').val();
   if(msg){
      loadChat(msg,true);
   }
   $('.chat-input').val('');
   send({ 
         type: "onChat", 
         message: msg,
         userName:userName
      }); 
}
function processSmiley(msg) {
    Object.keys( smileys ).forEach(function( ico ) {
        // escape special characters for regex
        var icoE   = ico.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
        // now replace actual symbols
        msg       = msg.replace( new RegExp(icoE, 'g'), smileys[ico] );
    });
    return msg;
}
function showIsTyping(){
    if($('.is-typing').length <= 0){
        chatHtml  = '<div class="chat-entry-bubble is-typing">';
        chatHtml += '<p><div class="typing-indicator mb-4 mr-4"><span></span> <span></span> <span></span></div></p>';
        chatHtml += '</div>';
       $('.chat-list').append(chatHtml);
    }
    setTimeout(function(){
        $('.is-typing').remove();
    },3000);
}
function loadChat(msg,me){
    msg = processSmiley(msg);
    var chatHtml = '';
    if(me){
        if(lastChated != 'me'){
            lastChatId++;
            chatHtml += '<div id="'+lastChatId+'" class="chat-entry entry-right">';
            chatHtml += '<a href="#" class="avatar chat-entry-avatar"><img src="'+myImage+'" alt=""></a>';
            chatHtml += '<div class="chat-entry-bubble">';
            chatHtml += '<p>'+msg+'</p>';
            chatHtml += '</div>';
            chatHtml += '</div>';
            $('.chat-list').append(chatHtml);
        }else{
            chatHtml += '<div class="chat-entry-bubble">';
            chatHtml += '<p>'+msg+'</p>';
            chatHtml += '</div>';
            $('#'+lastChatId).append(chatHtml);
        }
        lastChated = 'me';
    }else{
       if(lastChated != 'you'){
            lastChatId++;
            chatHtml += '<div id="'+lastChatId+'" class="chat-entry entry-left">';
            chatHtml += '<a href="#" class="avatar chat-entry-avatar"><img src="'+yourImage+'" alt=""></a>';
            chatHtml += '<div class="chat-entry-bubble">';
            chatHtml += '<p>'+msg+'</p>';
            chatHtml += '</div>';
            chatHtml += '</div>';
            $('.chat-list').append(chatHtml);
       }else{
            chatHtml += '<div class="chat-entry-bubble">';
            chatHtml += '<p>'+msg+'</p>';
            chatHtml += '</div>';
            $('#'+lastChatId).append(chatHtml);
       }
       lastChated = 'you';
    }
    if($('.is-typing').length > 0){
       $('.is-typing').remove();
    }
    $(".chat-list").scrollTop($(".chat-list").prop("scrollHeight"));
}
var fadeTrigger = false;
function showNotification(str){
    $('.notification').html(str);
    $('.notification').fadeIn();
    if(!fadeTrigger){
        setTimeout(hideNotification,10000);
        fadeTrigger = true;
    }
       
}
function hideNotification(){
    fadeTrigger = false;
    $('.notification').fadeOut();
}
function captureImage(type){
    if(type == 'my'){
        var video = document.getElementById('my-video');
    }else{
        var video = document.getElementById('your-video');
    }
    var canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    var dataURI = canvas.toDataURL('image/jpeg'); 
    if(type == 'my'){
        myImage = dataURI;
    }else{
        yourImage = dataURI;
    }
}