<template>
<v-row>
  <v-col cols="7">
    <v-select solo :items="videoCollection" item-text="title" item-value="id" label="Video" @change="getSub($event)"></v-select>
    <v-simple-table dense>
    <template v-slot:default>
        <thead>
        <tr>
            <th class="text-left"> Time </th>
            <th class="text-left"> Sub </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(item, i) in videoSub" :key="i">
            <td style="font-weight: bold"> {{ item.id }} 
                <div v-if="item.gra" style="color: red"> {{ item.gra}} </div>
            </td>
            <td v-html="item.html" class="subtitle-1"> 
            <span class="subtitle-1" @click="applyTag(i, item)" v-if="!item.html"> {{ item.sub }} </span>
            <!-- <span :html="item.html" class="subtitle-1" @click="applyTag(i, item)"> {{item.html}} </span> -->
            </td>
        </tr>
        </tbody>
    </template>
    </v-simple-table>
  </v-col>
  <v-col cols="5" style="position: relative;">
    <div style="position: sticky; top: 70px;">
      <v-row>                    <!--  把  -->
        <span style="width: 40px; font-size:18px; font-weight: bold;" @click="filter('把')"> 把 </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="010" @change="tag('010', $event)"></v-checkbox> </span>
        measure word: 一 <span class=highlightText> 把 </span> 槍
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="011" @change="tag('011', $event)"></v-checkbox> </span>
        noun: <span class=highlightText> 把 </span> 戲、<span class=highlightText> 把 </span>手，掃 <span class=highlightText> 把 </span>
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="011" @change="tag('011', $event)"></v-checkbox> </span>
        verb: 派人 <span class=highlightText> 把 </span> 守
      </v-row>
      <v-row>                    <!--  才  -->
        <span style="width: 40px; font-size:18px; font-weight: bold;" @click="filter('才')"> 才 </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="020" @change="tag('020', $event)"></v-checkbox> </span>
        not until: 八點 <span class=highlightText> 才 </span> 來
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="021" @change="tag('021', $event)"></v-checkbox> </span>
        emphasis: 我 <span class=highlightText> 才 </span> 不要呢
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="022" @change="tag('022', $event)"></v-checkbox> </span>
        conditional: 你去我 <span class=highlightText> 才 </span> 去
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="023" @change="tag('023', $event)"></v-checkbox> </span>
         only: 他 <span class=highlightText> 才 </span> 12 歲
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="024" @change="tag('024', $event)"></v-checkbox> </span>
         just now: 他們剛剛 <span class=highlightText> 才 </span> 到家
      </v-row>
      <v-row>                    <!--  得  -->
        <span style="width: 40px; font-size:18px; font-weight: bold;" @click="filter('得')"> 得 </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="030" @change="tag('030', $event)"></v-checkbox> </span>
         have to: 我們 <span class=highlightText> 得 </span> 走了
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="031" @change="tag('031', $event)"></v-checkbox> </span>
         verb - de:  打球打 <span class=highlightText> 得 </span> 很好
      </v-row>
      <v-row>                    <!--  多  -->
        <span style="width: 40px; font-size:18px; font-weight: bold;" @click="filter('多')"> 多 </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="040" @change="tag('040', $event)"></v-checkbox> </span>
         a little more: 十 <span class=highlightText> 多 </span> 個
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="041" @change="tag('041', $event)"></v-checkbox> </span>
         question:  今年 <span class=highlightText> 多 </span> 大
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="042" @change="tag('042', $event)"></v-checkbox> </span>
         comparison:  年輕 <span class=highlightText> 多 </span> 了
      </v-row>
      <v-row>                    <!--  還是  -->
        <span style="width: 40px; font-size:18px; font-weight: bold;" @click="filter('還是')"> 還是 </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="050" @change="tag('050', $event)"></v-checkbox> </span>
         selection / choice: 我們 <span class=highlightText> 還是 </span> 吃中國菜吧
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="051" @change="tag('051', $event)"></v-checkbox> </span>
         still:  他 <span class=highlightText> 還是 </span> 不舒服
      </v-row>
      <v-row>                    <!--  就  -->
        <span style="width: 40px; font-size:18px; font-weight: bold;" @click="filter('就')"> 就 </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="110" @change="tag('110', $event)"></v-checkbox> </span>
         a little more: 很快 <span class=highlightText> 就 </span> 到 /  <span class=highlightText> 就 </span>要起飛了
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="111" @change="tag('111', $event)"></v-checkbox> </span>
         question:  你去我 <span class=highlightText> 就 </span> 去
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="112" @change="tag('112', $event)"></v-checkbox> </span>
         comparison:  一看完 <span class=highlightText> 就 </span> 還你
      </v-row>
      <v-row>                    <!--  是  -->
        <span style="width: 40px; font-size:18px; font-weight: bold;" @click="filter('是')"> 是 </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="120" @change="tag('120', $event)"></v-checkbox> </span>
        verb 是 verb: 好看 <span class=highlightText> 是 </span> 好看
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="121" @change="tag('121', $event)"></v-checkbox> </span>
        emphasis: 這幾年變化 <span class=highlightText> 是 </span> 很大
      </v-row>
      <v-row>                    <!--  的  -->
        <span style="width: 40px; font-size:18px; font-weight: bold;" @click="filter('的')"> 的 </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="220" @change="tag('220', $event)"></v-checkbox> </span>
        category: 這本書是新 <span class=highlightText> 的 </span> / 這是有可能 <span class=highlightText> 的 </span> 
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="221" @change="tag('221', $event)"></v-checkbox> </span>
         past event: 是跟誰去 <span class=highlightText> 的 </span>
      </v-row>
      <v-row>                    <!--  為  -->
        <span style="width: 40px; font-size:18px; font-weight: bold;" @click="filter('為')"> 為 </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="130" @change="tag('130', $event)"></v-checkbox> </span>
          to be: 成 <span class=highlightText> 為 </span> / 登記 <span class=highlightText> 為 </span>
      </v-row>
      <v-row>
        <span style="width: 40px; font-size:18px; font-weight: bold;">  </span>
        <span style="width: 30px;"> <v-checkbox v-model="selected" value="131" @change="tag('131', $event)"></v-checkbox> </span>
          for: <span class=highlightText> 為 </span> 您帶來 / <span class=highlightText> 為 </span> 我們準備
      </v-row>
    </div>
  </v-col>

      <v-snackbar v-model="snackbar" :color="snackbar_color">
      {{ snackbar_text }}
      <v-btn text @click="snackbar = false">
        Close
      </v-btn>
    </v-snackbar>

