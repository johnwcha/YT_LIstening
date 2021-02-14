<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-center">
        <logo />
        <vuetify-logo />
      </div>
      <v-card>
        <v-card-title class="headline">
          Prototype
        </v-card-title>
        <v-card-text>
          <p> subtitles/speeches/lyrics indexed against HSK vocabulary </p>
          <p> </p>
          <p> TO DO: CSS for mobile </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            nuxt
            to="/speech_1"
          >
          speech video (indexed against HSK level 1 vocabulary)
          </v-btn>
          </v-card-actions>
          <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            nuxt
            to="/speech_2"
          >
          speech video (indexed against HSK level 2 vocabulary)
          </v-btn>
          </v-card-actions>
          <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            nuxt
            to="/music_1"
          >
          music video (indexed against HSK level 1 vocabulary)
          </v-btn>
          </v-card-actions>
          <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            nuxt
            to="/music_2"
          >
          music video (indexed against HSK level 2 vocabulary)
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import Logo from '~/components/Logo.vue'
import VuetifyLogo from '~/components/VuetifyLogo.vue'

export default {
  components: {
    Logo,
    VuetifyLogo
  },
  methods: {
  login() {
    console.log(this.$fireAuth.currentUser)
    this.$fireAuth.signInAnonymously().catch( (e) => {
      console.log(e)
    })
  }
},
mounted() {
  this.login()
}

}
</script>
