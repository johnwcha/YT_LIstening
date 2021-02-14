<template>
  <div>

    <v-row id="content">
      <v-col cols="6" id="left">
        <v-row>
          <v-col cols="12">
          <youtube v-if="videoId!=''" ref="youtube" :video-id="videoId" :player-vars="playerVars" 
            @ready="onReady" @buffering="onBuffer" @paused="paused" @ended="ended"
            @playing="playing" width="100%" ></youtube>
          <v-text-field solo v-model="ytURL" label="YouTube URL" @change="parseURL"></v-text-field>
            <input type="text" style="border-style: solid; width: 40px" v-model="counter">
            <v-btn class="success" @click="getCurrentTime"> get current time </v-btn>
            <v-btn class="info" @click="outputJSON"> output JSON </v-btn>
          </v-col>
          <v-col cols="12">
            <v-textarea outlined label="subtitle here, line by line" v-model="taValue" @change="parseInput"></v-textarea>
            <p> JSON.stringify(this.videoCollection) </p>
            <v-textarea outlined
              label="paste JSON Object here"
              v-model="taVocab"
            ></v-textarea>
            <v-btn class="primary" @click="parse_sub_against_vocab" :disabled="taVocab==''"> Parse JSON Object </v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="6" id="right" style="overflow:auto; height: 1000px">
        <v-btn class="warning" @click="save_to_database"> save to database </v-btn>
        <v-simple-table dense>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left"> # </th>
                <th class="text-left"> Time </th>
                <th class="text-left"> Lyrics </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in videoCollection" :key="i" >
                <td> {{ i }} </td>
                <td style="font-weight: bolds; width: 140px;">
                  <v-text-field v-model="item.id" @change="adjustTime(item, i)"> </v-text-field>
                </td>
                <td @click="playSegment(item, i)"> 
                  <v-text-field v-model="item.sub"> </v-text-field>
                  <!-- <span style="font-size: 18px"> {{ item.sub }} </span>
                  <v-icon class="pink--text"> mdi-circle </v-icon> -->
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-col>
    </v-row>


    <v-snackbar v-model="snackbar" color="success">
      Success !
      <v-btn dark text @click="snackbar = false">
        Close
      </v-btn>
    </v-snackbar>
  </div>
</template>

<script>
import Vue from 'vue'
import VueYoutube from 'vue-youtube'
import firebase from 'firebase/app';
import 'firebase/firestore'

// import hsk_1 from '../hsk/hsk-level-1';
// import hsk_2 from '../hsk/hsk-level-2';
// import hsk_3 from '../hsk/hsk-level-3';
// import hsk_4 from '../hsk/hsk-level-4';
// import hsk_5 from '../hsk/hsk-level-5';
// import hsk_6 from '../hsk/hsk-level-6';
// import ic4 from '../IC4/vocab_list';
// import sub from '../video/video_sub';

Vue.use(VueYoutube)

