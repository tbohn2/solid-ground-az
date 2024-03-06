$(document).ready(function () {
    $('input[name="navOptions"]').change(
        function () {
            var pageToLoad = $(this).val();
            window.location.assign(pageToLoad);
        });
});
