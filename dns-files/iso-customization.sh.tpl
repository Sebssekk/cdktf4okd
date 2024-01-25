#!/bin/bash
set -x

mkdir -p /home/okd/iso_customization
cd /home/okd/iso_customization

# Base ignition
cat << EOF >> base.bu
variant: fcos
version: 1.5.0
storage:
  links:
    - path: /etc/localtime
      target: ../usr/share/zoneinfo/${TZ}
  files:
    - path: /etc/NetworkManager/system-connections/${interface}.nmconnection
      mode: 0600
      contents:
        inline: |
          [connection]
          id=${interface}
          type=ethernet
          interface-name=${interface}
          [ipv4]
          address1=IP/${prefix},${gateway}
          dns=${dns_host};  
          dns-search=${domain}
          may-fail=true
          method=manual
    - path: /etc/coreos/installer.d/custom.yaml
      contents:
        inline: |
          dest-device: /dev/sda
          insecure-ignition: true
          copy-network: true
          ignition-url: http://${dns_host}:8000/ROLE.ign
EOF

# Masters ignition files
nm=0
for node in %{for addr in master_addrs ~} ${addr} %{ endfor ~}; do
  sed -e "s/IP/$${node}/" -e "s/ROLE/master/" base.bu > master$${nm}.bu

  butane < master$${nm}.bu > install-master$${nm}.ign
  nm=$((nm+1))
done

# Workers ignition files
nw=0
for node in %{for addr in worker_addrs ~} ${addr} %{ endfor ~}; do
  sed -e "s/IP/$${node}/" -e "s/ROLE/worker/" base.bu > worker$${nw}.bu

  butane < worker$${nw}.bu > install-worker$${nw}.ign
  nw=$((nw+1))
done

# Bootstrap ignition file
sed -e "s/IP/${bootstrap_addr}/" -e "s/ROLE/bootstrap/" base.bu > bootstrap0.bu

butane < bootstrap0.bu > install-bootstrap0.ign


# ISO Customization
#wget $(/home/okd/openshift-install coreos print-stream-json | jq '.architectures.x86_64.artifacts.metal.formats.iso.disk.location' -r) \
#-O base-fedora.iso
wget ${fedoraISO} -O base-fedora.iso



customizeIso(){
    coreos-installer iso ignition embed -i install-$${1}.ign -o /home/okd/okd_installation_dir/$${1}.iso base-fedora.iso
    echo $${1}.iso >> /home/okd/okd_installation_dir/okd-iso-image.list
}

for ign in $(ls | grep -E '^install-.+\.ign$')
do
node=$(echo $ign | cut -d '.' -f 1 |  cut -d '-' -f 2)
customizeIso $node &
done

iso_num=$((nm+nw+1))
complete=$(cat /home/okd/okd_installation_dir/okd-iso-image.list | wc -w )
attempt=0
while [ $complete -ne $iso_num ]
do
  if [ $attempt -gt 120 ]
  then
    break
  fi
  attempt=$((attempt+1))
  complete=$(cat /home/okd/okd_installation_dir/okd-iso-image.list | wc -w )
  sleep 20
done

