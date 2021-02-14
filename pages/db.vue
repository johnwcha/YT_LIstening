<template>
    <v-container class="fill-height" fluid >
    <v-row align="center" justify="center" >
        <v-col class="text-center">
            <v-row>
            Video Collection: 
            <v-text-field solo v-model="collection" label="collection (collection)" @change="getDocs"></v-text-field>
            <v-btn class="error" @click="doDelete" :disabled="delBtn"> Delete </v-btn>
            </v-row>
        </v-col>
    </v-row>

        <v-col>
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left"> Time </th>
                <th class="text-left"> Subtitle </th>
                <th class="text-right"> @ </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in videoSub" :key="i" >
                <td style="font-weight: bold"> {{ item.id }} </td>
                <td style="font-size:18px"> <v-text-field solo v-model="item.sub" ></v-text-field> </td>
                <td class="text-right"> <v-btn @click="saveEdit(item)" color="info" fab x-small dark> <v-icon>mdi-content-save</v-icon> </v-btn>
                  <v-btn @click="deleteSentence(item)" color="warning" fab x-small > <v-icon>mdi-delete</v-icon> </v-btn>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
        </v-col>
<!-- ----------------- phrase collection ----------------------------- -->
    <v-row align="center" justify="center" >
        <v-col class="text-center">
            <v-row>
            Phrase Collection: 
            <v-text-field solo v-model="vocabCollection" label="vocab item (vocabCollection)" @change="getVocab"></v-text-field>
            <v-btn class="error" @click="doAllPhraseDelete" :disabled="delVocabBtn"> Delete </v-btn>
            </v-row>
        </v-col>
    </v-row>

    <v-col>
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left"> Doc ID / field </th>
                <th class="text-left"> subtitle </th>
                <th class="text-right"> @ </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in vocabSub" :key="i" >
                <td width="160px" style="font-weight: bold; padding:4px"> {{ item.id }} /{{ item.field }} </td>
                <td style="font-size:18px"> <v-text-field solo v-model="item.sub" ></v-text-field> </td>
                <td width="70px" class="text-right"> 
                  <v-btn @click="saveVocabEdit(item)" color="info" fab x-small > <v-icon>mdi-content-save</v-icon> </v-btn>
                  <v-btn @click="deleteOnePhraseEntry(item)" color="secondary" fab x-small > <v-icon>mdi-delete</v-icon> </v-btn>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
    </v-col>

    <v-row> SRT file to pure text </v-row>
    <v-row><v-textarea v-model="taSource" label="srt source file" @change="parseSRT"></v-textarea></v-row>
    <v-row><v-textarea v-model="taTarget"></v-textarea> </v-row>  
    

    </v-container>
</template>

<script>
//import ConvertPY from '../pinyin/pinyin'
import * as firebase from 'firebase/app';
//import * as admin from "firebase-admin";
import 'firebase/firestore';
import { getVideoMeta, getCharIndex, compareValues } from '../util/functions'

