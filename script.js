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

function loadHomeFeed() {
  $.getJSON("post/list.json", function(list) {
    let i = 0;
    for (const post of list) {
      let newPost = `
        <div class="post">
          <div class="text"></div>
          <div class="readMore">
            <div>
            <a href="/?post/${post.content}">
            <i class="fa fa-file-text" aria-hidden="true"></i> Full article</a>
             &emsp14;
            <a href="">
            <i class="fa fa-comments-o" aria-hidden="true"></i> Comments</a>
            </div>
          </div>
        </div>
      `;
      $(`#main`).prepend(newPost);
      $(`#main > .post:first-child > .text`).load(`/post/${post.content}`);
      i++;
    }
    $(`.readMore a`).click(function(e) {
      //e.preventDefault();
      history.pushState({page: $(this).attr('href')}, "title 1", $(this).attr('href'));
      }
    );
  });
}
loadHomeFeed();

window.addEventListener('popstate', (event) => {
  console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));
  e.preventDefault();
});

/*function makeReadMore() {
  $("#main > div").append(
    `<div class="readMore"><div>
    <a href="${$(this).attr('path')}">
    <i class="fa fa-file-text" aria-hidden="true"></i> Full article
    </a>
     &emsp14;<a href="">
    <i class="fa fa-comments-o" aria-hidden="true"></i> Comments
    </a>
    </div></div>`
  );
}
makeReadMore();*/
