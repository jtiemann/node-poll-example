/* Author: Jon "T-Bone" Tiemann
*/
//BEGIN WIDGET poll-vote
(function(pv, $){
  pv.element = "poll-vote";
  pv.qandaArray =  JSON.parse(document.body.getElementsByTagName(pv.element)[0].getAttribute('data-questions')).qandas;
  pv.struct = pv.qandaArray.map(function(unit, index, arr){
    var ed = `<p>${unit[0]}<button class="like" name="${index}" value="like">like</button><button class="like" name="${index}" value="notLike">not like</button></p>`
    //var ed = '<p>' + unit[0] + '<button class="like" name="' + index + '" value="like">like</button><button class="like" name="' + index + '" value="notLike">not like</button></p>';
    var jim = unit[1].reduce(function(sum, piece, idx){
         return sum.concat(`<li><input class="sender" type="radio" name="${index}" value="${piece}" data-index="${idx}">${piece}</li>`)
       },"")
    //var jim = unit[1].reduce(function(sum, piece, idx){
      //   return sum.concat('<li><input class="sender" type="radio" name="'+ index +'" value="' + piece + '" data-index="' + idx + '">' + piece + '</li>')
       //},"")
    return `<div>${ed}<ol>${jim}</ol><label class="result"></label></div>`
  })
  pv.numAnswersArr = pv.qandaArray.reduce(function(sum, unit, index, arr){
    return sum.concat(unit[1].length)
  }, []);

  //BUILD TEST
  document.body.getElementsByTagName(pv.element)[0].innerHTML = pv.struct.join(" ");

  //BUILD CONF
  pv.conf = document.body.getElementsByTagName(pv.element)[0].getAttribute('data-conf');
  //calculate numAnswers
  pv.parsedConf = JSON.parse(pv.conf)
  pv.parsedConf.numAnswers = pv.numAnswersArr
  //

/*
 <div>
 <p>Do you code javascript daily?
 <button class="like" name="0" value="like">like</button>
 <button class="like" name="0" value="notLike">not like</button>
 </p>
 <ol>
 <li><input class="sender" type="radio" name="0" value="yes" data-index="0">yes</li>
 <li><input class="sender" type="radio" name="0" value="no" data-index="1">no</li>
 <li><input class="sender" type="radio" name="0" value="sometimes" data-index="2">Sometimes</li>
 </ol>
 <label class="result"></label>
 </div>
 */
}(window.pv = window.pv || {}, jQuery))
//END WIDGET