export default {
  data() {
    return {
        snackbar: false,
        counter: 0,
      videoCollection: [],
      videoDuration: null,
      videoId: '',
      playerVars: {
        autoplay: 0,
        controls: 1,
        //start: 35,
        //end: 36,
        fs: 1,
        iv_load_policy: 3, // not working
        loop: 1, // not working
        modestbranding: 0, // no effect
        rel: 0,
        showinfo: 0,
      },
      taValue: '',
      taVocab: '',
      ytURL: '',
      advSkipWords: ['和', '嗎', '你', '我', '他', '她', '的', '了','、', '，', '。', '：', '？', '"', ',', '（', '）', '(', ')'],
      noviceSkipWords: ['、', '，', '。', '：', '？', '"', ',', '（', '）', '(', ')', '.', '…', '','‘','’', '“', '”'],
      alphabet: ['“','”','哦','喲','呢','啊','呀','呐','唉','哎','！','1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    }
  },
  methods: {
    parseInput() {
      this.videoCollection = [];
      const input_lines = this.taValue.split('\n');
      console.log(input_lines)
      
      input_lines.forEach(item => {
        console.log(item)
          //var string_with_hsk_level = [];
          //const temp = item.split('", "').join(' ').trim().split(' ') // ", "多伦多", "的", "父老乡亲", "们", "，", "大家", "过年", "好", "
        const temp = item.trim().split('", "').join(' ').trim() // ", "多伦多", "的", "父老乡亲", "们", "，", "大家", "过年", "好", "
          const obj = {id: 0, start: 0, sub: temp}
          this.videoCollection.push(obj)
        //this.videoCollection.push( obj ); 
      })
    },
    outputJSON(){
      this.genre = '教學'
      this.level = 'advanced'
      this.vidTitle = 'Happy Chinese Ep 1 - 快乐汉语 - 远方来客'
      this.cctype = 'hard'
      this.taVocab = JSON.stringify(this.videoCollection)
      alert(this.genre +' - '+ this.level +' - '+ this.vidTitle +' - '+ this.cctype)
    },
    save_to_database() {
      console.log(this.videoCollection)

      let sentence_write = 0
      let phrase_write = 0
      let character_write = 0
      let levelSkip = []
      levelSkip = this.noviceSkipWords.concat(this.alphabet)
      levelSkip = levelSkip.concat(this.advSkipWords)

      this.videoCollection.forEach(item => {
        //console.log(item) // {id: vid, start: startTime, duration: duration, sub: sub}
        console.log(item.sub)
        const obj = {start: item.start, sub: item.sub}
        //                                                                            ******* WRITE ********  sentence_
        this.$fireStore.collection( this.videoId ).doc(item.id).set(obj).then(() => {
          sentence_write++
          console.log('】sentence write count:', sentence_write)
        }).catch(error => { console.error('】sentence_write:', error.message)})

        // write phrase
        item.sub.split(' ').forEach(phrase => {
          console.log(phrase)
          const skip = this.advSkipWords.concat(this.alphabet) // also exclude 我 有 的 你 他 ...
          if (!skip.includes(phrase)) {
            var obj = {}
            obj[item.id] = {start: item.start, sub: item.sub}
            //                                                                      ******* WRITE ******** phrase 
            this.$fireStore.collection(phrase).doc(this.videoId).set(obj, { merge: true }).then(() => {
                phrase_write++
                console.log('phrase write count:', phrase_write)
            }).catch(error => { console.error('phrase_write:', error.message)})
          }
          const chars = phrase.split('')
          chars.forEach(char => {
            console.log(char)
            if (char != ' ') { 
              if (!levelSkip.includes(char)) {
                //                                                                    ******* WRITE ******** 汉字 
                this.$fireStore.collection('-char_index').doc(char).update({ // 1) try 'update' first
                    vocab: firebase.firestore.FieldValue.arrayUnion(phrase)
                }).then(() => { console.log('updated field'); character_write = character_write +2;
                  console.log('character write count:', character_write) }).catch(error => {
                  // 2) if error, No document to update, so set() the doc
                  console.log( char, phrase)
                  character_write = character_write +2
                  this.$fireStore.collection('-char_index').doc(char).set({vocab: []}).then(() =>{
                    this.$fireStore.collection('-char_index').doc(char).update({ // 3) after set [], then 'update'
                      vocab: firebase.firestore.FieldValue.arrayUnion(phrase)
                    }).then(() => { 
                      console.log('insert data')
                      character_write++
                      console.log('character write count:', character_write)
                    }).catch(error => { console.log(error.message) })
                  }).catch(error => { console.log(error.message) })
                })
              }
            }
          })
        })
      })

      // save video metadata
      this.$fireStore.collection( '-video_meta' ).doc(this.videoId)
          .set( {genre: this.genre, level: this.level, title: this.vidTitle, cc: this.cctype, active: true} )
          .then(() => { console.log('video meta-data save complete 😀😀😀😀😀') })
          .catch((error) => { console.error(error.message) } )
    },
    justNote(){
            // character batch write commit
            // NOT WORKING as checking doc.exists is asynchronous
            // character_batch.commit().then(() => {
            //     console.log( 'character batch write done' )
            // }).catch((error) => { console.log('character write error:', error.message) })
        // sentence batch write：===================== 500 MAX
        // sentence_batch.commit().then(() => {
        //     console.log( 'sentence batch write done' )
        //     // phrase batch write
        //     phrase_batch.commit().then(() => {
        //         console.log( 'phrase batch write done' )
        //     }).catch((error) => { console.log('phrase write error:', error.message) })
        // }).catch((error) => { console.log('sentenc write error: ', error.message) })
        /*
            A batched write can contain up to 500 operations. 
            Each operation in the batch counts separately towards 
            your Cloud Firestore usage. Within a write operation, 
            field transforms like serverTimestamp, arrayUnion, and increment 
            each count as an additional operation.
        */
    },
    getCurrentTime() {
      this.$refs.youtube.player.getCurrentTime().then(value => {
        console.log(value, this.counter);
        console.log(new Date((value.toFixed(1)-.6) * 1000).toISOString().substr(11, 12))
        //this.videoCollection[this.counter].id = new Date((value.toFixed(1)-.6) * 1000).toISOString().substr(14, 5);
        this.videoCollection[this.counter].id = new Date((value.toFixed(1)-.6) * 1000).toISOString().substr(11, 12);
        this.videoCollection[this.counter].start = value.toFixed(1)-.6;
        this.counter++;
      })
    },
    adjustTime(item, index) {
      console.log( item )
      const time = item.id.split(':')
      this.videoCollection[index].start = parseInt(time[0])*60*60 + parseInt(time[1])*60 + parseFloat(time[2])
    },
    playSegment(obj, i) {
      this.counter = i
      //console.log(obj.start, obj.start+obj.duration);
      //this.playerVars.start = obj.start;
      //this.playerVars.end = obj.start + obj.duration;
      this.$refs.youtube.player.seekTo(obj.start, true);
      this.$refs.youtube.player.playVideo();
    },
    parseURL() {
      const temp = this.ytURL.split('&');
      this.videoId = temp[0].split('?v=')[1];
      console.log(temp[0].split('?v=')[1]);
    },
    ended(obj) {
      console.log(obj, 'video ended')
    },
    paused(obj) {
      console.log(obj, 'video is paused')
    },
    onBuffer(obj) {
      console.log(obj, 'Buffering')
    },
    playing(obj) {
      console.log(obj.getDuration(), 'we are watching!!!')
    },
    onReady(obj) {
      console.log(obj, 'video is ready')
      this.videoDuration = obj.getDuration();
    },
    parse_sub_against_vocab() {
      this.videoCollection = JSON.parse(this.taVocab)
    },
    /*
    parse_input_against_hsk() {
      //console.log(this.taValue);
      this.hsk = {1: 'n', 2: 'n', 3: 'n', 4: 'n', 5: 'n', 6: 'n'};
      var timecode_str;
      var startTime = 0;
      var time_0 = 0;
      var time_2 = 0;
      var duration = 0;

      // parsing results from http://cppjieba-webdemo.herokuapp.com/

      const input_lines = this.taValue.split('\n');
      //console.log( input_lines );
      //return;

      input_lines.forEach((item, index) => {
          if (item != '') { 
        var string_with_hsk_level = [];
        if ((index % 2) === 0) {
          //console.log(index);
          timecode_str = item;
          const timecode = item.split(':');
           // 00_m :_w 25_m
          let min = 0; let sec = 0;
          if (timecode.length === 2) {
            min = timecode[0]; 
            sec = timecode[1]; 
            if ( (index+2) === input_lines.length) {
              time_0 = parseInt(min)*60 + parseInt(sec);
              startTime = time_0;
              duration = this.videoDuration - time_0
            } else {
              //console.log( input_lines[index+2] );
              time_0 = parseInt(min)*60 + parseInt(sec);
              startTime = time_0;
              time_2 = parseInt( input_lines[index+2].split(':')[0] )*60 + parseInt( input_lines[index+2].split(':')[1] );
              duration = time_2 - time_0;
            }
            //console.log(timecode_str); // firestore document id
          } else {
            alert('Error with subtitle timestamp');
          }
        } else {
          const temp = item.split('", "').join(' ').trim().split(' '); // ", "多伦多", "的", "父老乡亲", "们", "，", "大家", "过年", "好", "
          temp.forEach(word => {
            const found = this.find_hsk_level(word);
            if (found) {
              string_with_hsk_level.push(word + '_' + found.level);
              //console.log(phrase[0] + '_' + found.level);
            } else {
              string_with_hsk_level.push(word);
              //console.log(phrase[0]);
            }
          })
          console.log(string_with_hsk_level);
          this.videoCollection.push( {id: timecode_str, start: startTime, duration: duration, sub: string_with_hsk_level} ); // firestore document          
        }
        }
      })
      console.log(this.hsk);
    }, */
    find_hsk_level(vocab) {
        //console.log(vocab);
        let found = false;
        for (let obj of hsk_1.hsk_1) {
          if (vocab === obj.hanzi) {
            found = true;
            this.hsk['1'] = 'y';
            return {level: '1', def: obj};
            break;
          }
        }
        if (!found) {
          for (let obj of hsk_2.hsk_2) {
            if (vocab === obj.hanzi) {
              found = true;
              this.hsk['2'] = 'y';
              return {level: '2', def: obj};
              break;
            }
          }
        }
        if (!found) {
          for (let obj of hsk_3.hsk_3) {
            if (vocab === obj.hanzi) {
              found = true;
              this.hsk['3'] = 'y';
              return {level: '3', def: obj};
              break;
            }
          }
        }
        if (!found) {
          for (let obj of hsk_4.hsk_4) {
            if (vocab === obj.hanzi) {
              found = true;
              this.hsk['4'] = 'y';
              return {level: '4', def: obj};
              break;
            }
          }
        }
        if (!found) {
          for (let obj of hsk_5.hsk_5) {
            if (vocab === obj.hanzi) {
              found = true;
              this.hsk['5'] = 'y';
              return {level: '5', def: obj};
              break;
            }
          }
        }
        if (!found) {
          for (let obj of hsk_6.hsk_6) {
            if (vocab === obj.hanzi) {
              found = true;
              this.hsk['6'] = 'y';
              return {level: '6', def: obj};
              break;
            }
          }
        }
      return false;
    }
  },
  mounted() {
      console.log( this.$fireAuth );
      console.log( this.$fireStore );
    //console.log(hsk_1); // [ {hanzi: , id: , pinyin: , translations: [] }, ... ]
    //console.log(hsk_2);
    //console.log(hsk_3);
    //console.log(hsk_4);
    //console.log(hsk_5);
    //console.log(hsk_6);
    //console.log(ic4); // ic4.L10 = ["地理", ...]
    //console.log(sub);
    //this.find_hsk_level(vocab);
    //this.parse_sub_against_hsk();
  }
}
</script>