export default {
  data() {
    return {
      taSource: '',
      taTarget: '',
      delBtn: true,
      collection: '',
      videoSub: [],
      vocabCollection: '',
      delVocabBtn: true,
      vocabSub: [],
      noviceSkipWords: ['、', '，', '。', '：', '？', '"', ',', '（', '）', '(', ')', '.', '…', ''],
      alphabet: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    }
  },
  methods: {
    parseSRT(){
      const input_lines = this.taSource.split('\n')
      var temp = []
      input_lines.forEach((item, index) => {
        if ((index % 4) === 0) {
          console.log(item) // line number
        } else if ((index % 4) === 1) {  
            console.log(item, index) // timecode format 00:01:36,000 --> 00:01:37,536
            //timecode_str = item;
        } else if ((index % 4) === 2) {  
            //console.log(item.split('", "').join(' ').trim()) // subtitle to parse
            temp.push(item)
        } else if ((index % 4) === 3) {  
            console.log(item) // blank line
        } 
      })
      this.taTarget = temp.join('\n')
    },
      deleteSentence(item) {
          console.log(this.collection, item)
          this.$fireStore.collection(this.collection).doc(item.id).delete().then(() => {
              console.log('sentence deleted')
          }).catch(error => { console.log(error.message) })
      },
      getVocab() {
          this.vocabSub = []
          this.delVocabBtn = true
          if ( (this.vocabCollection).trim()=='') return;
          this.$fireStore.collection( this.vocabCollection ).get().then(snapshots => {
              snapshots.forEach(doc => {
                  console.log( doc.id, doc.data() )
                  for (const key in doc.data() ) {
                      this.vocabSub.push( {id: doc.id, field: key, sub: doc.data()[key].sub } )
                  }
                  //this.vocabSub.push( {id: doc.id, field: field, data: data} )
              })
              this.delVocabBtn = false
          }).catch(error => { console.log(error) })
      },
      saveVocabEdit(item) {
        console.log(item) // {field: "00:06:09.375" id: "RxmyJpsAZvA" sub: "干脆 这样 吧"}
        // write phrase
        // item.sub.split(' ').forEach(phrase => {
        //     console.log(phrase)
        //     const skip = this.noviceSkipWords.concat(this.alphabet)
        //     if (!skip.includes(phrase)) {
        //         var obj = {}
        //         obj[item.id] = {duration: item.duration, start: item.start, sub: item.sub}
        //         // ******* WRITE ******** phrase 
        //         this.$fireStore.collection(phrase).doc(this.videoId).set(obj, { merge: true }).then(() => {
        //             phrase_write++
        //             console.log('phrase write count:', phrase_write)
        //         }).catch(error => { console.error('phrase_write:', error.message)})
        //     }
        //     //phrase_batch.set(this.$fireStore.collection(phrase).doc(this.videoId), obj, { merge: true })
        //     // batch write character
        //     const chars = phrase.split('')
        //     chars.forEach(char => {
        //         console.log(char)
        //         if (!this.noviceSkipWords.includes(char)) {
        //             // ******* WRITE ******** 汉字 
        //             this.$fireStore.collection('-char_index').doc(char).update({
        //                 vocab: firebase.firestore.FieldValue.arrayUnion(phrase)
        //             }).then(() => { console.log('updated field'); character_write = character_write +2;
        //                 console.log('character write count:', character_write) }).catch(error => {
        //                 //console.log(error.message)
        //                 console.log( char, phrase)
        //                 character_write = character_write +2
        //                 this.$fireStore.collection('-char_index').doc(char).set({vocab: [phrase]})
        //                     .then(() =>{
        //                         console.log('insert data')
        //                         character_write++
        //                         console.log('character write count:', character_write)
        //                     }).catch(error => { console.log(error) })
        //             })
        //         }
        //     })
        // })
      },
      deleteOnePhraseEntry(item) {
          console.log(item)
          //this.fieldDelete( this.vocabCollection, item.id, item.field )
      },
      fieldUpdate(col, id, field) {
          this.$fireStore.collection(col).doc(id).update({field: this.$firestore.FieldValue.delete()})
      },
      fieldDelete(col, id, field) {
          this.$fireStore.collection(col).doc(id).update({field: this.$firestore.FieldValue.delete()})
      },
      doAllPhraseDelete() {
          const batch = this.$fireStore.batch()
          this.vocabSub.forEach(doc => {
              batch.delete( this.$fireStore.collection(this.vocabCollection).doc(doc.id))
          })
          batch.commit().then(() => {
              console.log('batch delete success')
              this.vocabSub = []
          }).catch(error => {
              console.log( error )
          })
      },
      saveEdit(item) {
          console.log( item ) // it's actually a sentence
          // update the subtitle entry itself
          this.$fireStore.collection(this.collection).doc(item.id).update( {sub: item.sub} )
          // update the db of each 分词 
          //const batch = this.$fireStore.batch()
          item.sub.split(' ').forEach(vocab => {
              console.log( vocab )
              //batch.update(this.$fireStore.collection( this.collection ).doc(item.id), {sub: item.sub})
          })
          // update -char_index
          this.indexVocab(item.sub)
      },
      doDelete() {
          // delete entire collection // will have to delete each document
          // const batch = this.$fireStore.batch() // 500 max
          var count = 0
          this.videoSub.forEach(doc => {
              count++
              this.$fireStore.collection(this.collection).doc(doc.id).delete().then(() => {
                console.log('delete ', count)
              }).catch(error => { console.log(error) })
          })
          // batch.commit().then(() => {
          //     console.log('batch delete success')
          //     this.videoSub = []
          // }).catch(error => {
          //     console.log( error )
          // })
      },
      getDocs() {
          this.videoSub = []
          this.delBtn = true
          if ( (this.collection).trim()=='') return;
          this.docID = []
          this.$fireStore.collection( this.collection ).get().then(snapshots => {
              snapshots.forEach(doc => {
                  console.log( doc.id, doc.data() )
                  this.videoSub.push( {id: doc.id, sub: doc.data().sub} )
              })
              this.delBtn = false
          }).catch(error => { console.log(error) })
      },
      indexVocab(sentence) {
        // update -char_index
        // const sentence (sentence with space delimited word segmentation)
        const vocab_arr = sentence.split(' ')
        //console.log( this.$fireStore)

        vocab_arr.forEach(vocab => {
            const tmp = vocab.split('')
            tmp.forEach(char => {
                console.log(char, vocab)
                this.$fireStore.collection('-char_index').doc(char).update({
                    vocab: firebase.firestore.FieldValue.arrayUnion(vocab)
                }).then(() => { console.log('updated field') }).catch(error => {
                    //console.log(error.message)
                    console.log( char, vocab)
                    this.$fireStore.collection('-char_index').doc(char).set({vocab: [vocab]})
                        .then(() =>{
                            console.log('insert data')
                        }).catch(error => { console.log(error) })
                })
            })
        })          
      }
  },
  mounted() {

    //console.log( getVideoMeta(this.$fireStore) )
    //console.log( getCharIndex() )
    // const db = admin.firestore();

    // db.listCollections().then(snapshot=>{
    //     snapshot.forEach(snaps=>{
    //         console.log(snaps["_queryOptions"].collectionId);  // GET LIST OF ALL COLLECTIONS
    //     })
    // }).catch(error=>console.log(error));  
  }
}

// convert simplified to traditional
// import OpenCC from 'opencc-js'
// (async () => {
//     const convert = await OpenCC.Converter('cn', 'tw')
//     this.final_transcript_trad = convert(this.final_transcript)
// })()

</script>