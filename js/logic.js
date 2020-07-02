$(document).ready(function () {
    // Open navbarSide when button is clicked
    $("button.navbar-toggler[data-target='#nav_topbar']").on('click', function () {
        if ($(this).hasClass("collapsed")) {
            $('.overlay').show();
            $('.navbar').css('height', '100vh');
            $('.navbar').css('width', '90%');
        }
        else {
            $('.navbar').css('height', 'auto');
            $('.navbar').css('width', '100%');
            $('.overlay').hide();
        }
    });
    // Close navbarSide when the outside of menu is clicked
    $('.overlay').on('click', function () {
        $('.navbar').css('height', 'auto');
        $('.navbar').css('width', '100%');
        $('.overlay').hide();
        $("button.navbar-toggler[data-target='#nav_topbar']").click();
    });
    // modal "Ask a question"
    $('[data-target="modal"]').on("click", function(event){
        event.preventDefault();
        $(".modal").show();
    });

    $('.close').on("click", function(event){
        event.preventDefault();
        $(".modal").hide();
    });

    // lifestyle slider
    $('#lifestyle_carousel .carousel-item').each(function(){
        var next = $(this).next();
        if (!next.length) {
        next = $(this).siblings(':first');
        }
        next.children(':first-child').clone().appendTo($(this));
        
        for (var i=0;i<2;i++) {
            next=next.next();
            if (!next.length) {
                next = $(this).siblings(':first');
              }
            next.children(':first-child').clone().appendTo($(this));
          }
    });
});