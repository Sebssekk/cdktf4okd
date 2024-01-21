global
  log         127.0.0.1 local2
  pidfile     /var/run/haproxy.pid
  maxconn     4000
  daemon
defaults
  mode                    http
  log                     global
  option                  dontlognull
  option http-server-close
  option                  redispatch
  retries                 3
  timeout http-request    10s
  timeout queue           1m
  timeout connect         10s
  timeout client          1m
  timeout server          1m
  timeout http-keep-alive 10s
  timeout check           10s
  maxconn                 3000
listen api-server-6443 
  bind *:6443
  mode tcp
  server bootstrap bootstrap.${cluster_name}.${domain}:6443 check inter 1s backup
%{for index,addr in master_addrs ~}
  server master${index} master${index}.${cluster_name}.${domain}:6443 check inter 1s
%{ endfor ~} 
listen machine-config-server-22623 
  bind *:22623
  mode tcp
  server bootstrap bootstrap.${cluster_name}.${domain}:22623 check inter 1s backup 
%{for index,addr in master_addrs ~}
  server master${index} master${index}.${cluster_name}.${domain}:22623 check inter 1s
%{ endfor ~} 
listen ingress-router-443 
  bind *:443
  mode tcp
  balance source
%{for index,addr in worker_addrs ~}
  server worker${index} worker${index}.${cluster_name}.${domain}:443 check inter 1s
%{ endfor ~}
listen ingress-router-80 
  bind *:80
  mode tcp
  balance source
%{for index,addr in worker_addrs ~}
  server worker${index} worker${index}.${cluster_name}.${domain}:80 check inter 1s
%{ endfor ~}