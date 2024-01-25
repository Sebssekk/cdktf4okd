import {Fn} from 'cdktf'
import 'dotenv/config'
import {platform} from 'os'
import { join } from 'path'

const netSize = Number(process.env.prefix) == 16 ? 2 : 1
let getFilename: Function = ()=>{}
if (platform() === 'win32'){
   //Fix how terraform read Windows Filesystem
   getFilename = (toJoinNname: string[]) : string => (Fn.join('///',[...__dirname.split('\\'),...toJoinNname]))
}
else {
   getFilename = (toJoinNname: string[]) : string => (join(__dirname, ...toJoinNname))
}

// DNS Host Templates

export const dnsDomainZone = Fn.templatefile(getFilename( ['dns-files', 'zones','db.domain.tpl']),{
   domain: process.env.domain,
   cluster_name: process.env.clusterName,
   dns_host: process.env.dnsNode,
   master_addrs: process.env.masterNodes?.split(','),
   worker_addrs: process.env.workerNodes?.split(','),
   bootstrap_addr: process.env.bootstrapNode,
   alb_addr: process.env.albNode
})
export  const dnsRevDomainZone = Fn.templatefile(getFilename(['dns-files', 'zones','db.net.tpl']),{
   domain: process.env.domain,
   cluster_name: process.env.clusterName,
   dns_host_rev: process.env.dnsNode?.split('.').reverse().slice(0,netSize).join('.'),
   master_rev_addrs: process.env.masterNodes?.split(',').map(h => h.split('.').reverse().slice(0,netSize).join('.')),
   worker_rev_addrs: process.env.workerNodes?.split(',').map(h => h.split('.').reverse().slice(0,netSize).join('.')),
   bootstrap_rev_addr: process.env.bootstrapNode?.split('.').reverse().slice(0,netSize).join('.'),
   alb_rev_addr:  process.env.albNode?.split('.').reverse().slice(0,netSize).join('.')
})
export  const namedConfLocal = Fn.templatefile(getFilename(['dns-files', 'named.conf.local.tpl']),{
   domain: process.env.domain,
   network: process.env.network,
   revNetwork: process.env.network?.split('.').reverse().slice(netSize).join('.')
})
export  const namedConfOptions = Fn.templatefile(getFilename(['dns-files', 'named.conf.tpl']),{
   dns_host: process.env.dnsNode,
   master_addrs: process.env.masterNodes?.split(','),
   worker_addrs: process.env.workerNodes?.split(','),
   bootstrap_addr: process.env.bootstrapNode,
   alb_addr: process.env.albNode,
   extra_addrs: process.env.dnsExtraClients?.split(',')
})
export  const checkDNSRecords = Fn.templatefile(getFilename(['dns-files', 'dns-check.sh.tpl']),{
   domain: process.env.domain,
   cluster_name: process.env.clusterName,
   dns_host: process.env.dnsNode,
   bootstrap_addr: process.env.bootstrapNode,
   alb_addr: process.env.albNode
})

export  const dnsSetup = Fn.templatefile(getFilename(['dns-files', 'dns-setup.sh.tpl']),{
   dns_host: process.env.dnsNode,
   interface: process.env.interface,
   network: process.env.network,
   domain: process.env.domain,
})


// ALB Templatate

export const HAProxyCfg = Fn.templatefile(getFilename(['alb-files', 'haproxy.cfg.tpl']),{
    domain: process.env.domain,
    cluster_name: process.env.clusterName,
    bootstrap_addr: process.env.bootstrapNode,
    master_addrs: process.env.masterNodes?.split(','),
    worker_addrs: process.env.workerNodes?.split(','),
})

export  const haproxySetup = Fn.templatefile(getFilename(['alb-files', 'haproxy-setup.sh.tpl']),{
   dns_host: process.env.dnsNode,
   interface: process.env.interface,
})

// Helper
export const installConfig = Fn.templatefile(getFilename(['okd-install.yaml.tpl']),{
    domain: process.env.domain,
    cluster_name: process.env.clusterName,
 })
 export  const helperSetup = Fn.templatefile(getFilename(['dns-files', 'helper-setup.sh.tpl']),{
   openshiftInstall: process.env.openshiftInstall,
   OCcli: process.env.OCcli,
   TZ: process.env.TZ,
})

export const isoCustomization = Fn.templatefile(getFilename( ['dns-files', 'iso-customization.sh.tpl']),{
   domain: process.env.domain,
   dns_host: process.env.dnsNode,
   master_addrs: process.env.masterNodes?.split(','),
   worker_addrs: process.env.workerNodes?.split(','),
   bootstrap_addr: process.env.bootstrapNode,
   prefix: process.env.prefix,
   gateway: process.env.gateway,
   interface: process.env.interface,
   fedoraISO: process.env.fedoraISO,
   TZ: process.env.TZ
})
