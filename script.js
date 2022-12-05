'use strict';
const index = {
  timer: 100,
  ready_count: 0,
  last_q: null,
  categories: ["articles", "gallery", "films", "music"],
  load_indices: function() { get_index_of(this.categories) },
  Errs: {
    Ind404: class Ind404 {
  		constructor(msg) {
  			this.name = `ind404`
        this.message = msg
  		}
    }
  }
}
function get_index_of(array) {
  for (let str of array) {
    $.getJSON(`/${str}/list.json`, function(data) {
      index[str] = data
      index.ready_count++
    })
  }
}

function ajaxA(e, a) {
  e.preventDefault()
  let url = null
  if (a.attr('href') !== undefined) { url = a.attr('href') }
  else if (a.attr('data-href') !== undefined) { url = a.attr('data-href') }
  else { console.log("no href") }

  history.pushState({}, "", url)
  goto_hash_or_ajax()
}

window.addEventListener('popstate', (e) => {
  goto_hash_or_ajax()
})

function goto_hash_or_ajax() {
  let parsed_path = document.location.pathname
  if (parsed_path === index.last_q) {
    parseFragment()
  } else {
    index.last_q = parsed_path
    try {
      find_page_from_index()
    }
    catch (e) {
      if (e instanceof index.Errs.Ind404) {
        console.error(e.message)
        layout_404(document.location.pathname, {status:"404", statusText:"error"}, $(`#main`))
      } else { throw e }
    }
  }
}

function find_page_from_index() {
  if (index.ready_count === index.categories.length) {
    index.timer = 100
    $(`#nav .text`).removeClass(`current-page`)

    let path = document.location.pathname
    path = path.split("/")
    if (path.length === 2) {
      switch (path[1]) {
        case "":
          layout_home()
          break
        case "gallery":
        case "gallery.html":
          layout_gallery()
          break
        case "films":
        case "films.html":
          layout_films()
          break
        case "articles":
        case "articles.html":
          layout_articles()
          break
        case "music":
        case "music.html":
          layout_music()
          break
        default:
          throw new index.Errs.Ind404(`not found in index`)
      }
    }
    else if ( path.length === 3 && is_indexed(path) ) {
      if (just_landed || path[1] === `music`) {
        layout_item(path)
      }
      else {
        let path_to_main = `${document.location.pathname} #main`
        queued_content = $(`<div>`).load(path_to_main, function( response, status, xhr ) {
          if ( status === "error" ) { layout_404(document.location.pathname, xhr, $(`#main`)) }
          else {
            queued_content = $(`#main`, queued_content.get(0)).html()
            layout_item(path)
          }
        })
      }
    }
    else {
      throw new index.Errs.Ind404(`not found in index`)
    }
    just_landed = false
  }
  else {
    console.log("index not ready, trying again later")
    index.timer = index.timer*2
    setTimeout(function(){ find_page_from_index() }, index.timer)
  }

  function layout_item(path) {
    switch (path[1]) {
      case "articles":
        layout_articles_item(path[2])
        break
      case "gallery":
        layout_gallery_item(path[2])
        break
      case "films":
        layout_films_item(path[2])
        break
      case "music":
        layout_music(path[2])
        break
      default:
        throw new Error
    }
  }
}
function is_indexed(path) {
  let filename = path[2].split(`.html`)[0]
  if (!index[path[1]]) { return false }
  for (let file of index[path[1]]) {
    if (file.path === filename) { return true }
  }
  return false
}

