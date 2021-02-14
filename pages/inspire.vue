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
          <v-col cols="6">
            <v-text-field solo v-model="textbook" label="textbook: IC1"></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field solo v-model="bookLesson" label="lesson: L01" ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <p> Input format: <span class="red--text"> each line one vocab item </span></p>
            <v-textarea outlined label="paste lesson vocabulary here" v-model="taVocab"></v-textarea>
            <v-btn class="info" @click="parseVocab"> Parse vocabulary </v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="6" id="right">
        <v-btn outlined dark color="indigo" @click="dbSave" :disabled="vocabList.length==0"> save vocab list </v-btn>
        <span class="pink--text" style="font-size: 20px"> {{ selPhrase }} </span>
        <div style="height: 400px; overflow: auto">
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left"> # </th>
                <th class="text-left"> Vocab </th>
                <th> Y/N </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in vocabList" :key="i" @click="search(item)">
                <td style="font-weight: bold"> {{ i+1 }} </td>
                <td> <span style="font-size: 18px"> {{item.vocab}} </span></td>
                <td :class="item.found ? 'blue--text' : 'pink--text'"> {{item.found}} </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>     </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
              <div style="height:400px; overflow: auto;">
                <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left"> @ </th>
                      <th class="text-left"> Video </th>
                      <th class="text-left" style="width: 90px;"> Level </th>
                      <th  style="width: 100px;"> Genre </th>
                      <th class="text-right"> <v-icon>mdi-closed-caption</v-icon> </th>
                    </tr> 
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in patternList" :key="i" @click="patternSub(item)">
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

    </v-container>
  </div>
</template>

<script>

export default {
  data() {
    return {
      textbook: '',
      bookLesson: '',
      vocabList: [],
      taVocab: '',
      vocabCollection: [],
      patternList: [],
      selPhrase: ''
    }
  },
  methods: {
    patternSub(item){
      console.log(item)
    },
    search(item){
      console.log(item)
      this.selPhrase = item.vocab
      this.vocabCollection = []
      this.patternList = []
      const keyword = item.vocab.split('')[0]
        this.$fireStore.collection('-char_index').doc(keyword).get().then( doc => {
            //console.log( doc );
            if (doc.exists) {
                console.log( doc.data() )
                //this.vocabCollection = doc.data().vocab
                let found = false
                doc.data().vocab.forEach(phrase => {
                  if (phrase.indexOf(item.vocab.trim()) != -1) {
                    found = true
                    this.vocabCollection.push( {vocab: phrase, html: phrase.split(item).join('<span class="pink--text">'+item+'</span>')} )
                    this.$fireStore.collection(phrase).get().then(docs => {
                      docs.forEach(oneDoc => {
                        console.log(oneDoc.id, oneDoc.data())
                        this.$fireStore.collection('-video_meta').doc(oneDoc.id).get().then(meta =>{
                          if (meta.data().active) { 
                            for (const prop in oneDoc.data()) {
                              const html = oneDoc.data()[prop].sub.split(item.vocab).join('<span class="pink--text">'+item.vocab+'</span>')
                              this.patternList.push({time: prop, htmlsub: html, id: oneDoc.id, start: oneDoc.data()[prop].start, sub: oneDoc.data()[prop].sub, ...meta.data()})
                            }
                          }
                        })
                      })
                    })
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
        }).catch(error => { console.error(error.message) })
    },
    dbSave() {
      if (this.textbook=='' || this.bookLesson=='') {
        console.log('required fields missing')
      } else {
        let tmp = []
        this.vocabList.forEach(item =>{
          if (item.found) {
            tmp.push(item.vocab)
          }
        })
        const percent = (tmp.length/this.vocabList.length*100).toFixed(1) + '%'
        // update metadata
        this.$fireStore.collection('-txt_'+this.textbook).doc(this.bookLesson).set({
          cover: percent, update: new Date().toString(), vocab: tmp
        }).then(() =>{
          console.log('success')
        }).catch(error =>{ console.error( error.message )})
        // tmp.forEach(item =>{
        //   this.$fireStore.collection('-txt_'+this.textbook).doc(this.bookLesson+'_'+item).set({
        //     sub: [{que: [9, 1]}]
        //   }).then(() =>{
        //     console.log('success')
        //   }).catch(error =>{ console.error( error.message )})
        // })
      }
    },
    parseVocab() {
      this.vocabList = []
      const tmp = this.taVocab.split('\n')
      tmp.forEach(vocab =>{
        this.vocabList.push({vocab: vocab.trim(), found: false})
      })
      this.vocabSearch()
    },
    vocabSearch() {
      this.vocabList.forEach(item =>{
        const keyword = item.vocab.split('')[0]
        this.$fireStore.collection('-char_index').doc(keyword).get().then( (doc => {
            //console.log( doc );
            if (doc.exists) {
                console.log( doc.data() )
                //this.vocabCollection = doc.data().vocab
                let found = false
                doc.data().vocab.forEach(phrase => {
                  if (phrase.indexOf(item.vocab) != -1) {
                    found = true
                    item.found = true
                  }
                })
                if (!found) {
                  console.log('found ' + keyword + ' but not ' + item.vocab)
                }
            } else {
              console.log(item.vocab + ' not found: ')
            }
            this.searchBusy = false
        })).catch(error => { console.log(error.message) })
      })
    },
  },
  mounted() {
    //console.log(hsk_1); // [ {hanzi: , id: , pinyin: , translations: [] }, ... ]
  }
}
</script>
