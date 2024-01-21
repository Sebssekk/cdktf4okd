import { readFileSync } from 'fs'
import { join } from 'path'
import {
  namedConfLocal,
  dnsDomainZone,
  dnsRevDomainZone,
  namedConfOptions,
  checkDNSRecords,
  HAProxyCfg,
  installConfig,
  isoCustomization,
} from './templates'
import { FileProvisioner, LocalExecProvisioner, RemoteExecProvisioner } from 'cdktf'

export const dnsProvisioner : (LocalExecProvisioner | RemoteExecProvisioner | FileProvisioner)[] | undefined= [
    {
      type: "file",
      destination: `/home/okd/db.${process.env.domain}`,
      content: dnsDomainZone,
    },
    {
      type: "file",
      destination: `/home/okd/db.${process.env.network}`,
      content: dnsRevDomainZone,
    },
    {
      type: "file",
      destination: `/home/okd/named.conf.local`,
      content: namedConfLocal,
    },
    {
      type: "file",
      destination: `/home/okd/named.conf`,
      content: namedConfOptions,
    },
    {
      type: "file",
      destination: `/home/okd/dns-check.sh`,
      content: checkDNSRecords,
    },
    {
      type: "file",
      destination: `/home/okd/okd-install.yaml`,
      content: installConfig,
    },
    {
      type: "file",
      destination: `/home/okd/pull-secret.txt`,
      content: readFileSync(join(__dirname,"pull-secret.txt"),'utf8'),
    },
    {
      type: "file",
      destination: `/home/okd/ignition-server.service`,
      content: readFileSync(join(__dirname,"dns-files","ignition-server.service"),'utf8'),
    },
    {
      type: "file",
      destination: `/home/okd/cert-approve.service`,
      content: readFileSync(join(__dirname,"dns-files","cert-approve.service"),'utf8'),
    },
    {
      type: "file",
      destination: `/home/okd/cert-approve.sh`,
      content: readFileSync(join(__dirname,"dns-files","cert-approve.sh"),'utf8'),
    },
    {
      type: "file",
      destination: `/home/okd/iso-customization.sh`,
      content: isoCustomization,
    },
    { type: "remote-exec",
      inline : [
        `echo \"export domain=${process.env.domain}\" >> ~/.bashrc`,
        `echo \"export interface=${process.env.interface}\" >> ~/.bashrc`,
        `echo \"export network=${process.env.network}\" >> ~/.bashrc`,
        `echo \"export dnsNode=${process.env.dnsNode}\" >> ~/.bashrc`,
        `echo \"export openshiftInstall=${process.env.openshiftInstall}\" >> ~/.bashrc`,
        `echo \"export OCcli=${process.env.OCcli}\" >> ~/.bashrc`,
      ],
    },
    {
      // DNS Setup
      type: 'remote-exec',
      script: join(__dirname,'dns-files','dns-setup.sh'),
    },
    {
      // Helper Setup
      type: 'remote-exec',
      script: join(__dirname,'dns-files', 'helper-setup.sh'),
    },
    { 
      // ISO Customization
      type: "remote-exec",
      inline : [
        'chmod +x /home/okd/iso-customization.sh',
        '/home/okd/iso-customization.sh',
      ],
    },
  ]

export const albProvisioner: (LocalExecProvisioner | RemoteExecProvisioner | FileProvisioner)[] | undefined = [
  {
    type: "file",
    destination: `/home/okd/haproxy.cfg`,
    content: HAProxyCfg,
  },
  { 
    type: "remote-exec",
    inline : [
      `echo \"export interface=${process.env.interface}\" >> ~/.bashrc`,
      `echo \"export dnsNode=${process.env.dnsNode}\" >> ~/.bashrc`,
    ]
  },
  {
    // Haproxy Setup
    type: 'remote-exec',
    script: join(__dirname,'alb-files','haproxy-setup.sh'),
  },
]