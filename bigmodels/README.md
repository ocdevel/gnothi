If you set TORCH_HOME to /bigmodels (ie in docker-compose.yml):
1. Can keep this folder around between docker builds, save time
2. Can move /bigmodels up a dir & share between projects
3. Can mount it in cloud & save Docker exec times
