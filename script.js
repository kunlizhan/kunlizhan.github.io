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
          layout_home()
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
  $("#nav .btn").prepend('<div class="btn-bg-dark"></div><div class="btn-bg-light"></div>');
  $("#nav a").click( function(e) {ajaxA(e, $(this));} );
  $(`.banner a`).click( function(e) {ajaxA(e, $(this));} );
  $('#nav .btn').hover(
    function() {
      $( this ).children(".btn-bg-dark").stop(true,false).fadeTo(100,0);
      $( this ).children(".btn-bg-light").stop(true,false).fadeTo(100,1);
    },
    function() {
      $( this ).children(".btn-bg-dark").stop(true,false).fadeTo(200,1);
      $( this ).children(".btn-bg-light").stop(true,false).fadeTo(300,0);
    }
  )
  $(`.close_ol`).click( function(e) {e.preventDefault(); history.back();} );
}

function layout_home() {
  update_title_in_head(`KunliZhan.com`)
  $(`#btn-home`).addClass(`current-page`)
  $(`#main`).html(`<div class="newsfeed"></div>`)
  let by_date_reverse = index.articles.sort(sort_reverse_date)
  by_date_reverse = by_date_reverse.slice(0, 6)
  populateFeed(by_date_reverse)
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
  $(`#main`).html(`<div id="art-vp" class="films"></div>`)
  let by_date_reverse = index.films.sort(sort_reverse_date)
  populateFilmVP(by_date_reverse)
}

function layout_music(item) {
  update_title_in_head(`Music`)
  $(`#btn-music`).addClass(`current-page`)
  let playlist = ""
  for (let track of index.music) {
    playlist = playlist+ `<div class="track"><h2>${track.title}</h2></div>`
  }
  $(`#main`).html(`
    <div id="playlist">
      ${playlist}
    </div>
    `)
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
      let newObj = obj
      let unixEpochNumber = Date.parse(newObj.date) //ISO 8601 to unix epoch
      newObj.dateUnix = new Date(unixEpochNumber) //number to date object
      return newObj
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
        <i class="fas fa-calendar-check" aria-hidden="true"></i> ${article.dateUnix.toDateString()}
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
    div.prepend(`<h1><a href="/articles/${path}.html#top">${title}</a></h1><hr>`);
    div.find(`h1 > a`).click( function(e) {ajaxA(e, $(this));} );
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

  let title = item.title;
  let date = new Date(Date.parse(item.date))
  let desc = ``;
  if (typeof item.desc !== 'undefined' && item.desc !== '') {
    desc = item.desc + `<hr>`;
  }
  $('#main').html(`
    <div class="show-wrap">
      <div class="base-container show-title">
        <h1>${title}</h1>
        <hr>
        <div class="metainfo center-children">
          <div class="metaitem">
            <i class="fas fa-calendar-check" aria-hidden="true"></i> ${date.toDateString()}
          </div>
        </div>
      </div>
      <div class="base-container show-media">
        <a href="#full_image=${item.full}">
          ${queued_content}
        </a>
      </div>
      <div class="base-container show-desc">
        <span>${desc}</span>
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
              <i class="fas fa-calendar-check" aria-hidden="true"></i> ${item.dateUnix.toDateString()}
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

function populateFeed(array) {
  for (let article of array) {
    let newPost = `
      <div class="post-thumb base-container">
        <div class="content"></div>
        <div class="readMore">
          <div>
          <a href="/articles/${article.path}.html#top">
          <i class="fas fa-file-alt" aria-hidden="true"></i> Full article</a>
           &emsp14; &emsp14;
          <a href="/articles/${article.path}.html#comments">
          <i class="fas fa-comments" aria-hidden="true"></i> Comments</a>
          </div>
        </div>
      </div>
    `;
    $(`#main > .newsfeed`).append(newPost);
    let div = $(`.newsfeed > .post-thumb:last-child > .content`)
    let loader_div = $(`<div>`).load(`/articles/${article.path}.html #main`, function( response, status, xhr ) {
      if ( status === "error" ) { layout_404(article.path, xhr, div.parent()) }
      else {
        let loader_data = $(`#main`, loader_div.get(0)).html()
        div.html(loader_data)
        process_article_div({div: div, path: article.path, isThumb: true}) }
    })
  }
  $(`.readMore a`).click( function(e) {ajaxA(e, $(this));} )
}

function populateArtVP(array) {
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
      <a href="${path_to_show}">
        <img src="/img/full/${item.full}" class="art-item ${imgClass}"/>
      </a>
    `
    $(`#main > #art-vp`).append(newPost)
  }
  $(`#main > #art-vp a`).click( function(e) {ajaxA(e, $(this))} )
}

function populateFilmVP(array) {
  for (const item of array) {
    let unixEpochNumber = Date.parse(item.date) //ISO 8601 to unix epoch
    item.dateUnix = new Date(unixEpochNumber) //number to date object

    let path_to_show = `/films/${item.path}.html#top`

    let desc = item.desc
    let newPost = `
        <div class="post-thumb base-container art-item" data-href="${path_to_show}">
          <img src="/img/thumb/${item.thumb}" class="video-thumb"/>
          <div class="content">
            <h1>${item.title}</h1><hr>
              <div class="metainfo center-children">
                <div class="metaitem">
                  <i class="fas fa-calendar-check" aria-hidden="true"></i> ${item.dateUnix.toDateString()}
                </div>
              </div>
              <br>
            ${desc}
          </div>
        </div>
    `
    $(`#main > #art-vp`).append(newPost)
  }
  $(`#main > #art-vp > .post-thumb`).click( function(e) {ajaxA(e, $(this))} )
}

function sort_reverse_date(a, b) {
  let a_date = Date.parse(a.date)
  let b_date = Date.parse(b.date)
  return b_date - a_date
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
/* Soundcloud */
const music_player = {
  scw: undefined,
  list: null,
  current_track: null,
  auto_next: true,
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
        }
        list.push(picked)
      }
      this.list = list
    }
    function on_play() {
      function update_current_track(index) {
        this.current_track = index
      }
      scw.getCurrentSoundIndex(update_current_track.bind(this))
      console.log(`playing ${this.current_track}`)
    }
    function on_finish() {
      console.log(`finished`)
      if (this.auto_next === false) {
        this.scw.pause()
        console.log(`auto_next is off`)
      }
    }
    let scw = this.scw
    //scw.getSounds(filter_list.bind(this))
    scw.bind(SC.Widget.Events.PLAY, on_play.bind(this))
    scw.bind(SC.Widget.Events.FINISH, on_finish.bind(this))
  },
  toggle: function() { this.scw.toggle() },
  skip: function(n) { this.scw.skip(n) },
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
});
