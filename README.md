# Gnōthi Seauton: Know Thyself
A journal that uses AI to help you introspect and find resources.

* Summaries: AI summarizes your entries, your week, your year.
* Themes: AI shows your recurring themes & issues. Also valuable for dream themes.
* Questions: Ask AI anything about yourself. The answers and insights may surprise you.
* Books: AI recommends self-help books based on your entries.
* Field Tracking: Track fields (mood, sleep, substance intake, etc). AI shows you how they interact and which ones to focus on.
* Share: Share journals with therapists, who can use all these tools to catch up since your last session.
* Security: All text is industry-standard encrypted.
* Future: The sky's the limit with BERT language models! Astrology? Dream analysis?

# Setup
Currently very hairy, will clean this up soon.

### Essentials
* Install Postgres. Currently not using Docker, as I'm constantly pruning and I want to keep my data between sessions (and use the same SQL hosts for other projects).
* `cp common/config.example.json common/config.json` and modify
* Install Docker & docker-compose
* `docker-compose up -d`
* If you get errors with `gpu-dev`, try `docker-compose up -d client && docker-compose up -d server` (then see section below)

### To use AI
* The client & server should run without the AI stuff, for a while, but you'll want to get this working eventually.
* Libgen
    * TODO: this part should be optional - don't use books unless libgen present. Someone PR me? 
    * Install MySQL server on your host
    * Download [libgen/dbdumps/libgen.rar](http://gen.lib.rus.ec/dbdumps/), extract, improt into MySQL
    * Modify `common/config.json` for MySQL/libgen
* Install docker-compose [with GPU support](https://github.com/docker/compose/issues/6691#issuecomment-670700674). If on Windows, you'll need [WSL2 + Dev channel](https://medium.com/@dalgibbard/docker-with-gpu-support-in-wsl2-ebbc94251cf5)
* `docker-compose up -d`

I'll be developing lefnire/ml-tools actively along with Gnothi, so on my machine it's setup like:

```
git clone https://github.com/lefnire/ml-tools.git  # might need to delete that folder first, if docker-compose created it
docker-compose exec gpu-dev
$ pip install -e /ml-tools
```

## Tests
First test GPU, which sets up fixtures. Then test server. Client tests sorely needed!

```
docker-compose exec gpu-dev bash
$ pytest tests -svv
$ # once it's done, you want to run it in another tab for your server tests
$ ENVIRONMENT=testing python app/run.py

docker-compose exec server bash
$ pytest tests -svv
```
