//
// Do any local configuration here
//
// Consider adding the 1918 zones here, if they are not used in your
// organization
//include "/etc/bind/zones.rfc1918";
zone "${domain}" {
        type master;
        file "db.${domain}";
};
zone "${revNetwork}.in-addr.arpa" {
        type master;
        file "db.${network}";
};