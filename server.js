//setup Dependencies
var connect = require('connect')
    , express = require('express')
    , io = require('socket.io')
    , port = (process.env.PORT || 4001);

//Setup Express
var server = express.createServer();
server.configure(function(){
    server.set('views', __dirname + '/views');
    server.set('view options', { layout: false });
    server.use(connect.bodyParser());
    server.use(express.cookieParser());
    server.use(express.session({ secret: "shhhhhhhhh!"}));
    server.use(connect.static(__dirname + '/static'));
    server.use(server.router);
});

//setup the errors
server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.jade', { locals: { 
                  title : '404 - Not Found'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX' 
                },status: 404 });
    } else {
        res.render('500.jade', { locals: { 
                  title : 'The Server Encountered an Error'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX'
                 ,error: err 
                },status: 500 });
    }
});
server.listen( port);

//Setup Socket.IO
var io = io.listen(server);
var answerArr = [],// array of yes, no answers for each question [3, 5] is 3 yeses and 5 nos for question name 0
    voter = {},//contains voter.address, voter.votes, an object containing an array of answers indexed by question number (name)
    voterAddressArr = [], //an array of voter ip's'
    voterArr = []; // array of voter objects
;
var likesArr = [],// array of yes, no answers for each question [3, 5] is 3 yeses and 5 nos for question name 0
  liker = {},//contains voter.address, voter.votes, an object containing an array of answers indexed by question number (name)
  likerAddressArr = [], //an array of voter ip's'
  likerArr = []; // array of voter objects

io.sockets.on('connection', function(socket){
  console.log('Client Connected');

  socket.on('message', function(data){
    /*
    get this connections address (ip)
    look in voterAddressArr to see if in there (if not add it)
    check if user has answered this question in voterArr[idx].votes array
    (idx in voterAddressArr is used as entry pointer in voterArr)
    if not in voterArr[idx].votes, then vote and add to votes, else just return

     */
    //console.log(socket)
    var address = socket.handshake.address;
    console.log("New connection from " + address.address + ":" + address.port);
    //check for presence
    var idx = voterAddressArr.indexOf(address.address);
    if ( idx !== -1) {
      voter = voterArr[idx] || {"address": address.address, "votes": []};
    }
    else {
      voterAddressArr.push(address.address);
      voter = voterArr[voterAddressArr.length-1] = {"address": address.address, "votes": []};
    }

    var vote = JSON.parse(data); //data.name = question number, data.answer = answer
    var arrIndex = vote.answer === 'yes' ? parseInt(vote.name) * 2 : parseInt(vote.name) * 2 + 1

    if (!voter.votes[vote.name]) {
      voter.votes[vote.name] = vote.answer
      answerArr[arrIndex] = answerArr[arrIndex] + 1 || 1;
      var jsonResponse = JSON.stringify({
        "questionNumber": vote.name,
        "answer": vote.answer,
        "yesCount": answerArr[parseInt(vote.name)*2] || 0,
        "noCount": answerArr[parseInt(vote.name)*2+1] || 0
      })
      socket.broadcast.emit('server_message',jsonResponse);
      socket.emit('server_message',jsonResponse);
    }

//    var jsonResponse = JSON.stringify({
//      "questionNumber": vote.name,
//      "answer": vote.answer,
//      "yesCount": answerArr[parseInt(vote.name)*2] || 0,
//      "noCount": answerArr[parseInt(vote.name)*2+1] || 0
//    })
//    socket.broadcast.emit('server_message',jsonResponse);
//    socket.emit('server_message',jsonResponse);

  });

  socket.on('like', function(data){
    /*
     get this connections address (ip)
     look in voterAddressArr to see if in there (if not add it)
     check if user has answered this question in voterArr[idx].votes array
     (idx in voterAddressArr is used as entry pointer in voterArr)
     if not in voterArr[idx].votes, then vote and add to votes, else just return

     */
    //console.log(socket)
    var address = socket.handshake.address;
    console.log("New connection from " + address.address + ":" + address.port);
    //check for presence
    var idx = likerAddressArr.indexOf(address.address);
    if ( idx !== -1) {
      liker = likerArr[idx] || {"address": address.address, "votes": []};
    }
    else {
      likerAddressArr.push(address.address);
      liker = likerArr[likerAddressArr.length-1] = {"address": address.address, "votes": []};
    }

    var vote = JSON.parse(data); //data.name = like number, data.answer = answer
    var arrIndex = vote.answer === 'like' ? parseInt(vote.name) * 2 : parseInt(vote.name) * 2 + 1

    //if (!liker.votes[vote.name]) {
      liker.votes[vote.name] = vote.answer
      likesArr[arrIndex] = likesArr[arrIndex] + 1 || 1;
      var jsonResponse = JSON.stringify({
        "likeNumber": vote.name,
        "answer": vote.answer,
        "likeCount": likesArr[parseInt(vote.name)*2] || 0,
        "notLikeCount": likesArr[parseInt(vote.name)*2+1] || 0
      })
      socket.broadcast.emit('server_like',jsonResponse);
      socket.emit('server_like',jsonResponse);
   // }

//    var jsonResponse = JSON.stringify({
//      "questionNumber": vote.name,
//      "answer": vote.answer,
//      "yesCount": answerArr[parseInt(vote.name)*2] || 0,
//      "noCount": answerArr[parseInt(vote.name)*2+1] || 0
//    })
//    socket.broadcast.emit('server_message',jsonResponse);
//    socket.emit('server_message',jsonResponse);

  });
  
  socket.on('disconnect', function(){
    console.log('Client Disconnected.');
  });
});


///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function(req,res){
  res.render('index.html');
});


//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res){
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', function(req, res){
    throw new NotFound;
});

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}


console.log('Listening on http://0.0.0.0:' + port );
