function makeBtnBg() {
  $(".btn").prepend('<div class="btn-bg-dark"></div><div class="btn-bg-light"></div>');
}
makeBtnBg();

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

var index = {'post': []};
function make_index() {
  $.getJSON("index.json", function(data) {
    index = data;
  });
}
//make_index();
var last_q = "";
function parseQuery() {
  let q = document.location.search;
  const slash = /%2F/gi;
  let parsed_path = q;
  parsed_path = parsed_path.replace(slash, '/');
  parsed_path = split('fbclid')[0];
  console.log(parsed_path);
  //check if we're already on the same query
  if (parsed_path == last_q) {
    //scroll to the element
    let id = location.hash.split('#')[1];
    document.getElementById(id).scrollIntoView();
  } else {
    last_q = parsed_path;
    parsed_path = parsed_path.split('/');

    switch (parsed_path[0].toLowerCase()) {
      case "":
      case "?":
      case "?home":
        load_Home();
        break;
      case "?philosophy":
        break;
      case "?post":
        get_post(parsed_path[1]);
        break;
      default:
        get_post("intentional_miss.html");
    }
  }
}

function ajaxA(e, a) {
  e.preventDefault();
  history.pushState({}, "", a.attr('href'));
  parseQuery();
}

function load_Home() {
  if (typeof index.post !== 'undefined' && index.post.length > 0) {
    $(`#main`).html(`<div class="newsfeed"></div>`);
    let i = 0;
    let by_date = index.post.sort(function (a, b) {
      return a.date - b.date;
    })
    by_date.slice(0, 6);
    for (const post of by_date) {
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
      $(`#main > .newsfeed`).prepend(newPost);
      load_post_content($(`.newsfeed > .post-thumb:first-child > .content`), post.content, true);
      i++;
    }
    $(`.readMore a`).click( function(e) {ajaxA(e, $(this));} );
  } else {
    $.getJSON("post/list.json", function(data) {
      index.post = data;
      console.log("got postlist, trying again");
      load_Home();
    });
  }
}

function get_post(name) {
  if (typeof index.post !== 'undefined' && index.post.length > 0) {
    $(`#main`).html(`
      <div class="post-wrap">
        <div class="post base-container"><div class="content"></div></div>
        <div id="comments" class="base-container"></div>
      </div>
      `);
    load_post_content($(`#main > .post-wrap > .post > .content`), name);
  } else {
    $.getJSON("post/list.json", function(data) {
      index.post = data;
      console.log("got postlist, trying again");
      get_post(name);
    });
  }
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
          <i class="fa fa-calendar" aria-hidden="true"></i>
          <div class="date">${date.toDateString()}</div>
          &emsp14; &emsp14; <i class="fa fa-clock-o" aria-hidden="true"></i>
          Reading time: <div class="eta"></div>
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
        $(`.metainfo`).append(`
          <a href="#comments">
          <i class="fa fa-comments-o" aria-hidden="true"></i> Comments</a>
        `);
        $(`.metainfo > a`).click( function(e) {ajaxA(e, $(this));} );
        //Comments
        let w = $(`#comments`).width();
        if (320 > w ) {
          w = "100%"
        } else if ( w > 550) {
          w = 550;
        }
        $(`#comments`).html(`
          <div class="fb-comments"
            data-href="https://kunlizhan.com/?post/${name}/"
            data-numposts="5" data-width="${w}"
            data-colorscheme="dark"></div>
        `);
        FB.XFBML.parse(document.getElementById('comments'));
      }
      $(this).readingTime({
        readingTimeTarget: $(this).find(".metainfo > .eta"),
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

var a = null;
/*$(window).resize(function(){
    if(a != null) {
        clearTimeout(a);
    }
    a = setTimeout(function(){
        let w = $(`#comments`).width();
        if (320 > w ) {
          w = "100%"
        } else if ( w > 550) {
          w = 550;
        }
        $(`#comments > .fb-comments`).attr('data-width', w);
        FB.XFBML.parse(document.getElementById('comments'));
    },1000)
})*/

window.addEventListener('popstate', (e) => {
  console.log("location: " + document.location.search);
  parseQuery();
});
console.log("location: " + document.location.search);
parseQuery();
$(`.title a`).click( function(e) {ajaxA(e, $(this));} );
