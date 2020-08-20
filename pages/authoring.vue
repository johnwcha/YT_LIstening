<template>
    <div>

    <v-row id="embedded_video">
          <div outlined>
            <div style="width: 480px; position: absolute"></div>
            <youtube v-if="videoId!=''" ref="youtube" :video-id="videoId" :player-vars="playerVars" 
                @ready="onReady" @buffering="onBuffer" @paused="paused" @ended="ended"
                @playing="playing" ></youtube>
            <v-slider style="width: 480px" label="playback rate" @end="setPlayerSpeed" v-model="slider" thumb-label max="1" min="0.1" step="0.1"></v-slider>
          </div>
          <v-col><v-card outlined>
            <v-virtual-scroll :items="searchVideoCollection" :item-height="56" height="360" >
              <template v-slot="{ item }">
                <v-list-item two-line >

                  <v-list-item-content >
                    <v-list-item-subtitle @click="playSegment(item)">{{ item.time }}</v-list-item-subtitle>
                    <v-list-item-title @mouseup="markup(item, $event)" class="wrap-text">{{ item.sub }}</v-list-item-title>
                  </v-list-item-content>

                </v-list-item>
              </template>
            </v-virtual-scroll></v-card>
          </v-col>
    </v-row>


  <v-card>
    <v-tabs background-color="white" color="deep-purple accent-4">
      <v-tab> Browse Videos </v-tab>
      <v-tab> Search by keywords </v-tab>

      <v-tab-item>
        <v-container fluid>
          <v-row>
              <v-btn outlined color="indigo" @click="browse('-video_meta')"> browse videos </v-btn> <br>
              filter by video genres / filter by proficiency levels <br>
            <v-container ref="browse_video" >
            <v-row id="subtitles">
            <v-col cols="12">
                <v-simple-table>
                <template v-slot:default>
                    <thead>
                    <tr>
                        <th class="text-left"> Video</th>
                        <th class="text-left"> @ </th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(item, i) in videoCollection" :key="i" @click="playSegment(item)">
                        <td style="font-weight: bold"> {{ item.id }} </td>
                        <td> 
                        <span v-for="(sub, key) in item.sub" :key="key">
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
          </v-row>
        </v-container>
      </v-tab-item>
      <!-- ========================= tab divider ========================  -->
      <v-tab-item>
        <v-row id="keyword_vocab">
            <v-col cols="1"></v-col>
            <v-col cols="10">
                <v-text-field @change="browse('-vocab_index')" v-model="keyword" color="success" 
                placeholder="Enter a keyword, and press ENTER to search"></v-text-field>
            </v-col>
            <v-col cols="1">
                <v-progress-circular v-if="searchBusy" indeterminate color="purple"></v-progress-circular>
            </v-col>
        </v-row>
        <v-row>
        <v-col cols="2">
          <v-card outlined> 
            <v-virtual-scroll :items="vocabCollection" :item-height="50" height="360" >
              <template v-slot="{ item }">
                <v-list-item :link="true">

                  <v-list-item-content >
                    <v-list-item-title @click="getPhrase(item)">{{ item }}</v-list-item-title>
                  </v-list-item-content>

                </v-list-item>
              </template>
            </v-virtual-scroll></v-card>
<!--
            <v-simple-table>
            <template v-slot:default>
                <thead>
                <tr>
                    <th class="text-left"> Vocabulary </th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(item, i) in vocabCollection" :key="i" @click="getPhrase(item)">
                    <td style="font-size: 18px"> {{ item }} </td>
                </tr>
                </tbody>
            </template>
            </v-simple-table>
            -->
        </v-col>
        <v-col cols="10">
            <v-simple-table>
            <template v-slot:default>
                <thead>
                <tr>
                    <th class="text-left"> Video </th>
                    <th class="text-left"> Level </th>
                    <th class="text-left"> Genre </th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(item, i) in videoList" :key="i" @click="showSub(item)">
                    <td style="font-size: 18px"> {{ item.title }} </td>
                    <td style="font-size: 18px"> {{ item.level }} </td>
                    <td style="font-size: 18px"> {{ item.genre }} </td>
                </tr>
                </tbody>
            </template>
            </v-simple-table>
        </v-col>
        </v-row>
      </v-tab-item>
    </v-tabs>
  </v-card>


    <v-snackbar v-model="snackbar" :color="snackbar_color">
      {{ snackbar_text }}
      <v-btn text @click="snackbar = false">
        Close
      </v-btn>
    </v-snackbar>
    </div>
</template>

<script>
import Vue from 'vue'
import VueYoutube from 'vue-youtube'
import { compareValues } from '../util/functions'

Vue.use(VueYoutube)

