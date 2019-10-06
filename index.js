const axios = require('axios')
const md5 = require('md5')

let [action, value] = process.argv.slice(2)
action = String(action).toLowerCase()
value = String(value).toLowerCase()

const customAxios = axios.create({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:64.0) Gecko/20100101 Firefox/64.0',
  },
})

const baseAccount = 'https://instagram.com/instagram'
const sharedDataRegex = 'window._sharedData = ({.*?});'
const profilePageRegex = /ProfilePageContainer.js\/(.*?).js/g
const baseProfilePageContainer = 'https://www.instagram.com/static/bundles/es6/'
const queryHashRegex = /(?:^|);const o="(.*?)"/g

switch (action) {
  case '--username':
  case '-u':
    getUserId(value)
    break
  case '--id':
  case '-i':
    getUsername(value)
    break
}

async function getUserId(username) {
  try {
    const response = await customAxios.get(
      `https://instagram.com/${username}?__a=1`
    )

    console.log('User ID:', response.data.graphql.user.id)
  } catch (e) {
    console.error('Error: Something wrong!', e)
  }
}

async function getUsername(userId) {
  try {
    const response = await customAxios.get(baseAccount)
    const { nonce } = JSON.parse(response.data.match(sharedDataRegex)[1])
    const suffixProfilePageContainer = response.data.match(profilePageRegex)[0]
    const profilePageContainer = `${baseProfilePageContainer}${suffixProfilePageContainer}`
    const responseProfile = await customAxios.get(profilePageContainer)

    const queryHash = queryHashRegex.exec(responseProfile.data)[1]

    const queryVariable = JSON.stringify({
      user_id: userId,
      include_reel: true,
    })

    const gis = md5(`${nonce}:${queryVariable}`)

    const headers = {
      'X-Instagram-GIS': gis,
      'X-Requested-With': 'XMLHttpRequest',
    }

    const url = `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${queryVariable}`

    const res = await axios.get(url, { headers })

    console.log('Username:', res.data.data.user.reel.user.username)
  } catch (e) {
    console.error('Error: Something wrong!', e)
  }
}
