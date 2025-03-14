# ATARI Ops

This repositry regroups the configuration-as-code to provision, configure,
deploy and manage the EPFL's ATARI app. It uses [Ansible] wrapped in a
convenient [suitcase], called [`atarisible`](./atarisible).

All the "dev" code can be found in https://github.com/epfl-si/ATARI.


## Prerequisites

* Access to our [Keybase] `/keybase/team/epfl_atari/` directory.
* Access to `itsidevfsd0024` (staging) & `itsidevfsd0031` (prod) VMs.


## TL;DR

`./atarisible`

Setup the VM, install Docker, clone the code, manage secrets, configure Traefik,
run the containers.

Use `--prod` to do the same in the production environement.

Use `-t chore` to run `docker system prune` and truncate logs.


[Ansible]: https://www.ansible.com (Ansible is Simple IT Automation)
[suitcase]: https://github.com/epfl-si/ansible.suitcase (Install Ansible and its dependency stack into a temporary directory)
[github]: https://github.com/epfl-si/atari
[Keybase]: https://keybase.io
[//]: # "comment"
