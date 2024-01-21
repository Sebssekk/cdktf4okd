import 'dotenv/config'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
let res = await fetch(`https://${process.env.vsphereServer}/rest/com/vmware/cis/session`,{
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'vmware-api-session-id': null,
        'Authorization': 'Basic ' + btoa(`${process.env.user}:${process.env.password}`)
    },  
})
const sessionId = await res.json()

res = await fetch(`https://${process.env.vsphereServer}/api/vcenter/vm/`,{
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'vmware-api-session-id': sessionId.value,
    }, 
})

const vmList= await res.json()
const bootstrapVm = vmList.filter(vm => vm.name.match('^okd-bootstrap')) ? vmList.filter(vm => vm.name.match('^okd-bootstrap'))[0] : null

if (bootstrapVm){
    res = await fetch(`https://${process.env.vsphereServer}/api/vcenter/vm/${bootstrapVm.vm}/power`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'vmware-api-session-id': sessionId.value,
        },
    })

    const bootstrapVmPowerState = await res.json()

    if(bootstrapVmPowerState.state == "POWERED_ON"){
        console.log("#### Powering off Bootstrap Machine")
        await fetch(`https://${process.env.vsphereServer}/api/vcenter/vm/${bootstrapVm.vm}/power?action=stop`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'vmware-api-session-id': sessionId.value,
            },
        })

    }else {
        console.log("#### Bootstrap is already POWERED_OFF ####")
    }
}