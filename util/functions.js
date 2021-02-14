// Firebase batch delete collections 
// firebase firestore:delete --all-collections -y

import firebase from 'firebase/app';
import 'firebase/firestore'

export function getVideoMeta(db) {
    let results = []
    db.collection('-video_meta').get().then(snapshots => {
        snapshots.forEach(video => {
            //console.log(video.id, video.data())
            results.push( {vid: video.id, ...video.data()} )
        })
    }).catch(error => {
        console.log('functions.js : ', error.message)
    })
    return results
}

export function getCharIndex() {
    let results = []
    firebase.firestore().collection('-vocab_index').doc('0').get().then(snapshots => {
        //console.log(snapshots.id, snapshots.data())
        results.push( {char: snapshots.id, ...snapshots.data()} )
    })
    return results
}

function SRTtimecodeToNumber(timeStr) {
    // timeString : "00:00:09,472 --> 00:00:10,752"
    const temp = timeStr.split(' --> ')
    const startTimeArr = temp[0].split(',').join('.').split(':')
    const endTimeArr = temp[1].split(',').join('.').split(':')
    //console.log(startTimeArr, endTimeArr)
    const startTime = parseInt(startTimeArr[0])*60*60 + parseInt(startTimeArr[1])*60 + parseFloat(startTimeArr[2])
    const endTime = parseInt(endTimeArr[0])*60*60 + parseInt(endTimeArr[1])*60 + parseFloat(endTimeArr[2])

    return [startTime, endTime]
}

export function parseSRT(file) {
    // videoCollection.push( {id: timecode_str, start: startTime, duration: duration, sub: temp.split(' ')} ); 
    var videoCollection = []
    // var timecode_str;
    var startTime = 0;
    //var time_0 = 0;
    //var time_2 = 0;
    var duration = 0;
    var vid = ''

    const input_lines = file.split('\n')

    input_lines.forEach((item, index) => {
      if ((index % 4) === 0) {
        //console.log(item) // line number
        return
    } else if ((index % 4) === 1) {  
        //console.log(item, index) // timecode format 00:01:36,000 --> 00:01:37,536
        //timecode_str = item;
        const timecode = item.split(' --> ');
        //console.log(timecode) // ["00:00:09,472", "00:00:10,752"]
        if (timecode.length === 2) {
            vid = timecode[0].split(',').join('.')
            const parsedTimeArr = SRTtimecodeToNumber(item)
            duration = parsedTimeArr[1] - parsedTimeArr[0]
            startTime = parsedTimeArr[0]
            //console.log('start: ', parsedTimeArr[0], 'duration: ', duration )
        } else {
            console.error('Error with subtitle timestamp')
        }        
    } else if ((index % 4) === 2) {  
        //console.log(item.split('", "').join(' ').trim()) // subtitle to parse
        if (item.split('", "').length==1) console.log('word segmentation !!!', item)
        const sub = item.split('", "').join(' ').trim()
        //console.log( {id: vid, obj: {start: startTime, duration: duration, sub: sub}} )
        videoCollection.push({id: vid, start: startTime, duration: duration, sub: sub})
        sub.split('').forEach(char => {
            console.log(char)
        })
    } else if ((index % 4) === 3) {  
        //console.log(item) // blank line
    } 
  })
  //console.log(videoCollection)
  return videoCollection
}

export function compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // property doesn't exist on either object
      return 0
      }

      const varA = (typeof a[key] === 'string')
      ? a[key].toUpperCase() : a[key];
      const varB = (typeof b[key] === 'string')
      ? b[key].toUpperCase() : b[key];

      let comparison = 0
      if (varA > varB) {
      comparison = 1;
      } else if (varA < varB) {
      comparison = -1;
      }
      return (
      (order === 'desc') ? (comparison * -1) : comparison
      )
    }
}