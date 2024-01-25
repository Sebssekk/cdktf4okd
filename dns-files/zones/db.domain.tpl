;
; BIND data file for local loopback interface
;
$TTL    604800
@       IN      SOA     ns.${domain}. admin.${domain}. (
                              3         ; Serial
                         604800         ; Refresh
                          86400         ; Retry
                        2419200         ; Expire
                         604800 )       ; Negative Cache TTL
;
; nameserver
        IN      NS      ns.${domain}.
; A records
ns.${domain}.   IN      A       ${dns_host}
%{for index,addr in master_addrs ~}
master${index}.${cluster_name}.${domain}.  IN      A       ${addr}
%{ endfor ~}
%{for index,addr in worker_addrs ~}
worker${index}.${cluster_name}.${domain}.  IN      A       ${addr}
%{ endfor ~}
bootstrap.${cluster_name}.${domain}.  IN      A       ${bootstrap_addr}
api.${cluster_name}.${domain}.  IN      A       ${alb_addr}
api-int.${cluster_name}.${domain}.  IN      A       ${alb_addr}
*.apps.${cluster_name}.${domain}.  IN      A       ${alb_addr}
*.ingress.${domain}.  IN      A       ${alb_addr}
helper.${cluster_name}.${domain}.  IN      A       ${alb_addr}
helper.${domain}.  IN      A       ${alb_addr}
