<template>
    <div>

    <v-row id="embedded_video">
      <div outlined>
        <div style="width: 480px; position: absolute"></div>
        <youtube v-if="videoId!=''" ref="youtube" :video-id="videoId" :player-vars="playerVars" 
            @ready="onReady" @buffering="onBuffer" @paused="paused" @ended="ended"
            @playing="playing" ></youtube>
        <v-slider style="width: 480px" label="playback speed" @end="setPlayerSpeed" v-model="slider" thumb-label max="1" min="0.1" step="0.1"></v-slider>
      </div>
      <v-col><v-card outlined>
        <v-virtual-scroll :items="searchVideoCollection" :item-height="56" height="360" >
          <template v-slot="{ item }">
            <v-list-item >

              <v-list-item-icon>
                <v-icon  color="primary" @click="rewind5()">mdi-rewind-5</v-icon>
                <v-icon  color="orange darken-2" @click="playSegment(item)">mdi-play-circle</v-icon>
              </v-list-item-icon>
              <v-list-item-content >
                <!-- v-list-item-subtitle @click="playSegment(item)">{{ item.time }}</v-list-item-subtitle -->
                <v-list-item-title @mouseup="markup(item, $event)" class="wrap-text">
                  <span v-for="(phrase, key) in item.que.split(' ')" :key=key>
                    <span v-if="phrase!='___'">{{ phrase }}</span>
                    <input v-if="phrase=='___'" :placeholder="item.sub.split(' ')[key]" type="text" 
                      @change="restorePhrase($event, item, item.sub.split(' ')[key], key)"
                      :style="{width: (item.sub.split(' ')[key].length*18+4) + 'px'}">
                  </span>
                </v-list-item-title>
              </v-list-item-content>
              <v-list-item-icon>
                <v-icon  color="primary" @click="addtoPlaylist(item)">mdi-teach</v-icon>
              </v-list-item-icon>

            </v-list-item>
          </template>
        </v-virtual-scroll></v-card>
      </v-col>
    </v-row>

  <v-card>
    <v-tabs background-color="white" color="deep-purple accent-4" grow>
      <v-tab> <v-icon color="orange darken-2">mdi-magnify</v-icon> Keyword Search </v-tab>
      <v-tab> <v-icon color="primary">mdi-text-search</v-icon> Keyword / Pattern Search 
        <v-text-field class="mx-2" append-outer-icon="mdi-send" @click:append-outer="patternSearch()"
            v-model="pattern" color="success" prepend-icon="mdi-chevron-right"> </v-text-field>
      </v-tab>
      <v-tab> 
        <v-badge color="purple accent-2" inline :content="duotingQues_arr.length" v-if="duotingQues_arr.length>0">
          <v-icon class="mx-2">mdi-headphones</v-icon> 多聽 - 練習 </v-badge>
          <span v-if="duotingQues_arr.length==0" > <v-icon>mdi-headphones</v-icon> 多聽 - 練習 </span>
      </v-tab>
      <v-tab> 
        <v-badge color="green" inline :content="duotingEx_arr.length" v-if="duotingEx_arr.length>0">
          <v-icon class="mx-2">mdi-teach</v-icon> 多聽 - 例句 </v-badge>
        <span v-if="duotingEx_arr.length==0" > <v-icon>mdi-teach</v-icon> 多聽 - 例句 </span>
      </v-tab>
      <v-tab> 
        <v-icon class="mx-2" color="pink"> mdi-file-document-edit </v-icon> 多聽 - 管理 
      </v-tab>

      <!-- ========================= KEYWORD SEARCH ========================  -->
      <v-tab-item>
        <v-row>
        <v-col cols="2">
                <v-text-field append-outer-icon="mdi-send" @click:append-outer="browse"
                @change="browse()" v-model="keyword" color="success" prepend-icon="mdi-chevron-right"
                placeholder="keywords"></v-text-field>

          <div style="height: 440px; overflow: auto">
            <v-simple-table>
            <template v-slot:default>
            <!--    <thead>
                <tr>
                    <th class="text-left"> Vocabulary </th>
                </tr>
                </thead>        -->
                <tbody>
                <tr v-for="(item, i) in vocabCollection" :key="i" @click="getPhrase(item.vocab)">
                    <td style="font-size: 18px" v-html="item.html">  </td>
                </tr>
                </tbody>
            </template>
            </v-simple-table>
          </div>
            
        </v-col>
        <v-col cols="10">
          <div style="height: 520px; overflow:auto">
            <v-simple-table>
            <template v-slot:default>
                <thead>
                <tr>
                    <th class="text-left"> Video </th>
                    <th class="text-left"> Level 
                      <span v-if="videoList.length>0">
                        <v-chip outlined color="deep-purple accent-4" @click="levelSort('novice')" x-small>N</v-chip>
                        <v-chip outlined color="deep-purple accent-4" @click="levelSort('intermediate')" x-small>I</v-chip>
                        <v-chip outlined color="deep-purple accent-4" @click="levelSort('advanced')" x-small>A</v-chip>
                      </span>
                    </th>
                    <th class="text-left"> Genre </th>
                    <th class="text-left"> Subtitle </th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(item, i) in videoList" :key="i" @click="showSub(item)">
                    <td style="font-size: 18px"> {{ item.title }} </td>
                    <td>
                      <span v-if="item.level=='advanced'"><v-icon large color="pink" > mdi-alpha-a </v-icon> 高</span>
                      <span v-if="item.level=='intermediate'"><v-icon large color="primary" > mdi-alpha-i </v-icon> 中</span>
                      <span v-if="item.level=='novice'"><v-icon large color="green" > mdi-alpha-n </v-icon> 初</span>
                    </td>
                    <td style="font-size: 18px"> {{ item.genre }} </td>
                    <td style="font-size: 18px"> 
                      <span v-if="item.cc=='soft'" ><v-icon> mdi-closed-caption-outline </v-icon><v-icon color="pink"> mdi-alpha-s </v-icon> </span>
                      <span v-if="item.cc=='hard'" ><v-icon> mdi-closed-caption-outline </v-icon><v-icon color="pink"> mdi-alpha-h </v-icon> </span>
                      <span v-if="item.cc=='eng'" ><v-icon> mdi-closed-caption-outline </v-icon><v-icon color="primary"> mdi-alpha-e </v-icon> </span>
                      <span v-if="item.cc=='none'" ><v-icon> mdi-closed-caption-outline </v-icon><v-icon color="green"> mdi-close-box-outline </v-icon> </span>
                    </td>
                </tr>
                </tbody>
            </template>
            </v-simple-table>
          </div>
        </v-col>
        </v-row>
      </v-tab-item>
      <!-- ========================= GRAMMAR / PATTERN SEARCH ========================  -->
      <v-tab-item>
        
          <v-row>
              <!--       v-text-field append-outer-icon="mdi-send" @click:append-outer="browse"
              @change="patternSearch()" v-model="pattern" color="success" prepend-icon="mdi-chevron-right"
              placeholder="Example: 沒 x 過，除 x 還（除了 ... 以外，... 還）">
              </v-text-field         -->
            <v-col cols="2" v-if="vocabCollection.length>0">
              <div style="height:400px; overflow: auto;">
                <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left"> Keyword </th>
                    </tr> 
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in vocabCollection" :key="i" @click="patternSub(item)">
                      <td style="font-size: 18px" v-html="item.html">  </td>
                    </tr>
                  </tbody>
                </template>
                </v-simple-table></div>
            </v-col>
            
            <v-col>
              <div style="height:400px; overflow: auto;">
                <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left"> @ </th>
                      <th class="text-left"> Video </th>
                      <th class="text-left"> Level </th>
                      <th class="text-right" style="width: 90px;"> Genre </th>
                      <th class="text-right"> <v-icon>mdi-closed-caption</v-icon> </th>
                    </tr> 
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in patternListUniq" :key="i" @click="patternSub(item)">
                      <td style="font-size: 18px" v-html="item.htmlsub"> {{ item.sub }} </td>
                      <td style="font-size: 18px"> {{ item.title }} </td>
                      <td style="font-size: 18px">
                        <span v-if="item.level=='advanced'"><v-icon color="pink" > mdi-alpha-a </v-icon> 高 </span>
                        <span v-if="item.level=='intermediate'"><v-icon color="orange" > mdi-alpha-i </v-icon> 中 </span>
                        <span v-if="item.level=='novice'"><v-icon color="green" > mdi-alpha-n </v-icon> 初 </span>
                      </td>
                      <td style="font-size: 18px;" class="text-right"> {{ item.genre }} </td>
                      <td style="font-size: 18px" class="text-right"> 
                        <span v-if="item.cc=='soft'"> <v-icon color="pink"> mdi-alpha-s-box-outline </v-icon> </span>
                        <span v-if="item.cc=='hard'"> <v-icon color="pink"> mdi-alpha-h-box-outline </v-icon> </span>
                        <span v-if="item.cc=='eng'"> <v-icon color="primary"> mdi-alpha-e-box-outline </v-icon> </span>
                        <span v-if="item.cc=='none'"> <v-icon color="green"> mdi-close-box-outline </v-icon> </span>
                      </td>
                    </tr>
                  </tbody>
                </template>
                </v-simple-table>
              </div>
            </v-col>
            
          </v-row>
        
      </v-tab-item>
      <!-- ========================= 多听 - 練習 ========================  -->
      <v-tab-item>
        <v-container>
          <v-row style="height: 450px; overflow: auto;">
            <v-col cols="2">
              Author: <v-text-field v-model="queAuthor"></v-text-field>
              Unit name: <v-text-field v-model="queName"></v-text-field>
              <v-btn color="primary" @click="saveQues"> save </v-btn>

            </v-col>
            <v-col cols="10">
              <v-simple-table>
              <template v-slot:default>
                  <thead>
                  <tr>
                      <th class="text-left"> # </th>
                      <th class="text-left"> Question </th>
                      <th class="text-right"> <v-icon> mdi-closed-caption </v-icon> </th>
                      <th class="text-right"> @ </th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="(item, i) in duotingQues_arr" :key="i">
                      <td style="font-size: 18px"> {{ i+1 }} </td>
                      <td>
                        <span style="font-size: 18px" v-for="(phrase, index) in item.que.split(' ')" :key="index">  
                        <span v-if="phrase!='___'"> {{phrase}} </span>
                        <input @change="checkAns($event.target.value, item.sub.split(' ')[index])"
                          v-if="phrase=='___'" :style="{width: (item.sub.split(' ')[index].length*18+6) + 'px'}">
                        </span>
                      </td>
                      <td class="text-right"> 
                        <v-icon color="primary" v-if="item.cc=='eng'"> mdi-alpha-e </v-icon>
                        <v-icon color="pink" v-if="item.cc=='hard'"> mdi-alpha-h-box-outline </v-icon>
                        <v-icon color="pink" v-if="item.cc=='soft'"> mdi-alpha-s-box-outline </v-icon>
                        <v-icon color="green" v-if="item.cc=='none'"> mdi-alpha-n </v-icon>
                      </td>
                      <td class="text-right"><v-icon color="orange" @click="removeQue(i)">mdi-delete-circle</v-icon> </td>
                  </tr>
                  </tbody>
              </template>
              </v-simple-table>
            </v-col>
          </v-row>
        </v-container>
      </v-tab-item>

      <!-- ========================= 多听 - 例句 ========================  -->
      <v-tab-item>
        <v-container>
          <v-row >
            <v-col cols="2">
              Author: <v-text-field v-model="queAuthor"></v-text-field>
              Unit name: <v-text-field v-model="queName"></v-text-field>
              <v-btn color="primary" @click="saveQues"> save </v-btn>


            </v-col>
            <v-col cols="10">
              <div style="height: 500px; overflow:auto;">
              <v-simple-table>
              <template v-slot:default>
                  <thead>
                  <tr>
                      <th class="text-left"> # </th>
                      <th class="text-left"> Sentence </th>
                      <th class="text-right"> <v-icon> mdi-closed-caption </v-icon> </th>
                      <th class="text-right"> @ </th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="(item, i) in duotingEx_arr" :key="i">
                      <td style="font-size: 18px"> {{ i+1 }} </td>
                      <td>
                        <span style="font-size: 18px" > {{ item.sub }}
                        </span>
                      </td>
                      <td class="text-right"> 
                        <v-icon color="primary" v-if="item.cc=='eng'"> mdi-alpha-e </v-icon>
                        <v-icon color="pink" v-if="item.cc=='hard'"> mdi-alpha-h-box-outline </v-icon>
                        <v-icon color="pink" v-if="item.cc=='soft'"> mdi-alpha-s-box-outline </v-icon>
                        <v-icon color="green" v-if="item.cc=='none'"> mdi-alpha-n </v-icon>
                      </td>
                      <td class="text-right"><v-icon color="orange" @click="removeEx(i)">mdi-delete-circle</v-icon> </td>
                  </tr>
                  </tbody>
              </template>
              </v-simple-table>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-tab-item>

      <!-- ========================= 多聽 - 管理 ========================  -->
      <v-tab-item>
        <v-container>
          <v-row >
            管理
          </v-row>
        </v-container>
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
      queAuthor: '',
      queName: '',
      duotingQues_arr: [],
      duotingEx_arr: [],
      duotingQues: {},
      searchBusy: false,
      searchVideoCollection: [],
      videoList: [],
      patternList: [],
      videoListOrig: [],
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
      pattern: '',
      snackbar: false,
      snackbar_text: '',
      snackbar_color: '',
    }
  },




  methods: {
    removeEx(index) {
      console.log(index)
      this.duotingEx_arr.splice(index, 1)
    },
    removeQue(index) {
      console.log(index)
      this.duotingQues_arr.splice(index, 1)
    },
    addtoPlaylist(item) {
      this.duotingEx_arr.push(item)
      console.log(this.duotingEx_arr)
    },
    saveQues() {
      console.log(this.queAuthor, this.queName, this.duotingQues_arr)
    },
    levelSort(level) {
      console.log(level)
      this.videoList = this.videoListOrig.filter(item => {
        return item.level===level
      })
    },
    checkAns(user_ans, answerKey) {
      console.log(user_ans, answerKey)
      console.log(user_ans===answerKey ? true : false)
    },
    restorePhrase(event, item, phrase, i) {
      console.log( event, item, phrase, i )
      if (event.target.value == 'x') {
        let temp = item.que.split(' ')
        temp[i] = phrase
        item.que = temp.join(' ')
      }
    },
    markup(item, event){
      console.log( item )
      const range = window.getSelection().getRangeAt(0)
      //console.log(range)
      const text = window.getSelection().isCollapsed // true, no text selected
      //console.log(text)
      console.log(item, event.target.innerHTML)
      //console.log(window.getSelection().getRangeAt(0).toString())
      let sel = window.getSelection().getRangeAt(0).toString().trim()
      const sel_noSpace = sel.split(' ').join('')
      const hasSpace = sel===sel_noSpace ? false : true
      //
      // to do more user input filtering: '拉' in 亚伯拉罕，'一起 上' in 一起 上山 // selection not allowed
      //
      if (text) { // true, no text selected
        //console.log(window.getSelection().getRangeAt(0).toString())
        //console.log(event.target.nodeName)
        //console.log( event.target.innerHTML )
      } else {
        const ans = sel.split(' ').join('')
        //console.log(que)
        //console.log(ans)
        if (hasSpace) {
          item.sub = item.sub.split(sel).join(sel_noSpace)
          item.que = item.que.split(sel).join(sel_noSpace)
          sel = sel_noSpace
          //console.log( sel )
          //console.log('has spaces :::', item.sub, item.que )
        } else { 
          //console.log( sel )
          //console.log('no space ::: index')
          const cut = event.target.innerHTML.split(sel)
          console.log('cut length: ', cut, cut.length)
          if (cut.length==2) {
            if (cut[0]==='' && cut[1]==='') {
              item.sub = item.sub.split(sel).join(sel)
              item.que = item.que.split(sel).join(sel)
            } else if (cut[0]==='') {
              item.sub = item.sub.split(sel).join(sel + ' ')
              item.que = item.que.split(sel).join(sel + ' ')
            } else if (cut[1]==='') {
              item.sub = item.sub.split(sel).join(' ' + sel)
              item.que = item.que.split(sel).join(' ' + sel)
            } else {
              item.sub = item.sub.split(sel).join(' ' + sel + ' ')
              item.que = item.que.split(sel).join(' ' + sel + ' ')
            }
          } else {
            console.error('text selection error')
          }
        }
        //console.log(item.sub)
        //console.log(item.que)
        if (this.duotingQues[item.time]) {
          //this.duotingQues[item.time].ans.push(ans)
          //this.duotingQues[item.time].que = this.duotingQues[item.time].que.split(sel).join('___')
          item.que = item.que.split(sel).join('___')
          this.duotingQues[item.time].que = item.que.split(sel).join('___')
        } else {
          //const que = item.sub.split(sel).join('___')
          item.que = item.sub.split(sel).join('___')
          this.duotingQues[item.time] = {vid: this.videoId, ...item}
        }
        console.log(this.duotingQues)
        console.log( this.searchVideoCollection )
        this.duotingQues_arr = []
        for (const prop in this.duotingQues) {
          this.duotingQues_arr.push(this.duotingQues[prop])
        }
        console.log(this.duotingQues_arr)
      }
    },
    patternSub(item) {
      console.log(item)
      this.videoId = item.id
      this.searchVideoCollection = []
      this.searchVideoCollection.push({ sub: item.sub, que: item.sub, start: item.start, time: item.time, cc: item.cc })
    },
    showSub(item) {
      console.log(item)
      //console.log(this.contentList[item.id])
      this.searchVideoCollection = []
      this.videoId = item.id
      for (const key in this.contentList[item.id]) {
        // que: this.contentList[item.id][key].sub -- make a copy for manipulations
        this.searchVideoCollection.push({cc: item.cc, que: this.contentList[item.id][key].sub, time: key, ...this.contentList[item.id][key]})
      }
      console.log(this.searchVideoCollection)
      this.searchVideoCollection.sort(compareValues('time'))
    },
    searchPhraseByFirstChar(item) {
      this.vocabCollection = []
      const keyword = item.split('')[0]
        this.$fireStore.collection('-char_index').doc(keyword).get().then( (doc => {
            //console.log( doc );
            if (doc.exists) {
                console.log( doc.data() )
                //this.vocabCollection = doc.data().vocab
                let found = false
                doc.data().vocab.forEach(phrase => {
                  if (phrase.indexOf(item) != -1) {
                    found = true
                    this.vocabCollection.push( {vocab: phrase, html: phrase.split(item).join('<span style="color:red">'+item+'</span>')} )
                  }
                })
                if (!found) {
                  this.snackbar = true
                  this.snackbar_text = 'Sorry. No data by the keyword：' + item
                  this.snackbar_color = 'warning'
                }
            } else {
                this.snackbar = true
                this.snackbar_text = 'Sorry. No data by the keyword：' + item
                this.snackbar_color = 'warning'
            }
            this.searchBusy = false
        })).catch(error => { console.log(error.message) })
    },
    getPhrase(item){
      console.log(item)
      this.videoList = []
      this.videoListOrig = []
      this.searchBusy = true
      this.$fireStore.collection(item).get().then(snapshots => {
        //console.log(snapshots)
        this.searchBusy = false
          if (snapshots.empty) {
            // this.snackbar = true
            // this.snackbar_text = 'Searching ' + item + ' ... Please wait'
            // this.snackbar_color = 'info'
            this.searchPhraseByFirstChar(item)
            return
          }
          snapshots.forEach(doc => {
            console.log(doc.id, doc.data())
            this.contentList[doc.id] = doc.data()
            this.$fireStore.collection('-video_meta').doc(doc.id).get().then(vid => {
              if (!vid.data().active)
                return
              this.videoList.push({id: doc.id, ...vid.data()})
              this.videoListOrig.push({id: doc.id, ...vid.data()})
              console.log(doc.id, vid.data())
            }).catch(error => { console.log(error.message)})
          })
      }).catch(error => { console.log(error.message)})
    },
    browse() {
      this.vocabCollection = []
      this.searchBusy = true
      this.videoList = []
      this.videoListOrig = []
      // db == '-char_index'
      const tmp = this.keyword.trim()
      console.log(tmp)
      if (tmp =='') {
          this.searchBusy = false 
      } else if (tmp.length==1) {
          //this.vocabCollection = []
          this.$fireStore.collection('-char_index').doc(tmp).get().then( (doc => {
              //console.log( doc );
              if (doc.exists) {
                  console.log( doc.data() )
                  //this.vocabCollection = doc.data().vocab
                  doc.data().vocab.forEach(item => {
                    //this.vocabCollection.push({vocab: item, html: item.split(tmp).join('<span style="color: red">'+tmp+'</span>')})
                    this.$fireStore.collection(item).get().then(vid => {
                      vid.forEach(sub => {
                        console.log(sub.id, sub.data())
                      })
                    })
                  })
                  console.log( this.vocabCollection )
              } else {
                  this.snackbar = true
                  this.snackbar_text = 'No data by the keyword：' + tmp
                  this.snackbar_color = 'warning'
              }
              this.searchBusy = false
          })).catch(error => { console.log(error.message) })
      } else if (tmp.length>1) {
        this.searchPhraseByFirstChar(tmp)
      }
    },
    patternSearch() {
      if (this.pattern.indexOf('x')==-1) {
        this.keyword = this.pattern
        this.vocabCollection = []
        this.browse()
        return
      }
      const strArray = this.pattern.split('x')
      let found = false
      this.patternList = []
      if (strArray.length!=2) {
        console.error('incorrect pattern format')
      } else {
        this.vocabCollection = []
        if (strArray[0].trim()=='') {
          console.log('x 在 ？')
          const firstChar = strArray[1].trim().split('')[0]
          this.$fireStore.collection('-char_index').doc(firstChar).get().then( (doc => {
              //console.log( doc );
              if (doc.exists) {
                  console.log( doc.data() )
                  doc.data().vocab.forEach(phrase => {
                    //console.log(phrase.split(strArray[0].trim()))
                    if ( phrase.indexOf(strArray[1].trim()) != -1) {
                      console.log(phrase)
                      if (phrase.split(strArray[1].trim())[0] != '') {
                        this.vocabCollection.push(phrase)
                        found = true
                      }
                    }
                  })
                  if (!found) {
                    console.log('not found 472')
                    this.snackbar = true
                    this.snackbar_text = 'No data by the pattern：' + this.pattern
                    this.snackbar_color = 'warning'
                  }
              } else {
                  this.snackbar = true
                  this.snackbar_text = 'No data by the  pattern：' + this.pattern
                  this.snackbar_color = 'warning'
              }
              this.searchBusy = false
          })).catch(error => { console.log(error.message) })
        } else {                                                                                  // pattern ('太 x 了')
          console.log('太 x 了')
          const firstChar = strArray[0].trim().split('')[0]
          this.$fireStore.collection('-char_index').doc(firstChar).get().then( (doc => {
            //console.log( doc );
            if (doc.exists) {
                //console.log( doc.data() )
                  doc.data().vocab.forEach(phrase => {
                    //console.log(phrase)
                    if (phrase.indexOf(strArray[0].trim()) == -1)
                      return
                    this.$fireStore.collection(phrase).get().then(docs => {
                      docs.forEach(doc => {
                        //console.log(doc.id, doc.data())
                        this.$fireStore.collection('-video_meta').doc(doc.id).get().then(meta => {
                          //console.log(meta.data())
                          if (!meta.data().active)
                            return
                          for (const prop in doc.data() ) {
                            //console.log( prop, doc.data()[prop]['sub'], doc.data()[prop]['sub'].indexOf(strArray[1].trim()) )
                            // 句子裡出現 過 
                            if (doc.data()[prop]['sub'].indexOf(strArray[1].trim()) != -1) {
                              // 句子裡的 沒 在 過 的前面 -- algorithm 不对
                              const phraseAfterKeyword = doc.data()[prop]['sub'].substring(doc.data()[prop]['sub'].indexOf(strArray[0].trim()), doc.data()[prop]['sub'].length)
                              if ( phraseAfterKeyword.indexOf(strArray[1].trim()) != -1 ) {
                                //console.log( prop, doc.data()[prop]['sub'], doc.data()[prop]['start'] )
                                //console.log( doc.data() )
                                let htmlsub = doc.data()[prop]['sub'].split(strArray[0].trim()).join('<span style="color: red">'+strArray[0].trim()+'</span>')
                                htmlsub = htmlsub.split(strArray[1].trim()).join('<span style="color: red">'+strArray[1].trim()+'</span>')
                                this.patternList.push({htmlsub: htmlsub, id: doc.id, sub: doc.data()[prop]['sub'], time:prop, start: doc.data()[prop]['start'], ...meta.data()})
                                //console.log( meta.data() )
                                found = true
                              }
                            }
                          }
                        }).catch(error => { console.log(error.message) })

                      })
                    }).catch(error => { console.log(error.message)})
                  })
            } else {
                this.snackbar = true
                this.snackbar_text = 'No data by the pattern：' + this.pattern
                this.snackbar_color = 'warning'
            }
            this.searchBusy = false
          })).catch(error => { console.log(error.message) })
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
    rewind5() {
      this.$refs.youtube.player.getCurrentTime().then(time => {
        if (time>5) {
          this.$refs.youtube.player.seekTo(time-5, true);
          this.$refs.youtube.player.playVideo();
        } else {
          this.$refs.youtube.player.seekTo(0, true);
          this.$refs.youtube.player.playVideo();
        }
      })
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
  computed: {
    patternListUniq() {
      let temp = []
      this.patternList.forEach(item => {
        const result = temp.find(({time}) => time===item.time)
        //console.log(result)
        if (!result) 
          temp.push(item)
      })
      return temp
    }
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
input {
  border-style: solid;
  border-color: cornflowerblue;
  padding-left: 1px;
}
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