</v-row>    
</template>

<script>
//import firebase from 'firebase/app';
import 'firebase/firestore'

export default {
  data() {
    return {
      curTag: [],
      allTags: [],
      videoCollection: [],
      videoSub: [],
      videoSubOrig: [],
      selected: [],
      vidID: '',
      snackbar: false,
      snackbar_text: '',
      snackbar_color: '',
    }
  },
  methods: {
    filter(str) {
      console.log(str)
      this.videoSub = []
      this.videoSubOrig.forEach(item =>{
        if (item.sub.indexOf(str)!=-1) {
          const html = item.sub.split(str).join(`<span class="pink--text">${str}</span>`)
          this.videoSub.push({html:html, ...item})
        }
      })
      console.log(this.videoSub)
      // this.videoSub = this.videoSubOrig.filter(item => {
      //   console.log(item)
      //   console.log(item.sub)
      //   console.log( item.sub.indexOf(str) )
      //   return item.sub.indexOf(str)==-1 ? false : true
      // })
    },
    tag(value, items) {
      console.log(value, items)
    },
    applyTag(index, item){
      console.log(index, item)
      // item.gra = this.selected
      // this.videoSub.splice(index, 1, item)
      // // update subtitle field with grammar tag
      // this.$fireStore.collection(this.vidID).doc(item.id).set( {gra: this.selected}, {merge: true}).then(() => {
      //   this.snackbar = true
      //   this.snackbar_text = 'Success'
      //   this.snackbar_color = 'success'        
      // }).catch(error => { console.error( error.message )})
      // write the grammar db
    },
    getSub(id) {
      //console.log(id)
      this.vidID = id
      this.videoSub = []
      this.videoSubOrig = []
      this.$fireStore.collection(id).get().then(snapshot => {
        snapshot.forEach((doc) => {
          //console.log( doc.data() );
          this.videoSub.push( {id: doc.id, ...doc.data()} )
          this.videoSubOrig.push( {id: doc.id, ...doc.data()} )
        })
      }).catch(error => { console.log(error.message) })
    }
  },
  mounted(){
    this.$fireStore.collection( '-video_meta' ).get().then(snapshot => {
      snapshot.forEach((doc) => {
        //console.log( doc.data() );
        this.videoCollection.push( {id: doc.id, ...doc.data()} )
      })
    }).catch(error => { console.log(error.message) })
  }
}
</script>

<style scoped>
.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
}
.v-input__control {
  width: 20px;
}
.v-input--selection-controls {
  height: 30px;
}
.highlightText {
  color: red;
}
.v-data-table > .v-data-table__wrapper > table > tbody > tr > td > .tightPadding {
    padding: 0 4px;
}
</style>