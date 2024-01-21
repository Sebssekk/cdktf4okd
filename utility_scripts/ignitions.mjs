import { exec } from "child_process";
import { join, dirname } from 'path';
import { exit } from 'process';
import { promisify } from 'util';
const execp = promisify(exec)
import 'dotenv/config'

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const okd_essentials= [{dns:process.env.dnsNode}, {alb:process.env.albNode} ] 

okd_essentials.map(node => {
   const filename = Object.keys(node)[0]
   console.log("[*]Producing "+ filename + " Bu/ign file")
   const buPath = join(__dirname,'..','ignitions', `${filename}.bu`)
   const ignPath = join(__dirname,'..','ignitions', `${filename}.ign`)
   const folder = `${Object.keys(node)[0]}-files`
   execp(`python ignitions/rendered.py ${filename} ${folder}  domain=${process.env.domain} host=${Object.values(node)[0]} gateway=${process.env.gateway} prefix=${process.env.prefix} interface=${process.env.interface} dns=${process.env.dnsNode}`)
      .then(() =>
         execp(`podman run --interactive --rm quay.io/coreos/butane --pretty --strict < ${buPath} > ${ignPath}`)
            .then(() => {
               console.log("Ignition file ready")
            })
      ).catch((err)=> {
         console.log(err)
         exit(1)
      })
})