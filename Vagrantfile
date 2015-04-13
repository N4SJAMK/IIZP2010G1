Vagrant.configure("2") do |config|
	config.vm.box = "ubuntu/trusty64"

	config.vm.provision :shell, :path => "./bootstrap.sh"
	config.vm.network :forwarded_port, host: 8080, guest: 8080
	config.vm.network :forwarded_port, host: 1337, guest: 1337
	config.vm.synced_folder ".", "/home/vagrant/kokeiluboksi"
end