function parseFragment() {
  if (typeof location.hash !== 'undefined' && location.hash !== '') {
    let id = location.hash.split('#')[1]
    function tryScroll(id) {
      try {
        document.getElementById(id).scrollIntoView({behavior: "smooth"})
      } catch (e) {
        //console.log("no such id: "+id);
      }
    }
    let arg = id.split('=')[1]
    id = id.split('=')[0]
    let ol_on = false
    switch (id) {
      case 'comments':
        setTimeout(function(){ tryScroll(id); }, 2000)
        break;
      case 'full_image':
        ol_on = true
        showImgOverlay(arg)
        break;
      default:
        tryScroll(id)
    }
    if (!ol_on) {
      $(`#ol`).removeClass(`active`)
    }
  } else {
    $(`#ol`).removeClass(`active`) //turn off ol if there is no hash, as ol should only be on with #full_image
  }
}
function showImgOverlay(path) {
  $(`#ol img`).remove()
  $(`#ol`).append(`
      <img src="/img/full/${path}" alt="Click for details">
  `);
  $(`#ol`).addClass(`active`)
}

function layout_404(resource, xhr, div) {
  let msg = `<br>Unable to load "${resource}".`
  $(div).html(`
    <div class="base-container error">
    ${msg} <br><br> ${xhr.status}: ${xhr.statusText}<br>
    <img src="/img/site/hbar.gif" class="hbar">
    </div>
  `)
}

function layout_nav() {
  $("#nav .btn").prepend('<div class="btn-bg-dark"></div><div class="btn-bg-light"></div>')
  $('#nav .btn').hover(
    function() {
      $( this ).children(".btn-bg-dark").stop(true,false).fadeTo(100,0)
      $( this ).children(".btn-bg-light").stop(true,false).fadeTo(100,1)
    },
    function() {
      $( this ).children(".btn-bg-dark").stop(true,false).fadeTo(200,1)
      $( this ).children(".btn-bg-light").stop(true,false).fadeTo(300,0)
    }
  )
  $(`.close_ol`).click( function(e) {e.preventDefault(); history.back()} )
}

function layout_home() {
  update_title_in_head(`KunliZhan.com`)
  $(`#btn-home`).addClass(`current-page`)
  $(`#main`).html(`<div class="feed newsfeed"></div>`)
  //get new items from each category
  let max_display = 6
  let categories = index.categories
  let combined = [] //create proxy array to track which category each item is from while exposing date for sorting
  categories.forEach( (cat) => combined = combined.concat(make_item_list_with_category_labels(index[cat], cat)) )
  function make_item_list_with_category_labels(item_list, category) {
    let items = item_list.sort(sort_reverse_date).slice(0, max_display)
    let return_list = []
    items.forEach( (i) => return_list.push({category: category, item: i, date: i.date}) )
    return return_list
  }
  combined = combined.sort(sort_reverse_date).slice(0, max_display)
  combined.forEach(item => $(`#main > .newsfeed`).append(make_Thumb_for_Home(item)) )
}

function layout_gallery() {
  update_title_in_head(`Gallery`)
  $(`#btn-gallery`).addClass(`current-page`)
  $(`#main`).html(`<div id="art-vp" class="gallery"></div>`)
  let by_date_reverse = index.gallery.sort(sort_reverse_date)
  populateArtVP(by_date_reverse)
}

function layout_films() {
  update_title_in_head(`Films`)
  $(`#btn-films`).addClass(`current-page`)
  $(`#main`).html(`<div id="art-vp" class="feed films"></div>`)
  let by_date_reverse = index.films.sort(sort_reverse_date)
  by_date_reverse.forEach(item => $(`#main > #art-vp`).append(make_Thumb_for_Film(item)) )
}

function layout_articles() {
  update_title_in_head(`Articles`)
  $(`#btn-articles`).addClass(`current-page`)
  $(`#main`).html(`<div class="feed newsfeed"></div>`)
  let by_date_reverse = index.articles.sort(sort_reverse_date)
  by_date_reverse = by_date_reverse.slice(0, 6)
  by_date_reverse.forEach(item => append_to_feed_article(item))

}

