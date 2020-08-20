<template>
  <div>
    <v-flex class="text-center">
      <blockquote class="blockquote">
        &#8220;First, solve the problem. Then, write the code.&#8221;
        <footer>
          <small>
            <em>&mdash;John Johnson</em>
          </small>
        </footer>
      </blockquote>
    </v-flex>
    <v-container fluid>

    <v-row id="content">
      <v-col cols="6" id="left">
        <v-row>
          <v-col cols="12">
          <youtube v-if="videoId!=''" ref="youtube" :video-id="videoId" :player-vars="playerVars" 
            @ready="onReady" @buffering="onBuffer" @paused="paused" @ended="ended"
            @playing="playing" width="100%" ></youtube>
          <v-text-field solo v-model="ytURL" label="YouTube URL (ytURL)" @change="parseURL"></v-text-field>
          <v-text-field solo v-model="vidTitle" label="video title (vidTitle)" ></v-text-field>
          </v-col>
          <v-col cols="12">
            <p class="display-2"> Speech video </p>
            <p> 1) 分词 at <a href="http://cppjieba-webdemo.herokuapp.com/"> http://cppjieba-webdemo.herokuapp.com/ </a></p>
            <p> 2) sample input formate: <br>
                  <span class="red--text"> 00:25 </span><br>
                  <span class="red--text"> ", "多伦多", "的", "父老乡亲", "们", "，", "大家", "过年", "好", " （分词：越初级 - 越细分）</span></p>
            <v-textarea name="input-7-1" outlined
              label="paste parsed output here"
              v-model="taValue"
            ></v-textarea>
            <v-row>
              <v-col cols="6">
                <v-text-field solo v-model="genre" label="video (genre)"> </v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field solo v-model="level" label="proficiency (level)"> </v-text-field>
              </v-col>
            </v-row>
            <v-text-field solo v-model="exclude" label="exclude item (delimiter: space)"> </v-text-field>
            <span class="blue--text"> GENRES: 
              <v-btn outlined color="indigo" @click="setGenre('animation/cartoon')"> animation/cartoon </v-btn>
              <v-btn outlined color="indigo" @click="setGenre('documentary')"> documentary</v-btn>
              <v-btn outlined color="indigo" @click="setGenre('drama')"> drama</v-btn> 
              <v-btn outlined color="indigo" @click="setGenre('info/educational/how-to')"> info/educational/how-to</v-btn>
              <v-btn outlined color="indigo" @click="setGenre('interview')"> interview</v-btn> 
              <v-btn outlined color="indigo" @click="setGenre('products')"> products</v-btn> 
              <v-btn outlined color="indigo" @click="setGenre('talkshow')"> talkshow</v-btn> 
              <v-btn outlined color="indigo" @click="setGenre('vlogs')"> vlogs</v-btn></span>
            <span class="blue--text"> Proficiency: 
              <v-btn outlined color="indigo" @click="setLevel('novice')"> 初级 </v-btn>
              <v-btn outlined color="indigo" @click="setLevel('intermediate')"> 中级</v-btn>
              <v-btn outlined color="indigo" @click="setLevel('advanced')"> 高级</v-btn></span>

            <v-btn class="info" @click="parse_n"> Parse </v-btn>
            <v-btn class="info" @click="n_save" :disabled="level=='' || genre=='' || videoId=='' || videoCollection.length==0"> Save  </v-btn>

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
      <v-col cols="6" id="right">
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
                    <span style="font-size:18px" v-if="sub.indexOf('_')==-1"> {{ sub }} </span>
                    <input type="text" v-if="sub.indexOf('_')!=-1" @change="checkAns(sub.split('_')[0])"
                      style="width: 40px; border-style: solid; border-color: orange;">
                    <span v-if="sub.indexOf('_')!=-1"> ({{sub.split('_')[1]}}) </span>
                  </span>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-col>
    </v-row>

    </v-container>
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
//import sub from '../video/video_sub';

