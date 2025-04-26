mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

There are two important files

## /etc/nginx/sites-enabled
It is a directory.
It contains a link file 'default'
lrwxrwxrwx 1 root root 34 Feb 15 15:59 default -> /etc/nginx/sites-available/default

## /etc/nginx/sites-available
It is a directory. 
It contains direct files. 
total 4
-rw-r--r-- 1 root root 2412 Aug 19  2024 default

# Creation of New Virtual Host

Example for bus
### Create a 
nano /etc/nginx/sites-available/bus.vnrzone.site.conf


### Create Symbolic link
ln -s /etc/nginx/sites-available/bus.vnrzone.site.conf /etc/nginx/sites-enabled/

