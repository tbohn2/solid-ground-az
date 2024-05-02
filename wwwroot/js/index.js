$(document).ready(function () {
    $('input[name="navOptions"]').change(
        function () {
            var pageToLoad = $(this).val();
            console.log(pageToLoad);
            window.location.assign(pageToLoad);
        });
});
