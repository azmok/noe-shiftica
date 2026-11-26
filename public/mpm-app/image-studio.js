(function () {
  'use strict'

  var get = function (id) { return document.getElementById(id) }
  var dialog = get('imageStudio')
  var settings = get('imageKeySection')
  var work = get('imageWork')
  var message = get('imageMessage')
  var prompt = get('imagePrompt')
  var location = get('imageLocation')
  var alt = get('imageAlt')
  var history = get('imageHistory')
  var preview = get('imagePreview')
  var generate = get('imageGenerate')
  var adopt = get('imageAdopt')
  var close = get('imageClose')
  var keyInput = get('imageKey')
  var article, queue, stage, candidate, busy

  async function api(path, data) {
    var options = { credentials: 'same-origin', cache: 'no-store' }
    if (data) {
      options.method = 'POST'
      options.headers = { 'Content-Type': 'application/json', 'X-MPM-Request': '1' }
      options.body = JSON.stringify(data)
    }
    var response = await fetch('/api/mpm/' + path, options)
    var result = await response.json().catch(function () { return {} })
    if (!response.ok) throw new Error(result.message || '通信に失敗しました。もう一度お試しください')
    return result
  }

  function lock(value) {
    busy = value
    generate.disabled = value
    adopt.disabled = value || !candidate
    close.disabled = value
    get('imageKeySave').disabled = value
    get('imageCount').disabled = value
    get('imageSkip').disabled = value
    get('imageKeyChange').disabled = value
    prompt.disabled = value
    location.disabled = value
  }

  function showSettings(status, editing) {
    get('imageKeyStatus').textContent = status.configured
      ? '接続キーを設定済み' + (status.hint ? '（' + status.hint + '）' : '')
      : 'OpenAI API キーを登録してください'
    settings.hidden = status.configured && !editing
    work.hidden = !stage || !status.configured || editing
    get('imageKeyChange').hidden = !status.configured || editing
    if (!settings.hidden) keyInput.focus()
  }

  function showStage() {
    stage = queue.shift()
    if (!stage) {
      dialog.close()
      return
    }
    candidate = null
    preview.hidden = true
    preview.removeAttribute('src')
    history.replaceChildren()
    alt.value = ''
    prompt.value = ''
    adopt.disabled = true
    generate.textContent = '画像を生成'
    get('imageStage').textContent = stage.kind === 'hero'
      ? 'ヒーローイメージ'
      : '本文画像 ' + stage.number + ' / ' + stage.total
    get('imageLocationField').hidden = stage.kind === 'hero'
    get('imageAltField').hidden = stage.kind === 'hero'
    location.replaceChildren()
    if (stage.kind === 'body') {
      var sections = article.sections()
      sections.forEach(function (section, index) {
        location.add(new Option(section.label, String(index)))
      })
      location.selectedIndex = Math.min(stage.number - 1, sections.length - 1)
    }
    get('imagePlan').hidden = !stage.allowCount
    message.textContent = '作りたい画像の雰囲気や、入れたい要素を入力してください。'
  }

  function plan(mode, count) {
    var steps = mode === 'body' ? [] : [{ kind: 'hero', allowCount: mode === 'both' }]
    if (mode !== 'hero') {
      for (var i = 1; i <= count; i++) {
        steps.push({ kind: 'body', number: i, total: count, allowCount: mode === 'body' && i === 1 })
      }
    }
    return steps
  }

  async function open(mode, selectedArticle) {
    if (dialog.open) return
    article = selectedArticle
    queue = mode === 'settings' ? [] : plan(mode, 3)
    stage = null
    candidate = null
    keyInput.value = ''
    settings.hidden = true
    work.hidden = true
    get('imageKeyChange').hidden = true
    get('imageCount').value = '3'
    get('imageKeyStatus').textContent = '設定を確認しています…'
    message.textContent = ''
    dialog.showModal()
    lock(true)
    try {
      if (queue.length) showStage()
      showSettings(await api('image-settings'), mode === 'settings')
    } catch (error) {
      get('imageKeyStatus').textContent = error.message
    } finally { lock(false) }
  }

  get('imageCount').addEventListener('change', function () {
    var count = Number(this.value)
    if (stage.kind === 'hero') {
      queue = plan('body', count)
      queue[0].allowCount = false
    } else {
      queue = plan('body', count)
      stage.total = count
      queue.shift()
      get('imageStage').textContent = '本文画像 1 / ' + count
    }
  })

  get('imageKeyChange').addEventListener('click', function () {
    showSettings({ configured: true }, true)
  })

  get('imageKeySave').addEventListener('click', async function () {
    if (busy) return
    var key = keyInput.value.trim()
    if (!key) { message.textContent = 'OpenAI API キーを入力してください。'; return }
    lock(true)
    message.textContent = 'キーを保存しています…'
    try {
      var status = await api('image-settings', { key: key })
      keyInput.value = ''
      showSettings(status, false)
      message.textContent = stage ? '設定できました。画像の指示を入力してください。' : 'キーを保存しました。'
      if (stage) prompt.focus()
    } catch (error) {
      message.textContent = error.message
    } finally { lock(false) }
  })

  location.addEventListener('change', function () {
    if (!candidate) return
    message.textContent = '挿入位置を変更しました。この画像を採用するか、指示を入力して調整できます。'
  })

  generate.addEventListener('click', async function () {
    if (busy || !stage) return
    var direction = prompt.value.trim()
    if (!direction) { message.textContent = '作りたい画像や変更したい箇所を入力してください。'; prompt.focus(); return }
    var section = stage.kind === 'body' ? article.sections()[Number(location.value)] : null
    var previous = candidate && candidate.image
    lock(true)
    message.textContent = previous ? '前の画像を調整しています…' : '画像を生成しています…'
    try {
      var result = await api('images', {
        kind: stage.kind, prompt: direction, context: article.context(section), previous: previous || undefined,
      })
      var version = { image: result.image, direction: direction }
      var option = document.createElement('button')
      option.type = 'button'
      option.textContent = '案 ' + (history.children.length + 1) + ' · ' + direction
      option.addEventListener('click', function () { if (!busy) select(version, option) })
      history.appendChild(option)
      select(version, option)
      prompt.value = ''
      message.textContent = '気に入ったら採用できます。変更点を入力すると、この案をもとに調整します。'
    } catch (error) {
      message.textContent = error.message
    } finally { lock(false) }
  })

  function select(version, option) {
    candidate = version
    preview.src = 'data:image/webp;base64,' + version.image
    preview.hidden = false
    Array.from(history.children).forEach(function (button) {
      button.setAttribute('aria-pressed', String(button === option))
    })
    generate.textContent = 'この案を調整'
  }

  adopt.addEventListener('click', function () {
    if (busy || !stage || !candidate) return
    var section = stage.kind === 'body' ? article.sections()[Number(location.value)] : null
    var description = alt.value.trim()
    if (section && !description) {
      message.textContent = '画像の内容が伝わる短い説明を入力してください。'
      alt.focus()
      return
    }
    try {
      article.adopt(stage.kind, section, description, candidate.image)
      showStage()
    } catch (error) { message.textContent = error.message }
  })

  get('imageSkip').addEventListener('click', function () { if (!busy) showStage() })
  close.addEventListener('click', function () { if (!busy) dialog.close() })
  dialog.addEventListener('cancel', function (event) { if (busy) event.preventDefault() })
  dialog.addEventListener('close', function () {
    keyInput.value = ''
    article = null
    stage = null
    candidate = null
    queue = []
    history.replaceChildren()
    preview.removeAttribute('src')
  })

  window.NoeImageStudio = { open: open }
})()
