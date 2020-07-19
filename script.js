function init_page() {
  $("#nav .btn").prepend('<div class="btn-bg-dark"></div><div class="btn-bg-light"></div>');
  $("#nav a").click( function(e) {ajaxA(e, $(this));} );
  $(`.title a`).click( function(e) {ajaxA(e, $(this));} );
  //$(`#ol > .close_x`).click( function(e) {ajaxA(e, $(this));} );
  $('.btn').hover(
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

function ajaxA(e, a) {
  e.preventDefault();
  history.pushState({}, "", a.attr('href'));
  parseQuery();
}

var last_q = null;
function parseQuery() {
  let q = document.location.search;
  const slash = /%2F/gi;
  let parsed_path = q;
  parsed_path = parsed_path.replace(slash, '/');
  const breakers = /&|fbclid/i;
  parsed_path = parsed_path.split(breakers)[0];
  //console.log(parsed_path);
  //check if we're already on the same query
  if (parsed_path === last_q) {
    //scroll to the element
    /*let id = location.hash.split('#')[1];
    document.getElementById(id).scrollIntoView();*/
    parseFragment();
  } else {
    last_q = parsed_path;
    parsed_path = parsed_path.split('/');

    switch (parsed_path[0].toLowerCase()) {
      case "":
      case "?":
      case "?home":
        load_Home();
        break;
      case "?post":
        get_post(parsed_path[1]);
        break;
      case "?show":
        show_media(parsed_path[1]);
        break;
      default:
        get_site(parsed_path[0]);
    }
  }
}

function load_Home() {
  if (typeof index.post !== 'undefined' && index.post.length > 0) {
    $(`#main`).html(`<div class="newsfeed"></div>`);
    let by_date_reverse = index.post.sort(function (a, b) {
      return b.date - a.date;
    })
    by_date_reverse = by_date_reverse.slice(0, 6);
    populateFeed(by_date_reverse);
    $(`title`).html(`KunliZhan.com`);
  } else {
    console.log("no post list, trying again");
    setTimeout(function(){
      load_Home(name);
    },1000)
  }
}

function populateFeed(array) {
  for (const post of array) {
    let newPost = `
      <div class="post-thumb base-container">
        <div class="content"></div>
        <div class="readMore">
          <div>
          <a href="/?post/${post.content}">
          <i class="fa fa-file-text" aria-hidden="true"></i> Full article</a>
           &emsp14; &emsp14;
          <a href="/?post/${post.content}#comments">
          <i class="fa fa-comments-o" aria-hidden="true"></i> Comments</a>
          </div>
        </div>
      </div>
    `;
    $(`#main > .newsfeed`).append(newPost);
    load_post_content($(`.newsfeed > .post-thumb:last-child > .content`), post.content, true);
  }
  $(`.readMore a`).click( function(e) {ajaxA(e, $(this));} );
}

function get_post(name) {
  $(`#main`).html(`
    <div class="post-wrap">
      <div class="post base-container"><div class="content"> Loading ... </div></div>
      <div id="comments" class="base-container"> Loading Comments. This uses 3rd-party cookies.</div>
    </div>
    `);
  load_post_content($(`#main > .post-wrap > .post > .content`), name);
  // fragment, hash
  parseFragment();
}

function load_post_content(contentDiv, name, isThumb) {
  //split name and frag
  name = name.split('.')[0];
  isThumb = isThumb || 0;
  let path = `/post/${name}.html`;

  contentDiv.load(path, function( response, status, xhr ) {
    if ( status == "error" ) {
      let msg = `<br>Unable to load post "${name}".`;
      $(this).parent().addClass(`error`);
      $(this).html(`${msg} <br><br> ${xhr.status}: ${xhr.statusText}`);
    } else {
      let date = new Date();
      let title = "";
      for (const post of index.post) {
        if (post.content == name) {
          title = post.title;
          date = new Date(post.date * 1000);
          break;
        }
      }
      $(this).prepend(
        `
        <div class="metainfo center-children">
          <div class="metaitem">
            <i class="fa fa-calendar" aria-hidden="true"></i> ${date.toDateString()}
          </div>
          <div class="metaitem">
            <i class="fa fa-clock-o" aria-hidden="true"></i>
            Reading time: <div class="eta"></div>
          </div>
        </div>
        <br>
        `
      );
      if (isThumb) {
        //for thumb, make title a link
        $(this).prepend(`<h1><a href="/?post/${name}">${title}</a></h1><hr>`);
        $(this).find(`h1 > a`).click( function(e) {ajaxA(e, $(this));} );
      } else {
        //for full post, make title and insert into metainfo a link to comments
        $(this).prepend(`<h1>${title}</h1><hr>`);
        $(`title`).html(`${title}`);
        $(`meta[property="og:url"]`).attr(`content`, `kunlizhan.com/${last_q}`);
        $(`meta[property="og:title"]`).attr(`content`, `${title}`);
        $(`meta[property="og:type"]`).attr(`content`, `article`);
        $(`meta[property="og:description"]`).attr(`content`, `${date.toDateString()}`);
        $(`.metainfo center-children`).append(`
          <div class="metaitem">
          <a href="#comments">
          <i class="fa fa-comments-o" aria-hidden="true"></i>
           <span class="fb-comments-count" data-href="https://kunlizhan.com/?post/${name}"></span> Comments</a>
          </div>
        `);
        //Comments
        let path = `?post/${name}`;
        load_comments(path);
      }
      $(this).readingTime({
        readingTimeTarget: $(this).find(".eta"),
      });
    }
  });
}

function get_site(name) {
  let path = name.replace('?', '');
  path = `/site/${path}.html`;
  $('#main').load(path, function( response, status, xhr ) {
    if ( status == "error" ) {
      let msg = `<br>Unable to load "${name}".`;
      $('#main').html(`
        <div class="base-container error">
        ${msg} <br><br> ${xhr.status}: ${xhr.statusText}
        <img src="img/hbar.gif" class="hbar">
        </div>
        `);
      console.log("no such page");
      console.log(path);
    } else {
    }
  });
}

function show_media(name) {
  if (
    typeof index.img !== 'undefined'
    && index.img !== '' //add more media here
  ) {
    for (item of index.img) {
      item_name = item.content.split('.')[0];
      if (name == item_name) {
        let can_show = true;
        for (tag of item.tags) {
          if (tag == "site-use" || tag == "no-show") {
            can_show = false;
          }
        }
        if (can_show) {
          let title = item.title;
          let date = new Date(item.date * 1000);
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
                    <i class="fa fa-calendar" aria-hidden="true"></i> ${date.toDateString()}
                  </div>
                </div>
              </div>
              <div class="base-container show-media">
                <a href="#full_image=${item.content}">
                  <img src="/img/${item.content}" />
                </a>
              </div>
              <div class="base-container show-desc">
                <span>${desc}</span>
                <div class="tags metainfo"><span>Tags: </span></div>
              </div>
              <div id="comments" class="base-container"> Loading Comments. This uses 3rd-party cookies.</div>
            </div>
          `);
          for (tag of item.tags) {
            $(`.show-desc > .tags`).append(`<div class="tag">${tag}</div>`);
          }
          let path = `?show/${name}`;
          load_comments(path);
          parseFragment();
          $(`title`).html(`${title} | Kunli Zhan`);
          break;
        }
      }
    }
  } else {
    console.log("at least one media list missing, trying again");
    setTimeout(function(){
      show_media(name);
    },1000)
  }
}

function load_comments(path) {
  let w = $(`#comments`).width();
  if (320 > w ) {
    w = "100%"
  } else if ( w > 550) {
    w = 550;
  }
  $(`#comments`).html(`
    <div class="metainfo center-children">Comments from <i class="fa fa-facebook-square" aria-hidden="true"></i> Facebook (requires 3rd party cookies)</div>
    <div class="fb-comments"
      data-href="https://kunlizhan.com/${path}"
      data-numposts="5"
      data-width="${w}"
      data-colorscheme="dark"
      data-lazy="true"
      data-order-by="time"></div>
  `);
  if (fbLoaded) {FB.XFBML.parse(document.getElementById('main'));}
}

function parseFragment() {
  if (typeof location.hash !== 'undefined' && location.hash !== '') {
    let id = location.hash.split('#')[1];
    function tryScroll(id) {
      try {
        document.getElementById(id).scrollIntoView();
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
        showImgOverlay(arg, 'full_image');
        break;
      case 'preview':
        ol_on = true;
        showImgOverlay(arg, 'preview');
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
function showImgOverlay(path, type) {
  type = type || 0;
  console.log(type);
  let path_to_show = ``;
  if (type == 'preview') {
    path_to_show = `/?show/${path.split('.')[0]}`;
  }
  $(`#ol img`).remove();
  $(`#ol`).append(`
      <img src="/img/${path}" alt="Click for details">
  `);
  $(`#ol`).addClass(`active`);
}

window.addEventListener('popstate', (e) => {
  console.log("history popstate event fired");
  parseQuery();
});

$( document ).ready(function() {
  console.log("Ready, location: " + document.location.search);
  parseQuery();
  init_page();
});
