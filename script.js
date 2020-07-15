function makeBtnBg() {
  $("#nav .btn").prepend('<div class="btn-bg-dark"></div><div class="btn-bg-light"></div>');
  $("#nav a").click( function(e) {ajaxA(e, $(this));} );
}

$('.btn').hover(
  function() {
    $( this ).children(".btn-bg-dark").stop(true,false).fadeTo(100,0);
    $( this ).children(".btn-bg-light").stop(true,false).fadeTo(100,1);
  },
  function() {
    $( this ).children(".btn-bg-dark").stop(true,false).fadeTo(200,1);
    $( this ).children(".btn-bg-light").stop(true,false).fadeTo(300,0);
  }
);

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
  console.log(parsed_path);
  //check if we're already on the same query
  if (parsed_path === last_q) {
    //scroll to the element
    /*let id = location.hash.split('#')[1];
    document.getElementById(id).scrollIntoView();*/
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
    by_date_reverse.slice(0, 6);
    populateFeed(by_date_reverse);
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
        <div class="metainfo">
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
        $(`.metainfo`).append(`
          <div class="metaitem">
          <a href="#comments">
          <i class="fa fa-comments-o" aria-hidden="true"></i>
           <span class="fb-comments-count" data-href="https://kunlizhan.com/?post/${name}"></span> Comments</a>
          </div>
        `);
        //Comments
        let w = $(`#comments`).width();
        if (320 > w ) {
          w = "100%"
        } else if ( w > 550) {
          w = 550;
        }
        $(`#comments`).html(`
          <span class="metainfo">Comments from <i class="fa fa-facebook-square" aria-hidden="true"></i> Facebook (requires 3rd party cookies)</span>
          <div class="fb-comments"
            data-href="https://kunlizhan.com/?post/${name}"
            data-numposts="5"
            data-width="${w}"
            data-colorscheme="dark"
            data-lazy="true"
            data-order-by="time"></div>
        `);
        FB.XFBML.parse(document.getElementById('main'));
      }
      $(this).readingTime({
        readingTimeTarget: $(this).find(".eta"),
      });

      // fragment, hash
      if (typeof location.hash !== 'undefined' && location.hash !== '') {
        let id = location.hash.split('#')[1];
        document.getElementById(id).scrollIntoView();
        if (id == 'comments') {
          //give comments time to load, then scroll again
          setTimeout(function(){ document.getElementById(id).scrollIntoView(); }, 2000);
        }
      }
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
window.addEventListener('popstate', (e) => {
  console.log("location: " + document.location.search);
  parseQuery();
});

$( document ).ready(function() {
  console.log("location: " + document.location.search);
  parseQuery();
  $(`.title a`).click( function(e) {ajaxA(e, $(this));} );
  makeBtnBg();
});
