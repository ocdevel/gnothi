# Welcome to Gnothi on GitHub!

Hello there, seekers of self-knowledge! We're excited to introduce Gnothi, a journal and toolkit that uses AI to help you introspect and find resources.

Gnothi, rooted in the ancient aphorism "Know thyself", is an open-source project designed to guide your self-discovery journey. As an AI-assisted journal and toolkit, Gnothi helps you identify patterns and themes in your life, analyze your dreams, track habits, and even connect you with resources such as book recommendations. It also allows you to share entries with friends or therapists, fostering a supportive environment for growth and change.

Our approach blends traditional practices like journaling and behavior tracking with AI-driven insights to highlight areas of opportunity for learning and personal growth. While we don't claim to replace therapy or offer medical advice, thousands of individuals have found value in using Gnothi as part of their self-improvement journey.

We're passionate about the potential of AI to enrich our understanding of ourselves and our lives, and we believe in the power of open-source to make this technology accessible and evolving. That's where you come in! We invite you to contribute to Gnothi's codebase, helping us refine our tools and broaden the impact of this project.

Whether you're a seasoned developer or just getting started, we welcome your input. So, come join us on this exciting journey of self-discovery and tech innovation. Let's work together to make Gnothi the best it can be!

The journey of a thousand miles begins with a single commit. Happy coding!


* Summaries: AI summarizes your entries, your week, your year.
* Themes: AI shows your recurring themes & issues. Also valuable for dream themes.
* Books: AI recommends self-help books based on your entries.
* Security: All text is industry-standard encrypted.
* Field Tracking (lots to be done here): Track fields (mood, sleep, substance intake, etc). AI shows you how they interact and which ones to focus on.
* Share (coming soon): Share journals with therapists, who can use all these tools to catch up since your last session.
* Questions (coming soon): Ask AI anything about yourself. The answers and insights may surprise you.

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
    * Quickstart by extracting https://gnothiai.com/libgens.zip to /storage/libgen/*. Each file starts with <ENVIRONMENT>, so replace with "testing" or "development" or such.
    * If you're not interested in books development, you can stop now. Below is how to generate those libgen files.
    * Install MySQL server on your host
    * Download [libgen/dbdumps/libgen.rar](http://gen.lib.rus.ec/dbdumps/), extract, improt into MySQL
    * Modify `common/config.json` for MySQL/libgen
* Install Docker & docker-compose [with GPU support](https://ocdevel.com/blog/20201207-wsl2-gpu-docker)
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