function layout_articles_item(path) {
  $(`#main`).html(`
    <div class="post-wrap">
      <div class="post base-container"><div class="content"> Loading ... </div></div>
      <div id="comments" class="base-container"> Loading Comments. This uses 3rd-party cookies.</div>
    </div>
  `);
  let div = $(`#main > .post-wrap > .post > .content`)

  div.html(queued_content)

  process_article_div({div: div, path: path})
}

function get_index_item(folder, path) {
  path = path.split(".")[0]
  for (let obj of index[folder]) {
    if (obj.path == path) {
      return obj
    }
  }
  return null
}

function process_article_div({div, path, isThumb=false}) {
  let article = get_index_item("articles", path)
  let title = article.title

  div.prepend(
    `
    <div class="metainfo center-children">
      <div class="metaitem">
        <i class="fas fa-calendar-check" aria-hidden="true"></i> ${format_toDateString(article.date)}
      </div>
      <div class="metaitem">
        <i class="fas fa-clock" aria-hidden="true"></i>
        Reading time: <div class="eta"></div>
      </div>
    </div>
    <br>
    `
  );
  if (isThumb) {
    //for thumb, make title a link
    div.prepend(`<h1><a href="/articles/${path}.html#top" class="ajaxA">${title}</a></h1><hr>`)
  } else {
    //for full post, make title and insert into metainfo a link to comments
    div.prepend(`<h1>${title}</h1><hr>`)
    update_title_in_head(`${title}`)
    $(`.metainfo`).append(`
      <div class="metaitem">
      <a href="#comments" id="goto-comments">
        <i class="fas fa-comments" aria-hidden="true"></i>
        <span class="fb-comments-count" data-href="https://kunlizhan.com/articles/${path}"></span>
        <span class="text">Comments</span>
      </a>
      </div>
    `)
    //Comments
    load_comments();
  }
  div.readingTime({
    readingTimeTarget: div.find(".eta"),
  })
}

function layout_gallery_item(path) {
  let item = get_index_item("gallery", path)

  let title = item.title
  let desc = ``
  if (typeof item.desc !== 'undefined' && item.desc !== '') {
    desc = item.desc
  }
  $('#main').html(`
    <div class="show-wrap">
      <div class="base-container show-title">
        <h1>${title}</h1>
        <hr>
        <div class="metainfo center-children">
          <div class="metaitem">
            <i class="fas fa-calendar-check" aria-hidden="true"></i> ${format_toDateString(item.date)}
          </div>
        </div>
      </div>
      <div class="base-container show-media">
        <a href="#full_image=${item.full}">
          ${queued_content}
        </a>
      </div>
      <div class="base-container show-desc">
        <span>${desc}</span><hr>
        <div class="tags metainfo"><span>Tags: </span></div>
      </div>
      <div id="comments" class="base-container"> Loading Comments. This uses 3rd-party cookies.</div>
    </div>
  `)
  for (let tag of item.tags) {
    $(`.show-desc > .tags`).append(`<div class="tag">${tag}</div>`);
  }
  load_comments()
  update_title_in_head(`${title}`)
}

function layout_films_item(path) {
  let item = get_index_item("films", path)
  $(`#main`).html(`
    <div class="post-wrap">
      <div class="post base-container">
        <div class="content">
          <br>
          ${queued_content}
          <img src="/img/site/hbar.gif" class="hbar">
          <h1>${item.title}</h1>
          <hr>
          <div class="metainfo center-children">
            <div class="metaitem">
              <i class="fas fa-calendar-check" aria-hidden="true"></i> ${format_toDateString(item.date)}
            </div>
          </div>
          <br>
          ${item.desc}
        </div>
      </div>
      <div id="comments" class="base-container"> Loading Comments. This uses 3rd-party cookies.</div>
    </div>
  `)
  load_comments()
  update_title_in_head(item.title)
}

function make_Thumb_for_Home(item_date_category) {
  let thumb = null
  let cat = item_date_category.category
  let thumb_maker = Thumb_Makers[cat]
  return thumb_maker(item_date_category.item)
}

