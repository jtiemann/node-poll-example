//setup Dependencies
var connect = require('connect')
    , express = require('express')
    , io = require('socket.io')
    , port = (process.env.PORT || 4001);

//Setup Express
var server = express();
server.configure(function(){
    //server.use(connect.bodyParser());
    //server.use(express.cookieParser());
    //server.use(express.session({ secret: "shhhhhhhhh!"}));
    server.use(connect.static(__dirname + '/static'));
    server.use(server.router);
});

//Setup Socket.IO
var sockets = io.listen(server.listen(port));
var multiVote = 'false';
var chartType = "bar";
var answerArr = [],// array of yes, no answers for each question [3, 5] is 3 yeses and 5 nos for question name 0
    voter = {},//contains voter.address, voter.votes, an object containing an array of answers indexed by question number (name)
    voterAddressArr = [], //an array of voter ip's'
    voterArr = []; // array of voter objects

var likesArr = [],// array of yes, no answers for each question [3, 5] is 3 yeses and 5 nos for question name 0
  liker = {},//contains voter.address, voter.votes, an object containing an array of answers indexed by question number (name)
  likerAddressArr = [], //an array of voter ip's'
  likerArr = []; // array of voter objects

sockets.on('connection', function(socket){
  console.log('Client Connected');
//if they have answered any questions, show them on client (ie send data)
  (function voteInit(){
    var conIdx = voterAddressArr.indexOf(socket.handshake.address.address);
    if (conIdx !== -1 ) {
      //send data for questions ip has answered
      var answeredQuestionsIndexArray = voterArr[conIdx].votes.map(function(unit, index){return unit !== "undefined" ? index : false}).filter(function(unit){return unit});
      // for each question in ed, build a jsonResponse and concat
      var jsonInit = JSON.stringify(answeredQuestionsIndexArray.reduce(function(sum, unit, index){
        socket.join(unit);

        return sum.concat({
        "questionNumber": unit,
        "answer": voterArr[conIdx].votes[unit],
        "yesCount": answerArr[parseInt(unit)*2] || 0,
        "noCount": answerArr[parseInt(unit)*2+1] || 0,
        "chartType": chartType || "bar",
        "multiVote": multiVote
      })
      }, [])
      );
      //add socket to all applicable rooms


      socket.emit('server_poll_init',jsonInit);
    }
//    else {
//      if (socket.handshake.address.address == '127.0.0.1'){
//        //admin sees all
//        console.log("I'm an ADMIN!!");
//        socket.emit('server_poll_init_admin', JSON.stringify(answerArr));
//
//      }
//    }
  }());

  (function likeInit(){
      var conIdx = likerAddressArr.indexOf(socket.handshake.address.address);
      if (conIdx !== -1) {
        //send data for questions ip as answered
        var ed = likerArr[conIdx].votes.map(function(unit, index){return unit !== "undefined" ? index : false}).filter(function(unit){return unit});
        // for each question in ed, build a jsonResponse and concat
        jsonInit = JSON.stringify(ed.reduce(function(sum, unit, index){  return sum.concat({
          "likeNumber": unit,
          "answer": likerArr[conIdx].votes[unit],
          "likeCount": likesArr[parseInt(unit)*2] || 0,
          "notLikeCount": likesArr[parseInt(unit)*2+1] || 0
        })
        }, [])
        );
        socket.emit('server_like_init',jsonInit);
      };
    }());


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
    console.log("Another vote connection from " + address.address + ":" + address.port);
    //check for presence
    var idx = voterAddressArr.indexOf(address.address);
    if ( idx !== -1) {
      voter = voterArr[idx] || {"address": address.address, "votes": []};
    }
    else {
      voterAddressArr.push(address.address);
      voter = voterArr[voterAddressArr.length-1] = {"address": address.address, "socketid": socket.id, "votes": []};
    }

    var vote = JSON.parse(data); //data.name = question number, data.answer = answer
    var arrIndex = vote.answer === 'yes' ? parseInt(vote.name) * 2 : parseInt(vote.name) * 2 + 1

    if (!voter.votes[vote.name] || multiVote === 'true') {
      voter.votes[vote.name] = vote.answer
      answerArr[arrIndex] = answerArr[arrIndex] + 1 || 1;
      var jsonResponse = JSON.stringify({
        "questionNumber": vote.name,
        "answer": vote.answer,
        "yesCount": answerArr[parseInt(vote.name)*2] || 0,
        "noCount": answerArr[parseInt(vote.name)*2+1] || 0,
        "chartType": chartType || 'bar'
      })
      // only broadcast to clients that have answered the question
      socket.join(vote.name);
      socket.broadcast.to(vote.name).emit('server_message', jsonResponse) //emit to 'room' except this socket

      //socket.broadcast.emit('server_message',jsonResponse);
      socket.emit('server_message',jsonResponse);
    }

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
    console.log("Another like connection from " + address.address + ":" + address.port);
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

  socket.on('multiVote', function(data){
    multiVote = (data === "true" ? 'true' : 'false');
  });

  socket.on('chartType', function(data){
    var chartTypes = ['bar','pie','text']
    chartType = chartTypes.filter(function(unit, index){return unit === data})[0];
  });

});


///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function(req,res){
  res.render('index.html');
});

console.log('Listening on http://0.0.0.0:' + port );
