import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, rmdirSync } from 'fs'
import { chdir } from 'process'
import { Readable } from 'stream'
import { finished } from 'stream/promises'
import 'dotenv/config'

const folder='kube-auth'
if (!existsSync(folder)){
  mkdirSync(folder)
}
chdir(folder)

console.log("Downloading kubeconfig file ...")
const kubeconfigStream = createWriteStream('./kubeconfig')
let res = await fetch(`http://${process.env.dnsNode}:8000/auth/kubeconfig`)
await finished(Readable.fromWeb(res.body).pipe(kubeconfigStream))
console.log(`kubeconfig downloaded in ./${folder}/kubeconfig`)

console.log("Downloading kubeadmin password ...")
const kubeadminPasswordStream = createWriteStream('./kubeadmin-password')
res = await fetch(`http://${process.env.dnsNode}:8000/auth/kubeadmin-password`)
await finished(Readable.fromWeb(res.body).pipe(kubeadminPasswordStream))
console.log(`Password for user 'kubeadmin' saved in ./${folder}/kubeadmin-password`)

console.log("Downloading ssh key file for okd nodes ...")
const okdKeyStream = createWriteStream('./okd-node-key')
res = await fetch(`http://${process.env.dnsNode}:8000/okd-node-key`)
await finished(Readable.fromWeb(res.body).pipe(okdKeyStream))
console.log(`SSH private key downloaded in ./${folder}/okd-node-key`)
console.log(`Use this key to connect to okd nodes as user 'core'`)

