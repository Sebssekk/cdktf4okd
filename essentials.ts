import { Construct } from "constructs";
import { ITerraformResource, TerraformStack,  } from "cdktf";
import { ClusterData, HostData } from "./main";
import { VsphereProvider, VsphereProviderConfig } from "@cdktf/provider-vsphere/lib/provider";
import 'dotenv/config'

import { readFileSync } from "fs";
import { join } from "path";
import { NullProvider } from "@cdktf/provider-null/lib/provider";
import { Resource } from "@cdktf/provider-null/lib/resource";
import { VirtualMachine } from "@cdktf/provider-vsphere/lib/virtual-machine";
import { albProvisioner, dnsProvisioner } from "./essentialsProvisioners";

export class Essentials extends TerraformStack {
  public tmpIsoFolder: string
  
  constructor(scope: Construct, id: string, vsphereProviderData: VsphereProviderConfig ,clusterData: ClusterData, hostData : HostData[], ) {
    super(scope, id);
    
    new VsphereProvider(this, 'vsphere',vsphereProviderData)
    new NullProvider(this, 'iso-manager-null' ,{})
    
    this.tmpIsoFolder='.iso-temp'

    const essentialsTerraformRes: ITerraformResource[] = []
    const nodes = ['dns','alb']

    nodes.map(node => {
      let thisHostData =  Math.floor(Math.random() * (nodes.length + 1) )
      const vm: ITerraformResource =  new VirtualMachine(this,`Essentials-${node}`,{
        name: `okd-${node}${node=='dns'?'+helper':''}`,
        memory: 1024*2,
        numCpus: 2,
        guestId: "fedora64Guest",
        datacenterId: clusterData.datacenter.id,
        datastoreId: hostData[thisHostData].datastore.id,
        resourcePoolId: hostData[thisHostData].resourcePool.id,
        hostSystemId: hostData[thisHostData].hostSystemId.id,
        networkInterface : [
          {
            networkId: clusterData.network.id,
          }
        ],
        disk: [{
          label: "disk0",
          size: 20,
          thinProvisioned: true,
          datastoreId: hostData[thisHostData].datastore.id
        }],
        
        folder: process.env.vsphereDatacenterFolder,
        
        ovfDeploy: {
          allowUnverifiedSslCert: true,
          remoteOvfUrl: process.env.fedoraOVA,
          diskProvisioning: "thin",
          ipProtocol: "IPV4",
          ipAllocationPolicy: "STATIC_MANUAL",
          ovfNetworkMap: {
            "Network 1": clusterData.network.id
          }
        },
        waitForGuestIpTimeout: 40,
        vapp: {
          properties: {
            "guestinfo.ignition.config.data.encoding" : "base64",
            "guestinfo.ignition.config.data" : readFileSync(join(__dirname,"ignitions", `${node}.ign`)).toString('base64'),
          }
        },
        connection: {
          type: 'ssh',
          user: process.env.essentialsUser,
          password: process.env.essentialsPsw,
          host: node == 'dns' ? process.env.dnsNode || '' : process.env.albNode || ''
        },
        provisioners: node == 'dns' ? dnsProvisioner : albProvisioner 
      })
      
      essentialsTerraformRes.push(vm)
    })

    new Resource(this, 'iso_download',{
      provisioners: [
        {
          type: 'local-exec',
          command: `node utility_scripts/isoDownload.mjs ${this.tmpIsoFolder}` ,
          workingDir: __dirname
        },
      ],
      dependsOn: essentialsTerraformRes
    })
  }
}