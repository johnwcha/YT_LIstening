<template>
  <div>
    <v-flex class="text-center">
      <blockquote class="blockquote">
        &#8220;Indexing Subtitle texts. File format: <span class="display-1"> SRT </span> (subtitles) &#8221;
      </blockquote>
    </v-flex>

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
            <p> 1) 分词 at <a href="http://cppjieba-webdemo.herokuapp.com/"> http://cppjieba-webdemo.herokuapp.com/ </a></p>
            <p> 2) sample input formate: <br>
                  <span class="red--text"> 1 </span><br>
                  <span class="red--text"> 00:00:04,352 --> 00:00:09,216 </span><br>
                  <span class="red--text"> ", "看着", "明媚", "的", "阳光", "怡人", "的", "景色", " </span></p>
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
          </v-col>
        </v-row>
      </v-col>
      <v-col>
        <v-card outlined>
          <v-virtual-scroll :items="videoCollection" :item-height="50" height="860" >
            <template v-slot="{ item, index }">
              <v-list-item :link="true">

                <v-list-item-content >
        <v-simple-table >
            <tbody>
              <tr>
                <td style="font-weight: bold; width: 140px;"> <v-text-field @change="adjustTime(item, index)" v-model="item.id"> </v-text-field> </td>
                <td style="font-size:18px" @click="playSegment(item)"> {{ item.sub }} </td>
              </tr>
            </tbody>
        </v-simple-table>
                  <!--
                  <v-list-item-subtitle><v-text-field @change="adjustTime(item, i)" v-model="item.id"> </v-text-field></v-list-item-subtitle>
                  <v-list-item-title @click="playSegment(item)">{{ item.sub }}</v-list-item-title> -->
                </v-list-item-content>

              </v-list-item>
            </template>
          </v-virtual-scroll></v-card>
      <!--
      <v-col cols="6" id="right">
        <v-container id="scroll-target" style="max-height: 880px" class="overflow-y-auto">
        <v-row v-scroll:#scroll-target="onScroll" style="height: 1000px">
        <v-simple-table >
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left"> Time </th>
                <th class="text-left"> Subtitle </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in videoCollection" :key="i">
                <td style="font-weight: bold"> <v-text-field @change="adjustTime(item, i)" v-model="item.id"> </v-text-field> </td>
                <td style="font-size:18px" @click="playSegment(item)"> {{ item.sub }} </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table> </v-row> </v-container> -->
      </v-col>
    </v-row>

  </div>
</template>

<script>
import Vue from 'vue'
import VueYoutube from 'vue-youtube'
import { parseSRT } from "../util/functions"
import firebase from 'firebase/app';
import 'firebase/firestore'

Vue.use(VueYoutube)

export default {
  data() {
    return {
      exclude: '',
      vidTitle: '',
      level: '',
      skipWords: [],
      advSkipWords: ['你', '我', '他', '她', '是', '有', '的', '一', '个', '不', '了','、', '，', '。', '：', '？', '"', ',', '（', '）', '(', ')'],
      noviceSkipWords: ['、', '，', '。', '：', '？', '"', ',', '（', '）', '(', ')', '.', '…', ''],
      alphabet: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
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
    }
  },
  methods: {
      onScroll (e) {
        //console.log( e.target.scrollTop )
      },
      adjustTime(item, index) {
          console.log( item )
          const time = item.id.split(':')
          this.videoCollection[index].start = parseInt(time[0])*60*60 + parseInt(time[1])*60 + parseFloat(time[2])
      },
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
      this.videoCollection = []
      this.videoCollection = parseSRT(this.taValue)
    },
    n_save() {
      this.parse_n_save()
    },
    parse_n_save() {
      //const sentence_batch = this.$fireStore.batch() 
      //const phrase_batch = this.$fireStore.batch() 
      //const character_batch = this.$fireStore.batch() 
      let sentence_write = 0
      let phrase_write = 0
      let character_write = 0

        this.videoCollection.forEach(item => {
          //console.log(item) // {id: vid, start: startTime, duration: duration, sub: sub}
          console.log(item.sub)
          const obj = {start: item.start, duration: item.duration, sub: item.sub}
          // ******* WRITE ********  sentence_
          this.$fireStore.collection( this.videoId ).doc(item.id).set(obj).then(() => {
              sentence_write++
              console.log('】sentence write count:', sentence_write)
          }).catch(error => { console.error('】sentence_write:', error.message)})
            // write phrase
            item.sub.split(' ').forEach(phrase => {
                console.log(phrase)
                const skip = this.noviceSkipWords.concat(this.alphabet)
                if (!skip.includes(phrase)) {
                    var obj = {}
                    obj[item.id] = {duration: item.duration, start: item.start, sub: item.sub}
                    // ******* WRITE ******** phrase 
                    this.$fireStore.collection(phrase).doc(this.videoId).set(obj, { merge: true }).then(() => {
                        phrase_write++
                        console.log('phrase write count:', phrase_write)
                    }).catch(error => { console.error('phrase_write:', error.message)})
                }
                //phrase_batch.set(this.$fireStore.collection(phrase).doc(this.videoId), obj, { merge: true })
                // batch write character
                const chars = phrase.split('')
                chars.forEach(char => {
                    console.log(char)
                    //const oneSentence = {start: item.start, duration: item.duration, sub: item.sub}
                    //var updateObj = {}
                    //updateObj[item.id] = oneSentence
                    //console.log(updateObj)
                    if (!this.noviceSkipWords.includes(char)) {
                        // ******* WRITE ******** 汉字 
                        this.$fireStore.collection('-vocab_index').doc(char).update({
                            vocab: firebase.firestore.FieldValue.arrayUnion(phrase)
                        }).then(() => { console.log('updated field'); character_write = character_write +2;
                           console.log('character write count:', character_write) }).catch(error => {
                            //console.log(error.message)
                            console.log( char, phrase)
                            character_write = character_write +2
                            this.$fireStore.collection('-vocab_index').doc(char).set({vocab: [phrase]})
                                .then(() =>{
                                    console.log('insert data')
                                    character_write++
                                    console.log('character write count:', character_write)
                                }).catch(error => { console.log(error) })
                        })
                    }
                })
            })

            // character batch write commit
            // NOT WORKING as checking doc.exists is asynchronous
            // character_batch.commit().then(() => {
            //     console.log( 'character batch write done' )
            // }).catch((error) => { console.log('character write error:', error.message) })
        })

        // sentence batch write：===================== 500 MAX
        // sentence_batch.commit().then(() => {
        //     console.log( 'sentence batch write done' )
        //     // phrase batch write
        //     phrase_batch.commit().then(() => {
        //         console.log( 'phrase batch write done' )
        //     }).catch((error) => { console.log('phrase write error:', error.message) })
        // }).catch((error) => { console.log('sentenc write error: ', error.message) })


        // save video metadata
        this.$fireStore.collection( '-video_meta' ).doc(this.videoId)
            .set( {genre: this.genre, level: this.level, title: this.vidTitle} )
            .then(() => { console.log('video meta-data save complete 😀😀😀😀😀') })
            .catch((error) => { console.error(error.message) } )
        /*
            A batched write can contain up to 500 operations. 
            Each operation in the batch counts separately towards 
            your Cloud Firestore usage. Within a write operation, 
            field transforms like serverTimestamp, arrayUnion, and increment 
            each count as an additional operation.
        */
    },
  },
  mounted() {
    //console.log(hsk_1); // [ {hanzi: , id: , pinyin: , translations: [] }, ... ]
  }
}
</script>
