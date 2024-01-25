import jinja2
import sys

def main(args):
    filename = args[1]
    folder = args[2]
    args = args[3:]
    data = {a.split('=')[0]:a.split('=')[1] for a in args} 
  
    environment = jinja2.Environment(loader=jinja2.FileSystemLoader("."))
    template =  environment.get_template(f"{folder}/ignition.bu.j2")
    ign = template.render(data=data)
    with open(f'ignitions/{filename}.bu','w') as f:
        f.write(ign)
main(sys.argv)

# python ignitions/rendered.py dns domain=okd.klabs.it dns_host=10.0.0.118 gateway=10.0.0.1 prefix=16 interface=ens192