;
; BIND reverse data file for local loopback interface
;
$TTL    604800
@       IN      SOA     ns.${domain}. admin.${domain}. (
                              3         ; Serial
                         604800         ; Refresh
                          86400         ; Retry
                        2419200         ; Expire
                         604800 )       ; Negative Cache TTL
; name-server
        IN      NS      ns.okd.klabs.it.
; PTR records
${dns_host_rev}  IN      PTR     ns.okd.klabs.it.
%{for index,rev_addr in master_rev_addrs ~}
${rev_addr}   IN      PTR     master${index}.${cluster_name}.${domain}.
%{ endfor ~}
%{for index,rev_addr in worker_rev_addrs ~}
${rev_addr}   IN      PTR     worker${index}.${cluster_name}.${domain}.
%{ endfor ~}
${bootstrap_rev_addr}   IN      PTR     bootstrap.${cluster_name}.${domain}.
${alb_rev_addr}   IN      PTR     api.${cluster_name}.${domain}.
${alb_rev_addr}  IN      PTR     api-int.${cluster_name}.${domain}.