const Thumb_Makers = {
  articles: append_to_feed_article,
  gallery: make_Thumb_for_Home_Gallery,
  films: make_Thumb_for_Film,
  music: thumbTest,
}

function thumbTest(item) {
  console.log(`making thumb for ${item.path}`)
}

function make_Thumb_for_Home_Gallery(item) {
  let path_to_show = `/gallery/${item.path}.html#top`
  let newPost = `
    <div class="post-thumb base-container art-item ajaxA" data-href="${path_to_show}">
      <img src="/img/full/${item.full}" class="art-item"/>
    </div>
  `
  return newPost
}

function populateArtVP(array) {
  // attempt at making 2 columns at smallest break point
  let parity = 0
  let imgClass = "even"
  for (const item of array) {
    if (parity == 0) {
      imgClass = "even"
    } else {
      imgClass = "odd"
    }
    parity = (parity + 1) % 2
    let path_to_show = `/gallery/${item.path}.html#top`
    let newPost = `
      <a href="${path_to_show}" class="ajaxA">
        <img src="/img/full/${item.full}" class="art-item ${imgClass}"/>
      </a>
    `
    $(`#main > #art-vp`).append(newPost)
  }
}

function append_to_feed_article(article) {
    let newPost = `
      <div class="post-thumb base-container">
        <div class="content"></div>
        <div class="readMore">
          <div>
          <a href="/articles/${article.path}.html#top" class="ajaxA">
          <i class="fas fa-file-alt" aria-hidden="true"></i> Full article</a>
           &emsp14; &emsp14;
          <a href="/articles/${article.path}.html#comments" class="ajaxA">
          <i class="fas fa-comments" aria-hidden="true"></i> Comments</a>
          </div>
        </div>
      </div>
    `;
    $(`#main > div`).append(newPost);
    let div = $(`#main > div > .post-thumb:last-child > .content`)
    let loader_div = $(`<div>`).load(`/articles/${article.path}.html #main`, function( response, status, xhr ) {
      if ( status === "error" ) { layout_404(article.path, xhr, div.parent()) }
      else {
        let loader_data = $(`#main`, loader_div.get(0)).html()
        div.html(loader_data)
        process_article_div({div: div, path: article.path, isThumb: true}) }
    })
}

function make_Thumb_for_Film(item) {
  let path_to_show = `/films/${item.path}.html#top`
  let newPost = `
      <div class="post-thumb base-container art-item film-item ajaxA" data-href="${path_to_show}">
        <div class="thumb-wrapper">
          <img src="/img/thumb/${item.thumb}"/>
          <div class="badge duration-badge">${get_time_string(item.duration*1000)}</div>
        </div>
        <div class="content">
          <h1>${item.title}</h1>
          <hr>
          <div class="metainfo center-children">
            <div class="metaitem">
              <i class="fas fa-calendar-check" aria-hidden="true"></i> ${format_toDateString(item.date)}
            </div>
          </div>
          <br>
          <div class="desc">${item.desc}</div>
        </div>
      </div>
  `
  return newPost
}

function sort_reverse_date(a, b) {
  let a_date = Date.parse(a.date)
  let b_date = Date.parse(b.date)
  return b_date - a_date
}

function format_toDateString(date) {
    let unixEpochNumber = Date.parse(date) //ISO 8601 to unix epoch
    let dateUnix = new Date(unixEpochNumber) //number to date object
    return dateUnix.toDateString()
}

function update_title_in_head(title) {
  $(`title`).html(`${title} | Kunli Zhan`)
}

