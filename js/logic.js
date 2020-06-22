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
});