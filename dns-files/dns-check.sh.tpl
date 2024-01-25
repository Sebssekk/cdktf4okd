#!/bin/bash
set -x

dig +noall +answer @${dns_host} api.${cluster_name}.${domain}
dig +noall +answer @${dns_host} api-int.${cluster_name}.${domain}
dig +noall +answer @${dns_host} random.apps.${cluster_name}.${domain}
dig +noall +answer @${dns_host} console-openshift-console.apps.${cluster_name}.${domain}
dig +noall +answer @${dns_host} bootstrap.${cluster_name}.${domain}
dig +noall +answer @${dns_host} -x ${alb_addr}
dig +noall +answer @${dns_host} -x ${bootstrap_addr}