function load_comments() {
  let w = $(`#comments`).width();
  if (320 > w ) {
    w = "100%"
  } else if ( w > 550) {
    w = 550;
  }
  $(`#comments`).html(`
    <div class="metainfo center-children">Comments from <i class="fab fa-facebook-square" aria-hidden="true"></i> Facebook (requires 3rd party cookies)</div>
    <div class="fb-comments"
      data-href="https://kunlizhan.com/${document.location.pathname}"
      data-numposts="5"
      data-width="${w}"
      data-colorscheme="light"
      data-lazy="true"
      data-order-by="time"></div>
    `)
  try { FB.XFBML.parse(document.getElementById('main'))
  }
  catch (err) {
    if (err.message !== "FB is not defined") { throw err }
  }
}
/* Music */
function layout_music(item) {
  function layout_music_player(item) {
    $(`#main`).html(`
      <div class="base-container"><i class="fas fa-circle-notch fa-spin"></i> Loading Music...</div>
    `)
    let list = music_player.list
    if (!Object.is(list, null)) {
      update_title_in_head(`Music`)
      $(`#btn-music`).addClass(`current-page`)
      let playlist = ""
      for (let track of list) {
        playlist = playlist+ `
        <a href="/music/${track.path}.html" class="ajaxA">
          <div class="track">
              <span class="title">${track.title}</span>
              <span class="duration">${get_time_string(track.duration)}</span>
          </div>
        </a>
        `
      }
      $(`#main`).html(`
        <div id="music-page" class="newsfeed">
          <div id="song-container" class="base-container">
            <div id="wave-container">
              <svg id="waveform"
                version="1.1"
                baseProfile="full"
                xmlns="http://www.w3.org/2000/svg">
              </svg>
              <div class="wave-ol">
                <i class="fas fa-circle-notch fa-spin"></i> Loading Info...
              </div>
              <span id="music-time-now">0:00</span>
              <span id="music-btn-toggle"><i class="fas fa-play"></i></span>
              <span id="music-time-end">total time</span>
            </div>
            <div id="song-info" class="content"></div>
          </div>
          <div id="playlist" class="base-container">
            ${playlist}
          </div>
        </div>
      `)
      $(`#music-btn-toggle`).click( music_player.toggle.bind(music_player) )
      $("body").on( "click", ".wave-seek", function() {
        $(this).siblings().removeClass(`wave-playhead`)
        $(this).addClass(`wave-playhead`)
        music_player.scw.seekTo($(this).attr(`data-seek`))
      } )
      layout_song(item)
    }
    else {
      console.log("music_player not ready, trying again later")
      index.timer = index.timer*2
      setTimeout(function(){ layout_music_player(item) }, index.timer)
    }
  }
  function layout_song(item) {
    let target = undefined
    if (typeof item === "string") {
      item = item.split(`.html`)[0]
      for (let t of music_player.list) {
        if (t.path === item) {
          target = t
          music_player.goto(music_player.list.indexOf(target))
          break
        }
      }
    }
    else if (music_player.current_track !== null) {
      target = music_player.list[music_player.current_track]
    }
    else {
      target = music_player.list[0]
    }
    music_player.current_track = music_player.list.indexOf(target)
    music_player.sync_btn_is_ready ? music_player.sync_btn() : music_player.sync_btn_is_ready = true //disable first sync because browser will forbid auto start of audio

    $.getJSON(target.wave, function(data) {
      let scale = 2
      let count = 0
      let all_points = data.samples.length
      let samples = ( ($(`#waveform`).width()-2)/(scale*2) )
      let max_h = $(`#waveform`).height()
      let peaks = ``
      for (let i=0; i<samples; i++) {
        let n = Math.trunc(i*all_points/samples)
        let h = data.samples[n]/data.height*max_h
        let ms = Math.trunc(i*target.duration/samples)
        //if (data.samples[n]/data.height > 1) { console.log(data.samples[n]) }
        peaks = peaks
          +`<g class="wave-seek" data-seek="${ms}" >`
            +`<rect class="wave-peak" width="${1*scale}" height="${h}" x="${i*scale*2}" y="${max_h-h}" />`
            +`<rect width="${1*scale}" height="${h}" x="${(i*scale*2)+2}" y="${max_h-h}" />`
          +`</g>`
        count++
      }
      $(`#waveform`).html(peaks)
      $(`#waveform *:first-child`).addClass(`wave-playhead`)
      $(`#waveform`).siblings(`.wave-ol`).addClass(`displayNone`)
      $(`#music-time-end`).html(get_time_string(target.duration))
    })
    $(`#song-info`).html(`
      <h1>${target.title}</h1>
      <hr>
      <div class="metainfo center-children">
        <div class="metaitem">
          <i class="fas fa-calendar-check" aria-hidden="true"></i> ${format_toDateString(target.date)}
        </div>
        <div class="metaitem">
          <a href="https://soundcloud.com/kunli-zhan/${target.path}" target="_blank"><i class="fab fa-soundcloud"> </i>Soundcloud</a>
        </div>
      </div>
      <div class="show-desc">
        <span>${target.desc}</span><br><br>
        <div class="tags metainfo"><span>Tags: </span></div>
      </div>
    `)
    for (let tag of target.tags) {
      $(`#song-info .tags`).append(`<div class="tag">${tag}</div>`);
    }
  }
  console.log($(`#song-container`).length)

  if ($(`#song-container`).length) {
    layout_song(item)
  }
  else { layout_music_player(item) }
}
const music_player = {
  scw: undefined,
  list: null,
  current_track: null,
  auto_next: false,
  wave_color: [null,null],
  wave_synced: false,
  sync_btn_is_ready: false,
  init: function() {
    function filter_list(raw_list) {
      let list = []
      for (let t of raw_list) {
        let picked = {
          title: t.title,
          date: t.release_date.split(`T`)[0],
          tags: t.tag_list.split(` `),
          path: t.permalink,
          desc: t.description,
          img: t.artwork_url,
          duration: t.duration,
          wave: t.waveform_url,
        }
        list.push(picked)
      }
      this.list = list
    }
    function on_play(msg) {
      function update_current_track(index) {
        this.current_track = index
      }
      scw.getCurrentSoundIndex(update_current_track.bind(this))
      console.log(`playing ${this.current_track}`)
    }
    function on_finish(msg) {
      console.log(`finished`)
      if (this.auto_next === false) {
        this.scw.pause()
        this.goto(this.current_track)
        this.scw.pause()
        $(`#music-btn-toggle`).html(`<i class="fas fa-undo-alt"></i>`)
        console.log(`auto_next is off`)
      }
      reset_progress()
    }
    function on_play_progress(msg) {
      $(`#music-time-now`).html(get_time_string(msg.currentPosition))
      this.sync_progress(msg.currentPosition)
    }
    function reset_progress() {
      $(`#waveform .wave-playhead`).removeClass(`wave-playhead`)
      $(`#waveform .wave-seek:first-child`).addClass(`wave-playhead`)
    }
    let scw = this.scw
    scw.getSounds(filter_list.bind(this))
    scw.bind(SC.Widget.Events.PLAY, on_play.bind(this))
    scw.bind(SC.Widget.Events.FINISH, on_finish.bind(this))
    scw.bind(SC.Widget.Events.PLAY_PROGRESS, on_play_progress.bind(this))
  },
  toggle: function() {
    this.scw.toggle()
    this.sync_btn()
  },
  goto: function(n) { this.scw.skip(n); this.scw.seekTo(0); },
  sync_btn: function() {
    this.scw.isPaused(function(is_paused) {
      if (is_paused) {
        $(`#music-btn-toggle`).html(`<i class="fas fa-play"></i>`)
        console.log(`button set to play`)
      } else {
        $(`#music-btn-toggle`).html(`<i class="fas fa-pause"></i>`)
        console.log(`button set to pause`)
      }
    })
  },
  sync_progress: function (ms) {
    if ($(`#song-container`).length) {
      if (this.wave_synced) {
        let next_playhead = $(`#waveform .wave-playhead + .wave-seek`)
        let next_ms = next_playhead.attr(`data-seek`)
        let last_playhead = $(`#waveform .wave-playhead`)
        let last_ms = last_playhead.attr(`data-seek`)
        $(`#waveform .wave-peak`).css(`fill`, ``)
        if ( ms < next_ms ) {
          if (this.wave_color[0] === null) {
            this.wave_color[0] = rgb_parse($(`#waveform .wave-playhead`).children(`.wave-peak`).css(`fill`))
            this.wave_color[1] = rgb_parse($(`#waveform .wave-playhead + .wave-seek`).children(`.wave-peak`).css(`fill`))
          }
          let percent_to_next = (ms-last_ms)/(next_ms-last_ms)
          next_playhead.children(`.wave-peak`).css(`fill`, rgb_tween(percent_to_next) )
          //console.log(next_playhead.children(`.wave-peak`).css(`fill`))
        }
        else {
          last_playhead.removeClass(`wave-playhead`)
          next_playhead.addClass(`wave-playhead`)
          next_ms = $(`#waveform .wave-playhead + .wave-seek`).attr(`data-seek`)
          if (ms > next_ms) {
            this.wave_synced = false
          }
        }
      }
      else {
        $(`#waveform g`).each(function() {
          let this_ms = $(this).attr(`data-seek`)
          if (this_ms > ms) {
            $(`#waveform .wave-playhead`).removeClass(`wave-playhead`)
            $(this).prev().addClass(`wave-playhead`)
            return false
          }
        })
        this.wave_synced = true
      }
    }
  },
  Err: {
    MusicErr: class MusicErr {
  		constructor(msg) {
  			this.name = `MusicErr`
        this.message = msg
  		}
    }
  }
}
function get_time_string(ms) {
  if (ms > 3600000 || typeof ms !== "number") {throw new music_player.Err.MusicErr(`duration invalid`)}
  let n = ms
  function div_n(divisor) {
    n = Math.trunc(n/divisor)
  }
  div_n(1000) //to seconds
  let sec = n % 60
  sec = sec.toString().padStart(2, "0")
  div_n(60) //to minutes
  let min = n
  min = min.toString()
  return `${min}:${sec}`
}
function rgb_parse(string) {
  string = string.split(`rgb(`)[1]
  string = string.split(`)`)[0]
  string = string.split(`, `)
  let rgb = {}
  for (let d in string) { rgb[d] = Number(string[d]) }
  return rgb
}
function rgb_tween(percent) {
  let c0 = music_player.wave_color[0]
  let c1 = music_player.wave_color[1]
  let r = {}
  for (let d in c0) {
    let range = c0[d]-c1[d]
    r[d] = c1[d]+percent*range
    //r[d] = Math.trunc((c0[d]+c1[d])/2)
  }
  //return `rgb(255, 0, 0)`
  return `rgb(${r[0]}, ${r[1]}, ${r[2]})`
}

$.getScript( "https://w.soundcloud.com/player/api.js")
  .fail(function( data, textStatus, jqxhr ) {
    console.log(`Soundcloud API failed to load`)
    //layout_404(`Soundcloud API`, xhr, $(`#main`))
  })
  .done(function( data, textStatus, jqxhr ) {
    $(`body`).append(`<iframe id="sc-widget" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1094860567&color=%234444cc&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=false"></iframe>`)
    let scw = music_player.scw = SC.Widget('sc-widget')
    scw.bind(SC.Widget.Events.READY, function() {
      music_player.init()
    })
  })

var queued_content = null
var just_landed = true
$( document ).ready(function() {
  //console.log("Ready, location: " + document.location.pathname);
  index.load_indices()
  //index.last_q = document.location.pathname
  queued_content = $("#main").html() //saves the page's content
  $("body").load("/common.html", function() {
    layout_nav()
    goto_hash_or_ajax()
  })
  $(`body`).on("click", ".ajaxA", function(e) {ajaxA(e, $(this))} )
})
