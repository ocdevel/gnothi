from insights import main

#pytest -rP


event = {
    'search': "Who is Arya Stark's father?"
}
res = main(event, {})
