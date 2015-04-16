IIZP2010G1
==========

Student Group 1 : Ryhmä Ygönen

=INSTALL=

Install Vagrant from http://vagrantup.com and, if not already installed, Oracle VirtualBox.

Open terminal, browse to the desired location and type
$ git clone https://github.com/N4SJAMK/IIZP2010G1.git <ENTER>

Give credentials if asked for. Browse to the newly created IIZP2010G1 folder
$ cd IIZP2010G1

and type
$ vagrant up

This starts the Vagrant procedure where the Ubuntu disc image is downloaded, virtual box is started and all necessary packages are installed. When told Vagrant is ready and up, type
$ vagrant ssh
to start ssh connection to Vagrant virtual computer. Type
$ cd admin
$ npm install
$ npm start
to install/update Node packages and start the NodeJS server. If you see something like
"listening to port 8080" or sorts, you are ready to launch your browser and head to http://localhost:8080 to see the admin panel (user is *adm1n* and pass *iz7heBestest*).
