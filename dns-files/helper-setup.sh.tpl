#!/bin/bash
set -x
# Generate SSH Key
ssh-keygen -t ed25519 -N '' -f /home/okd/key 
eval "$(ssh-agent -s)"
ssh-add /home/okd/key 
# Get utils
wget -qO - ${openshiftInstall} | tar -xz -C /home/okd
wget -qO - ${OCcli} | tar -xz -C /home/okd
#Prepare Installation DIR
mkdir -p /home/okd/okd_installation_dir
cp /home/okd/key /home/okd/okd_installation_dir/okd-node-key
mv /home/okd/okd-install.yaml /home/okd/okd_installation_dir/install-config.yaml
sed -i 's,{{ key }},'"$(cat /home/okd/key.pub)"',' /home/okd/okd_installation_dir/install-config.yaml
sed -i 's/\,/\\,/g' /home/okd/pull-secret.txt && sed -i 's,{{ pull_secret }},'"$(cat /home/okd/pull-secret.txt)"',' /home/okd/okd_installation_dir/install-config.yaml
/home/okd/openshift-install create manifests --dir /home/okd/okd_installation_dir
sed -i 's/mastersSchedulable: true/mastersSchedulable: false/' /home/okd/okd_installation_dir/manifests/cluster-scheduler-02-config.yml
# Change the TZ
for role in master worker ; do
cat << EOF >> /home/okd/okd_installation_dir/openshift/99_openshift-machineconfig_99-$${role}-tz.yaml
apiVersion: machineconfiguration.openshift.io/v1
kind: MachineConfig
metadata:
  creationTimestamp: null
  labels:
    machineconfiguration.openshift.io/role: $role
  name: 99-$${role}-tz
spec:
  config:
    ignition:
      version: 3.2.0
    storage:
      links:
        - path: /etc/localtime
          target: ../usr/share/zoneinfo/${TZ}
  extensions: null
  fips: false
  kernelArguments: null
  kernelType: ""
  osImageURL: ""
EOF
done
/home/okd/openshift-install create ignition-configs --dir /home/okd/okd_installation_dir
# HTTP Server to exposer ignition files
sudo mv /home/okd/ignition-server.service /etc/systemd/system/
sudo restorecon -RFv /etc/systemd/system/ignition-server.service
# Cert-approve service to approve node certs
sudo mv /home/okd/cert-approve.service /etc/systemd/system/
sudo restorecon -RFv /etc/systemd/system/cert-approve.service
sudo mv /home/okd/cert-approve.sh /opt/
chmod +x /opt/cert-approve.sh
sudo chcon -Rv -u system_u -t bin_t /opt/cert-approve.sh
# Enabling & starting services
sudo systemctl daemon-reload
sudo systemctl enable ignition-server
sudo systemctl start ignition-server
sudo systemctl enable cert-approve
sudo systemctl start cert-approve
echo "HELPER READY"