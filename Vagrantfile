Vagrant.configure("2") do |config|

    config.vm.provider "virtualbox" do |v|
        v.memory = 1024
        v.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate//v-root", "1"]
    end

    config.vm.define "timbotrusty64" do |timbotrusty64|
        timbotrusty64.vm.box = "timbotrusty64"
        timbotrusty64.vm.hostname = "timbotrusty64"
        timbotrusty64.vm.network "private_network", ip: "10.1.1.10"
        timbotrusty64.vm.provision "shell", inline: <<-SHELL
                apt-get update

                echo "*** Install Curl & build-essentials"
                sudo apt-get install -y curl
                sudo apt-get install -y build-essentials

                echo "*** Install node and npm"
                curl --silent --location https://deb.nodesource.com/setup_10.x | sudo bash -
                sudo apt-get install -y nodejs

                echo "*** Installing NPM dependencies"
                cd /vagrant
                npm install

                echo "*** Start Service"
                npm run start
            SHELL
    end
end

