function makeBtnBg() {
  $(".btn").prepend('<div class="btn-bg-dark"></div><div class="btn-bg-light"></div>');
}
makeBtnBg();

function makeReadMore() {
  $("#main > div").append(
    '<div class="readMore"><div><i class="fa fa-file-text" aria-hidden="true"></i> Full article &emsp14; <i class="fa fa-comments-o" aria-hidden="true"></i> Comments</div></div>'
  );
}
makeReadMore();

$('.btn').hover(
  function() {
    console.log("button hover");
    $( this ).children(".btn-bg-dark").stop(true,false).fadeTo(100,0);
    $( this ).children(".btn-bg-light").stop(true,false).fadeTo(100,1);
  },
  function() {
    console.log("button out");
    $( this ).children(".btn-bg-dark").stop(true,false).fadeTo(200,1);
    $( this ).children(".btn-bg-light").stop(true,false).fadeTo(300,0);
  }
);

function loadHomeFeed() {
  $.getJSON("post/list.json", function(list) {
    let i = 0;
    for (const post of list) {
      $(`#main div:nth-child(${i+1}) > .text`).load(`post/${post.content}`);
      $(`#main > div:nth-child(${i+1})`).attr(`path`, `post/${post.content}`);
      i++;
    }
  });
}
loadHomeFeed();