Vue.use(VueYoutube)

export default {
  data() {
    return {
      exclude: '',
      vidTitle: '',
      level: '',
      skipWords: [],
      advSkipWords: ['你', '我', '他', '她', '是', '有', '的', '一', '个', '不', '了','、', '，', '。', '：', '？', '"', ',', '（', '）', '(', ')'],
      noviceSkipWords: ['、', '，', '。', '：', '？', '"', ',', '（', '）', '(', ')'],
      dbSave: false,
      videoCollection: [],
      videoDuration: null,
      videoId: '',
      genre: '',
      playerVars: {
        autoplay: 0,
        controls: 1,
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
    setGenre(genre) {
      this.genre = genre
    },
    setLevel(level) {
      this.level = level
    },
    checkAns(ans) {
      console.log('check ans: ', ans);
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
    parse_n() {
      this.dbSave = false
      this.parse_n_save()
    },
    n_save() {
      this.dbSave = true
      this.parse_n_save()
    },
    parse_n_save() {
      var timecode_str;
      var startTime = 0;
      var time_0 = 0;
      var time_2 = 0;
      var duration = 0;

      const batch = this.$fireStore.batch() 
      const input_lines = this.taValue.split('\n')
      this.videoCollection = []

      input_lines.forEach((item, index) => {
        if ((index % 2) === 0) {
          //console.log(index);
          timecode_str = item;
          const timecode = item.split(':');
          console.log(timecode)
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
              time_2 = parseInt( input_lines[index+2].split(':')[0] )*60 + parseInt( input_lines[index+2].split(':')[1] )
              duration = time_2 - time_0
            }
            //console.log(timecode_str); // firestore document id
          } else {
            alert('Error with subtitle timestamp')
          }
        } else {
          const temp = item.split('", "').join(' ').trim(); // ", "多伦多", "的", "父老乡亲", "们", "，", "大家", "过年", "好", "
          console.log( temp )
          this.videoCollection.push( {id: timecode_str, start: startTime, duration: duration, sub: temp.split(' ')} ); 
          // write document to firestore
          //console.log( timecode_str );
          const oneSentence = {start: startTime, duration: duration, sub: temp}
          if (this.dbSave)
            batch.set(this.$fireStore.collection( this.videoId ).doc(timecode_str), oneSentence);
          // create a collection for each vocab item & save to DB
          //console.log(this.videoId);
          console.log( this.noviceSkipWords.concat(this.exclude.split(' ')) )
          temp.split(' ').forEach((item, index) => {
            console.log('collection: ', item)
            //console.log('collection: ', item, 'doc ID: ', this.videoId, oneSentence)
            if (this.dbSave) {
              if (this.level=='novice')
                this.skipWords = this.noviceSkipWords.concat(this.exclude.split(' '))
              else
                this.skipWords = this.advSkipWords.concat(this.exclude.split(' '))
              var updateObj = {}
              updateObj[timecode_str.split(':').join('_')] = oneSentence
              if (!this.skipWords.includes(item)) {
                this.$fireStore.collection(item).doc(this.videoId).set(updateObj, { merge: true })
                  .then(() => { }).catch((error) => { console.log(error) })
              }
            }
          })
        }
      })
      if (this.dbSave) {
        batch.commit().then(() => {
          console.log( 'batch write done' )
        }).catch((error) => { console.log(error) })
        // save video metadata
          this.$fireStore.collection( '-video_meta' ).doc(this.videoId)
          .set( {genre: this.genre, level: this.level, title: this.vidTitle} )
          .then(() => { })
          .catch((error) => { console.log(error) } )
      }
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
      const input_lines = this.taValue.split('\n');
      //console.log( input_lines );
      //return;

      input_lines.forEach((item, index) => {
        var string_with_hsk_level = [];
        if ((index % 2) === 0) {
          //console.log(index);
          timecode_str = item;
          const timecode = item.split(':');
          console.log(timecode)
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
