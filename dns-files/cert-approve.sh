#!/bin/bash

while true; do /home/okd/oc --kubeconfig /home/okd/okd_installation_dir/auth/kubeconfig get csr -o go-template='{{range .items}}{{if not .status}}{{.metadata.name}}{{"\n"}}{{end}}{{end}}' | xargs --no-run-if-empty /home/okd/oc --kubeconfig /home/okd/okd_installation_dir/auth/kubeconfig adm certificate approve; sleep 300; done
