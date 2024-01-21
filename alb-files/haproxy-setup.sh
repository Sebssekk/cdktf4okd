#!/bin/bash
set -x
sudo nmcli con mod ${interface} ipv4.dns "${dnsNode}"
sudo nmcli con up ${interface}
sudo systemctl enable haproxy
sudo mv /home/okd/haproxy.cfg /etc/haproxy/haproxy.cfg
sudo chown root:root /etc/haproxy/haproxy.cfg
sudo restorecon -RFv /etc/haproxy/haproxy.cfg
sudo setsebool -P haproxy_connect_any=1 

# Set the maximum number of attempts
max_attempts=30

# Set a counter for the number of attempts
attempt_num=1

# Set a flag to indicate whether the command was successful
success=false

# Loop until the command is successful or the maximum number of attempts is reached
while [ $success = false ] && [ $attempt_num -le $max_attempts ]; do
  # Execute the command
  sudo systemctl restart haproxy
  # Check the exit code of the command
  if [ $? -eq 0 ]; then
    # The command was successful
    success=true
  else
    # The command was not successful
    echo "Attempt $attempt_num failed. Trying again..."
    # Increment the attempt counter
    attempt_num=$(( attempt_num + 1 ))
    sleep 5
  fi
done