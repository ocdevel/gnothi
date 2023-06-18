# Welcome to Gnothi on GitHub!

Hello there, seekers of self-knowledge! We're excited to introduce Gnothi, a journal and toolkit that uses AI to help you introspect and find resources.

Gnothi, rooted in the ancient aphorism "Know thyself", is an open-source project designed to guide your self-discovery journey. As an AI-assisted journal and toolkit, Gnothi helps you identify patterns and themes in your life, analyze your dreams, track habits, and even connect you with resources such as book recommendations. It also allows you to share entries with friends or therapists, fostering a supportive environment for growth and change.

Our approach blends traditional practices like journaling and behavior tracking with AI-driven insights to highlight areas of opportunity for learning and personal growth. While we don't claim to replace therapy or offer medical advice, thousands of individuals have found value in using Gnothi as part of their self-improvement journey.

We're passionate about the potential of AI to enrich our understanding of ourselves and our lives, and we believe in the power of open-source to make this technology accessible and evolving. That's where you come in! We invite you to contribute to Gnothi's codebase, helping us refine our tools and broaden the impact of this project.

Whether you're a seasoned developer or just getting started, we welcome your input. So, come join us on this exciting journey of self-discovery and tech innovation. Let's work together to make Gnothi the best it can be!

The journey of a thousand miles begins with a single commit. Happy coding!


* Summaries: AI summarizes your entries, your week, your year.
* Themes: AI shows your recurring themes & issues. Also valuable for dream themes.
* Prompt: chat with your journal (TODO integrate local language models)
* Books: AI recommends self-help books based on your entries.
* Security: industry best practices
* Field Tracking (lots to be done here): Track fields (mood, sleep, substance intake, etc). AI shows you how they interact and which ones to focus on.
* Share (coming soon): Share journals with therapists, who can use all these tools to catch up since your last session.
* Questions (coming soon): Ask AI anything about yourself. The answers and insights may surprise you.

# Setup
This is an SST site (CDK, AWS). Which means even local development runs against an AWS stack. Normally that's awesome and cheap, but for Gnothi there's a VPC for security (private subnets and a NAT gateway), which is $30/mo min; and Aurora Serverless v2 Postgres, which is $40/mo min. So I need to figure out how to Dockerize the dev requirements for localhost development. In the mean time, if you see an opportunity for bugs/features in the code, take a stab at it and I'll integreate on my end. I'll beef up this README when I can get a viable local dev setup.

### Steps
* `docker-compose up -d`
* `cp .env .env.shared-prod` -> modify with your email
* `cp .env .env.dev` -> modify with your email 
* `AWS_PROFILE=<your profile> npm start`
* `cd web && npm start`