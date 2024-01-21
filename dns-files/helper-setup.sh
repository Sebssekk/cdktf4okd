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
/home/okd/openshift-install create ignition-configs --dir /home/okd/okd_installation_dir
sudo mv /home/okd/ignition-server.service /etc/systemd/system/
sudo restorecon -RFv /etc/systemd/system/ignition-server.service
sudo mv /home/okd/cert-approve.service /etc/systemd/system/
sudo restorecon -RFv /etc/systemd/system/cert-approve.service
sudo mv /home/okd/cert-approve.sh /opt/
chmod +x /opt/cert-approve.sh
sudo chcon -Rv -u system_u -t bin_t /opt/cert-approve.sh
sudo systemctl daemon-reload
sudo systemctl enable ignition-server
sudo systemctl start ignition-server
sudo systemctl enable cert-approve
sudo systemctl start cert-approve
echo "HELPER READY"