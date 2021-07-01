'use strict';
const index = {
  timer: 100,
  ready_count: 0,
  parts_sum: 4,
  last_q: null,
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
  get_page_or_404()
}

window.addEventListener('popstate', (e) => {
  get_page_or_404()
})

function get_page_or_404() {
  let parsed_path = document.location.pathname
  /*
  //not sure if still needed after using static site and real pathnames instead of query hacks

  const slash = /%2F/gi;
  parsed_path = parsed_path.replace(slash, '/');
  */
  //const breakers = /&|fbclid/i; //not sure if still needed for fb
  //parsed_path = parsed_path.split(breakers)[0];
  //check if we're already on the same query
  if (parsed_path === index.last_q) {
    parseFragment()
  } else {
    index.last_q = parsed_path
    let path_to_main = `${parsed_path} #main`
    queued_content = $(`<div>`).load(path_to_main, function( response, status, xhr ) {
      if ( status === "error" ) { layout_404(parsed_path, xhr, $(`#main`)) }
      else {
        queued_content = $(`#main`, queued_content.get(0)).html()
        //console.log(queued_content)
        find_page_from_index()
        parseFragment()
      }
    })
  }
}

function find_page_from_index() {
  if (index.ready_count === index.parts_sum) {
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
        default:
          layout_404(document.location.pathname, {status:"404", statusText:"error"}, $(`#main`))
      }
    }
    else if (path.length === 3) {
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
          layout_music_item(path[2])
          break
        default:
          layout_404(document.location.pathname, {status:"404", statusText:"error"}, $(`#main`))
      }
    }
    else {
      layout_404(document.location.pathname, {status:"404", statusText:"error"}, $(`#main`))
    }
  }
  else {
    console.log("index not ready, trying again later")
    index.timer = index.timer*2
    setTimeout(function(){ find_page_from_index() }, index.timer)
  }
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
    tryScroll(id);
    if (id == 'comments') {
      //give comments time to load, then scroll again
      setTimeout(function(){ tryScroll(id); }, 2000);
    }
    let arg = id.split('=')[1];
    id = id.split('=')[0];
    let ol_on = false;
    switch (id) {
      case 'comments':
        setTimeout(function(){ tryScroll(id); }, 2000);
        break;
      case 'full_image':
        ol_on = true;
        showImgOverlay(arg);
        break;
      default:
    }
    if (!ol_on) {
      $(`#ol`).removeClass(`active`);
    }
  } else {
    $(`#ol`).removeClass(`active`); //turn off ol if there is no hash, as ol should only be on with #full_image
  }
}
function showImgOverlay(path) {
  $(`#ol img`).remove();
  $(`#ol`).append(`
      <img src="/img/full/${path}" alt="Click for details">
  `);
  $(`#ol`).addClass(`active`);
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
    $(`.metainfo center-children`).append(`
      <div class="metaitem">
      <a href="#comments">
        <i class="fas fa-comments" aria-hidden="true"></i>
        <span class="fb-comments-count" data-href="https://kunlizhan.com/articles/${path}.html"></span> Comments</a>
      </div>
    `)
    //Comments
    load_comments(`articles/${path}`);
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
  load_comments(`gallery/${path}`)
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
  update_title_in_head(item.title)
}

function layout_music_item(path) {
  let item = get_index_item("music", path)
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
/*
var fbLoaded = false;
window.fbAsyncInit = function() {
  FB.init({
    appId      : '982995422130578',
    cookie     : true,
    xfbml      : true,
    version    : 'v7.0'
  });
  FB.AppEvents.logPageView();
  fbLoaded = true;
};

(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "https://connect.facebook.net/en_US/sdk.js";
   fjs.parentNode.insertBefore(js, fjs);
 }(document, 'script', 'facebook-jssdk'));*/

function load_comments(path) {
  let w = $(`#comments`).width();
  if (320 > w ) {
    w = "100%"
  } else if ( w > 550) {
    w = 550;
  }
  $(`#comments`).html(`
    <div class="metainfo center-children">Comments from <i class="fab fa-facebook-square" aria-hidden="true"></i> Facebook (requires 3rd party cookies)</div>
    <div class="fb-comments"
      data-href="https://kunlizhan.com/${path}"
      data-numposts="5"
      data-width="${w}"
      data-colorscheme="dark"
      data-lazy="true"
      data-order-by="time"></div>
    `)
  try { FB.XFBML.parse(document.getElementById('main')) }
  catch (err) {
    if (err.message !== "FB is not defined") { throw err }
  }
}
var queued_content = null
$( document ).ready(function() {
  //console.log("Ready, location: " + document.location.pathname);
  get_index_of(["articles", "gallery", "films", "music"])
  //index.last_q = document.location.pathname
  queued_content = $("#main").html() //saves the page's content
  $("body").load("/common.html", function() {
    layout_nav()
    get_page_or_404()
  })
});
