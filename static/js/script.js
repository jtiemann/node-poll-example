/* Author: Jon "T-Bone" Tiemann
*/

$(document).ready(function() {   

  var socket = io.connect();
  //var answerArr = [];

  $('.sender').bind('click', function(evt) {
   //alert('thanks for your vote: ' + (evt.currentTarget.value + ' on the question:' + $(this).siblings().first().text()));
   socket.emit('message', JSON.stringify({"name": evt.currentTarget.name, "answer": evt.currentTarget.value }));
  });

  $('.like').bind('click', function(evt) {
    //alert('thanks for your vote: ' + (evt.currentTarget.value + ' on the question:' + $(this).siblings().first().text()));
    socket.emit('like', JSON.stringify({"name": evt.currentTarget.name, "answer": evt.currentTarget.value }));
  });

  socket.on('server_message', function(data){
    /* how the server responds
     var jsonResponse = JSON.stringify({
     "questionNumber": vote[0],
     "answer": vote[1],
     "yesCount": answerArr[parseInt(vote[0])*2] || 0,
     "noCount": answerArr[parseInt(vote[0])*2+1] || 0
     })
     */
    //parse receiver and add to correct question
    var vote = JSON.parse(data);
    var yesPercent = vote.yesCount/(vote.yesCount + vote.noCount);
    var noPercent = 1 - yesPercent;
    var buildString = vote.yesCount +  ' Y, ' + vote.noCount + ' N'
    //$('[name=' + vote.questionNumber + ']').siblings('.result').html(buildString);
    $('[name=' + vote.questionNumber + ']').siblings('.result').highcharts(barOptions(vote.yesCount, vote.noCount))
    //$('[name=' + vote.questionNumber + ']').siblings('.result').highcharts(pieOptions(yesPercent, noPercent))
  }); //END SOCKET server_message

  function pieOptions(yesPercent, noPercent) {
    return {
      chart: {
        //renderTo: 'container',
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
          size: '80%',
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
        data: [
          ['Yes', yesPercent],
          ['No', noPercent]
        ]
      }]
    }
  }
  function barOptions(yesCount, noCount) {
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
        'Yes',
        'No'
      ]
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Counts'
      }
    },
    tooltip: {enabled:false},
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
    series: [{
      name: 'Yes',
      data: [yesCount]

    }, {
      name: 'No',
      data: [noCount]

    }]
  }
 }

  socket.on('server_like', function(data){
  /* how the server responds
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
    /* how the server responds
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
      var yesPercent = vote.yesCount/(vote.yesCount + vote.noCount);
      var noPercent = 1 - yesPercent;
      var buildString = vote.yesCount +  ' Y, ' + vote.noCount + ' N'
      //$('[name=' + vote.questionNumber + ']').siblings('.result').html(buildString);
      $('[name=' + vote.questionNumber + ']').siblings('.result').highcharts(barOptions(vote.yesCount, vote.noCount))
      //$('[name=' + vote.questionNumber + ']').siblings('.result').highcharts(pieOptions(yesPercent, noPercent))

    })
  }); //END SOCKET server_poll_init

  socket.on('server_like_init', function(data){
    /* how the server responds
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
  //END DOCUMENT READY
});