export default {
  //components: { Splitpanes, Pane },
  data() {
    return {
      searchBusy: false,
      searchVideoCollection: [],
      videoList: [],
      contentList: {},
      phraseCollection: [],
      videoCollection: [],
      vocabCollection: [],
      videoDuration: null,
      videoId: '',
      slider: '1',
      playerVars: {
        autoplay: 1,
        controls: 1,
        start: 0,
        //end: 36,
        fs: 1,
        iv_load_policy: 3, // not working
        loop: 1, // not working
        modestbranding: 1, // no effect
        rel: 0,
        showinfo: 0,
        wmode: 'transparent',
        playsinline: 1
      },
      taValue: '',
      taVocab: '',
      ytURL: '',
      keyword: '',
      snackbar: false,
      snackbar_text: '',
      snackbar_color: '',
    }
  },
  methods: {
    markup(item, event){
      const range = window.getSelection().getRangeAt(0)
      //console.log(range)
      //const text = window.getSelection().getRangeAt(0).toString()
      const text = window.getSelection().isCollapsed // true, no text selected
      //console.log(text)
      if (text) {
        //console.log(window.getSelection().getRangeAt(0).toString())
        //console.log(event.target.nodeName)
        console.log( event.target.innerHTML )
      } else {
        console.log(window.getSelection().getRangeAt(0).toString())
        console.log(item)
        console.log(this.videoId)
        //console.log( event.target.innerHTML )
      }
    },
    showSub(item) {
      console.log(item)
      console.log(this.contentList[item.id])
      this.searchVideoCollection = []
      this.videoId = item.id
      for (const key in this.contentList[item.id]) {
        this.searchVideoCollection.push({time: key, ...this.contentList[item.id][key]})
      }
      this.searchVideoCollection.sort(compareValues('time'))
    },
    getPhrase(item){
      console.log(item)
      this.videoList = []
      this.searchBusy = true
      this.$fireStore.collection(item).get().then(snapshots => {
        console.log(snapshots)
        this.searchBusy = false
          if (snapshots.empty) {
            this.snackbar = true
            this.snackbar_text = 'No data by the key phrase：' + item
            this.snackbar_color = 'warning'
            return
          }
          snapshots.forEach(doc => {
              console.log(doc.id, doc.data())
              this.contentList[doc.id] = doc.data()
              this.$fireStore.collection('-video_meta').doc(doc.id).get().then(vid => {
                  this.videoList.push({id: doc.id, ...vid.data()})
              }).catch(error => { console.log(error.message)})
          })
      }).catch(error => { console.log(error.message)})
    },
    browse(db) {
        this.searchBusy = true
        this.videoList = []
        if (db === '-video_meta') {
            this.$fireStore.collection(db).get().then( (querySnapshot => {
                querySnapshot.forEach((doc) => {
                    console.log( doc.data() );
                    this.videoCollection.push( {id: doc.id, ...doc.data()} );
                    this.searchBusy = false
                })
            })).catch(error => { console.log(error.message) })
        } else { // '-vocab_index'
            const tmp = this.keyword.trim()
            console.log(tmp)
            if (tmp =='') {
                this.searchBusy = false 
            } else if (tmp.length==1) {
                //this.vocabCollection = []
                this.$fireStore.collection(db).doc(tmp).get().then( (doc => {
                    //console.log( doc );
                    if (doc.exists) {
                        console.log( doc.data() )
                        this.vocabCollection = doc.data().vocab
                    } else {
                        this.snackbar = true
                        this.snackbar_text = 'No data by the keyword：' + tmp
                        this.snackbar_color = 'warning'
                    }
                    this.searchBusy = false
                })).catch(error => { console.log(error.message) })
            } else if (tmp.length>1) {
                this.getPhrase(tmp)
            }
        }
    },
    pauseVid() {
      this.$refs.youtube.player.getPlayerState().then( state => {
        console.log( state )
        if (state === 1) {
          this.$refs.youtube.player.pauseVideo()
        } else {
          this.$refs.youtube.player.playVideo()
        }
      })
      /*
          -1 – unstarted
          0 – ended
          1 – playing
          2 – paused
          3 – buffering
          5 – video cued
      */
    },
    onScroll (e) {
      //console.log( e.target.scrollTop )
    },
      setPlayerSpeed(){
          this.$refs.youtube.player.setPlaybackRate(this.slider);
      },
      checkInput(ans, user_ans) {
          console.log(ans, user_ans);
      },
    playSegment(obj) {
      console.log(obj);
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
      //console.log( obj.hideVideoInfo() )
      console.log( obj.isVideoInfoVisible() )
      console.log( obj.getPlayerState() )
      //this.$refs.youtube.player.seekTo(2, true);
      //this.$refs.youtube.player.pauseVideo();
    },
  },
  mounted() {
    //   this.$fireStore.collection('-video_meta').get().then(snapshots =>{
    //       var temp = {}
    //       snapshots.forEach(doc => {
    //           temp[doc.id] = doc.data()
    //       })
    //       console.log(temp)
    //   }).catch(error => { console.log(error.message)})
  }
}
</script>

<style scoped>
.wrap-text {
  -webkit-line-clamp: unset !important;
  white-space: normal;
}
.v-list-item__subtitle {
  cursor: pointer;
}
td {
  cursor: pointer;
}
</style>