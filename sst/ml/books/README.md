## TODO: turn this into a Dockerfile

Download a catalog from https://libgen.is/dbdumps/
```shell
wget https://libgen.is/dbdumps/libgen.rar
```

Unzip
```shell
sudo apt install -y unrar
unrar e libgen.rar
mkdir -p db
mv libgen.sql db
```

Start MySQL
```shell
docker-compose up -d
```

**Wait for import to finish, some 15min**

Then convert to Weaviate:

```shell
pip3 install -r requirements.txt
cd .. # needed for __init__ access to vectors 
python3 books/to_pandas.py # run separately to cache intermediate
python books/to_weaviate.py
```
