from fixtures import docs
from insights import main

#pytest -rP
print(len(docs))
res = main({}, {})
