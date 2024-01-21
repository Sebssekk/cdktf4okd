import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import {  
  dataVsphereDatacenter, 
  dataVsphereDatastore, 
  dataVsphereResourcePool, 
  dataVsphereHost,
  dataVsphereNetwork } from "@cdktf/provider-vsphere";
import { Essentials } from "./essentials";
import { VsphereProvider, VsphereProviderConfig } from "@cdktf/provider-vsphere/lib/provider";
import 'dotenv/config'
import { OkdCluster } from "./okd-cluster";

export interface ClusterData {
  datacenter : dataVsphereDatacenter.DataVsphereDatacenter,
  network : dataVsphereNetwork.DataVsphereNetwork,
}
export interface HostData {
  datastore : dataVsphereDatastore.DataVsphereDatastore,
  resourcePool : dataVsphereResourcePool.DataVsphereResourcePool,
  hostSystemId : dataVsphereHost.DataVsphereHost,
}

class MyStack extends TerraformStack {
  public vspherePoviderData: VsphereProviderConfig;
  public clusterData : ClusterData;
  public hostsData : {[name: string]:HostData};

  constructor(scope: Construct, id: string, hostsDatastoreMap: {[hostIp: string ]:string} ) {
    super(scope, id);

    // Vsphere Provider

    this.vspherePoviderData = {
      user: process.env.user || '',
      password: process.env.password || '',
      vsphereServer: process.env.vsphereServer,
      allowUnverifiedSsl: true
    }
     
    new VsphereProvider(this, 'vsphere', this.vspherePoviderData)

    // Data Datacenter
    const kdc : dataVsphereDatacenter.DataVsphereDatacenter = new dataVsphereDatacenter.DataVsphereDatacenter(this,`datacenter${process.env.vsphereDatacenter}`,{
      name: process.env.vsphereDatacenter
    })

    // Chosen Network
    const network : dataVsphereNetwork.DataVsphereNetwork = new dataVsphereNetwork.DataVsphereNetwork(this, 'DCNetwork', {
      name: process.env.vlan || 'VM NETWORK',
      datacenterId: kdc.id
    })

    this.clusterData = {
      datacenter : kdc,
      network: network,
    }
    this.hostsData = Object.fromEntries(Object.entries(hostsDatastoreMap).map(([hip,ds]) => [
      hip,
      {
        datastore: new dataVsphereDatastore.DataVsphereDatastore(this, `datastoreOnHost${hip}`,{
          name: ds,
          datacenterId: kdc.id
        }),
        resourcePool: new dataVsphereResourcePool.DataVsphereResourcePool(this, `resourcePoolOnHost${hip}`, {
          name: `${hip}/Resources`,
          datacenterId: kdc.id
        } ) ,
        hostSystemId: new dataVsphereHost.DataVsphereHost(this, `host${hip}`, {
          name: hip,
          datacenterId: kdc.id
        }) ,
      }
    ]))
  }
}



const vsphereNodes = Object.keys(process.env).filter(env => env.match('^vsphereNode\\d$'))
const chosenHostsDatastore: {[hostIp: string ]:string} = {}
for (const node of vsphereNodes) {
  chosenHostsDatastore[process.env[node] || ''] = process.env[node+"Datastore"] || ''
}

console.log('### Chosen Host:Datastore for deployment ->')
console.log(chosenHostsDatastore)

const app = new App();

const main = new MyStack(app, "okd_cdktf", chosenHostsDatastore);

const essentialsStack = 
  new Essentials(app,"essentials",main.vspherePoviderData,main.clusterData,Object.values(main.hostsData))
const okdClusterStack =  
  new OkdCluster(app,'okdcluster',main.vspherePoviderData,main.clusterData,Object.values(main.hostsData), essentialsStack.tmpIsoFolder)
okdClusterStack.addDependency(essentialsStack)

app.synth();

// start with
// $ cdktf deploy '*' --auto-approve
