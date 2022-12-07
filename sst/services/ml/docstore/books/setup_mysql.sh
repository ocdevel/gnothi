# 1. Download a catalog from https://libgen.is/dbdumps/
wget https://libgen.is/dbdumps/libgen.rar


# 2. Unzip
sudo apt install -y unrar
unrar e libgen_2022-11-10.rar
mkdir -p db
mv libgen.sql db

# 3. Import data into mysql
docker-compose up -d

# 4. Convert to weaviate
pip3 install -r requirements.txt

# wait a bit, libgen import can take 1h
#cd .. && python3 to_weaviate.py