$(document).ready(function() {


  var socket = io.connect(), 
      conf = "",
      chartSelector = "$('[name=\"questionNumber\"]').parent().parent().children('.result')",
      chartTypes = ["bar", "pie", "text"],
    // jQuery plugin style
      displayFunctions = [".highcharts(barOptions.apply(this, args))",
                          ".highcharts(pieOptions.apply(null, args))",
                          ".html(buildString)"]

  function buildChartArgs(aVote){
    var buildString = "",
       args =[];

    for (var i=0; i<aVote.answerArray.length;i++){
      buildString +=  (i+1) + ": "+ aVote.answerArray[i] + ", ";
      args.push(aVote.answerArray[i])
    }
    buildString = buildString.slice(0, -2);
    return [buildString, args]
  }

  // INIT SERVER
  /*
   data-conf='{
   "title": "Ts JS Test1", //todo
   "numAnswers": [2,2],
   "defaultChartType": "pie",
   "defaultMultiVote": "true"
   }'
   */

    socket.emit('setup', JSON.stringify(pv.parsedConf));
  //END INIT SERVER

  // UI EVENTS
  $('#poll').on('click', '.sender', function(evt) {
    //alert(evt);
   socket.emit('message', JSON.stringify({"name": evt.currentTarget.name, "answer": evt.currentTarget.value, "answerIndex": evt.currentTarget.getAttribute("data-index") }));
  });

  $('#poll').on('click', '.like',function(evt) {
    //alert('thanks for your vote: ' + (evt.currentTarget.value + ' on the question:' + $(this).siblings().first().text()));
    socket.emit('like', JSON.stringify({"name": evt.currentTarget.name, "answer": evt.currentTarget.value }));
  });
  //END UI EVENTS

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    $('#multi-vote').val(pv.parsedConf.defaultMultiVote || 'false')
    $('#multi-vote').text($('#multi-vote').val() === 'true' ? "multiVote is on" : "multiVote is off")
    $('#multi-vote').css("display", "block");

    $('#chart-type').val(pv.parsedConf.defaultChartType || "pie")
    $('#chart-type').css("display", "block");

    // UI EVENTS

    $('#multi-vote').on('click', function(evt) {
      this.value = this.value === 'true' ? 'false' : 'true';
      this.innerText = this.value === 'true' ? "multiVote is on" : "multiVote is off"
      socket.emit('multiVote', this.value);
    });

    $('#chart-type').on('change', function(evt) {
      socket.emit('chartType', this.value);
    });
  }

  socket.on('server_message', function(data){
    //parse receiver and add to correct question
    var vote = JSON.parse(data);  // now with answerArray
    $('#chart-type').val(vote.chartType);

    var chartBuilderArray = buildChartArgs(vote),
        buildString = chartBuilderArray[0],
        args = chartBuilderArray[1]

    //fire off the chart!
    eval(chartSelector.replace(/questionNumber/, vote.questionNumber) + displayFunctions[chartTypes.indexOf(vote.chartType)]);

//    if (vote.chartType === "bar"){
//      $('[name=' + vote.questionNumber + ']').parent().parent().children('.result').highcharts(barOptions.apply(this, args))
//    }
//    else if (vote.chartType === "pie") {
//      $('[name=' + vote.questionNumber + ']').parent().parent().children('.result').highcharts(pieOptions.apply(null, args))
//    }
//    else {
//      $('[name=' + vote.questionNumber + ']').parent().parent().children('.result').html(buildString);
//    }
  }); //END SOCKET server_message

  socket.on('server_like', function(data){
  /* how the app responds
   var jsonResponse = JSON.stringify({
   "likeNumber": vote[0],
   "answer": vote[1],
   "likeCount": likeArr[parseInt(vote[0])*2] || 0,
   "notLikeCount": likeArr[parseInt(vote[0])*2+1] || 0
   })
   */
  //parse receiver and add to correct question
  var vote = JSON.parse(data);

    var buildString =  vote.likeCount + ' like';
    $('[name=' + vote.likeNumber + ']').siblings('.like').first().html(buildString);
    buildString = vote.notLikeCount + ' not like';
    $('[name=' + vote.likeNumber + ']').siblings('.like').first().next().html(buildString);
}); //END SOCKET server_like

  socket.on('server_poll_init', function(data){
    /* how the app responds
     var jsonResponse = JSON.stringify({
     "likeNumber": vote[0],
     "answer": vote[1],
     "likeCount": likeArr[parseInt(vote[0])*2] || 0,
     "notLikeCount": likeArr[parseInt(vote[0])*2+1] || 0,
     "chartType": 'pie',
     "multiVote": 'false'
     })
     */
    var votes = JSON.parse(data);
    $('#chart-type').val( votes[0].chartType || JSON.parse(conf).defaultChartType || "bar")

    $('#multi-vote').val(votes[0].multiVote === 'true' ? 'true' : 'false')
    $('#multi-vote').text('multiVote is ' + (votes[0].multiVote === 'true' ? 'on' : 'off'));

    votes.map(function(vote){
      var chartBuilderArray = buildChartArgs(vote),
          buildString = chartBuilderArray[0],
          args = chartBuilderArray[1]

      //fire off the chart!
/* ODD, shows if tbone!   eval(chartSelector.replace(/questionNumber/, vote.questionNumber) + displayFunctions[chartTypes.indexOf(vote.chartType)]); */

//      if (vote.chartType === "bar"){
//        $('[name=' + vote.questionNumber + ']').parent().parent().children('.result').highcharts(barOptions.apply(null, args))
//      }
//      else if (vote.chartType === "pie") {
//        $('[name=' + vote.questionNumber + ']').parent().parent().children('.result').highcharts(pieOptions.apply(null, args))
//      }
//      else {
//        $('[name=' + vote.questionNumber + ']').parent().parent().children('.result').html(buildString);
//      }
    })
  }); //END SOCKET server_poll_init

  socket.on('server_like_init', function(data){
    /* how the app responds
     var jsonResponse = JSON.stringify({
     "likeNumber": vote[0],
     "answer": vote[1],
     "likeCount": likeArr[parseInt(vote[0])*2] || 0,
     "notLikeCount": likeArr[parseInt(vote[0])*2+1] || 0
     })
     */
    //parse receiver and add to correct question

    var votes = JSON.parse(data);

    votes.map(function(vote, index){
        var buildString =  vote.likeCount + ' like';
        $('[name=' + vote.likeNumber + ']').siblings('.like').first().html(buildString);

        buildString = vote.notLikeCount + ' not like';
        $('[name=' + vote.likeNumber + ']').siblings('.like').first().next().html(buildString);
    })
  }); //END SOCKET server_like_init

  socket.on('server_poll_init_admin', function(data){
//    var voterArray = JSON.parse(data);
//
//    $('#multi-vote').val(votes[0].multiVote === 'true' ? 'true' : 'false')
//    $('#multi-vote').text('multiVote is ' + (votes[0].multiVote === 'true' ? 'on' : 'off'))
//
//    voterArray.map(function(vote, index){
//
//    })
  }); //todo

 // HIGHCHART HELPERS
  function pieOptions() {

    return {
      chart: {
        //renderTo: 'container',
        width: '400',
        height: '200',
        type: 'pie',
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false
      },
      title: {
        text: ''
      },
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
      },
      plotOptions: {
        pie: {
          size: '70%',
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            color: '#000000',
            connectorColor: '#000000',
            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
          }
        }
      },
      series: [{
        type: 'pie',
        //name: 'Browser share',
        data:
              Array.prototype.slice.call(arguments, 0).
                   reduce(function(sum, unit, index, arr){
                       return sum.concat( [[ ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'][index], unit/(arr.reduce(function(sum, unit,index, arr){return sum += unit},0) ) ]] ) }, [])
      }]
    }
  }
  function barOptions() {
    //var ed = Array.prototype.slice.call(arguments, 0).reduce(function(sum, unit, index, arr){return sum.concat({name: index, data: [unit]}) }, [])
    //debugger
    return {
      chart: {
        height: '200',
        width: '400',
        type: 'bar'
      },
      title: {
        text: ''
      },
      subtitle: {
        text: ''
      },
      xAxis: {
        labels: '',
        title: {
          text: 'Votes'
        },
        categories: [
          'count'
        ]
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Counts'
        }
      },
      tooltip: {enabled:true},
//    tooltip: {
//      headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
//      pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
//        '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
//      footerFormat: '</table>',
//      shared: true,
//      useHTML: true
//    },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0
        }
      },
      series: Array.prototype.slice.call(arguments, 0).reduce(function(sum, unit, index, arr){return sum.concat({name: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'][index], data: [unit]}) }, [])
    }
  }
  //END DOCUMENT READY
});