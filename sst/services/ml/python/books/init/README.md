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

 # run steps to cache intermediate 
python3 books/to_pandas.py  # ~1h
python3 books/to_embeddings.py  # ~2h 
python3 books/to_weaviate.py  # ~1h
```
