/* Author: Jon "T-Bone" Tiemann
*/

$(document).ready(function() {   

  var socket = io.connect(), gChartType;
  var conf = {
    "title": "T's JS Test1",
    "numAnswers": [3,2,4,2,2,2,2]
  }

  socket.emit('setup', conf);

  $('.sender').bind('click', function(evt) {
   //alert('thanks for your vote: ' + (evt.currentTarget.value + ' on the question:' + $(this).siblings().first().text()));
//alert(this.getAttribute("data-index"))
   socket.emit('message', JSON.stringify({"name": evt.currentTarget.name, "answer": evt.currentTarget.value, "answerIndex": this.getAttribute("data-index") }));
  });

  $('.like').bind('click', function(evt) {
    //alert('thanks for your vote: ' + (evt.currentTarget.value + ' on the question:' + $(this).siblings().first().text()));
    socket.emit('like', JSON.stringify({"name": evt.currentTarget.name, "answer": evt.currentTarget.value }));
  });

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    $('#multi-vote').css("display", "block");

    $('#multi-vote').on('click', function(evt) {
      this.value = this.value === 'true' ? 'false' : 'true';
      this.innerText = this.value === 'true' ? "multiVote is on" : "multiVote is off"
      socket.emit('multiVote', this.value);
    });
    $('#chart-type').css("display", "block");
    $('#chart-type').on('change', function(evt) {
      socket.emit('chartType', this.value);
    });
  }

  socket.on('server_message', function(data){
    /* how the app responds
     var jsonResponse = JSON.stringify({
     "questionNumber": vote[0],
     "answer": vote[1],
     "yesCount": answerArr[parseInt(vote[0])*2] || 0,
     "noCount": answerArr[parseInt(vote[0])*2+1] || 0
     })
     */
    //parse receiver and add to correct question
    var vote = JSON.parse(data);  // now with answerArray
    var buildString = "",
        args =[];

    for (var i=0; i<vote.answerArray.length;i++){
      buildString +=  (i+1) + ": "+ vote.answerArray[i] + ", ";
      args.push(vote.answerArray[i])
    }
    buildString = buildString.slice(0, -2);

    //var buildString = vote.yesCount +  ' Y, ' + vote.noCount + ' N'
    if (vote.chartType === "bar"){
      $('[name=' + vote.questionNumber + ']').siblings('.result').highcharts(barOptions.apply(this, args))
    }
    else if (vote.chartType === "pie") {
      $('[name=' + vote.questionNumber + ']').siblings('.result').highcharts(pieOptions.apply(null, args))
    }
    else {
      $('[name=' + vote.questionNumber + ']').siblings('.result').html(buildString);
    }
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
    //parse receiver and add to correct question

    var votes = JSON.parse(data);
    $('#multi-vote').val(votes[0].multiVote === 'true' ? 'true' : 'false')
    $('#multi-vote').text('multiVote is ' + (votes[0].multiVote === 'true' ? 'on' : 'off'));

    votes.map(function(vote, index){
      var buildString = "", args =[];

      gChartType = vote.chartType

      $('#chart-type').val(gChartType);


      for (var i=0; i<vote.answerArray.length;i++){
        buildString +=  (i+1) + ": "+ vote.answerArray[i] + ", ";
        args.push(vote.answerArray[i])
      }
      buildString = buildString.slice(0, -2);

      //var buildString = vote.yesCount +  ' Y, ' + vote.noCount + ' N'
      if (vote.chartType === "bar"){
        $('[name=' + vote.questionNumber + ']').siblings('.result').highcharts(barOptions.apply(null, args))
      }
      else if (vote.chartType === "pie") {
        $('[name=' + vote.questionNumber + ']').siblings('.result').highcharts(pieOptions.apply(null, args))
      }
      else {
        $('[name=' + vote.questionNumber + ']').siblings('.result').html(buildString);
      }
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
    //parse receiver and add to correct question

    var voterArray = JSON.parse(data);

    $('#multi-vote').val(votes[0].multiVote === 'true' ? 'true' : 'false')
    $('#multi-vote').text('multiVote is ' + (votes[0].multiVote === 'true' ? 'on' : 'off'))

    voterArray.map(function(vote, index){

//      var yesPercent = vote.yesCount/(vote.yesCount + vote.noCount);
//      var noPercent = 1 - yesPercent;
//      var buildString = vote.yesCount +  ' Y, ' + vote.noCount + ' N'
//      // todo: refactor side effect
//      gChartType = vote.chartType
//      $('#chart-type').val(gChartType);
//
//      if (vote.chartType === "bar"){
//        $('[name=' + vote.questionNumber + ']').siblings('.result').highcharts(barOptions(vote.yesCount, vote.noCount))
//      }
//      else if (vote.chartType === "pie") {
//        $('[name=' + vote.questionNumber + ']').siblings('.result').highcharts(pieOptions(yesPercent, noPercent))
//      }
//      else {
//        $('[name=' + vote.questionNumber + ']').siblings('.result').html(buildString);
//      }
    })
  }); //todo


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
        type: 'column'
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