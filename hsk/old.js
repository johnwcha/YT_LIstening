
function parse_sub_against_hsk() {
    //console.log(this.taValue);
    this.hsk = {1: 'n', 2: 'n', 3: 'n', 4: 'n', 5: 'n', 6: 'n'};
    var timecode_str;
    var time_0 = 0;
    var time_2 = 0;
    var duration = 0;
    
    // parsing results from http://thulac.thunlp.org/demo
    const input_lines = this.taValue.split('\n');

    input_lines.forEach((item, index) => {
      var string_with_hsk_level = [];
      if ((index % 2) === 0) {
        //console.log(index);
        const timecode = item.split(' ');
         // 00_m :_w 25_m
        let min; let sec;
        if (timecode.length === 3) {
          min = timecode[0];
          sec = timecode[2];
          timecode_str = min.split('_')[0] + ':' + sec.split('_')[0];
          if ( (index+2) === input_lines.length) {
            time_0 = parseInt(min)*60 + parseInt(sec);
            duration = this.videoDuration - time_0
          } else {
            console.log( input_lines[index+2] );
            time_0 = parseInt(min)*60 + parseInt(sec);
            time_2 = parseInt( input_lines[index+2].split(' ')[0].split('_')[0] )*60 + parseInt( input_lines[index+2].split(' ')[2].split('_')[0] )
            duration = time_2 - time_0;
          }
          //console.log(timecode_str); // firestore document id
        } else {
          alert('Error with subtitle timestamp');
        }
      } else {
        const temp = item.split(' '); // 多伦多_ns 的_u 父老乡亲_i 们_k ，_w 大家_n 过年_v 好_a
        temp.forEach(obj => {
          const phrase = obj.split('_');
          const found = this.find_hsk_level(phrase[0]);
          if (found) {
            string_with_hsk_level.push(phrase[0] + '_' + found.level);
            //console.log(phrase[0] + '_' + found.level);
          } else {
            string_with_hsk_level.push(phrase[0]);
            //console.log(phrase[0]);
          }
        })
        console.log( {id: timecode_str, duration: duration, sub: string_with_hsk_level.join(' ')} ); // firestore document
      }
    })
    console.log(this.hsk);
  }