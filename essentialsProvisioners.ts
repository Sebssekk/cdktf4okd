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
  dnsSetup,
  helperSetup,
  haproxySetup,
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
      destination: `/home/okd/dns-setup.sh`,
      content: dnsSetup,
    },
    {
      type: "file",
      destination: `/home/okd/helper-setup.sh`,
      content: helperSetup,
    },
    {
      type: "file",
      destination: `/home/okd/iso-customization.sh`,
      content: isoCustomization,
    },
    {
      // DNS Setup
      type: 'remote-exec',
      inline : [
        'chmod +x /home/okd/dns-setup.sh',
        '/home/okd/dns-setup.sh',
      ],
    },
    {
      // Helper Setup
      type: 'remote-exec',
      inline : [
        'chmod +x /home/okd/helper-setup.sh',
        '/home/okd/helper-setup.sh',
      ],    
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
    type: "file",
    destination: `/home/okd/haproxy-setup.sh`,
    content: haproxySetup,
  },
  {
    // Haproxy Setup
    type: 'remote-exec',
    inline : [
      'chmod +x /home/okd/haproxy-setup.sh',
      '/home/okd/haproxy-setup.sh',
    ],  
  },
]