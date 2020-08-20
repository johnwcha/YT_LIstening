<template>
    <div>

      <v-row id="embedded_video">
          <v-col cols="12" >

            <youtube v-if="videoId!=''" ref="youtube" :video-id="videoId" :player-vars="playerVars" 
                @ready="onReady" @buffering="onBuffer" @paused="paused" @ended="ended"
                @playing="playing" ></youtube>

            <v-slider style="width: 480px" label="playback rate" @end="setPlayerSpeed" v-model="slider" thumb-label max="1" min="0.1" step="0.1"></v-slider>
          </v-col>
      </v-row>

      <v-container>
      <v-row>
      <v-col cols="12" id="subtitles">
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left"> Time </th>
                <th class="text-left"> Subtitle </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in videoCollection" :key="i" @click="playSegment(item)">
                <td style="font-weight: bold"> {{ item.id }} </td>
                <td> 
                  <span v-for="(sub, key) in item.sub" :key="key">
                    <span v-if="sub.indexOf('_')==-1"> {{ sub }} </span>
                    <span v-if="sub.indexOf('_2')!=-1"> {{ sub.split('_')[0] }} </span>
                    <span v-if="sub.indexOf('_3')!=-1"> {{ sub.split('_')[0] }} </span>
                    <span v-if="sub.indexOf('_4')!=-1"> {{ sub.split('_')[0] }} </span>
                    <span v-if="sub.indexOf('_5')!=-1"> {{ sub.split('_')[0] }} </span>
                    <span v-if="sub.indexOf('_6')!=-1"> {{ sub.split('_')[0] }} </span>
                    <input type="text" v-if="sub.indexOf('_1')!=-1" 
                        
                        @change="checkAns(sub.split('_')[0], $event.target.value)"
                      style="width: 40px; border-style: solid; border-color: cornflowerblue;">
                    
                  </span>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-col>
      </v-row>
      </v-container>


    <v-snackbar
      v-model="snackbar"
      :color="snackbar_color"
    >
      {{ snackbar_text }}
      <v-btn
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

Vue.use(VueYoutube)

export default {
  data() {
    return {
      videoCollection: [],
      videoDuration: null,
      videoId: 'T9V45IhnMRU',
      slider: '1',
      playerVars: {
        autoplay: 0,
        controls: 0,
        enablejsapi: 1,
        playsinline: 1,
        wmode: 'transparent',
        widgetid: 1,
        modestbranding: 1, // no effect
        rel: 0,
        showinfo: 0,
        origin: 'https://firechrome-817a7.web.app',
      },
      taValue: '',
      taVocab: '',
      ytURL: '',
      user_ans: '',
      snackbar: false,
      snackbar_text: '',
      snackbar_color: '',
      // https://www.youtube.com/embed/ccx7PGK8Qz0?
      // autoplay = 0
      // controls = 0 & rel = 0 &
      // modestbranding = 1 &
      // showinfo = 0 &
      // wmode = transparent &
      // playsinline = 1&
      // enablejsapi = 1&
      // origin=https%3A%2F%2Fwww.erasemybackpain.org&
      // widgetid = 1
    }
  },
  methods: {
      setPlayerSpeed(){
          this.$refs.youtube.player.setPlaybackRate(this.slider);
      },
      checkInput(ans, user_ans) {
          console.log(ans, user_ans);
      },
    checkAns(ans, user_ans) {
      //    console.log('check ans: ', ans, user_ans);
      if (user_ans === ans) {
          this.snackbar = true; this.snackbar_text = 'Correct'; this.snackbar_color = 'success';
      } else {
          this.snackbar = true; this.snackbar_text = 'Try again'; this.snackbar_color = 'warning';
      }
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
    parse_sub_against_hsk() {
      //console.log(this.taValue);
      this.hsk = {1: 'n', 2: 'n', 3: 'n', 4: 'n', 5: 'n', 6: 'n'};
      var timecode_str;
      var startTime = 0;
      var time_0 = 0;
      var time_2 = 0;
      var duration = 0;

      console.log( this.$fireStore.batch() );

      // parsing results from http://cppjieba-webdemo.herokuapp.com/
      const input_lines = this.taValue.split(' \n');
      //console.log( input_lines );
      //return;

      input_lines.forEach((item, index) => {
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
          this.videoCollection.push( {id: timecode_str, start: startTime, duration: duration, sub: string_with_hsk_level} ); 
          // write document to firestore
          console.log(this.videoId);
          console.log( timecode_str );
          this.$fireStore.collection( this.videoId ).doc(timecode_str)
          .set( {start: startTime, duration: duration, sub: string_with_hsk_level} )
          .then(() => { })
          .catch((error) => { console.log(error) } )
          //this.$fireStore.batch().set( this.$fireStore.collection(this.videoId)
          //.doc(timecode_str), {start: startTime, duration: duration, sub: string_with_hsk_level} );
        }
      })
      console.log(this.hsk);
      //this.$fireStore.batch().set( this.$fireStore.collection(this.videoId).doc("hsk"), this.hsk );
      //this.$fireStore.batch().commit().then((obj) => {
      //  console.log(obj);
      //}).catch(err => console.log(`There was an error: ${err}`))
          this.$fireStore.collection( '_vid_genre' ).doc(this.videoId)
          .set( {hsk: this.hsk, genre: this.genre} )
          .then(() => { })
          .catch((error) => { console.log(error) } )
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
    //console.log( this.$fireStore );
    this.$fireStore.collection(this.videoId).get().then( (querySnapshot => {
        querySnapshot.forEach((doc) => {
            //console.log( doc.data() );
            this.videoCollection.push( {id: doc.id, ...doc.data()} );
        })
    }))
  }
}
</script>

<style scoped>
#embedded_video {
  position: fixed; 
  background-color: white; 
  width: 100%; 
  top: 64px
}
#subtitles {
  margin-top: 400px;
}
</style>