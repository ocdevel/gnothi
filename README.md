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

## Setup
Currently very hairy, will clean this up soon.

* Install Postgres & MySQL servers on your host. Currently not using Docker, as I'm constantly pruning and I want to keep my data between sessions (and use the same SQL hosts for other projects).
* `cp common/config.example.json common/config.json` and modify
* Install Docker & docker-compose [with GPU support](https://github.com/docker/compose/issues/6691#issuecomment-670700674). If on Windows, you'll need [WSL2 + Dev channel](https://medium.com/@dalgibbard/docker-with-gpu-support-in-wsl2-ebbc94251cf5)
* `docker-compose up -d`

You'll likely want to `pip install -e` some helper modules during development, since they'll be in active development side-by-side.

```
mkdir tmp && pushd tmp
git clone https://github.com/lefnire/lefnire_ml_utils.git
popd
docker-compose exec gpu-dev
$ pip install -e tmp/lefnire_ml_utils
```

Note: docker-compose.yml, production deploy, will go away soon as I move to ECS & S3

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
