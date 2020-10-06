# keep production_all.df, it'll be the main source of everything                                                                                             sudo chown -R lefnire:lefnire .
\cp testing_all.npy production_all.npy
\cp testing_all.min.npy production_all.min.npy
\cp -r testing_all.tf production_all.tf
rm -rf testing_all.tf testing_all.min.npy testing_all.npy
ln -s production_all.npy testing_all.npy
ln -s production_all.min.npy testing_all.min.npy
ln -s production_all.tf testing_all.tf

zip libgens.zip production_all.tf production_all.min.npy production_all.df
