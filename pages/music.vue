<template>
  <div>
    <v-flex class="text-center">
    </v-flex>
    
    <v-container fluid>

    <v-row id="content">
      <v-col cols="8" id="left">
        <v-row>
          <v-col cols="12">
          <youtube v-if="videoId!=''" ref="youtube" :video-id="videoId" :player-vars="playerVars" 
            @ready="onReady" @buffering="onBuffer" @paused="paused" @ended="ended"
            @playing="playing" ></youtube>
          <v-text-field solo v-model="ytURL" label="YouTube URL" @change="parseURL"></v-text-field>
          </v-col>
          <v-col cols="12">
            <p class="display-2"> Music video </p>
            <p> 1) copy and paste lyrics below: </p>
            <p> 2) sample input formate: <br>
                  <span class="red--text"> 你看看大伙儿合照 </span><br>
                  <span class="red--text"> 就你一个人没有笑 </span><br>
                  <span class="red--text"> 是我们装傻 还是你真的 </span></p>
            <v-textarea
              name="input-7-1"
              outlined
              label="paste parsed output here"
              v-model="taValue"
              @change="parseInput"
            ></v-textarea>
            <input type="text" style="border-style: solid; width: 40px" v-model="counter">
            <v-btn class="success" @click="getCurrentTime"> get current time </v-btn>
            <v-btn class="warning" @click="save_to_database"> save to database </v-btn>
            <hr class="my-5">
            <p> Parse against lesson vocabulary </p>
            <p> Input format: <span class="red--text"> 206_L11 节日/舅舅/舅妈/小区/环境 </span></p>
            <v-textarea
              name="input-7-1"
              outlined
              label="paste lesson vocabulary here"
              v-model="taVocab"
            ></v-textarea>
            <v-btn class="primary" @click="parse_sub_against_vocab"> Parse against lesson vocabulary
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="4" id="right" style="overflow:auto">
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left"> # </th>
                <th class="text-left"> Time </th>
                <th class="text-left"> Lyrics </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in videoCollection" :key="i" @click="playSegment(item)">
                <td> {{ i }} </td>
                <td style="font-weight: bold"> {{ item.id }} </td>
                <td> 
                <!-- development -->
                <span> {{ item.sub.join(' ') }} </span>
                <!-- production -->
                <!--
                  <span v-for="(sub, key) in item.sub" :key="key">
                    <span v-if="sub.indexOf('_')==-1"> {{ sub }} </span>
                    <input type="text" v-if="sub.indexOf('_')!=-1" @change="checkAns(sub.split('_')[0])"
                      style="width: 40px; border-style: solid; border-color: orange;">
                    <span v-if="sub.indexOf('_')!=-1"> ({{sub.split('_')[1]}}) </span>
                  </span> -->
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-col>
    </v-row>

    </v-container>
    <v-snackbar
      v-model="snackbar" color="success"
    >
      Success !
      <v-btn
        dark
        text
        @click="snackbar = false"
      >
        Close
      </v-btn>
    </v-snackbar>
  </div>
</template>

<script>
import Vue from 'vue'
import VueYoutube from 'vue-youtube'

import hsk_1 from '../hsk/hsk-level-1';
import hsk_2 from '../hsk/hsk-level-2';
import hsk_3 from '../hsk/hsk-level-3';
import hsk_4 from '../hsk/hsk-level-4';
import hsk_5 from '../hsk/hsk-level-5';
import hsk_6 from '../hsk/hsk-level-6';
import ic4 from '../IC4/vocab_list';
import sub from '../video/video_sub';

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
      hsk: {1: 'n', 2: 'n', 3: 'n', 4: 'n', 5: 'n', 6: 'n'}
    }
  },
  methods: {
    parseInput() {
        this.videoCollection = [];
      const input_lines = this.taValue.split('\n');
      
      input_lines.forEach((item, index) => {
          //console.log(item)
          var string_with_hsk_level = [];
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
        this.videoCollection.push( {id: 0, start: 0, duration: 0, sub: string_with_hsk_level} ); 
      })
    },
    save_to_database() {
      // save document to firestore
      this.videoCollection.forEach(item => {
        this.$fireStore.collection( this.videoId ).doc(item.id)
        .set( {start: item.start, sub: item.sub} )
        .then(() => { this.snackbar = true })
        .catch((error) => { alert(error) } )
      })
    },
    getCurrentTime() {
      this.$refs.youtube.player.getCurrentTime().then(value => {
        console.log(value, this.counter);
        this.videoCollection[this.counter].id = new Date((value.toFixed(1)-.6) * 1000).toISOString().substr(14, 5);
        this.videoCollection[this.counter].start = value.toFixed(1)-.6;
        this.counter++;
      })
    },
    playSegment(obj) {
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

    },
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
    },
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
