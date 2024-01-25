#!/bin/bash
set -x

sudo systemctl enable named
sudo mv /home/okd/db.* /var/named/
sudo mv /home/okd/named.* /etc/
sudo chown root:named /etc/named.conf
sudo restorecon -RFv /etc/named.conf
sudo chown root:named /etc/named.conf.local
sudo restorecon -RFv /etc/named.conf.local
sudo chown root:named /var/named/db.${network}
sudo restorecon -RFv /var/named/db.${network}
sudo chown root:named /var/named/db.${domain}
sudo restorecon -RFv /var/named/db.${domain}
sudo nmcli con mod ${interface} ipv4.dns "${dns_host}"
sudo nmcli con up ${interface}
sudo systemctl restart named
chmod +x /home/okd/dns-check.sh
/home/okd/dns-check.sh > /home/okd/dns-check-result.txt
echo "DNS READY"