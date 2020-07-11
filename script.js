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

function parseQuery() {
  let q = document.location.search;
  let parsed_path = q.split('/');
  console.log(parsed_path);

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

function ajaxA(e, a) {
  e.preventDefault();
  history.pushState({}, "", a.attr('href'));
  parseQuery();
}

function load_Home() {
  if (typeof index.post !== 'undefined' && index.post.length > 0) {
    $(`#main`).html(`<div class="newsfeed"></div>`);
    let i = 0;
    for (const post of index.post) {
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

function get_post(filename) {
  filename = filename.split('.')[0];
  if (typeof index.post !== 'undefined' && index.post.length > 0) {
    $(`#main`).html(`
      <div class="post base-container"><div class="content"></div></div>
      <div class="base-container">
        <div id="comment-container">
        </div>
      </div>
      `);
    load_post_content($(`#main > .post > .content`), filename);
  } else {
    $.getJSON("post/list.json", function(data) {
      index.post = data;
      console.log("got postlist, trying again");
      get_post(filename);
    });
  }
}

function load_post_content(contentDiv, filename, isThumb) {
  isThumb = isThumb || 0;
  let path = `/post/${filename}.html`;
  contentDiv.load(path, function( response, status, xhr ) {
    if ( status == "error" ) {
      let msg = "<br>Unable to load page.";
      $(this).parent().addClass(`error`);
      $(this).html(`${msg} <br><br> ${xhr.status}: ${xhr.statusText}`);
    } else {
      let date = new Date();
      let title = "";
      for (const post of index.post) {
        if (post.content == filename) {
          title = post.title;
          date = new Date(post.date * 1000);
          console.log(date);
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
        $(this).prepend(`<h1><a href="/?post/${filename}">${title}</a></h1><hr>`);
        $(this).children(`h1 > a`).click( function(e) {ajaxA(e, $(this));} );
      } else {
        $(this).prepend(`<h1>${title}</h1><hr>`);
        //Comments
        let w = $(`#comment-container`).width();
        console.log("comm width: "+w);
        if (320 > w ) {
          w = "100%"
        } else if ( w > 550) {
          w = 550;
        }
        console.log("comm width: "+w);
        $(`#comment-container`).html(`
          <div class="fb-comments"
            data-href="https://kunlizhan.com/?post/${filename}"
            data-numposts="5" data-width="${w}"
            data-colorscheme="dark"></div>
        `);
        FB.XFBML.parse(document.getElementById('comment-container'));
      }
      $(this).readingTime({
        readingTimeTarget: $(this).find(".metainfo > .eta"),
      });
    }
  });
}

var a = null;
$(window).resize(function(){
    if(a != null) {
        clearTimeout(a);
    }
    let w = $(`#comment-container`).width();
    console.log("comm width: "+w);
    if (320 > w ) {
      w = "100%"
    } else if ( w > 550) {
      w = 550;
    }
    console.log("comm width: "+w);
    $(`#comment-container > .fb-comments`).attr('data-width', w);
    a = setTimeout(function(){
        FB.XFBML.parse(document.getElementById('comment-container'));
    },1000)
})

window.addEventListener('popstate', (e) => {
  console.log("location: " + document.location.search);
  parseQuery();
});
console.log("location: " + document.location.search);
parseQuery();
$(`.title a`).click( function(e) {ajaxA(e, $(this));} );
