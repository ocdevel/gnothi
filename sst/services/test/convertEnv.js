import fs from 'fs'
const input = fs.readFileSync('.env.json', 'utf8')
const json = JSON.parse(input)
const vars = json[Object.keys(json)[0]]
const content = Object.keys(vars)
  .map(key => `${key}=${vars[key]}`)
  .join('\n')
console.log(content)

fs.writeFileSync('.env.test.local', content)

