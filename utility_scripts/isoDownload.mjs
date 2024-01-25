import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, rmdirSync } from 'fs'
import { chdir } from 'process'
import { Readable } from 'stream'
import { finished } from 'stream/promises'
import 'dotenv/config'

const tmp=process.argv[2]
if (!existsSync(tmp)){
  mkdirSync(tmp)
}
chdir(tmp)

const vsphereNodes = Object.keys(process.env).filter(env => env.match('^vsphereNode\\d$'))
const chosenHostsDatastore = {}
for (const node of vsphereNodes) {
  chosenHostsDatastore[process.env[node]] = process.env[node+"Datastore"] || ''
}
console.log("Downloading iso index file")
let res = await fetch(`http://${process.env.dnsNode}:8000/okd-iso-image.list`)
const isosTxt = await res.text()
const isos = isosTxt.split('\n').filter(s => s.match('.iso$')) 

await Promise.all(isos.map(async isoName => {
    const isoStream = createWriteStream(isoName)
    console.log(`Downloading ${isoName}`)
    const {body} = await fetch(`http://${process.env.dnsNode}:8000/${isoName}`)
    await finished(Readable.fromWeb(body).pipe(isoStream))
    console.log(`${isoName} downloaded`)
}))

