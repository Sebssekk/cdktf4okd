import { ITerraformResource, TerraformStack} from 'cdktf'
import { Construct } from "constructs";
import { VsphereProvider, VsphereProviderConfig } from "@cdktf/provider-vsphere/lib/provider";
import { ClusterData, HostData } from "./main";
import { File } from '@cdktf/provider-vsphere/lib/file';
import { VirtualMachine } from '@cdktf/provider-vsphere/lib/virtual-machine';
import { Resource } from '@cdktf/provider-null/lib/resource';
import { NullProvider } from '@cdktf/provider-null/lib/provider';


export class OkdCluster extends TerraformStack {
    constructor(scope: Construct, id: string, vsphereProviderData: VsphereProviderConfig, clusterData: ClusterData, hostsData: HostData[],tmpIsoFolder: string){
        super(scope,id);

        new VsphereProvider(this,'vsphere',vsphereProviderData)
        new NullProvider(this, 'wait-install-null' ,{})

        const master: string[] = process.env.masterNodes?.split(',') || []
        const worker: string []= process.env.workerNodes?.split(',') || []
        const bootstrap : string[] = [process.env.bootstrapNode || ''] 
        const okdNodes: {[role:string]: string[] } = {master,worker,bootstrap}

        const okdTerraformRes: ITerraformResource[] = []
        let nodeCounter: number = 0
        for (let role in okdNodes){
          for(let i=0 ; i< okdNodes[role].length; i++){
            nodeCounter+=1
            let thisHostData = (nodeCounter) % hostsData.length
            
            const isoFile = new File(this, `iso-image-${role}${i}`,{
              sourceFile: `${__dirname}/${tmpIsoFolder}/${role}${i}.iso`,
              datastore: hostsData[thisHostData].datastore.name,
              destinationFile: `ISO/${role}${i}.iso`,
              datacenter: clusterData.datacenter.name
            })

            const vm = new VirtualMachine(this,`okd-${role}${i}`,{        
              name: `okd-${role}${i}`,
              memory: role == 'worker'? 1024*8 :1024*16,
              numCpus: role == 'worker'? 2 :4,
              guestId: "fedora64Guest",
              datastoreId: hostsData[thisHostData].datastore.id,
              resourcePoolId: hostsData[thisHostData].resourcePool.id,
              hostSystemId: hostsData[thisHostData].hostSystemId.id,
              enableDiskUuid: true,
              cdrom : [{
                datastoreId : hostsData[thisHostData].datastore.id,
                path: isoFile.destinationFile 
              }],
              networkInterface : [
                {
                  networkId: clusterData.network.id,
                }
              ],
              disk: [
                {
                  label: "disk0",
                  size: 110,
                  thinProvisioned: true,
                  datastoreId: hostsData[thisHostData].datastore.id,
                },
                ...process.env.secondDiskOnOkdNodes=='yes' ? [{
                  label: "disk1",
                  size: 20,
                  thinProvisioned: true,
                  unitNumber: 1,
                  datastoreId: hostsData[thisHostData].datastore.id,
                }] : []
              ],
              waitForGuestIpTimeout: 90,
              folder: process.env.vsphereDatacenterFolder,
            })
            okdTerraformRes.push(vm)
          }
        }

        const removeBootstrap = new Resource(this, "wait-bootstrap-resource",{
          provisioners: [
            {
              type: 'remote-exec',
              inline: [
                '/home/okd/openshift-install --dir /home/okd/okd_installation_dir wait-for bootstrap-complete',
              ],
              connection:{
                type: 'ssh',
                user: process.env.essentialsUser,
                password: process.env.essentialsPsw,
                host:  process.env.dnsNode || ''
              }
            },
            {
              type: 'remote-exec',
              inline: [
                `sudo sed -i '/backup/c \\' /etc/haproxy/haproxy.cfg && sudo systemctl restart haproxy`,
              ],
              connection:{
                type: 'ssh',
                user: process.env.essentialsUser,
                password: process.env.essentialsPsw,
                host:  process.env.albNode || ''
              }
            },
            {
              type: 'local-exec',
              command: 'node utility_scripts/poweroffBootstrap.mjs',
              workingDir: __dirname
            }
          ],
          dependsOn: okdTerraformRes
        })

        const waitInstall = new Resource(this, "wait-install-resource",{
          connection: {
            type: 'ssh',
            user: process.env.essentialsUser,
            password: process.env.essentialsPsw,
            host:  process.env.dnsNode || ''
          },
          provisioners: [
            {
              type: 'remote-exec',
              inline: [
                '/home/okd/openshift-install --dir /home/okd/okd_installation_dir wait-for install-complete'
              ]
            },
          ],
          dependsOn: [removeBootstrap]
        })

        new Resource(this, "post-install-addons",{
          connection: {
            type: 'ssh',
            user: process.env.essentialsUser,
            password: process.env.essentialsPsw,
            host:  process.env.dnsNode || ''
          },
          provisioners: [
            {
              type: 'remote-exec',
              inline: [
                // Fix Registry
                // Using an Empty Dir for image registry -> consider to change with PVC for a production deployment
                `/home/okd/oc --kubeconfig /home/okd/okd_installation_dir/auth/kubeconfig patch configs.imageregistry.operator.openshift.io cluster --type merge --patch '{"spec":{"storage":{"emptyDir":{}}}}'`,
                `/home/okd/oc --kubeconfig /home/okd/okd_installation_dir/auth/kubeconfig patch  configs.imageregistry/cluster --type merge --patch '{"spec":{"managementState": "Managed"}}'`,
                // Add all operator sources (Red Hat too)
                `/home/okd/oc --kubeconfig /home/okd/okd_installation_dir/auth/kubeconfig patch  OperatorHub/cluster --type merge --patch '{"spec": {"disableAllDefaultSources": false,"sources": [{"disabled": false,"name": "redhat-operators"},{"disabled": false,"name": "certified-operators"},{"disabled": false,"name": "community-operators"},{"disabled": false,"name": "redhat-marketplace"}]}}'`
              ]
            },
            {
              type: 'local-exec',
              command: 'node utility_scripts/kubeAuthDownload.mjs',
              workingDir: __dirname
            },
            {
              type: 'remote-exec',
              inline: [
                // Stop Autocert and http serving
                'sudo systemctl stop ignition-server',
                'sudo systemctl disable ignition-server',
                'sudo systemctl stop cert-approve',
                'sudo systemctl disable cert-approve',
              ]
            },
            {
              type: 'local-exec',
              command: `rm -r ${tmpIsoFolder}`,
              workingDir: __dirname
            },
            {
              type: 'local-exec',
              command: `node -e 'console.log(\`####################################################################
              [!] For a complete implementation you should add at least
              ---> A CSI for storage resources 
              --- (For a DEV/TEST approach try RedHat LVM operator from OperatorHub)
              
              ---> A LoadBalancer solution 
              --- (For a DEV/TEST approach try MetalLB operator from OperatorHub )
              
              ---> User management
              --- (For a DEV/TEST approach try htpasswd file approach)\`
              )'`
            }
          ],
          dependsOn: [waitInstall]
        })
          
    }

}