var strategies = window.strategies ? window.strategies : []

var app = (function(){
  const converter = new showdown.Converter()

  const toHtml = (markdown) => converter.makeHtml(markdown)

  const reload = () => {
    const scriptTag = document.createElement('script')
    scriptTag.src = 'index.js'
    document.body.appendChild(scriptTag)
  }

  const query = (selector) => document.querySelector(selector)

  const item = (itemKey) => window.localStorage.getItem(itemKey)
  const store = (itemKey, s) => window.localStorage.setItem(itemKey, s)
  const load = () => {
    const apiKey = item('apiKey') | window.location.hash.slice(1)
    const systemPrompt = item('systemPrompt') | DEFAULT_STRATEGY_SYSTEM_PROMPT
    const userPrompt = item('userPrompt') | DEFAULT_STRATEGY_USER_PROMPT
    const judgeSystemPrompt = item('judgeSystemPrompt') | DEFAULT_JUDGE_SYSTEM_PROMPT
    const judgeUserPrompt = item('judgeUserPrompt') | DEFAULT_JUDGE_USER_PROMPT
    query('.apiKey').value = apiKey
    query('.systemPrompt').value = systemPrompt
    query('.userPrompt').value = userPrompt
    query('.judgeSystemPrompt').value = judgeSystemPrompt
    query('.judgeUserPrompt').value = judgeUserPrompt
  }
  const save = () => {
    store('apiKey', query('.apiKey').value)
    store('systemPrompt', query('.systemPrompt').value)
    store('userPrompt', query('.userPrompt').value)
    store('judgeSystemPrompt', query('.judgeSystemPrompt').value)
    store('judgeUserPrompt', query('.judgeUserPrompt').value)
  }

  const apiKey = () => query('.apiKey').value

  const get = (url, body) =>  {
    const headers = { 'Content-Type': 'application/json' }
    const opts = body ? { 'method': 'POST', headers, 'body': JSON.stringify(body) } : { 'method': 'GET' } 
    return fetch(`${url}?key=${apiKey()}`, opts ).then(e => e.json())
  }

  //const defaultModel = 'gemini-2.5-pro-exp-03-25' //'gemini-2.0-flash'
  const defaultModel = 'gemini-2.0-flash'
  const defaultConfig = {}

  const model = (model) => get(`https://generativelanguage.googleapis.com/v1beta/models/${model}`)
  const models = () => get(`https://generativelanguage.googleapis.com/v1beta/models`)
  const generate = async (userPrompt, systemPrompt, model=defaultModel, generationConfig=defaultConfig) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    const body = {
      'system_instruction': { 
        'parts': [{ 'text': systemPrompt }]
      },
      'contents': [{
        'parts': [{ 'text': userPrompt }]
       }],
       generationConfig
    }
    const response = await get(url, body)
    const answer = response.candidates[0].content.parts[0].text

    return answer 
  }

  const listModels = async () => {
    const m = await models()
    console.log(m)
  }

  const rank = async () => {
    const systemPrompt = query('.judgeSystemPrompt').value
    const userPrompt = query('.judgeUserPrompt').value.replace('$STRATEGIES', strategies.map((e, i) => `-----\nStrategy ${i + 1}\n${e}-----\n`).join('\n'))

    const answer = await generate(userPrompt, systemPrompt)
    query('div.ranked').innerHTML = '<hr>' + toHtml(answer)

    return query('.run').innerHTML = 'Go'
  }

  const DELAY = 500
  const objectives = ['Growth', 'Digital', 'Sustainable', 'Self-Service']
  const randomObjective = () => Math.floor(Math.random() * objectives.length)

  const turn = async (i) => {
    const objective = objectives[randomObjective()]
    const systemPrompt = query('.systemPrompt').value
    const userPrompt = query('.userPrompt').value + '\n Focus on the objective ' + objective
    const answer = await generate(userPrompt, systemPrompt)

    console.log(objective)

    strategies.push(answer)

    const el = document.createElement('DETAILS')
    el.innerHTML = `<summary>Strategy ${strategies.length}</summary>` + toHtml(answer)
    query('div.strategies').appendChild(el)

    if (i == 1) {
      return setTimeout(async () => rank(), DELAY) 
    }
    console.log(i)

    setTimeout(async () => turn(i - 1), DELAY)
  }

  const runGame = async (e) => {
    if (e) e.preventDefault()

    query('.run').innerHTML = 'Generating ...'
    query('div.ranked').innerHTML = ''

    const turns = parseInt(query('.turns').value)

    setTimeout(async () => turn(turns), 0)
  }

  query('.run').onclick = runGame

  if (!window.app) load()

  return { reload, load, save, query, apiKey, listModels, model, generate, runGame, rank, randomObjective }
})()
