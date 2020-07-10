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

var index = [];
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
      load_post(parsed_path[1]);
      break;
    default:
      load_post("intentional_miss.html");
  }
}

function ajaxA(e, a) {
  e.preventDefault();
  history.pushState({}, "", a.attr('href'));
  parseQuery();
}

function load_Home() {
  $.getJSON("post/list.json", function(data) {
    $(`#main`).html(`<div class="newsfeed"></div>`);
    let i = 0;
    for (const post of data) {
      let newPost = `
        <div class="post-thumb">
          <div class="text"></div>
          <div class="readMore">
            <div>
            <a href="/?post/${post.content}">
            <i class="fa fa-file-text" aria-hidden="true"></i> Full article</a>
             &emsp14;
            <a href="/?post/${post.content}#comments">
            <i class="fa fa-comments-o" aria-hidden="true"></i> Comments</a>
            </div>
          </div>
        </div>
      `;
      $(`#main > .newsfeed`).prepend(newPost);
      $(`.newsfeed > .post-thumb:first-child > .text`).load(`/post/${post.content}.html`, function() {
        $(this).prepend(`<h1><a href="/?post/${post.content}">${post.title}</a></h1><hr>`);
        $(this).children(`h1`).children(`a`).click( function(e) {ajaxA(e, $(this));} );
      });
      i++;
    }
    $(`.readMore a`).click( function(e) {ajaxA(e, $(this));} );
  });
}

function load_post(filename) {
  filename = filename.split('.')[0];
  let title = '';

  $(`#main`).html(`<div class="post"></div>`);
  $(`.post`).load(`/post/${filename}.html`, function( response, status, xhr ) {
    if ( status == "error" ) {
      let msg = "Unable to load page.";
      $(`.post`).addClass(`error`);
      $(`.post`).html(`${msg} <br><br> ${xhr.status}: ${xhr.statusText}`);
    } else {
      $.getJSON("post/list.json", function(data) {
        for (const post of data) {
          if (filename == post.content) {
            $(`.post`).prepend(`<h1>${post.title}</h1><hr><br>`);
          }
        }
      });
    }
  });
}

window.addEventListener('popstate', (e) => {
  console.log("location: " + document.location.search);
  parseQuery();
});
console.log("location: " + document.location.search);
parseQuery();
$(`.title h1, .title h2`).click( function(e) {ajaxA(e, $(this));} );
